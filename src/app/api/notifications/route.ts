import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMockNotifications } from "@/lib/mock-data";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Try to get from database first
    const dbNotifications = await prisma.portalNotification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // If no DB notifications, return mock data for demo
    if (dbNotifications.length === 0) {
      const mockNotifications = getMockNotifications(session.user.id);
      return NextResponse.json({ data: mockNotifications });
    }

    const notifications = dbNotifications.map((n: {
      id: string;
      userId: string;
      title: string;
      message: string;
      type: string;
      isRead: boolean;
      readAt: Date | null;
      createdAt: Date;
    }) => ({
      id: n.id,
      userId: n.userId,
      title: n.title,
      message: n.message,
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
