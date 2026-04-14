import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const link = await prisma.portalShareLink.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.portalShareLink.update({
      where: { id },
      data: { revokedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[REVOKE_SHARE_LINK]", error);
    return NextResponse.json({ error: "Failed to revoke link" }, { status: 500 });
  }
}
