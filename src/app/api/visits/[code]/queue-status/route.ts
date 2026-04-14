import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cmsPrisma } from "@/lib/prisma-cms";
import { STATUS_MAP } from "@/types";
import type { QueueStatusCode } from "@/types";

const STATUS_FRIENDLY: Record<number, QueueStatusCode> = {
  100: "waiting",  201: "waiting",   202: "in_progress", 203: "on_hold",
  205: "exit",     210: "in_progress", 212: "in_progress", 230: "next_room",
  250: "in_progress", 260: "in_progress", 280: "in_progress", 300: "in_progress",
  360: "complete", 400: "complete",  500: "complete",  550: "complete",
  600: "complete", 610: "complete",  615: "complete",  620: "complete",
  630: "complete", 650: "complete",  900: "exit",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await params;

    const queue = await cmsPrisma.cmsQueue.findFirst({
      where: { code },
      select: {
        id: true,
        status: true,
      },
    });

    if (!queue) {
      return NextResponse.json({ error: "Queue not found" }, { status: 404 });
    }

    const statusKey = STATUS_FRIENDLY[queue.status] ?? "waiting";

    // Count patients ahead with active statuses
    const waitingAhead = await cmsPrisma.cmsQueue.count({
      where: {
        status: { in: [201, 202, 210, 212] },
        id: { lt: queue.id },
      },
    });

    return NextResponse.json({
      data: {
        queueCode:     code,
        station:       "",
        stationLabel:  "",
        status:        statusKey,
        numOfCall:     0,
        friendlyStatus: STATUS_MAP[statusKey],
        waitingAhead,
        estimatedWait: waitingAhead * 10,
        lastUpdated:   new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[GET_QUEUE_STATUS]", error);
    return NextResponse.json({ error: "Failed to fetch queue status" }, { status: 500 });
  }
}
