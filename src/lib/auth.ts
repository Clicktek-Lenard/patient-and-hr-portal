import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { cmsPrisma } from "@/lib/prisma-cms";

/** Compare two dates by calendar date only, ignoring time and timezone. */
function dobMatches(inputDob: Date, refDob: Date): boolean {
  const fmt = (d: Date) => d.toISOString().slice(0, 10); // "YYYY-MM-DD"
  // Also compare using UTC parts to guard against TZ shifts
  const inputStr = `${inputDob.getUTCFullYear()}-${String(inputDob.getUTCMonth() + 1).padStart(2, "0")}-${String(inputDob.getUTCDate()).padStart(2, "0")}`;
  const refStr   = fmt(refDob);
  return inputStr === refStr;
}

// ── In-memory login rate limiter ─────────────────────────────────────────────
// Keyed by identifier — max 5 attempts per 15 minutes
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function checkLoginRateLimit(identifier: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(identifier);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(identifier, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

function clearLoginAttempts(identifier: string) {
  loginAttempts.delete(identifier);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        loginType:  { label: "Login Type", type: "text" },
        identifier: { label: "ID",         type: "text" },
        dob:        { label: "Birthdate",  type: "text" },
        pin:        { label: "PIN",        type: "text" },
      },
      async authorize(credentials) {
        const loginType  = credentials?.loginType  as string;
        const rawIdentifier = (credentials?.identifier as string)?.trim() ?? "";
        const dob        = credentials?.dob        as string;
        const pin        = (credentials?.pin        as string)?.trim();

        if (!loginType || !rawIdentifier) {
          throw new Error("Missing credentials");
        }

        // ── Rate limit by identifier ──────────────────────────────────────
        if (!checkLoginRateLimit(rawIdentifier.toLowerCase())) {
          throw new Error("Too many login attempts. Please wait 15 minutes.");
        }

        // ── PATIENT LOGIN: patientCode + dob ──────────────────────────────
        if (loginType === "patient") {
          const patientCode = rawIdentifier.toUpperCase();

          if (!dob) throw new Error("Date of birth is required");

          const inputDob = new Date(dob);

          // ── Fast path: already registered in portal_users ─────────────
          // No cms_v2 query needed — DOB was already validated on first login
          const portalUser = await prisma.portalUser.findUnique({
            where: { patientCode },
          });

          if (portalUser) {
            if (!portalUser.isActive || portalUser.deletedAt) {
              throw new Error("Invalid Patient ID or date of birth");
            }

            const refDob = new Date(portalUser.dob);

            if (!dobMatches(inputDob, refDob)) {
              // DOB mismatch on portal — re-check cms_v2 in case DOB was
              // corrected there (keeps cms_v2 as ultimate source of truth)
              let cmsRefDob: Date | null = null;
              try {
                const cmsPatient = await cmsPrisma.cmsPatient.findUnique({
                  where: { code: patientCode },
                  select: { dob: true },
                });
                if (cmsPatient) cmsRefDob = new Date(cmsPatient.dob);
              } catch { /* cms_v2 unreachable */ }

              if (!cmsRefDob) throw new Error("Invalid Patient ID or date of birth");

              if (!dobMatches(inputDob, cmsRefDob)) throw new Error("Invalid Patient ID or date of birth");

              // DOB was updated in cms_v2 — sync it to portal_users
              await prisma.portalUser.update({
                where: { id: portalUser.id },
                data: { dob: cmsRefDob, lastLoginAt: new Date() },
              });
            } else {
              await prisma.portalUser.update({
                where: { id: portalUser.id },
                data: { lastLoginAt: new Date() },
              });
            }

            clearLoginAttempts(patientCode.toLowerCase());

            return {
              id:          portalUser.id,
              email:       portalUser.email,
              name:        `${portalUser.firstName} ${portalUser.lastName}`,
              firstName:   portalUser.firstName,
              lastName:    portalUser.lastName,
              mobile:      portalUser.mobile,
              patientCode: portalUser.patientCode ?? undefined,
              role:        portalUser.role,
            };
          }

          // ── Slow path: not yet registered — validate against cms_v2 ───
          let cmsPatient: {
            dob: Date; firstName: string | null; lastName: string | null;
            fullName: string | null; email: string | null; mobile: string | null;
            isActive: number;
          } | null = null;

          try {
            cmsPatient = await cmsPrisma.cmsPatient.findUnique({
              where: { code: patientCode },
              select: {
                dob: true, firstName: true, lastName: true,
                fullName: true, email: true, mobile: true, isActive: true,
              },
            });
          } catch {
            throw new Error("Unable to verify identity. Please try again later.");
          }

          if (!cmsPatient) {
            throw new Error("Invalid Patient ID or date of birth");
          }

          if (cmsPatient.isActive === 0) {
            throw new Error("This patient account is inactive");
          }

          const refDob = new Date(cmsPatient.dob);

          console.log("[auth] DOB check — input:", inputDob.toISOString(), "cms_v2:", refDob.toISOString());

          if (!dobMatches(inputDob, refDob)) {
            throw new Error("Invalid Patient ID or date of birth");
          }

          // ── First login confirmed — register into portal_users ─────────
          const firstName = cmsPatient.firstName?.trim() || cmsPatient.fullName?.split(" ")[0] || "Patient";
          const lastName  = cmsPatient.lastName?.trim()  || cmsPatient.fullName?.split(" ").slice(1).join(" ") || patientCode;
          const email     = cmsPatient.email?.trim()     || `${patientCode.toLowerCase()}@nwd.placeholder`;
          const mobile    = cmsPatient.mobile?.trim()    || `NOMOBILE-${patientCode}`;

          // Guard against duplicate email/mobile across patients in cms_v2
          const safeEmail  = await prisma.portalUser.findUnique({ where: { email } })
            ? `${patientCode.toLowerCase()}@nwd.placeholder`
            : email;
          const safeMobile = await prisma.portalUser.findUnique({ where: { mobile } })
            ? `NOMOBILE-${patientCode}`
            : mobile;

          const newUser = await prisma.portalUser.create({
            data: {
              patientCode,
              firstName,
              lastName,
              email:       safeEmail,
              mobile:      safeMobile,
              dob:         refDob,
              password:    "", // no password — auth is patientCode + DOB
              isVerified:  true,
              isActive:    true,
              lastLoginAt: new Date(),
            },
          });

          clearLoginAttempts(patientCode.toLowerCase());

          return {
            id:          newUser.id,
            email:       newUser.email,
            name:        `${newUser.firstName} ${newUser.lastName}`,
            firstName:   newUser.firstName,
            lastName:    newUser.lastName,
            mobile:      newUser.mobile,
            patientCode: newUser.patientCode ?? undefined,
            role:        newUser.role,
          };
        }

        // ── HR LOGIN: email + password ────────────────────────────────────
        if (loginType === "hr") {
          const password   = pin; // "pin" field carries the password from the form
          const emailLower = rawIdentifier.toLowerCase();

          if (!password) {
            throw new Error("Password is required");
          }

          const user = await prisma.portalUser.findUnique({
            where: { email: emailLower },
          });

          if (!user || !user.isActive || user.deletedAt) {
            throw new Error("Invalid email or password");
          }

          if (user.role !== "HR" && user.role !== "ADMIN") {
            throw new Error("Unauthorized role");
          }

          const passwordMatches = await bcrypt.compare(password!, user.password);
          if (!passwordMatches) {
            throw new Error("Invalid email or password");
          }

          // Clear rate limit on success
          clearLoginAttempts(emailLower);

          await prisma.portalUser.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });

          return {
            id:          user.id,
            email:       user.email,
            name:        `${user.firstName} ${user.lastName}`,
            firstName:   user.firstName,
            lastName:    user.lastName,
            mobile:      user.mobile,
            patientCode: undefined,
            role:        user.role,
          };
        }

        throw new Error("Invalid login type");
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge:   8 * 60 * 60, // 8 hours (reduced from 30 days)
    updateAge: 60 * 60,    // Refresh token every hour of activity
  },
  pages: {
    signIn: "/login",
    error:  "/login",
  },
  events: {
    async signIn({ user }) {
      try {
        const u = user as { id?: string; firstName?: string; lastName?: string; role?: string };
        if (u.role === "HR" || u.role === "ADMIN") {
          const name = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "HR User";
          await prisma.portalAuditLog.create({
            data: {
              hrUserId:   u.id ?? "unknown",
              hrUserName: name,
              action:     "LOGIN",
              detail:     `Successful login — ${name}`,
              ipAddress:  null,
              userAgent:  null,
            },
          });
        }
      } catch {
        // audit failures must never block login
      }
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id          = user.id;
        token.firstName   = (user as { firstName?: string }).firstName;
        token.lastName    = (user as { lastName?: string }).lastName;
        token.mobile      = (user as { mobile?: string }).mobile;
        token.patientCode = (user as { patientCode?: string }).patientCode;
        token.role        = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id          = token.id as string;
        session.user.firstName   = token.firstName as string;
        session.user.lastName    = token.lastName as string;
        session.user.mobile      = token.mobile as string;
        session.user.patientCode = token.patientCode as string | undefined;
        session.user.role        = token.role as string;
      }
      return session;
    },
  },
  secret:    process.env.AUTH_SECRET,
  trustHost: true,
});

declare module "next-auth" {
  interface User {
    id?: string;
    firstName?: string;
    lastName?: string;
    mobile?: string;
    patientCode?: string;
    role?: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      firstName: string;
      lastName: string;
      mobile: string;
      patientCode?: string;
      role: string;
    };
  }

  interface JWT {
    id?: string;
    firstName?: string;
    lastName?: string;
    mobile?: string;
    patientCode?: string;
    role?: string;
  }
}
