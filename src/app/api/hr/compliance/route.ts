import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cmsPrisma } from "@/lib/prisma-cms";
import { EMPLOYEE_PATIENT_WHERE, EMPLOYEE_TRANSACTION_WHERE } from "@/lib/hr-employee-filter";

const PE_KEYWORDS = ["APE", "ANNUAL", "PHYSICAL", "CAAP"];

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const role = (session.user as { role?: string }).role;
    if (role !== "HR" && role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const page   = parseInt(searchParams.get("page")  ?? "1",  10);
    const limit  = parseInt(searchParams.get("limit") ?? "20", 10);
    const search = searchParams.get("search") ?? "";
    const status = searchParams.get("status") ?? "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      ...EMPLOYEE_PATIENT_WHERE,
      ...(search ? {
        OR: [
          { fullName: { contains: search, mode: "insensitive" } },
          { code:     { contains: search, mode: "insensitive" } },
        ],
      } : {}),
    };

    const patients = await cmsPrisma.cmsPatient.findMany({
      where,
      select: {
        id: true,
        code: true,
        fullName: true,
        gender: true,
        dob: true,
        queues: {
          where: { transactions: { some: EMPLOYEE_TRANSACTION_WHERE } },
          orderBy: { date: "desc" },
          take: 10,
          select: {
            id: true,
            date: true,
            status: true,
            patientType: true,
            transactions: {
              select: { descriptionItemPrice: true, date: true },
            },
          },
        },
      },
    });

    const today      = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const rows = patients.map((p) => {
      let lastPeDate: Date | null = null;

      for (const q of p.queues) {
        for (const tx of q.transactions) {
          const desc = (tx.descriptionItemPrice ?? "").toUpperCase();
          if (PE_KEYWORDS.some((k) => desc.includes(k))) {
            const d = tx.date ? new Date(tx.date) : (q.date ? new Date(q.date) : null);
            if (d && (!lastPeDate || d > lastPeDate)) lastPeDate = d;
          }
        }
      }

      const daysOverdue = lastPeDate
        ? Math.floor((today.getTime() - lastPeDate.getTime()) / (1000 * 60 * 60 * 24)) - 365
        : null;

      const peStatus: "compliant" | "overdue" | "never" =
        !lastPeDate ? "never"
        : daysOverdue !== null && daysOverdue > 0 ? "overdue"
        : "compliant";

      return {
        id:          String(p.id),
        code:        p.code,
        fullName:    p.fullName,
        gender:      p.gender,
        lastPeDate:  lastPeDate?.toISOString().split("T")[0] ?? null,
        daysOverdue: daysOverdue !== null && daysOverdue > 0 ? daysOverdue : null,
        peStatus,
      };
    });

    const filtered   = status ? rows.filter((r) => r.peStatus === status) : rows;
    const total      = filtered.length;
    const paginated  = filtered.slice((page - 1) * limit, page * limit);

    const overdueCnt    = rows.filter((r) => r.peStatus === "overdue").length;
    const compliantCnt  = rows.filter((r) => r.peStatus === "compliant").length;
    const neverCnt      = rows.filter((r) => r.peStatus === "never").length;
    const complianceRate = patients.length > 0
      ? Math.round((compliantCnt / patients.length) * 100)
      : 0;

    return NextResponse.json({
      data: paginated,
      summary: { overdue: overdueCnt, compliant: compliantCnt, never: neverCnt, complianceRate, total: patients.length },
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[GET_COMPLIANCE]", error);
    return NextResponse.json({ error: "Failed to fetch compliance data" }, { status: 500 });
  }
}
