import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";
import { generateOtp } from "@/lib/utils";

// ── In-memory registration rate limiter ──────────────────────────────────────
// Keyed by IP — max 5 registration attempts per hour
const registerAttempts = new Map<string, { count: number; resetAt: number }>();

function checkRegisterRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = registerAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    registerAttempts.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (!checkRegisterRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();

    // Validate input
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, mobile, dob, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    // Check for existing email
    const existingEmail = await prisma.portalUser.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingEmail) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Check for existing mobile
    const existingMobile = await prisma.portalUser.findUnique({
      where: { mobile },
    });
    if (existingMobile) {
      return NextResponse.json(
        { error: "An account with this mobile number already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.portalUser.create({
      data: {
        firstName,
        lastName,
        email: normalizedEmail,
        mobile,
        dob: new Date(dob),
        password: hashedPassword,
        isVerified: false,
      },
    });

    // Generate OTP for email verification
    const otpCode = generateOtp(6);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.portalOtp.create({
      data: {
        userId: user.id,
        type: "EMAIL",
        code: otpCode,
        purpose: "REGISTER",
        expiresAt,
      },
    });

    // In production: send OTP via email
    // await sendEmail({ to: email, subject: "Verify your account", ... })

    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEV] OTP for ${email}: ${otpCode}`);
    }

    return NextResponse.json(
      {
        data: { userId: user.id },
        message: "Account created. Please check your email for the verification code.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[REGISTER]", error);
    return NextResponse.json(
      { error: "Failed to create account. Please try again." },
      { status: 500 }
    );
  }
}
