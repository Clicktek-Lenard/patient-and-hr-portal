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
      include: {
        transactions: {
          where: { status: { not: 2 } },
          select: {
            id: true,
            codeItemPrice: true,
            descriptionItemPrice: true,
            amountItemPrice: true,
            nameDoctor: true,
          },
        },
      },
    });

    if (!queue) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    // Verify this queue belongs to the authenticated patient
    const patientCode = session.user.patientCode;
    if (patientCode) {
      const cmsPatient = await cmsPrisma.cmsPatient.findUnique({
        where: { code: patientCode },
        select: { id: true },
      });
      if (!cmsPatient || queue.idPatient !== cmsPatient.id) {
        return NextResponse.json({ error: "Visit not found" }, { status: 404 });
      }
    }

    const statusKey  = STATUS_FRIENDLY[queue.status] ?? "waiting";
    const services   = queue.transactions.map((t) => ({
      id:     Number(t.id),
      code:   t.codeItemPrice ?? "",
      name:   t.descriptionItemPrice ?? "",
      amount: Number(t.amountItemPrice ?? 0),
    }));
    const totalAmount = services.reduce((s, sv) => s + sv.amount, 0);
    const doctorName  = queue.transactions.find((t) => t.nameDoctor)?.nameDoctor;

    return NextResponse.json({
      data: {
        id:             Number(queue.id),
        code:           queue.code ?? "",
        date:           queue.dateTime.toISOString(),
        status:         statusKey,
        friendlyStatus: STATUS_MAP[statusKey],
        patientCode:    patientCode ?? "",
        services,
        doctor:         doctorName ? { id: 0, code: "", name: doctorName } : undefined,
        department:     undefined,
        chiefComplaint: undefined,
        totalAmount,
        isPaid:         queue.status >= 400,
        hasResults:     false,
        hasVitals:      false,
      },
    });
  } catch (error) {
    console.error("[GET_VISIT]", error);
    return NextResponse.json({ error: "Failed to fetch visit" }, { status: 500 });
  }
}
