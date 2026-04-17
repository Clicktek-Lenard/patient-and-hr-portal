import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cmsPrisma } from "@/lib/prisma-cms";

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
    const page     = parseInt(searchParams.get("page")     ?? "1",  10);
    const pageSize = parseInt(searchParams.get("pageSize") ?? "10", 10);

    const cmsPatient = await cmsPrisma.cmsPatient.findUnique({
      where: { code: patientCode },
      select: { id: true },
    });

    if (!cmsPatient) {
      return NextResponse.json({ data: { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 } });
    }

    // Get patient's queue IDs
    const patientQueues = await cmsPrisma.cmsQueue.findMany({
      where: { idPatient: cmsPatient.id },
      select: { id: true, code: true, dateTime: true },
      orderBy: { dateTime: "desc" },
    });

    const queueBigIds = patientQueues.map((q) => q.id);

    const [total, vitalSigns] = await Promise.all([
      cmsPrisma.cmsVitalSign.count({ where: { idQueue: { in: queueBigIds } } }),
      cmsPrisma.cmsVitalSign.findMany({
        where: { idQueue: { in: queueBigIds } },
        orderBy: { inputDate: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const queueMap = new Map(patientQueues.map((q) => [q.id.toString(), q]));

    const data = vitalSigns.map((v) => {
      const queue      = v.idQueue ? queueMap.get(v.idQueue.toString()) : null;
      const sys        = v.bpSystolic  ?? undefined;
      const dia        = v.bpDiastolic ?? undefined;
      return {
        id:              Number(v.id),
        queueCode:       queue?.code ?? v.queueCode ?? "",
        date:            queue?.dateTime?.toISOString() ?? v.inputDate?.toISOString() ?? null,
        bp:              sys && dia ? `${sys}/${dia}` : undefined,
        bpSystolic:      sys,
        bpDiastolic:     dia,
        temp:            v.temperature     ?? undefined,
        weight:          v.weight          ?? undefined,
        height:          v.height          ?? undefined,
        bmi:             v.bmi             ?? undefined,
        pulse:           v.pulseRate       ?? undefined,
        respiratoryRate: v.respiratoryRate ?? undefined,
        chiefComplaint:  v.chiefComplaint  ?? undefined,
        recordedAt:      v.inputDate?.toISOString() ?? null,
      };
    });

    return NextResponse.json({
      data: { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error("[GET_VITALS]", error);
    return NextResponse.json({ error: "Failed to fetch vitals" }, { status: 500 });
  }
}
