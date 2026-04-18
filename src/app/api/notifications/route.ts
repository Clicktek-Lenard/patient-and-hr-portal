import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbNotifications = await prisma.portalNotification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const notifications = dbNotifications.map((n) => ({
      id: n.id,
      userId: n.userId,
      title: n.title,
      // Hide the dedupe marker (e.g. "[QUEUE:XXX]") from the UI
      message: n.message.replace(/\s*\[QUEUE:[^\]]+\]\s*/g, "").trim(),
      type: n.type,
      isRead: n.isRead,
      readAt: n.readAt?.toISOString(),
      createdAt: n.createdAt.toISOString(),
    }));

    return NextResponse.json({ data: notifications });
  } catch (error) {
    console.error("[GET_NOTIFICATIONS]", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
