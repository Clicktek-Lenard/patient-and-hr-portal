import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const links = await prisma.portalShareLink.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: links });
  } catch (error) {
    console.error("[GET_SHARE_LINKS]", error);
    return NextResponse.json({ error: "Failed to fetch share links" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { queueCode, resultLabel, recipient, expiryHours } = body;

    if (!queueCode || typeof queueCode !== "string") {
      return NextResponse.json({ error: "queueCode is required" }, { status: 400 });
    }

    // Cap expiry: min 1 minute, max 30 days, default 7 days
    const rawHours = parseFloat(expiryHours ?? "168");
    const hours    = isNaN(rawHours) || rawHours <= 0 ? 168 : Math.min(rawHours, 720);
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
    const token = randomBytes(24).toString("hex");

    const link = await prisma.portalShareLink.create({
      data: {
        userId: session.user.id,
        queueCode,
        resultLabel: resultLabel ?? queueCode,
        token,
        recipient: recipient ?? null,
        expiresAt,
      },
    });

    return NextResponse.json({ data: link });
  } catch (error) {
    console.error("[POST_SHARE_LINK]", error);
    return NextResponse.json({ error: "Failed to create share link" }, { status: 500 });
  }
}
