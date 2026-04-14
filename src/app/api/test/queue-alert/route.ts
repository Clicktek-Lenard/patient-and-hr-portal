/**
 * DEV-ONLY endpoint — forces queue status to advance one step immediately.
 * Use this to test the sound/vibration alert without waiting 30s.
 *
 * GET  /api/test/queue-alert?code=Q2026-001234   → returns next status step
 * POST /api/test/queue-alert?code=Q2026-001234   → resets cycle back to step 0
 */

import { NextRequest, NextResponse } from "next/server";
import { getMockQueueStatus, resetMockQueueCycle } from "@/lib/mock-data";

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  const code = req.nextUrl.searchParams.get("code") ?? "Q2026-001234";
  const status = getMockQueueStatus(code);

  return NextResponse.json({ data: status });
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  const code = req.nextUrl.searchParams.get("code") ?? "Q2026-001234";
  resetMockQueueCycle(code);

  return NextResponse.json({ message: `Queue ${code} reset to step 0 (waiting)` });
}
