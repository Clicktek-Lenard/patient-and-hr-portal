import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cmsPrisma } from "@/lib/prisma-cms";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  if (role !== "HR" && role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const queueCode = req.nextUrl.searchParams.get("queueCode")?.trim();
  if (!queueCode) return NextResponse.json({ error: "queueCode required" }, { status: 400 });

  const queue = await cmsPrisma.cmsQueue.findFirst({
    where: { code: queueCode },
    select: {
      id: true, code: true, dateTime: true, status: true, idPatient: true,
      transactions: {
        where: { status: { not: 2 } },
        select: {
          id: true, descriptionItemPrice: true, amountItemPrice: true,
          nameCompany: true, groupItemMaster: true,
        },
      },
    },
  });

  if (!queue) return NextResponse.json({ error: "Payment record not found for this QR code." }, { status: 404 });

  // Fetch patient separately
  const patient = queue.idPatient
    ? await cmsPrisma.cmsPatient.findUnique({
        where: { id: queue.idPatient },
        select: { id: true, code: true, fullName: true },
      })
    : null;

  const totalAmount = queue.transactions.reduce((s, t) => s + Number(t.amountItemPrice ?? 0), 0);
  const company     = queue.transactions.find((t) => t.nameCompany)?.nameCompany?.trim() ?? null;

  return NextResponse.json({
    queueCode:   queue.code ?? queueCode,
    patientName: patient?.fullName ?? "—",
    patientCode: patient?.code ?? "—",
    date:        queue.dateTime instanceof Date ? queue.dateTime.toISOString() : queue.dateTime,
    totalAmount,
    paymentType: company && !company.toLowerCase().includes("default") ? `HMO - ${company}` : "CASH",
    status:      (queue.status ?? 0) >= 400 ? "paid" : "pending",
    items:       queue.transactions.map((t) => ({
      id:          Number(t.id),
      description: t.descriptionItemPrice ?? "—",
      amount:      Number(t.amountItemPrice ?? 0),
      group:       t.groupItemMaster ?? null,
    })),
  });
}
