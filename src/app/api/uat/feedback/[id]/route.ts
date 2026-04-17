import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UatStatus } from "@prisma/client";

// PATCH /api/uat/feedback/[id] — HR/ADMIN only, update status
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || !["HR", "ADMIN"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { status } = (await req.json()) as { status: UatStatus };
    const validStatuses: UatStatus[] = ["Open", "Acknowledged", "Resolved"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const id = BigInt(params.id);
    const updated = await prisma.uatFeedback.update({
      where: { id },
      data:  { status },
    });

    return NextResponse.json({ id: updated.id.toString(), status: updated.status });
  } catch (err) {
    console.error("[UAT_FEEDBACK_PATCH]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
