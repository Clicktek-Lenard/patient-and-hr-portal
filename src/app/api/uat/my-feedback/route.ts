import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/uat/my-feedback — returns feedback submitted by the logged-in user only
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const u = session.user as { email?: string };
  const submittedBy = u.email ?? "unknown";

  try {
    const rows = await prisma.uatFeedback.findMany({
      where: { submittedBy },
      orderBy: { createdAt: "desc" },
    });

    const data = rows.map((r) => ({
      id:             r.id.toString(),
      module:         r.module,
      pageTitle:      r.pageTitle,
      pageUrl:        r.pageUrl,
      severity:       r.severity,
      description:    r.description,
      screenshotPath: r.screenshotPath,
      status:         r.status,
      createdAt:      r.createdAt.toISOString(),
    }));

    return NextResponse.json({ data });
  } catch (err) {
    console.error("[UAT_MY_FEEDBACK]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
