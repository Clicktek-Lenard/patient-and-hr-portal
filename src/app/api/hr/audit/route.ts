import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ── GET: fetch audit logs (paginated, filterable) ─────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const role = (session.user as { role?: string }).role;
    if (role !== "HR" && role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const page   = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit  = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
    const action = searchParams.get("action") ?? "";
    const search = searchParams.get("search")?.trim() ?? "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (action && action !== "all") where.action = action;
    if (search) {
      where.OR = [
        { detail:      { contains: search, mode: "insensitive" } },
        { hrUserName:  { contains: search, mode: "insensitive" } },
        { targetCode:  { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, logs] = await Promise.all([
      prisma.portalAuditLog.count({ where }),
      prisma.portalAuditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, action: true, detail: true, targetCode: true,
          hrUserName: true, ipAddress: true, createdAt: true,
        },
      }),
    ]);

    // Summary counts
    const [logins, views, exports, downloads, reminders] = await Promise.all([
      prisma.portalAuditLog.count({ where: { action: "LOGIN" } }),
      prisma.portalAuditLog.count({ where: { action: { in: ["VIEW_EMPLOYEE", "VIEW_APE"] } } }),
      prisma.portalAuditLog.count({ where: { action: "EXPORT" } }),
      prisma.portalAuditLog.count({ where: { action: "DOWNLOAD" } }),
      prisma.portalAuditLog.count({ where: { action: "SEND_REMINDER" } }),
    ]);

    return NextResponse.json({
      data: logs.map((l) => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
      })),
      summary: { total, logins, views, exports, downloads, reminders },
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[GET_AUDIT]", error);
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}

// ── POST: write an audit log entry ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const role = (session.user as { role?: string }).role;
    if (role !== "HR" && role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { action, detail, targetCode } = body as {
      action: string;
      detail: string;
      targetCode?: string;
    };

    if (!action || !detail) {
      return NextResponse.json({ error: "action and detail are required" }, { status: 400 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? req.headers.get("x-real-ip")
      ?? null;
    const ua = req.headers.get("user-agent") ?? null;

    const user = session.user as { id: string; firstName?: string; lastName?: string };
    const hrUserName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "HR User";

    const log = await prisma.portalAuditLog.create({
      data: {
        hrUserId:   user.id,
        hrUserName,
        action:     action.toUpperCase(),
        detail,
        targetCode: targetCode ?? null,
        ipAddress:  ip,
        userAgent:  ua?.slice(0, 500) ?? null,
      },
    });

    return NextResponse.json({ data: { id: log.id } });
  } catch (error) {
    console.error("[POST_AUDIT]", error);
    return NextResponse.json({ error: "Failed to write audit log" }, { status: 500 });
  }
}
