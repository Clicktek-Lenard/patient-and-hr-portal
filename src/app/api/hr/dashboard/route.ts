import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { cmsPrisma } from "@/lib/prisma-cms";
import { prisma } from "@/lib/prisma";
import { EMPLOYEE_PATIENT_WHERE, EMPLOYEE_QUEUE_WHERE, EMPLOYEE_TRANSACTION_WHERE } from "@/lib/hr-employee-filter";

const ONGOING_STATUSES  = [100, 201, 202, 203, 210, 212, 230, 250, 260, 280, 300];
const COMPLETE_STATUSES = [360, 400, 500, 550, 600, 610, 615, 620, 630, 650];
const PE_KW = ["APE", "ANNUAL", "PHYSICAL", "CAAP"];

function statusLabel(status: number): string {
  if ([100, 201].includes(status))                           return "waiting";
  if ([202, 210, 212, 250, 260, 280, 300].includes(status)) return "in_progress";
  if ([203].includes(status))                                return "on_hold";
  if ([230].includes(status))                                return "next_room";
  if ([205, 900].includes(status))                           return "exit";
  if (status >= 360)                                         return "complete";
  return "unknown";
}

function isPeTransaction(desc: string | null): boolean {
  if (!desc) return false;
  const up = desc.toUpperCase();
  return PE_KW.some((k) => up.includes(k));
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

  // ── Core counts — employees only ────────────────────────────────
  const [
    totalEmployees,
    todayVisits,
    totalVisits,
    ongoingVisits,
    completedVisits,
  ] = await Promise.all([
    cmsPrisma.cmsPatient.count({ where: EMPLOYEE_PATIENT_WHERE }),
    cmsPrisma.cmsQueue.count({ where: { ...EMPLOYEE_QUEUE_WHERE, date: { gte: today, lt: tomorrow } } }),
    cmsPrisma.cmsQueue.count({ where: EMPLOYEE_QUEUE_WHERE }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cmsPrisma.cmsQueue.count({ where: { ...EMPLOYEE_QUEUE_WHERE, status: { in: ONGOING_STATUSES } } as any }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cmsPrisma.cmsQueue.count({ where: { ...EMPLOYEE_QUEUE_WHERE, status: { in: COMPLETE_STATUSES } } as any }),
  ]);

  // ── Employees with at least one released result ──────────────────
  const employeesWithResults = await cmsPrisma.cmsPatient.count({
    where: {
      ...EMPLOYEE_PATIENT_WHERE,
      queues: {
        some: {
          status: { gte: 500, lt: 650 },
          transactions: { some: EMPLOYEE_TRANSACTION_WHERE },
        },
      },
    },
  });

  // ── Fetch all employees with recent queues + transactions ────────
  const allEmployees = await cmsPrisma.cmsPatient.findMany({
    where: EMPLOYEE_PATIENT_WHERE,
    select: {
      id: true,
      code: true,
      queues: {
        where: { transactions: { some: EMPLOYEE_TRANSACTION_WHERE } },
        orderBy: { date: "desc" },
        take: 20,
        select: {
          date: true,
          status: true,
          patientType: true,
          transactions: {
            where: EMPLOYEE_TRANSACTION_WHERE,
            select: { descriptionItemPrice: true, date: true, nameCompany: true },
          },
        },
      },
    },
  });

  // ── Department resolution (same logic as employee list) ──────────
  const empCodes = allEmployees.map((e) => e.code).filter((c): c is string => !!c);
  const empIds   = allEmployees.map((e) => e.id);

  const portalDeptMap = new Map<string, string>();
  if (empCodes.length > 0) {
    const rows = await prisma.portalEmployeeDepartment.findMany({
      where: { patientCode: { in: empCodes } },
      select: { patientCode: true, department: true },
    });
    for (const r of rows) portalDeptMap.set(r.patientCode, r.department);
  }

  const cmsDeptMap = new Map<string, string>();
  if (empIds.length > 0) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const corpEmpModel = (cmsPrisma as any).corporateEmployee;
      if (corpEmpModel?.findMany) {
        const rows = await corpEmpModel.findMany({
          where: { patientId: { in: empIds }, department: { not: null } },
          select: { patientId: true, department: true },
          orderBy: { id: "desc" },
        });
        for (const r of rows as { patientId: bigint | null; department: string | null }[]) {
          if (r.patientId && r.department && !cmsDeptMap.has(r.patientId.toString())) {
            cmsDeptMap.set(r.patientId.toString(), r.department);
          }
        }
      }
    } catch {
      // skip if model not regenerated yet
    }
  }

  function resolveDepartment(
    patientCode: string | null,
    patientId: bigint,
    queues: typeof allEmployees[number]["queues"],
  ): string {
    // 1. Portal override
    if (patientCode) {
      const d = portalDeptMap.get(patientCode);
      if (d && d.trim()) return d.trim();
    }
    // 2. CMS corporate_employees
    const cmsD = cmsDeptMap.get(patientId.toString());
    if (cmsD && cmsD.trim()) return cmsD.trim();
    // 3. First non-DEFAULT company from transactions
    for (const q of queues) {
      for (const tx of q.transactions) {
        const c = tx.nameCompany?.trim();
        if (c && !c.toUpperCase().includes("DEFAULT")) return c;
      }
    }
    return "Unassigned";
  }

  let overdueCount   = 0;
  let compliantCount = 0;
  let neverCount     = 0;
  const conditionMap: Record<string, number> = {};
  const companyMap:   Record<string, { total: number; compliant: number }> = {};

  for (const emp of allEmployees) {
    let lastPeDate: Date | null = null;
    const empDept = resolveDepartment(emp.code, emp.id, emp.queues);

    for (const q of emp.queues) {
      for (const tx of q.transactions) {
        const desc = tx.descriptionItemPrice ?? "";
        const key  = desc.trim();
        if (key) conditionMap[key] = (conditionMap[key] ?? 0) + 1;

        if (isPeTransaction(desc)) {
          const d = tx.date ? new Date(tx.date) : q.date ? new Date(q.date) : null;
          if (d && (!lastPeDate || d > lastPeDate)) lastPeDate = d;
        }
      }
    }

    if (!companyMap[empDept]) companyMap[empDept] = { total: 0, compliant: 0 };
    companyMap[empDept].total++;

    if (!lastPeDate) {
      neverCount++;
    } else {
      const daysAgo = Math.floor((today.getTime() - lastPeDate.getTime()) / 86400000);
      if (daysAgo > 365) overdueCount++;
      else {
        compliantCount++;
        companyMap[empDept].compliant++;
      }
    }
  }

  const total = allEmployees.length || 1;
  const peComplianceRate = Math.round((compliantCount / total) * 100);

  // ── Top 5 Conditions ─────────────────────────────────────────────
  const top5Conditions = Object.entries(conditionMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // ── PE Compliance by Department ───────────────────────────────────
  // Priority order: portal override > CMS corporate_employees > queue
  // nameCompany (excluding DEFAULT). "Unassigned" groups patients with
  // no department anywhere.
  const peByDept = Object.entries(companyMap)
    .filter(([, v]) => v.total >= 1)
    .map(([dept, v]) => ({
      dept,
      total: v.total,
      compliant: v.compliant,
      rate: Math.round((v.compliant / v.total) * 100),
    }))
    // Unassigned goes last regardless of size
    .sort((a, b) => {
      if (a.dept === "Unassigned" && b.dept !== "Unassigned") return 1;
      if (b.dept === "Unassigned" && a.dept !== "Unassigned") return -1;
      return b.total - a.total;
    })
    .slice(0, 6);

  // ── Wellness score ────────────────────────────────────────────────
  const patientsWithVitals = await cmsPrisma.cmsVitalSign.count();
  const vitalRate = totalEmployees > 0
    ? Math.min(100, Math.round((patientsWithVitals / totalEmployees) * 100))
    : 0;
  const wellnessScore = Math.min(100, Math.round((peComplianceRate + vitalRate) / 2));

  // ── Recent 8 employee visits ──────────────────────────────────────
  const recentVisitsRaw = await cmsPrisma.cmsQueue.findMany({
    where: EMPLOYEE_QUEUE_WHERE,
    take: 8,
    orderBy: { dateTime: "desc" },
    select: {
      id: true, code: true, qFullName: true, qGender: true,
      agePatient: true, status: true, patientType: true, date: true, dateTime: true, idPatient: true,
    },
  });

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

  // ── Top 5 employees by visit count ────────────────────────────────
  const topGrouped = await cmsPrisma.cmsQueue.groupBy({
    by: ["idPatient"],
    where: EMPLOYEE_QUEUE_WHERE,
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
    const p = topDetails.find((pd) => pd.id === tp.idPatient) ?? null;
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

  return NextResponse.json({
    stats: {
      totalPatients:        totalEmployees,
      todayVisits,
      totalVisits,
      ongoingVisits,
      completedVisits,
      employeesWithResults,
      overdueAnnualPe:      overdueCount,
      peComplianceRate,
      wellnessScore,
    },
    top5Conditions,
    peByDept,
    recentVisits,
    topPatients,
  });
}
