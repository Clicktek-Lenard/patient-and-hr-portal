import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validations/auth";

// ── In-memory rate limiter for reset attempts ─────────────────────────────────
// Keyed by userId — max 5 attempts per 15 minutes
const resetAttempts = new Map<string, { count: number; resetAt: number }>();

function checkResetRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = resetAttempts.get(userId);
  if (!entry || now > entry.resetAt) {
    resetAttempts.set(userId, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { userId, code, password } = parsed.data;

    // Rate limit by userId
    if (!checkResetRateLimit(userId)) {
      return NextResponse.json(
        { error: "Too many attempts. Please wait 15 minutes." },
        { status: 429 }
      );
    }

    const user = await prisma.portalUser.findUnique({
      where: { id: userId },
    });

    // Generic error — do not reveal whether userId exists
    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired reset code" },
        { status: 400 }
      );
    }

    // Verify OTP
    const otp = await prisma.portalOtp.findFirst({
      where: {
        userId,
        code,
        purpose: "RESET",
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      return NextResponse.json(
        { error: "Invalid or expired reset code" },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update password and mark OTP as used atomically
    await prisma.$transaction([
      prisma.portalUser.update({
        where: { id: userId },
        data: { password: hashedPassword },
      }),
      prisma.portalOtp.update({
        where: { id: otp.id },
        data: { usedAt: new Date() },
      }),
    ]);

    // Clear rate limit on success
    resetAttempts.delete(userId);

    return NextResponse.json(
      { data: { reset: true }, message: "Password reset successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[RESET_PASSWORD]", error);
    return NextResponse.json(
      { error: "Failed to reset password. Please try again." },
      { status: 500 }
    );
  }
}
