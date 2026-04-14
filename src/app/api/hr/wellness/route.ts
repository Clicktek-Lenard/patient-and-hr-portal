import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cmsPrisma } from "@/lib/prisma-cms";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const role = (session.user as { role?: string }).role;
    if (role !== "HR" && role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const today = new Date();

    // Build last 12 months
    const months: { label: string; start: Date; end: Date }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      months.push({
        label: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        start: d,
        end,
      });
    }

    const PE_KEYWORDS = ["APE", "ANNUAL", "PHYSICAL"];

    // Total active patients
    const totalPatients = await cmsPrisma.cmsPatient.count({ where: { isActive: 1 } });

    // For each month: count PE transactions (APE/annual physical)
    const peByMonth = await Promise.all(
      months.map(async (m) => {
        const count = await cmsPrisma.cmsTransaction.count({
          where: {
            date: { gte: m.start, lte: m.end },
            OR: PE_KEYWORDS.map((k) => ({
              descriptionItemPrice: { contains: k, mode: "insensitive" },
            })),
          },
        });
        const rate = totalPatients > 0 ? Math.round((count / totalPatients) * 100) : 0;
        return { month: m.label, count, rate };
      })
    );

    // For each month: count patients with hypertension (bp_systolic >= 140 OR bp_diastolic >= 90)
    const hypertensionByMonth = await Promise.all(
      months.map(async (m) => {
        const count = await cmsPrisma.cmsVitalSign.count({
          where: {
            createdAt: { gte: m.start, lte: m.end },
            OR: [
              { bpSystolic: { gte: 140 } },
              { bpDiastolic: { gte: 90 } },
            ],
          },
        });
        const totalVitals = await cmsPrisma.cmsVitalSign.count({
          where: { createdAt: { gte: m.start, lte: m.end } },
        });
        const rate = totalVitals > 0 ? Math.round((count / totalVitals) * 100) : 0;
        return { month: m.label, count, rate };
      })
    );

    // Pre-hypertension (120-139 systolic OR 80-89 diastolic)
    const preHypertensionByMonth = await Promise.all(
      months.map(async (m) => {
        const count = await cmsPrisma.cmsVitalSign.count({
          where: {
            createdAt: { gte: m.start, lte: m.end },
            OR: [
              { bpSystolic: { gte: 120, lt: 140 } },
              { bpDiastolic: { gte: 80, lt: 90 } },
            ],
          },
        });
        const totalVitals = await cmsPrisma.cmsVitalSign.count({
          where: { createdAt: { gte: m.start, lte: m.end } },
        });
        const rate = totalVitals > 0 ? Math.round((count / totalVitals) * 100) : 0;
        return { month: m.label, count, rate };
      })
    );

    return NextResponse.json({
      data: {
        months: months.map((m) => m.label),
        peCompliance:      peByMonth.map((m) => m.rate),
        hypertension:      hypertensionByMonth.map((m) => m.rate),
        preHypertension:   preHypertensionByMonth.map((m) => m.rate),
        totalPatients,
      },
    });
  } catch (error) {
    console.error("[GET_WELLNESS]", error);
    return NextResponse.json({ error: "Failed to fetch wellness data" }, { status: 500 });
  }
}
