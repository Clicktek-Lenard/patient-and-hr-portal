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

    const role = session.user.role;
    const patientCode = session.user.patientCode;

    if (role === "PATIENT") {
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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const doctor = queue.transactions.find((t) => t.nameDoctor)?.nameDoctor ?? null;

    const allText = [
      ...queue.transactions.map((t) => t.groupItemMaster ?? ""),
      ...queue.transactions.map((t) => t.descriptionItemPrice ?? ""),
    ].map((s) => s.toLowerCase());

    const resultType =
      allText.some((g) =>
        g.includes("lab") || g.includes("chem") || g.includes("hema") ||
        g.includes("micro") || g.includes("cbc") || g.includes("urin") ||
        g.includes("glucose") || g.includes("blood") || g.includes("fbs") ||
        g.includes("lipid") || g.includes("thyroid") || g.includes("hepat") ||
        g.includes("culture") || g.includes("serol")
      )
        ? "lab"
        : allText.some((g) =>
          g.includes("xray") || g.includes("x-ray") || g.includes("imaging") ||
          g.includes("ultrasound") || g.includes("ct") || g.includes("mri") ||
          g.includes("ecg") || g.includes("echo") || g.includes("abpm") ||
          g.includes("radiolog")
        )
        ? "imaging"
        : allText.some((g) => g.includes("path") || g.includes("histo") || g.includes("cyto"))
        ? "pathology"
        : "other";

    // Map transactions as visit service items
    const parameters = queue.transactions.map((t) => ({
      name:           t.descriptionItemPrice ?? t.codeItemPrice ?? "—",
      value:          t.amountItemPrice != null ? `₱${Number(t.amountItemPrice).toLocaleString("en-PH", { minimumFractionDigits: 2 })}` : "—",
      unit:           undefined,
      referenceRange: undefined,
      flag:           undefined,
      group:          t.groupItemMaster ?? t.transactionType ?? undefined,
    }));

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
        status:      queue.status >= 500 ? "released" : "pending",
        hasPdf:      true,
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
