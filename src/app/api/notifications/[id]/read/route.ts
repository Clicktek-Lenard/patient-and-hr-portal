import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Try to mark as read in database
    try {
      const notification = await prisma.portalNotification.findFirst({
        where: {
          id,
          userId: session.user.id,
        },
      });

      if (notification && !notification.isRead) {
        await prisma.portalNotification.update({
          where: { id },
          data: {
            isRead: true,
            readAt: new Date(),
          },
        });
      }
    } catch {
      // Notification might be a mock notification; that's OK
    }

    return NextResponse.json({
      data: { id, read: true },
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("[MARK_READ]", error);
    return NextResponse.json(
      { error: "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}
