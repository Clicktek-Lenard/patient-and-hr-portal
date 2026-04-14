import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getMockVitals } from "@/lib/mock-data";
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
    const vitals = getMockVitals(session.user.patientCode);
    const vitalRecord = vitals.find((v) => v.queueCode === queueCode);

    if (!vitalRecord) {
      return NextResponse.json(
        { error: "Vital signs not found for this visit" },
        { status: 404 }
      );
    }

    // Log vitals access
    try {
      const ipAddress =
        req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";

      await prisma.portalResultAccessLog.create({
        data: {
          portalUserId: session.user.id,
          queueCode,
          accessType: "VITALS",
          ipAddress,
        },
      });
    } catch (logError) {
      console.error("[AUDIT_LOG]", logError);
    }

    return NextResponse.json({ data: vitalRecord });
  } catch (error) {
    console.error("[GET_VITALS_DETAIL]", error);
    return NextResponse.json(
      { error: "Failed to fetch vital signs" },
      { status: 500 }
    );
  }
}
