"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, AlertTriangle, CheckCircle2, Search, ChevronLeft, ChevronRight, X, Mail } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";

type ComplianceRow = {
  id: string; code: string | null; fullName: string | null; gender: string | null;
  lastPeDate: string | null; daysOverdue: number | null; peStatus: "compliant" | "overdue" | "never";
};
type Summary = { overdue: number; compliant: number; never: number; complianceRate: number; total: number };
type Response = { data: ComplianceRow[]; summary: Summary; pagination: { page: number; limit: number; total: number; totalPages: number } };

const STATUS_OPTS = [
  { value: "",         label: "All" },
  { value: "compliant", label: "Compliant" },
  { value: "overdue",   label: "Overdue" },
  { value: "never",     label: "No PE on file" },
];

export default function CompliancePage() {
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const buildUrl = useCallback(() => {
    const p = new URLSearchParams({ page: String(page), limit: "20" });
    if (debouncedSearch) p.set("search", debouncedSearch);
    if (status)          p.set("status", status);
    return `/api/hr/compliance?${p}`;
  }, [page, debouncedSearch, status]);

  const { data, isLoading } = useQuery<Response>({
    queryKey: ["hr-compliance", page, debouncedSearch, status],
    queryFn: () => fetch(buildUrl()).then((r) => r.json()),
    staleTime: 60_000,
  });

  const rows = data?.data ?? [];
  const summary = data?.summary;
  const pagination = data?.pagination;

  function sendReminders() {
    toast.success(`Reminder emails would be sent to ${summary?.overdue ?? 0} overdue employees`);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div style={{ borderRadius: 14, background: "linear-gradient(135deg, #059669 0%, #0D9488 100%)", padding: "20px 24px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.06, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <ShieldCheck style={{ width: 16, height: 16, color: "rgba(255,255,255,0.8)" }} />
              <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Compliance &amp; Wellness</span>
            </div>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#ffffff", lineHeight: 1.2 }}>PE Compliance Tracker</h1>
            <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.55)", marginTop: 6 }}>Annual Physical Exam status for all employees</p>
          </div>
          {summary && summary.overdue > 0 && (
            <button onClick={sendReminders} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, background: "rgba(255,255,255,0.95)", border: "none", color: "#EA580C", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>
              <Mail style={{ width: 13, height: 13 }} /> Send Reminders ({summary.overdue})
            </button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ background: "var(--ui-card)", border: "1px solid var(--ui-border)", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px var(--ui-shadow)" }} className="animate-pulse">
              <div className="h-7 w-12 rounded bg-muted mb-2" />
              <div className="h-3 w-20 rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div style={{ background: "var(--ui-card)", border: "1px solid var(--ui-border)", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px var(--ui-shadow)" }}>
            <p className="text-2xl font-bold text-foreground">{summary.total.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">Total Employees</p>
          </div>
          <div style={{ background: "var(--ui-card)", border: "1px solid var(--ui-border)", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px var(--ui-shadow)" }}>
            <p className="text-2xl font-bold text-green-600">{summary.compliant.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" /> PE Compliant
            </p>
          </div>
          <div style={{ background: "var(--ui-card)", border: "1px solid var(--ui-border)", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px var(--ui-shadow)" }}>
            <p className="text-2xl font-bold text-orange-600">{summary.overdue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-orange-500" /> Overdue
            </p>
          </div>
          <div style={{ background: "var(--ui-card)", border: "1px solid var(--ui-border)", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px var(--ui-shadow)" }}>
            <div className="flex items-end gap-1">
              <p className="text-2xl font-bold text-foreground">{summary.complianceRate}%</p>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-violet-500" style={{ width: `${summary.complianceRate}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-violet-500" /> Compliance Rate
            </p>
          </div>
        </div>
      )}

      {/* Warning banner if overdue */}
      {!isLoading && summary && summary.overdue > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-orange-200 dark:border-orange-500/20 bg-orange-50 dark:bg-orange-500/10 px-4 py-3.5">
          <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
          <p className="text-xs text-orange-700 dark:text-orange-300 leading-relaxed">
            <strong>{summary.overdue} employees</strong> have not completed their Annual PE within the last 12 months.
            This may pose a regulatory compliance risk. Use &ldquo;Send Reminders&rdquo; to notify them.
          </p>
        </div>
      )}

      {/* Filters */}
      <div style={{ background: "var(--ui-card)", border: "1px solid var(--ui-border)", borderRadius: 12, padding: "12px 16px", boxShadow: "0 1px 3px var(--ui-shadow)", display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
          <Input
            placeholder="Search by name or code…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 h-9 rounded-xl text-sm"
            style={{ background: "var(--ui-card)", border: "1.5px solid var(--ui-border)", color: "var(--ui-text-primary)" }}
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          style={{
            height: 36, padding: "0 12px", borderRadius: 8,
            border: "1.5px solid var(--ui-border)", background: "var(--ui-card)",
            color: "var(--ui-text-primary)", fontSize: "0.82rem", fontWeight: 500,
            outline: "none", cursor: "pointer", minWidth: 140,
          }}
        >
          {STATUS_OPTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        {(search || status) && (
          <button
            onClick={() => { setSearch(""); setStatus(""); setPage(1); }}
            style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8, fontSize: "0.75rem", fontWeight: 600, color: "var(--ui-status-danger)", background: "transparent", border: "1px solid var(--ui-status-danger)", cursor: "pointer" }}
          >
            <X style={{ width: 12, height: 12 }} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ background: "var(--ui-card)", border: "1px solid var(--ui-border)", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px var(--ui-shadow)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Employee</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Code</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Last PE</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Days Overdue</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
                        <div className="h-3 w-32 rounded bg-muted" />
                      </div>
                    </td>
                    {Array.from({ length: 4 }).map((_, j) => (
                      <td key={j} className="px-4 py-3.5 hidden sm:table-cell">
                        <div className="h-3 w-16 rounded bg-muted" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <ShieldCheck className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No records found</p>
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const initials = ((row.fullName ?? "?")[0]).toUpperCase();
                  return (
                    <tr key={row.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                            row.peStatus === "overdue"   ? "bg-orange-500/10 text-orange-600 border border-orange-300/40"
                            : row.peStatus === "never"   ? "bg-muted text-muted-foreground border border-border"
                            : "bg-green-500/10 text-green-600 border border-green-300/40"
                          )}>
                            {initials}
                          </div>
                          <p className="font-medium text-foreground truncate max-w-36">{row.fullName ?? "—"}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        <span className="font-mono text-xs text-muted-foreground">{row.code ?? "—"}</span>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell text-xs text-muted-foreground">
                        {row.lastPeDate
                          ? new Date(row.lastPeDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                          : "—"}
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        {row.daysOverdue !== null && row.daysOverdue > 0 ? (
                          <span className="text-xs font-semibold text-orange-600">{row.daysOverdue} days</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                          row.peStatus === "compliant" ? "text-green-600 bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20"
                          : row.peStatus === "overdue" ? "text-orange-600 bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20"
                          : "text-muted-foreground bg-muted border-border"
                        )}>
                          {row.peStatus === "compliant" ? <><CheckCircle2 className="h-2.5 w-2.5" />Compliant</>
                          : row.peStatus === "overdue"  ? <><AlertTriangle className="h-2.5 w-2.5" />Overdue</>
                          : "No PE on file"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages} · {pagination.total.toLocaleString()} results
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
