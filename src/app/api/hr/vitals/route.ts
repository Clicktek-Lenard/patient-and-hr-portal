import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cmsPrisma } from "@/lib/prisma-cms";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  if (role !== "HR" && role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = req.nextUrl;
  const page   = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
  const limit  = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "25")));
  const search = searchParams.get("search")?.trim() ?? "";

  const [total, vitals] = await Promise.all([
    cmsPrisma.cmsVitalSign.count(),
    cmsPrisma.cmsVitalSign.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { inputDate: "desc" },
    }),
  ]);

  // Fetch queues by BigInt idQueue
  const queueIds = [...new Set(vitals.map((v) => v.idQueue).filter((id) => id != null))] as bigint[];

  const queues = queueIds.length
    ? await cmsPrisma.cmsQueue.findMany({
        where: { id: { in: queueIds } },
        select: { id: true, code: true, qFullName: true, dateTime: true, idPatient: true },
      })
    : [];

  const patientIds = [...new Set(queues.map((q) => q.idPatient).filter(Boolean))];
  const patients = patientIds.length
    ? await cmsPrisma.cmsPatient.findMany({
        where: { id: { in: patientIds as bigint[] } },
        select: { id: true, code: true, fullName: true },
      })
    : [];

  const queueMap   = new Map(queues.map((q) => [q.id.toString(), q]));
  const patientMap = new Map(patients.map((p) => [p.id.toString(), p]));

  let data = vitals.map((v) => {
    const queue   = v.idQueue != null ? queueMap.get(v.idQueue.toString()) : null;
    const patient = queue?.idPatient ? patientMap.get(queue.idPatient.toString()) : null;

    const sys = v.bpSystolic  ?? 0;
    const dia = v.bpDiastolic ?? 0;
    const bpCategory =
      sys >= 140 || dia >= 90 ? "hypertension"
      : sys >= 120 || dia >= 80 ? "pre-hypertension"
      : sys > 0               ? "normal"
      : null;

    return {
      id:              Number(v.id),
      queueCode:       queue?.code ?? v.queueCode ?? "—",
      patientCode:     patient?.code ?? "—",
      patientName:     patient?.fullName ?? queue?.qFullName ?? "—",
      date:            queue?.dateTime?.toISOString() ?? v.inputDate?.toISOString() ?? null,
      bpSystolic:      v.bpSystolic  ?? null,
      bpDiastolic:     v.bpDiastolic ?? null,
      heartRate:       v.pulseRate   ?? null,
      temperature:     v.temperature ?? null,
      respiratoryRate: v.respiratoryRate ?? null,
      weight:          v.weight ?? null,
      height:          v.height ?? null,
      bmi:             v.bmi    ?? null,
      bmiCategory:     v.bmiCategory ?? null,
      chiefComplaint:  v.chiefComplaint ?? null,
      pcpDoctor:       v.pcpName  ?? null,
      bpCategory,
      recordedAt:      v.inputDate?.toISOString() ?? null,
    };
  });

  if (search) {
    const s = search.toLowerCase();
    data = data.filter(
      (d) =>
        d.patientName.toLowerCase().includes(s) ||
        d.patientCode.toLowerCase().includes(s) ||
        d.queueCode.toLowerCase().includes(s)
    );
  }

  return NextResponse.json({
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
