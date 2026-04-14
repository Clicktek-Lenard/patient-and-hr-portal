import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { cmsPrisma } from "@/lib/prisma-cms";

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

          const user = await prisma.portalUser.findUnique({
            where: { patientCode },
          });

          if (!user || !user.isActive || user.deletedAt) {
            throw new Error("Invalid Patient ID or date of birth");
          }

          const cmsPatient = await cmsPrisma.cmsPatient.findUnique({
            where: { code: patientCode },
            select: { dob: true },
          });

          if (!cmsPatient) {
            throw new Error("Invalid Patient ID or date of birth");
          }

          const inputDob   = new Date(dob);
          const cmsDob     = new Date(cmsPatient.dob);
          const dobMatches =
            inputDob.getFullYear() === cmsDob.getFullYear() &&
            inputDob.getMonth()    === cmsDob.getMonth() &&
            inputDob.getDate()     === cmsDob.getDate();

          if (!dobMatches) {
            throw new Error("Invalid Patient ID or date of birth");
          }

          // Clear rate limit on success
          clearLoginAttempts(patientCode.toLowerCase());

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
            patientCode: user.patientCode ?? undefined,
            role:        user.role,
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
