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

    // Get patient's queue IDs first, then join vitalsign
    const patientQueues = await cmsPrisma.cmsQueue.findMany({
      where: { idPatient: cmsPatient.id },
      select: { id: true, code: true, dateTime: true },
      orderBy: { dateTime: "desc" },
    });

    const queueIds = patientQueues.map((q) => parseInt(q.id.toString())); // bigint→number for Int FK

    const [total, vitalSigns] = await Promise.all([
      cmsPrisma.cmsVitalSign.count({ where: { queueId: { in: queueIds } } }),
      cmsPrisma.cmsVitalSign.findMany({
        where: { queueId: { in: queueIds } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const queueMap = new Map<number, typeof patientQueues[number]>(
      patientQueues.map((q) => [parseInt(q.id.toString()), q])
    );

    const data = vitalSigns.map((v) => {
      const queue       = queueMap.get(parseInt(v.queueId.toString()));
      const bpSystolic  = v.bpSystolic  ?? undefined;
      const bpDiastolic = v.bpDiastolic ?? undefined;
      return {
        id:              v.id,
        queueCode:       queue?.code ?? "",
        date:            queue?.dateTime.toISOString() ?? v.createdAt.toISOString(),
        bp:              bpSystolic && bpDiastolic ? `${bpSystolic}/${bpDiastolic}` : undefined,
        bpSystolic,
        bpDiastolic,
        temp:            v.temperature     ?? undefined,
        weight:          v.weightKg        ?? undefined,
        height:          v.heightCm        ?? undefined,
        bmi:             v.bmi             ?? undefined,
        pulse:           v.heartRate       ?? undefined,
        respiratoryRate: v.respiratoryRate ?? undefined,
        chiefComplaint:  v.chiefComplaint  ?? undefined,
        recordedAt:      v.createdAt.toISOString(),
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
