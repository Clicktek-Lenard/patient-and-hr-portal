import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { cmsPrisma } from "@/lib/prisma-cms";

const ONGOING_STATUSES  = [100, 201, 202, 203, 210, 212, 230, 250, 260, 280, 300];
const COMPLETE_STATUSES = [360, 400, 500, 550, 600, 610, 615, 620, 630, 650];

function statusLabel(status: number): string {
  if ([100, 201].includes(status))                           return "waiting";
  if ([202, 210, 212, 250, 260, 280, 300].includes(status)) return "in_progress";
  if ([203].includes(status))                                return "on_hold";
  if ([230].includes(status))                                return "next_room";
  if ([205, 900].includes(status))                           return "exit";
  if (status >= 360)                                         return "complete";
  return "unknown";
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  if (role !== "HR" && role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const PE_KW    = ["APE", "ANNUAL", "PHYSICAL", "CAAP"];
  const XRAY_KW  = ["XRAY", "X-RAY", "CHEST"];
  const CBC_KW   = ["CBC", "COMPLETE BLOOD"];
  const URINE_KW = ["URINE", "URINALYSIS", "UA "];

  const [
    totalPatients,
    todayVisits,
    monthVisits,
    totalVisits,
    ongoingVisits,
    completedVisits,
    pendingResults,
  ] = await Promise.all([
    cmsPrisma.cmsPatient.count({ where: { isActive: 1 } }),
    cmsPrisma.cmsQueue.count({ where: { date: { gte: today, lt: tomorrow } } }),
    cmsPrisma.cmsQueue.count({ where: { date: { gte: monthStart, lt: tomorrow } } }),
    cmsPrisma.cmsQueue.count(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cmsPrisma.cmsQueue.count({ where: { status: { in: ONGOING_STATUSES } } as any }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cmsPrisma.cmsQueue.count({ where: { status: { in: COMPLETE_STATUSES } } as any }),
    // pending = in-progress queues with transactions
    cmsPrisma.cmsTransaction.count({ where: { status: { not: 2 } } }),
  ]);

  // Service counts from transactions
  const mkOr = (kws: string[]) => kws.map((k) => ({
    descriptionItemPrice: { contains: k, mode: "insensitive" as const },
  }));

  const [apeCount, xrayCount, cbcCount, urinalysisCount] = await Promise.all([
    cmsPrisma.cmsTransaction.count({ where: { OR: mkOr(PE_KW),    status: { not: 2 } } }),
    cmsPrisma.cmsTransaction.count({ where: { OR: mkOr(XRAY_KW),  status: { not: 2 } } }),
    cmsPrisma.cmsTransaction.count({ where: { OR: mkOr(CBC_KW),   status: { not: 2 } } }),
    cmsPrisma.cmsTransaction.count({ where: { OR: mkOr(URINE_KW), status: { not: 2 } } }),
  ]);

  // Recent 8 visits — no inline patient relation to avoid null errors
  const recentVisitsRaw = await cmsPrisma.cmsQueue.findMany({
    take: 8,
    orderBy: { dateTime: "desc" },
    select: {
      id: true, code: true, qFullName: true, qGender: true,
      agePatient: true, status: true, patientType: true, date: true, dateTime: true, idPatient: true,
    },
  });

  // Fetch patients for recent visits separately
  const recentPatientIds = [...new Set(recentVisitsRaw.map((q) => q.idPatient).filter(Boolean))];
  const recentPatients = recentPatientIds.length
    ? await cmsPrisma.cmsPatient.findMany({
        where: { id: { in: recentPatientIds as bigint[] } },
        select: { id: true, code: true, fullName: true },
      })
    : [];
  const recentPatientMap = new Map(recentPatients.map((p) => [p.id.toString(), p]));

  const recentVisits = recentVisitsRaw.map((q) => {
    const patient = q.idPatient ? recentPatientMap.get(q.idPatient.toString()) : null;
    return {
      id:          Number(q.id),
      code:        q.code,
      qFullName:   q.qFullName,
      qGender:     q.qGender,
      agePatient:  q.agePatient,
      status:      q.status,
      statusLabel: statusLabel(q.status ?? 0),
      patientType: q.patientType,
      date:        q.date instanceof Date ? q.date.toISOString() : q.date,
      dateTime:    q.dateTime instanceof Date ? q.dateTime.toISOString() : q.dateTime,
      patientCode: patient?.code ?? null,
    };
  });

  // Top 5 patients by visit count
  const topGrouped = await cmsPrisma.cmsQueue.groupBy({
    by: ["idPatient"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 5,
  });
  const topIds = topGrouped.map((p) => p.idPatient);
  const topDetails = await cmsPrisma.cmsPatient.findMany({
    where: { id: { in: topIds } },
    select: { id: true, fullName: true, code: true, gender: true, lastVisit: true },
  });
  const topPatients = topGrouped.map((tp) => {
    const p = topDetails.find((p) => p.id === tp.idPatient) ?? null;
    return {
      idPatient:  Number(tp.idPatient),
      visitCount: tp._count.id,
      patient: p ? {
        id:        Number(p.id),
        fullName:  p.fullName,
        code:      p.code,
        gender:    p.gender,
        lastVisit: p.lastVisit?.toISOString() ?? null,
      } : null,
    };
  });

  // Gender breakdown
  const [maleCount, femaleCount, otherGenderCount] = await Promise.all([
    cmsPrisma.cmsPatient.count({ where: { gender: { equals: "Male",   mode: "insensitive" }, isActive: 1 } }),
    cmsPrisma.cmsPatient.count({ where: { gender: { equals: "Female", mode: "insensitive" }, isActive: 1 } }),
    cmsPrisma.cmsPatient.count({ where: { gender: { notIn: ["Male", "Female", "male", "female"] }, isActive: 1 } }),
  ]);

  // Patient type breakdown
  const patientTypeRaw = await cmsPrisma.cmsQueue.groupBy({
    by: ["patientType"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  return NextResponse.json({
    stats: {
      totalPatients,
      todayVisits,
      monthVisits,
      totalVisits,
      ongoingVisits,
      completedVisits,
      pendingResults,
      apeCount,
      xrayCount,
      cbcCount,
      urinalysisCount,
    },
    recentVisits,
    topPatients,
    genderBreakdown:      { male: maleCount, female: femaleCount, other: otherGenderCount },
    patientTypeBreakdown: patientTypeRaw.map((pt) => ({ type: pt.patientType ?? "Unknown", count: pt._count.id })),
  });
}
