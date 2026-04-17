import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cmsPrisma } from "@/lib/prisma-cms";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Find and validate the share link
    const link = await prisma.portalShareLink.findUnique({
      where: { token },
    });

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }
    if (link.revokedAt) {
      return NextResponse.json({ error: "This link has been revoked" }, { status: 410 });
    }
    if (new Date(link.expiresAt) < new Date()) {
      return NextResponse.json({ error: "This link has expired" }, { status: 410 });
    }

    // Increment view count
    await prisma.portalShareLink.update({
      where: { token },
      data: { viewCount: { increment: 1 } },
    });

    // Fetch queue data from CMS
    const queue = await cmsPrisma.cmsQueue.findFirst({
      where: { code: link.queueCode },
      include: {
        patient: { select: { code: true, fullName: true } },
        transactions: {
          where: { status: { not: 2 } },
          select: {
            id: true,
            codeItemPrice: true,
            descriptionItemPrice: true,
            amountItemPrice: true,
            groupItemMaster: true,
            transactionType: true,
            nameDoctor: true,
            nameCompany: true,
            status: true,
          },
        },
      },
    });

    if (!queue) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 });
    }

    const doctor = queue.transactions.find((t) => t.nameDoctor)?.nameDoctor ?? null;

    const parameters = queue.transactions.map((t) => ({
      name: t.descriptionItemPrice ?? t.codeItemPrice ?? "—",
      value: t.amountItemPrice != null
        ? `₱${Number(t.amountItemPrice).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
        : "—",
      group: t.groupItemMaster ?? t.transactionType ?? undefined,
    }));

    return NextResponse.json({
      data: {
        queueCode: link.queueCode,
        resultLabel: link.resultLabel,
        recipient: link.recipient,
        expiresAt: link.expiresAt,
        viewCount: link.viewCount + 1,
        queue: {
          code: queue.code,
          accessionNo: queue.accessionNo,
          date: queue.dateTime.toISOString(),
          patientName: queue.qFullName,
          patientType: queue.patientType,
          agePatient: queue.agePatient,
          gender: queue.qGender,
          doctor,
          parameters,
        },
      },
    });
  } catch (error) {
    console.error("[GET_SHARED]", error);
    return NextResponse.json({ error: "Failed to load shared result" }, { status: 500 });
  }
}
