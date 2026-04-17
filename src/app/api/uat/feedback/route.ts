import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UatSeverity, UatStatus } from "@prisma/client";

// POST /api/uat/feedback — any authenticated user
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { module, pageUrl, pageTitle, severity, description, screenshotPath } = body as {
      module: string;
      pageUrl: string;
      pageTitle?: string;
      severity: UatSeverity;
      description: string;
      screenshotPath?: string;
    };

    if (!module || !pageUrl || !severity || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const validSeverities: UatSeverity[] = ["Bug", "Suggestion", "Question", "Blocker"];
    if (!validSeverities.includes(severity)) {
      return NextResponse.json({ error: "Invalid severity" }, { status: 400 });
    }

    const u = session.user as { email?: string; firstName?: string; lastName?: string; role?: string };
    const submittedBy  = u.email ?? "unknown";
    const userFullname = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || null;
    const userRole     = u.role ?? "PATIENT";

    const feedback = await prisma.uatFeedback.create({
      data: {
        submittedBy,
        userFullname,
        userRole,
        module,
        pageUrl,
        pageTitle: pageTitle ?? null,
        severity,
        description,
        screenshotPath: screenshotPath ?? null,
      },
    });

    return NextResponse.json({ id: feedback.id.toString(), status: "created" }, { status: 201 });
  } catch (err) {
    console.error("[UAT_FEEDBACK_POST]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// GET /api/uat/feedback — HR/ADMIN only, with optional filters
export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || !["HR", "ADMIN"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const severityParam = searchParams.get("severity") as UatSeverity | null;
    const statusParam   = searchParams.get("status") as UatStatus | null;
    const moduleParam   = searchParams.get("module");
    const exportCsv     = searchParams.get("export") === "csv";

    const where = {
      ...(severityParam ? { severity: severityParam } : {}),
      ...(statusParam   ? { status: statusParam }     : {}),
      ...(moduleParam   ? { module: moduleParam }      : {}),
    };

    const rows = await prisma.uatFeedback.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const data = rows.map((r) => ({
      id:             r.id.toString(),
      submittedBy:    r.submittedBy,
      userFullname:   r.userFullname,
      userRole:       r.userRole,
      module:         r.module,
      pageUrl:        r.pageUrl,
      pageTitle:      r.pageTitle,
      severity:       r.severity,
      description:    r.description,
      screenshotPath: r.screenshotPath,
      status:         r.status,
      createdAt:      r.createdAt.toISOString(),
      updatedAt:      r.updatedAt.toISOString(),
    }));

    if (exportCsv) {
      const header = "ID,Date,User,Role,Module,Page,Severity,Status,Description\n";
      const csvRows = data.map((r) =>
        [
          r.id,
          new Date(r.createdAt).toLocaleDateString("en-PH"),
          r.userFullname ?? r.submittedBy,
          r.userRole,
          r.module,
          r.pageTitle ?? r.pageUrl,
          r.severity,
          r.status,
          `"${r.description.replace(/"/g, '""')}"`,
        ].join(",")
      );
      const csv = header + csvRows.join("\n");
      return new NextResponse(csv, {
        headers: {
          "Content-Type":        "text/csv",
          "Content-Disposition": `attachment; filename="uat-feedback-${Date.now()}.csv"`,
        },
      });
    }

    // Also return aggregate stats
    const blockers     = rows.filter((r) => r.severity === "Blocker").length;
    const bugs         = rows.filter((r) => r.severity === "Bug").length;
    const open         = rows.filter((r) => r.status === "Open").length;
    const acknowledged = rows.filter((r) => r.status === "Acknowledged").length;
    const resolved     = rows.filter((r) => r.status === "Resolved").length;

    return NextResponse.json({ data, stats: { total: rows.length, blockers, bugs, open, acknowledged, resolved } });
  } catch (err) {
    console.error("[UAT_FEEDBACK_GET]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
