import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cmsPrisma } from "@/lib/prisma-cms";

// Vital sign series — mapped to real CMS DB columns (all varchar except BP which is Int)
const VITAL_SERIES = [
  { key: "bpSystolic",  name: "Systolic BP",  unit: "mmHg", normalRange: "90–120",    low: 90,   high: 120,  group: "Blood Pressure" },
  { key: "bpDiastolic", name: "Diastolic BP",  unit: "mmHg", normalRange: "60–80",     low: 60,   high: 80,   group: "Blood Pressure" },
  { key: "pulseRate",   name: "Pulse Rate",    unit: "bpm",  normalRange: "60–100",    low: 60,   high: 100,  group: "Vitals" },
  { key: "temperature", name: "Temperature",   unit: "°C",   normalRange: "36.1–37.2", low: 36.1, high: 37.2, group: "Vitals" },
  { key: "weight",      name: "Weight",        unit: "kg",   normalRange: "",          low: null, high: null, group: "Body Metrics" },
  { key: "height",      name: "Height",        unit: "cm",   normalRange: "",          low: null, high: null, group: "Body Metrics" },
  { key: "bmi",         name: "BMI",           unit: "kg/m²", normalRange: "18.5–24.9", low: 18.5, high: 24.9, group: "Body Metrics" },
] as const;

type VitalKey = typeof VITAL_SERIES[number]["key"];

function getFlag(value: number, low: number | null, high: number | null): string | null {
  if (low !== null && value < low) return "L";
  if (high !== null && value > high) return "H";
  return "N";
}

function buildInsight(name: string, points: { value: number; flag: string | null }[], low: number | null, high: number | null): string | null {
  if (points.length < 2) return null;
  const abnormalLow  = points.filter((p) => p.flag === "L").length;
  const abnormalHigh = points.filter((p) => p.flag === "H").length;
  const latest = points[points.length - 1].value;
  const prev   = points[points.length - 2].value;
  const trend  = latest > prev ? "increasing" : latest < prev ? "decreasing" : "stable";

  if (abnormalLow > 0 && low !== null) {
    return `⚠ ${abnormalLow} reading${abnormalLow > 1 ? "s" : ""} below normal range — consider consulting your physician.`;
  }
  if (abnormalHigh > 0 && high !== null) {
    return `⚠ ${abnormalHigh} reading${abnormalHigh > 1 ? "s" : ""} above normal range — consider consulting your physician.`;
  }
  if (trend === "decreasing" && name.toLowerCase().includes("bp")) {
    return `✓ Blood pressure trending down — good progress.`;
  }
  if (trend === "stable") {
    return `✓ ${name} is stable across your visits.`;
  }
  return null;
}

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

    // Fetch queues ordered by date asc
    const queues = await cmsPrisma.cmsQueue.findMany({
      where: {
        idPatient: cmsPatient.id,
        status: { gte: 100, lt: 650 },
      },
      orderBy: { date: "asc" },
      select: { id: true, date: true, dateTime: true },
    });

    if (queues.length === 0) return NextResponse.json({ data: [] });

    const queueBigIds = queues.map((q) => q.id);

    const vitalSigns = await cmsPrisma.cmsVitalSign.findMany({
      where: { idQueue: { in: queueBigIds } },
      select: {
        idQueue:      true,
        bpSystolic:   true,
        bpDiastolic:  true,
        pulseRate:    true,
        temperature:  true,
        weight:       true,
        height:       true,
        bmi:          true,
      },
    });

    // Map queueId → date string
    const queueDateMap = new Map(queues.map((q) => [
      q.id.toString(),
      (q.date ? new Date(q.date) : new Date(q.dateTime)).toISOString().split("T")[0],
    ]));

    type DataPoint = { date: string; value: number; flag: string | null; unit: string; normalRange: string };
    type Series = { name: string; points: DataPoint[]; unit: string; normalRange: string; group: string; insight: string | null };

    const result: Series[] = [];

    for (const def of VITAL_SERIES) {
      const points: DataPoint[] = [];

      for (const vs of vitalSigns) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawVal = (vs as any)[def.key as VitalKey];
        if (rawVal == null || rawVal === "") continue;
        const value = Number(rawVal);
        if (isNaN(value) || value === 0) continue;

        const date = vs.idQueue ? queueDateMap.get(vs.idQueue.toString()) : undefined;
        if (!date) continue;

        const flag = getFlag(value, def.low, def.high);
        points.push({ date, value, flag, unit: def.unit, normalRange: def.normalRange });
      }

      if (points.length === 0) continue;

      points.sort((a, b) => a.date.localeCompare(b.date));

      result.push({
        name:       def.name,
        points,
        unit:       def.unit,
        normalRange: def.normalRange,
        group:      def.group,
        insight:    buildInsight(def.name, points, def.low, def.high),
      });
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("[GET_TRENDS]", error);
    return NextResponse.json({ error: "Failed to fetch trends" }, { status: 500 });
  }
}
