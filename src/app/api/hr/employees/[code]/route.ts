import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { cmsPrisma } from "@/lib/prisma-cms";
import { EMPLOYEE_TRANSACTION_WHERE } from "@/lib/hr-employee-filter";

const APE_KEYWORDS = ["APE", "ANNUAL", "PHYSICAL EXAM", "PE "];

function isApeVisit(transactions: { descriptionItemPrice: string | null }[]) {
  return transactions.some((t) =>
    t.descriptionItemPrice &&
    APE_KEYWORDS.some((kw) =>
      t.descriptionItemPrice!.toUpperCase().includes(kw)
    )
  );
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const role = (session.user as { role?: string }).role;
    if (role !== "HR" && role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { code: rawCode } = await params;
    const code = decodeURIComponent(rawCode);

    // Find patient — use findFirst to avoid nullable-unique edge cases
    const patient = await cmsPrisma.cmsPatient.findFirst({
      where: { code },
      select: {
        id: true, code: true, fullName: true, firstName: true, lastName: true,
        middleName: true, gender: true, dob: true, email: true, mobile: true,
        contactNo: true, fullAddress: true, isActive: true, pictureLink: true, lastVisit: true,
      },
    });

    if (!patient) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Fetch only employee visits (has at least one corporate transaction)
    const rawVisits = await cmsPrisma.cmsQueue.findMany({
      where: {
        idPatient: patient.id,
        transactions: { some: EMPLOYEE_TRANSACTION_WHERE },
      },
      orderBy: { dateTime: "desc" },
      take: 50,
      select: {
        id: true, code: true, date: true, dateTime: true, status: true, patientType: true,
      },
    });

    if (rawVisits.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Fetch transactions for all visits
    const queueBigIds = rawVisits.map((q) => q.id);
    const transactions = await cmsPrisma.cmsTransaction.findMany({
      where: { idQueue: { in: queueBigIds }, status: { not: 2 } },
      select: {
        id: true, idQueue: true, descriptionItemPrice: true,
        amountItemPrice: true, transactionType: true, groupItemMaster: true,
        status: true, nameCompany: true, nameDoctor: true, codeItemPrice: true,
      },
    });

    // Group transactions by queue id
    const txByQueue = new Map<string, typeof transactions>();
    for (const tx of transactions) {
      const key = tx.idQueue.toString();
      if (!txByQueue.has(key)) txByQueue.set(key, []);
      txByQueue.get(key)!.push(tx);
    }

    // Fetch vitals using BigInt idQueue
    const vitals = await cmsPrisma.cmsVitalSign.findMany({
      where: { idQueue: { in: queueBigIds } },
      select: {
        idQueue: true, bpSystolic: true, bpDiastolic: true, pulseRate: true,
        temperature: true, weight: true, height: true, bmi: true,
        respiratoryRate: true, chiefComplaint: true, pcpName: true, inputDate: true,
      },
    });
    const vitalsMap = new Map(vitals.map((v) => [v.idQueue.toString(), v]));

    const visits = rawVisits.map((q) => {
      const qTx = (txByQueue.get(q.id.toString()) ?? []).map((t) => ({
        id:                   Number(t.id),
        codeItemPrice:        t.codeItemPrice ?? null,
        descriptionItemPrice: t.descriptionItemPrice ?? null,
        amountItemPrice:      t.amountItemPrice ? Number(t.amountItemPrice) : null,
        transactionType:      t.transactionType ?? null,
        groupItemMaster:      t.groupItemMaster ?? null,
        nameCompany:          t.nameCompany ?? null,
        nameDoctor:           t.nameDoctor ?? null,
        status:               t.status,
      }));

      const vitalSign = vitalsMap.get(q.id.toString()) ?? null;
      const company = qTx.find((t) => t.nameCompany)?.nameCompany?.trim() ?? null;
      const isApe = isApeVisit(qTx);
      const totalAmount = qTx.reduce((s, t) => s + (t.amountItemPrice ?? 0), 0);

      return {
        id:           Number(q.id),
        code:         q.code ?? null,
        date:         q.date?.toISOString() ?? null,
        dateTime:     q.dateTime?.toISOString() ?? null,
        status:       q.status,
        patientType:  q.patientType ?? null,
        company,
        isApe,
        totalAmount,
        transactions: qTx,
        vitalSign: vitalSign
          ? {
              bpSystolic:      vitalSign.bpSystolic ?? null,
              bpDiastolic:     vitalSign.bpDiastolic ?? null,
              heartRate:       vitalSign.pulseRate ?? null,
              temperature:     vitalSign.temperature ?? null,
              respiratoryRate: vitalSign.respiratoryRate ?? null,
              weightKg:        vitalSign.weight ?? null,
              heightCm:        vitalSign.height ?? null,
              bmi:             vitalSign.bmi ?? null,
              chiefComplaint:  vitalSign.chiefComplaint ?? null,
              pcpDoctor:       vitalSign.pcpName ?? null,
              createdAt:       vitalSign.inputDate?.toISOString() ?? null,
            }
          : null,
      };
    });

    return NextResponse.json({
      patient: {
        id:          Number(patient.id),
        code:        patient.code ?? null,
        fullName:    patient.fullName ?? null,
        firstName:   patient.firstName ?? null,
        lastName:    patient.lastName ?? null,
        middleName:  patient.middleName ?? null,
        gender:      patient.gender ?? null,
        dob:         patient.dob?.toISOString() ?? null,
        email:       patient.email ?? null,
        mobile:      patient.mobile ?? null,
        contactNo:   patient.contactNo ?? null,
        fullAddress: patient.fullAddress ?? null,
        isActive:    patient.isActive,
        pictureLink: patient.pictureLink ?? null,
        lastVisit:   patient.lastVisit?.toISOString() ?? null,
      },
      visits,
    });
  } catch (error) {
    console.error("[HR_EMPLOYEE_DETAIL]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
