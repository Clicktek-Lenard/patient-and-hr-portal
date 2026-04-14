import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const logs = await prisma.portalResultAccessLog.findMany({
      where: { portalUserId: session.user.id },
      orderBy: { accessedAt: "desc" },
      take: 100,
      select: {
        id: true,
        queueCode: true,
        accessType: true,
        ipAddress: true,
        accessedAt: true,
        filePath: true,
      },
    });

    return NextResponse.json({ data: logs });
  } catch (error) {
    console.error("[GET_ACCESS_HISTORY]", error);
    return NextResponse.json({ error: "Failed to fetch access history" }, { status: 500 });
  }
}
