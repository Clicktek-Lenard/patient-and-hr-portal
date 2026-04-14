import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyOtpSchema } from "@/lib/validations/auth";

// ── In-memory OTP attempt rate limiter ───────────────────────────────────────
// Keyed by userId — max 5 attempts per 15 minutes
const otpAttempts = new Map<string, { count: number; resetAt: number }>();

function checkOtpRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = otpAttempts.get(userId);
  if (!entry || now > entry.resetAt) {
    otpAttempts.set(userId, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

function clearOtpAttempts(userId: string) {
  otpAttempts.delete(userId);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const parsed = verifyOtpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { userId, code, purpose } = parsed.data;

    // Rate limit OTP attempts
    if (!checkOtpRateLimit(userId)) {
      return NextResponse.json(
        { error: "Too many verification attempts. Please wait 15 minutes." },
        { status: 429 }
      );
    }

    // Find the user
    const user = await prisma.portalUser.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired verification code" },
        { status: 400 }
      );
    }

    // Find valid OTP
    const otp = await prisma.portalOtp.findFirst({
      where: {
        userId,
        code,
        purpose,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      return NextResponse.json(
        { error: "Invalid or expired verification code" },
        { status: 400 }
      );
    }

    // Clear rate limit on success
    clearOtpAttempts(userId);

    // Mark OTP as used
    await prisma.portalOtp.update({
      where: { id: otp.id },
      data: { usedAt: new Date() },
    });

    // Update user based on purpose
    if (purpose === "REGISTER") {
      await prisma.portalUser.update({
        where: { id: userId },
        data: {
          isVerified: true,
          emailVerifiedAt: new Date(),
        },
      });
    }

    return NextResponse.json(
      { data: { verified: true }, message: "Verification successful" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[VERIFY_OTP]", error);
    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}
