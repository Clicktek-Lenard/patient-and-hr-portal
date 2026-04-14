import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cmsPrisma } from "@/lib/prisma-cms";
import { STATUS_MAP } from "@/types";
import type { QueueStatusCode } from "@/types";

const STATUS_FRIENDLY: Record<number, QueueStatusCode> = {
  100: "waiting",
  201: "waiting",
  202: "in_progress",
  203: "on_hold",
  205: "exit",
  210: "in_progress",
  212: "in_progress",
  230: "next_room",
  250: "in_progress",
  260: "in_progress",
  280: "in_progress",
  300: "in_progress",
  360: "complete",
  400: "complete",
  500: "complete",
  550: "complete",
  600: "complete",
  610: "complete",
  615: "complete",
  620: "complete",
  630: "complete",
  650: "complete",
  900: "exit",
};

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const patientCode = session.user.patientCode;
    if (!patientCode) {
      return NextResponse.json({ data: { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 } });
    }

    const { searchParams } = new URL(req.url);
    const rawPage     = parseInt(searchParams.get("page")     ?? "1",  10);
    const rawPageSize = parseInt(searchParams.get("pageSize") ?? "10", 10);
    const page        = isNaN(rawPage)     || rawPage     < 1 ? 1  : rawPage;
    const pageSize    = isNaN(rawPageSize) || rawPageSize < 1 ? 10 : Math.min(100, rawPageSize);
    const search   = searchParams.get("search")?.toLowerCase() ?? "";

    const cmsPatient = await cmsPrisma.cmsPatient.findUnique({
      where: { code: patientCode },
      select: { id: true },
    });

    if (!cmsPatient) {
      return NextResponse.json({ data: { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 } });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { idPatient: cmsPatient.id };
    if (search) {
      where.OR = [
        { code:      { contains: search, mode: "insensitive" } },
        { qFullName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, queues] = await Promise.all([
      cmsPrisma.cmsQueue.count({ where }),
      cmsPrisma.cmsQueue.findMany({
        where,
        orderBy: { dateTime: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          transactions: {
            where: { status: { not: 2 } },
            select: { amountItemPrice: true, nameDoctor: true },
          },
        },
      }),
    ]);

    const data = queues.map((q) => {
      const statusKey   = STATUS_FRIENDLY[q.status] ?? "waiting";
      const totalAmount = q.transactions.reduce((s, t) => s + Number(t.amountItemPrice ?? 0), 0);
      const doctor      = q.transactions.find((t) => t.nameDoctor)?.nameDoctor ?? null;

      return {
        id:             Number(q.id),
        code:           q.code ?? "",
        date:           q.dateTime.toISOString(),
        status:         statusKey,
        friendlyStatus: STATUS_MAP[statusKey],
        doctor,
        department:     null,
        totalAmount,
        isPaid:         q.status >= 400,
      };
    });

    return NextResponse.json({
      data: { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error("[GET_VISITS]", error);
    return NextResponse.json({ error: "Failed to fetch visits" }, { status: 500 });
  }
}
