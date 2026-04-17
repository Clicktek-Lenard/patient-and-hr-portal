import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/uat/settings — public (anyone can read, needed for floating button visibility check)
export async function GET() {
  try {
    const settings = await prisma.uatSettings.findFirst({ where: { id: 1 } });
    if (!settings) {
      return NextResponse.json({ isActive: false, activeFrom: null, activeUntil: null });
    }
    return NextResponse.json({
      isActive:    settings.isActive,
      activeFrom:  settings.activeFrom?.toISOString() ?? null,
      activeUntil: settings.activeUntil?.toISOString() ?? null,
      updatedBy:   settings.updatedBy,
      updatedAt:   settings.updatedAt.toISOString(),
    });
  } catch (err) {
    console.error("[UAT_SETTINGS_GET]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// PUT /api/uat/settings — HR/ADMIN only
export async function PUT(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || !["HR", "ADMIN"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { isActive, activeFrom, activeUntil } = body as {
      isActive: boolean;
      activeFrom?: string | null;
      activeUntil?: string | null;
    };

    const u = session.user as { firstName?: string; lastName?: string; email?: string };
    const updatedBy = (`${u.firstName ?? ""} ${u.lastName ?? ""}`.trim()) || (u.email ?? "unknown");

    const settings = await prisma.uatSettings.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        isActive,
        activeFrom:  activeFrom  ? new Date(activeFrom)  : null,
        activeUntil: activeUntil ? new Date(activeUntil) : null,
        updatedBy,
      },
      update: {
        isActive,
        activeFrom:  activeFrom  ? new Date(activeFrom)  : null,
        activeUntil: activeUntil ? new Date(activeUntil) : null,
        updatedBy,
      },
    });

    return NextResponse.json({
      isActive:    settings.isActive,
      activeFrom:  settings.activeFrom?.toISOString() ?? null,
      activeUntil: settings.activeUntil?.toISOString() ?? null,
      updatedBy:   settings.updatedBy,
      updatedAt:   settings.updatedAt.toISOString(),
    });
  } catch (err) {
    console.error("[UAT_SETTINGS_PUT]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
