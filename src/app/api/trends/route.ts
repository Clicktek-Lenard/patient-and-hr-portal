import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cmsPrisma } from "@/lib/prisma-cms";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const patientCode = session.user.patientCode;
    if (!patientCode) return NextResponse.json({ data: [] });

    const cmsPatient = await cmsPrisma.cmsPatient.findUnique({
      where: { code: patientCode },
      select: { id: true },
    });
    if (!cmsPatient) return NextResponse.json({ data: [] });

    // Trends from transactions — track service amounts over time per test type
    const transactions = await cmsPrisma.cmsTransaction.findMany({
      where: { queue: { idPatient: cmsPatient.id }, status: { not: 2 } },
      orderBy: { date: "asc" },
      select: {
        date: true,
        descriptionItemPrice: true,
        amountItemPrice: true,
        groupItemMaster: true,
        queue: { select: { dateTime: true } },
      },
    });

    type DataPoint = { date: string; value: number; unit: string; normalRange: string; flag: string | null };
    const seriesMap: Record<string, DataPoint[]> = {};

    for (const tx of transactions) {
      if (!tx.amountItemPrice) continue;
      const numVal = Number(tx.amountItemPrice);
      if (isNaN(numVal) || numVal === 0) continue;

      const dateStr = tx.date
        ? new Date(tx.date).toISOString().split("T")[0]
        : new Date(tx.queue.dateTime).toISOString().split("T")[0];

      const name = (tx.descriptionItemPrice ?? tx.groupItemMaster ?? "Unknown").trim();
      if (!seriesMap[name]) seriesMap[name] = [];
      seriesMap[name].push({ date: dateStr, value: numVal, unit: "PHP", normalRange: "", flag: null });
    }

    const series = Object.entries(seriesMap)
      .filter(([, points]) => points.length >= 1)
      .map(([name, points]) => ({
        name,
        points: points.sort((a, b) => a.date.localeCompare(b.date)),
        unit: "PHP",
        normalRange: "",
      }))
      .sort((a, b) => b.points.length - a.points.length)
      .slice(0, 20);

    return NextResponse.json({ data: series });
  } catch (error) {
    console.error("[GET_TRENDS]", error);
    return NextResponse.json({ error: "Failed to fetch trends" }, { status: 500 });
  }
}
