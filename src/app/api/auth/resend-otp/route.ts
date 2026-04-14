import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resendOtpSchema } from "@/lib/validations/auth";
import { generateOtp } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const parsed = resendOtpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { userId, purpose } = parsed.data;

    const user = await prisma.portalUser.findUnique({
      where: { id: userId },
    });
    if (!user) {
      // Generic response — do not reveal whether userId exists
      return NextResponse.json(
        { error: "Too many OTP requests. Please wait 15 minutes before trying again." },
        { status: 429 }
      );
    }

    // Check rate limiting: max 3 OTPs per 15 minutes
    const recentOtps = await prisma.portalOtp.count({
      where: {
        userId,
        purpose,
        createdAt: { gt: new Date(Date.now() - 15 * 60 * 1000) },
      },
    });

    if (recentOtps >= 3) {
      return NextResponse.json(
        { error: "Too many OTP requests. Please wait 15 minutes before trying again." },
        { status: 429 }
      );
    }

    // Invalidate existing unused OTPs
    await prisma.portalOtp.updateMany({
      where: {
        userId,
        purpose,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { usedAt: new Date() },
    });

    // Generate new OTP
    const otpCode = generateOtp(6);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.portalOtp.create({
      data: {
        userId,
        type: "EMAIL",
        code: otpCode,
        purpose,
        expiresAt,
      },
    });

    // In production: send OTP via email/SMS
    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEV] Resent OTP for ${user.email}: ${otpCode}`);
    }

    return NextResponse.json(
      { data: { sent: true }, message: "New code sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[RESEND_OTP]", error);
    return NextResponse.json(
      { error: "Failed to resend code. Please try again." },
      { status: 500 }
    );
  }
}
