import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    try {
      const notification = await prisma.portalNotification.findFirst({
        where: { id, userId: session.user.id },
      });

      if (notification?.isRead) {
        await prisma.portalNotification.update({
          where: { id },
          data: { isRead: false, readAt: null },
        });
      }
    } catch {
      // Mock notification — ignore silently
    }

    return NextResponse.json({ data: { id, read: false } });
  } catch (error) {
    console.error("[MARK_UNREAD]", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
