import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateProfileSchema } from "@/lib/validations/profile";

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.portalUser.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        patientCode: true,
        firstName: true,
        lastName: true,
        email: true,
        mobile: true,
        dob: true,
        isVerified: true,
        emailVerifiedAt: true,
        mobileVerifiedAt: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ data: user });
  } catch (error) {
    console.error("[GET_PROFILE]", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, dob } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    // Check if email is taken by another user
    const existingUser = await prisma.portalUser.findFirst({
      where: {
        email: normalizedEmail,
        id: { not: session.user.id },
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "This email is already in use by another account" },
        { status: 409 }
      );
    }

    const updatedUser = await prisma.portalUser.update({
      where: { id: session.user.id },
      data: {
        firstName,
        lastName,
        email: normalizedEmail,
        dob: new Date(dob),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        mobile: true,
        dob: true,
      },
    });

    return NextResponse.json({
      data: updatedUser,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("[UPDATE_PROFILE]", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
