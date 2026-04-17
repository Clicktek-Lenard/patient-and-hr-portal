"use client";

import { useCallback } from "react";

type AuditAction =
  | "LOGIN"
  | "VIEW_EMPLOYEE"
  | "VIEW_APE"
  | "SEND_REMINDER"
  | "EXPORT"
  | "DOWNLOAD"
  | "BULK_SCHEDULE";

export function useAuditLog() {
  const log = useCallback(
    async (action: AuditAction, detail: string, targetCode?: string) => {
      try {
        await fetch("/api/hr/audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, detail, targetCode }),
        });
      } catch {
        // audit log failures must never break the UI
      }
    },
    []
  );

  return { log };
}
