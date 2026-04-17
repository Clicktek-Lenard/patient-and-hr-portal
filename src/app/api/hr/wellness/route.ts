import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cmsPrisma } from "@/lib/prisma-cms";
import { EMPLOYEE_TRANSACTION_WHERE } from "@/lib/hr-employee-filter";

const PE_KEYWORDS = ["APE", "ANNUAL", "PHYSICAL"];

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const role = (session.user as { role?: string }).role;
    if (role !== "HR" && role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const today = new Date();

    const months: { label: string; start: Date; end: Date }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d   = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      months.push({
        label: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        start: d,
        end,
      });
    }

    // Total active employees
    const totalEmployees = await cmsPrisma.cmsPatient.count({
      where: {
        isActive: 1,
        queues: { some: { transactions: { some: EMPLOYEE_TRANSACTION_WHERE } } },
      },
    });

    // PE transactions per month
    const peByMonth = await Promise.all(
      months.map(async (m) => {
        const count = await cmsPrisma.cmsTransaction.count({
          where: {
            date: { gte: m.start, lte: m.end },
            ...EMPLOYEE_TRANSACTION_WHERE,
            OR: PE_KEYWORDS.map((k) => ({
              descriptionItemPrice: { contains: k, mode: "insensitive" },
            })),
          },
        });
        const rate = totalEmployees > 0 ? Math.round((count / totalEmployees) * 100) : 0;
        return { month: m.label, count, rate };
      })
    );

    // Get employee queue BigInt IDs for vitals lookups
    const empQueues = await cmsPrisma.cmsQueue.findMany({
      where: { transactions: { some: EMPLOYEE_TRANSACTION_WHERE } },
      select: { id: true },
    });
    const empQueueBigIds = empQueues.map((q) => q.id);

    // Hypertension — bpSystolic/bpDiastolic are Int columns
    const hypertensionByMonth = await Promise.all(
      months.map(async (m) => {
        const [count, totalVitals] = await Promise.all([
          cmsPrisma.cmsVitalSign.count({
            where: {
              idQueue: { in: empQueueBigIds },
              inputDate: { gte: m.start, lte: m.end },
              OR: [
                { bpSystolic: { gte: 140 } },
                { bpDiastolic: { gte: 90 } },
              ],
            },
          }),
          cmsPrisma.cmsVitalSign.count({
            where: {
              idQueue: { in: empQueueBigIds },
              inputDate: { gte: m.start, lte: m.end },
            },
          }),
        ]);
        const rate = totalVitals > 0 ? Math.round((count / totalVitals) * 100) : 0;
        return { month: m.label, count, rate };
      })
    );

    const preHypertensionByMonth = await Promise.all(
      months.map(async (m) => {
        const [count, totalVitals] = await Promise.all([
          cmsPrisma.cmsVitalSign.count({
            where: {
              idQueue: { in: empQueueBigIds },
              inputDate: { gte: m.start, lte: m.end },
              OR: [
                { bpSystolic: { gte: 120, lt: 140 } },
                { bpDiastolic: { gte: 80, lt: 90 } },
              ],
            },
          }),
          cmsPrisma.cmsVitalSign.count({
            where: {
              idQueue: { in: empQueueBigIds },
              inputDate: { gte: m.start, lte: m.end },
            },
          }),
        ]);
        const rate = totalVitals > 0 ? Math.round((count / totalVitals) * 100) : 0;
        return { month: m.label, count, rate };
      })
    );

    return NextResponse.json({
      data: {
        months:          months.map((m) => m.label),
        peCompliance:    peByMonth.map((m) => m.rate),
        hypertension:    hypertensionByMonth.map((m) => m.rate),
        preHypertension: preHypertensionByMonth.map((m) => m.rate),
        totalPatients:   totalEmployees,
      },
    });
  } catch (error) {
    console.error("[GET_WELLNESS]", error);
    return NextResponse.json({ error: "Failed to fetch wellness data" }, { status: 500 });
  }
}
