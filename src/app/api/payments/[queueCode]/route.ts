import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cmsPrisma } from "@/lib/prisma-cms";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ queueCode: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { queueCode } = await params;

    const queue = await cmsPrisma.cmsQueue.findFirst({
      where: { code: queueCode },
      include: {
        transactions: {
          where: { status: { not: 2 } },
          select: {
            id: true,
            descriptionItemPrice: true,
            amountItemPrice: true,
            groupItemMaster: true,
            nameCompany: true,
          },
        },
      },
    });

    if (!queue) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Verify ownership
    const patientCode = session.user.patientCode;
    if (patientCode) {
      const cmsPatient = await cmsPrisma.cmsPatient.findUnique({
        where: { code: patientCode },
        select: { id: true },
      });
      if (!cmsPatient || queue.idPatient !== cmsPatient.id) {
        return NextResponse.json({ error: "Payment not found" }, { status: 404 });
      }
    }

    const totalAmount = queue.transactions.reduce((s, t) => s + Number(t.amountItemPrice ?? 0), 0);
    const company     = queue.transactions.find((t) => t.nameCompany)?.nameCompany ?? null;
    const status      = queue.status >= 400 ? "paid" : "pending";

    const items = queue.transactions.map((t) => ({
      id:          Number(t.id),
      description: t.descriptionItemPrice ?? "",
      quantity:    1,
      unitPrice:   Number(t.amountItemPrice ?? 0),
      total:       Number(t.amountItemPrice ?? 0),
      category:    t.groupItemMaster ?? undefined,
    }));

    // Log receipt access
    try {
      await prisma.portalResultAccessLog.create({
        data: {
          portalUserId: session.user.id,
          queueCode,
          accessType:  "RECEIPT",
          ipAddress:   req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown",
        },
      });
    } catch (logError) {
      console.error("[AUDIT_LOG]", logError);
    }

    return NextResponse.json({
      data: {
        id:            Number(queue.id),
        queueCode,
        date:          queue.dateTime.toISOString(),
        amount:        totalAmount,
        discount:      undefined,
        coverage:      undefined,
        coverageLabel: company ? `HMO - ${company}` : undefined,
        totalAmount,
        paymentMethod: company ? `HMO - ${company}` : "CASH",
        receiptNo:     queue.code ?? "",
        status,
        items,
        paidAt:        queue.dateTime.toISOString(),
      },
    });
  } catch (error) {
    console.error("[GET_PAYMENT]", error);
    return NextResponse.json({ error: "Failed to fetch payment" }, { status: 500 });
  }
}
