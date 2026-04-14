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

    const role = session.user.role;
    const patientCode = session.user.patientCode;

    if (role === "PATIENT") {
      // Patients can only view their own results
      if (!patientCode) {
        return NextResponse.json({ error: "Result not found" }, { status: 404 });
      }
      const cmsPatient = await cmsPrisma.cmsPatient.findUnique({
        where: { code: patientCode },
        select: { id: true },
      });
      if (!cmsPatient || queue.idPatient !== cmsPatient.id) {
        return NextResponse.json({ error: "Result not found" }, { status: 404 });
      }
    } else if (role !== "HR" && role !== "ADMIN") {
      // Unknown role — deny
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const doctor = queue.transactions.find((t) => t.nameDoctor)?.nameDoctor ?? null;

    // Determine result type
    const groups = queue.transactions.map((t) =>
      (t.groupItemMaster ?? t.descriptionItemPrice ?? "").toLowerCase()
    );
    const resultType =
      groups.some((g) => g.includes("lab") || g.includes("chem") || g.includes("hema") || g.includes("micro") || g.includes("cbc") || g.includes("urinal"))
        ? "lab"
        : groups.some((g) => g.includes("xray") || g.includes("x-ray") || g.includes("imaging") || g.includes("ultrasound") || g.includes("ct") || g.includes("mri"))
        ? "imaging"
        : groups.some((g) => g.includes("path") || g.includes("histo") || g.includes("cyto"))
        ? "pathology"
        : "other";

    // Map transactions to ResultParameter shape
    const parameters = queue.transactions.map((t) => ({
      name:           t.descriptionItemPrice ?? t.codeItemPrice ?? "—",
      value:          "—",   // actual result values not stored in this table
      unit:           undefined,
      referenceRange: undefined,
      flag:           undefined,
      group:          t.groupItemMaster ?? undefined,
    }));

    // Build description from services
    const serviceNames = queue.transactions
      .map((t) => t.descriptionItemPrice)
      .filter(Boolean)
      .slice(0, 3);
    const description =
      serviceNames.length > 0
        ? serviceNames.join(", ") + (queue.transactions.length > 3 ? ` +${queue.transactions.length - 3} more` : "")
        : queue.qFullName ?? "Visit";

    // Audit log
    try {
      await prisma.portalResultAccessLog.create({
        data: {
          portalUserId: session.user.id,
          queueCode,
          accessType:  "SUMMARY",
          ipAddress:   req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown",
        },
      });
    } catch (logError) {
      console.error("[AUDIT_LOG]", logError);
    }

    return NextResponse.json({
      data: {
        id:          Number(queue.id),
        transNo:     queue.accessionNo ?? queue.code ?? "",
        queueCode,
        date:        queue.dateTime.toISOString(),
        type:        resultType,
        description,
        status:      queue.status >= 400 ? "released" : "pending",
        hasPdf:      false,
        releasedAt:  null,
        requestedBy: doctor,
        parameters,
      },
    });
  } catch (error) {
    console.error("[GET_RESULT]", error);
    return NextResponse.json({ error: "Failed to fetch result" }, { status: 500 });
  }
}
