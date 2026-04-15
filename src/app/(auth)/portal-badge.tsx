"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function BadgeInner() {
  const searchParams = useSearchParams();
  const portal      = searchParams.get("portal");
  const callbackUrl = searchParams.get("callbackUrl") ?? "";
  const isHr        = portal === "hr" || decodeURIComponent(callbackUrl).startsWith("/hr");

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold text-white/80 tracking-widest uppercase mb-6">
      <span
        style={{
          width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
          background: isHr ? "#ef4444" : "#22c55e",
          boxShadow: isHr ? "0 0 6px rgba(239,68,68,0.8)" : "0 0 6px rgba(34,197,94,0.8)",
        }}
      />
      {isHr ? "HR Portal" : "Patient Portal"}
    </span>
  );
}

export function PortalBadge() {
  return (
    <Suspense fallback={
      <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold text-white/80 tracking-widest uppercase mb-6">
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px rgba(34,197,94,0.8)" }} />
        Patient Portal
      </span>
    }>
      <BadgeInner />
    </Suspense>
  );
}
