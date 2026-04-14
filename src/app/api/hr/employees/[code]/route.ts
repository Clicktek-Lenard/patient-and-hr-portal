import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { cmsPrisma } from "@/lib/prisma-cms";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  if (role !== "HR" && role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { code: rawCode } = await params;
  const code = decodeURIComponent(rawCode);

  const patient = await cmsPrisma.cmsPatient.findUnique({
    where: { code },
    select: {
      id: true, code: true, fullName: true, firstName: true, lastName: true,
      middleName: true, gender: true, dob: true, email: true, mobile: true,
      contactNo: true, fullAddress: true, isActive: true, pictureLink: true, lastVisit: true,
    },
  });

  if (!patient) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Fetch queues without inline relations to avoid orphaned-FK errors
  const rawVisits = await cmsPrisma.cmsQueue.findMany({
    where: { idPatient: patient.id },
    orderBy: { dateTime: "desc" },
    take: 20,
    select: {
      id: true, code: true, date: true, dateTime: true, status: true, patientType: true,
    },
  });

  // Fetch transactions separately for each queue
  const queueBigIds = rawVisits.map((q) => q.id);
  const transactions = queueBigIds.length
    ? await cmsPrisma.cmsTransaction.findMany({
        where: { idQueue: { in: queueBigIds }, status: { not: 2 } },
        select: {
          id: true, idQueue: true, descriptionItemPrice: true,
          amountItemPrice: true, transactionType: true, groupItemMaster: true, status: true,
        },
      })
    : [];

  // Group transactions by queue id
  const txByQueue = new Map<string, typeof transactions>();
  for (const tx of transactions) {
    const key = tx.idQueue.toString();
    if (!txByQueue.has(key)) txByQueue.set(key, []);
    txByQueue.get(key)!.push(tx);
  }

  // Fetch vitals separately (queueId is Int, no FK relation)
  const queueIntIds = rawVisits.map((q) => Number(q.id));
  const vitals = queueIntIds.length
    ? await cmsPrisma.cmsVitalSign.findMany({
        where: { queueId: { in: queueIntIds } },
        select: {
          queueId: true, bpSystolic: true, bpDiastolic: true, heartRate: true,
          temperature: true, weightKg: true, heightCm: true, bmi: true,
          chiefComplaint: true, pcpDoctor: true, createdAt: true,
        },
      })
    : [];
  const vitalsMap = new Map(vitals.map((v) => [String(v.queueId), v]));

  const visits = rawVisits.map((q) => ({
    id:          Number(q.id),
    code:        q.code,
    date:        q.date,
    dateTime:    q.dateTime,
    status:      q.status,
    patientType: q.patientType,
    transactions: (txByQueue.get(q.id.toString()) ?? []).map((t) => ({
      id:                   Number(t.id),
      descriptionItemPrice: t.descriptionItemPrice,
      amountItemPrice:      t.amountItemPrice?.toString() ?? null,
      transactionType:      t.transactionType,
      groupItemMaster:      t.groupItemMaster,
      status:               t.status,
    })),
    vitalSign: vitalsMap.get(String(Number(q.id))) ?? null,
  }));

  return NextResponse.json({
    patient: { ...patient, id: Number(patient.id) },
    visits,
  });
}
