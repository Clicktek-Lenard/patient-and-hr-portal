import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { generateOtp, maskEmail } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { email } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const user = await prisma.portalUser.findUnique({
      where: { email: normalizedEmail },
    });

    // Always return success to prevent email enumeration
    if (!user || !user.isActive || user.deletedAt) {
      return NextResponse.json(
        {
          data: {
            userId: "not-found",
            maskedEmail: maskEmail(normalizedEmail),
          },
          message: "If this email exists, a reset code has been sent",
        },
        { status: 200 }
      );
    }

    // Check rate limiting
    const recentOtps = await prisma.portalOtp.count({
      where: {
        userId: user.id,
        purpose: "RESET",
        createdAt: { gt: new Date(Date.now() - 15 * 60 * 1000) },
      },
    });

    if (recentOtps >= 3) {
      return NextResponse.json(
        { error: "Too many reset attempts. Please wait 15 minutes." },
        { status: 429 }
      );
    }

    // Invalidate existing OTPs
    await prisma.portalOtp.updateMany({
      where: {
        userId: user.id,
        purpose: "RESET",
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { usedAt: new Date() },
    });

    // Generate reset OTP
    const otpCode = generateOtp(6);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.portalOtp.create({
      data: {
        userId: user.id,
        type: "EMAIL",
        code: otpCode,
        purpose: "RESET",
        expiresAt,
      },
    });

    // In production: send email
    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEV] Password reset OTP for ${normalizedEmail}: ${otpCode}`);
    }

    return NextResponse.json(
      {
        data: {
          userId: user.id,
          maskedEmail: maskEmail(normalizedEmail),
        },
        message: "Reset code sent to your email",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[FORGOT_PASSWORD]", error);
    return NextResponse.json(
      { error: "Failed to process request. Please try again." },
      { status: 500 }
    );
  }
}
