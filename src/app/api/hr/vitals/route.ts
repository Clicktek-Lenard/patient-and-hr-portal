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

  // Step 1 — fetch vitals (no relations)
  const [total, vitals] = await Promise.all([
    cmsPrisma.cmsVitalSign.count(),
    cmsPrisma.cmsVitalSign.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Step 2 — fetch queues by Int queueId separately (no required-relation join)
  const queueIdsAsInt = [...new Set(vitals.map((v) => v.queueId).filter((id) => id != null))] as number[];
  const queueIdsAsBigInt = queueIdsAsInt.map((id) => BigInt(id));

  const queues = queueIdsAsBigInt.length
    ? await cmsPrisma.cmsQueue.findMany({
        where: { id: { in: queueIdsAsBigInt } },
        select: { id: true, code: true, qFullName: true, dateTime: true, idPatient: true },
      })
    : [];

  // Step 3 — fetch patients separately
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
    const queue   = v.queueId != null ? queueMap.get(BigInt(v.queueId).toString()) : null;
    const patient = queue?.idPatient ? patientMap.get(queue.idPatient.toString()) : null;

    const sys = v.bpSystolic  ?? 0;
    const dia = v.bpDiastolic ?? 0;
    const bpCategory =
      sys >= 140 || dia >= 90 ? "hypertension"
      : sys >= 120 || dia >= 80 ? "pre-hypertension"
      : sys > 0               ? "normal"
      : null;

    return {
      id:             v.id,
      queueCode:      queue?.code ?? "—",
      patientCode:    patient?.code ?? "—",
      patientName:    patient?.fullName ?? queue?.qFullName ?? "—",
      date:           queue?.dateTime?.toISOString() ?? v.createdAt.toISOString(),
      bpSystolic:     v.bpSystolic  ?? null,
      bpDiastolic:    v.bpDiastolic ?? null,
      heartRate:      v.heartRate   ?? null,
      temperature:    v.temperature ?? null,
      respiratoryRate: v.respiratoryRate ?? null,
      weightKg:       v.weightKg    ?? null,
      heightCm:       v.heightCm    ?? null,
      bmi:            v.bmi         ?? null,
      chiefComplaint: v.chiefComplaint ?? null,
      pcpDoctor:      v.pcpDoctor   ?? null,
      recordedBy:     v.recordedBy  ?? null,
      bpCategory,
      createdAt:      v.createdAt.toISOString(),
    };
  });

  // Apply search filter in-memory (after join)
  if (search) {
    const s = search.toLowerCase();
    data = data.filter(
      (d) => d.patientName.toLowerCase().includes(s) || d.patientCode.toLowerCase().includes(s) || d.queueCode.toLowerCase().includes(s)
    );
  }

  return NextResponse.json({
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
