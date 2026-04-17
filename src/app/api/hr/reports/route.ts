import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cmsPrisma } from "@/lib/prisma-cms";
import { EMPLOYEE_PATIENT_WHERE, EMPLOYEE_QUEUE_WHERE, EMPLOYEE_TRANSACTION_WHERE } from "@/lib/hr-employee-filter";
import * as XLSX from "xlsx";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const role = (session.user as { role?: string }).role;
    if (role !== "HR" && role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const type       = searchParams.get("type")       ?? "summary";
    const format     = searchParams.get("format")     ?? "json";
    const from       = searchParams.get("from");
    const to         = searchParams.get("to");
    const department = searchParams.get("department") ?? "";

    const dateFilter = from && to
      ? { gte: new Date(from), lte: new Date(to) }
      : undefined;

    // Build department-aware employee filter
    const deptTxWhere = department
      ? { ...EMPLOYEE_TRANSACTION_WHERE, nameCompany: { equals: department, mode: "insensitive" as const } }
      : EMPLOYEE_TRANSACTION_WHERE;

    const empPatientWhere = {
      isActive: 1 as const,
      queues: { some: { transactions: { some: deptTxWhere } } },
    };

    const empQueueWhere = {
      transactions: { some: deptTxWhere },
    };

    // ── DEPARTMENTS LIST (for "json" requests) ───────────────────
    if (type === "departments") {
      const txs = await cmsPrisma.cmsTransaction.findMany({
        where: EMPLOYEE_TRANSACTION_WHERE,
        select: { nameCompany: true },
        distinct: ["nameCompany"],
      });
      const departments = txs
        .map((t) => t.nameCompany)
        .filter((n): n is string => !!n)
        .sort();
      return NextResponse.json({ data: departments });
    }

    // ── DEMOGRAPHIC REPORT ────────────────────────────────────────
    if (type === "demographic") {
      const empBase = empPatientWhere;
      const [maleCount, femaleCount, otherCount, totalCount] = await Promise.all([
        cmsPrisma.cmsPatient.count({ where: { ...empBase, gender: { equals: "Male",   mode: "insensitive" } } }),
        cmsPrisma.cmsPatient.count({ where: { ...empBase, gender: { equals: "Female", mode: "insensitive" } } }),
        cmsPrisma.cmsPatient.count({ where: { ...empBase, gender: { notIn: ["Male", "Female"] } } }),
        cmsPrisma.cmsPatient.count({ where: empBase }),
      ]);

      // Top 10 chief complaints (used as disease/diagnosis proxy from vitals)
      const complaintsRaw = await cmsPrisma.cmsVitalSign.findMany({
        where: { chiefComplaint: { not: null } },
        select: { chiefComplaint: true },
      });

      const complaintMap: Record<string, number> = {};
      for (const v of complaintsRaw) {
        const c = (v.chiefComplaint ?? "").trim();
        if (!c) continue;
        complaintMap[c] = (complaintMap[c] ?? 0) + 1;
      }

      const top10 = Object.entries(complaintMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([diagnosis, count], i) => ({ rank: i + 1, diagnosis, count }));

      const demographicData = {
        gender: { male: maleCount, female: femaleCount, other: otherCount, total: totalCount },
        top10Diseases: top10,
      };

      if (format === "json") {
        return NextResponse.json({ data: demographicData });
      }

      // Excel / CSV export
      const genderRows = [
        { Category: "Male",   Count: maleCount,   Percentage: totalCount ? `${((maleCount / totalCount) * 100).toFixed(1)}%` : "0%" },
        { Category: "Female", Count: femaleCount,  Percentage: totalCount ? `${((femaleCount / totalCount) * 100).toFixed(1)}%` : "0%" },
        { Category: "Other",  Count: otherCount,   Percentage: totalCount ? `${((otherCount / totalCount) * 100).toFixed(1)}%` : "0%" },
        { Category: "TOTAL",  Count: totalCount,   Percentage: "100%" },
      ];

      const diseaseRows = top10.map((d) => ({
        Rank: d.rank,
        Diagnosis: d.diagnosis,
        "Patient Count": d.count,
      }));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(genderRows),  "Gender Distribution");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(diseaseRows), "Top 10 Diseases");

      if (format === "csv") {
        const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet([...genderRows, {}, ...diseaseRows]));
        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="demographic-report.csv"`,
          },
        });
      }

      const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      return new NextResponse(buf, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="demographic-report.xlsx"`,
        },
      });
    }

    // ── SUMMARY REPORT (employees only, with optional department) ──
    const whereQueue = {
      ...empQueueWhere,
      ...(dateFilter ? { date: dateFilter } : {}),
    };

    const whereTransaction = {
      ...deptTxWhere,
      ...(dateFilter ? { date: dateFilter } : {}),
    };

    const [totalVisits, completedVisits, totalPatients, totalRevenue, labResults] = await Promise.all([
      cmsPrisma.cmsQueue.count({ where: whereQueue }),
      cmsPrisma.cmsQueue.count({ where: { ...whereQueue, status: { gte: 400 } } }),
      cmsPrisma.cmsPatient.count({ where: empPatientWhere }),
      cmsPrisma.cmsTransaction.aggregate({
        _sum: { amountItemPrice: true },
        where: whereTransaction,
      }),
      cmsPrisma.cmsTransaction.count({
        where: whereTransaction,
      }),
    ]);

    // Visits by day (employee visits only)
    const visits = await cmsPrisma.cmsQueue.findMany({
      where: whereQueue,
      select: { date: true, patientType: true, status: true },
      orderBy: { date: "asc" },
    });

    // Group by date
    const byDate: Record<string, { date: string; total: number; completed: number }> = {};
    for (const v of visits) {
      const d = v.date.toISOString().split("T")[0];
      if (!byDate[d]) byDate[d] = { date: d, total: 0, completed: 0 };
      byDate[d].total++;
      if (v.status >= 400) byDate[d].completed++;
    }

    // Visit breakdown by patient type
    const byType: Record<string, number> = {};
    for (const v of visits) {
      const t = v.patientType ?? "Unknown";
      byType[t] = (byType[t] ?? 0) + 1;
    }

    const summaryData = {
      totals: {
        totalVisits,
        completedVisits,
        totalPatients,
        totalRevenue: totalRevenue._sum.amountItemPrice ?? 0,
        labResults,
      },
      visitsByDate: Object.values(byDate),
      visitsByType: Object.entries(byType).map(([type, count]) => ({ type, count })),
    };

    if (format === "json") {
      return NextResponse.json({ data: summaryData });
    }

    // Excel export
    const summaryRows = [
      { Metric: "Total Visits",      Value: totalVisits },
      { Metric: "Completed Visits",  Value: completedVisits },
      { Metric: "Total Employees",   Value: totalPatients },
      { Metric: "Total Revenue",     Value: Number(totalRevenue._sum.amountItemPrice ?? 0).toFixed(2) },
      { Metric: "Lab Results",       Value: labResults },
    ];

    const dateRows = summaryData.visitsByDate.map((d) => ({
      Date: d.date,
      "Total Visits": d.total,
      "Completed": d.completed,
    }));

    const typeRows = summaryData.visitsByType.map((t) => ({
      "Patient Type": t.type,
      Count: t.count,
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), "Summary");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dateRows),    "Visits by Date");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(typeRows),    "Visits by Type");

    if (format === "csv") {
      const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(summaryRows));
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="summary-report.csv"`,
        },
      });
    }

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="summary-report.xlsx"`,
      },
    });
  } catch (error) {
    console.error("[GET_REPORTS]", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
