"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ClipboardList, Download, Eye, AlertTriangle, LogIn, Send,
  FileText, Search, ChevronLeft, ChevronRight, RefreshCw,
} from "lucide-react";

/* ─── types ─── */
type AuditLog = {
  id:          string;
  action:      string;
  detail:      string;
  targetCode:  string | null;
  hrUserName:  string;
  ipAddress:   string | null;
  createdAt:   string;
};

type Summary = {
  total:     number;
  logins:    number;
  views:     number;
  exports:   number;
  downloads: number;
  reminders: number;
};

type ApiResponse = {
  data:       AuditLog[];
  summary:    Summary;
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

/* ─── action → filter key mapping ─── */
function actionToType(action: string): string {
  switch (action) {
    case "LOGIN":          return "login";
    case "VIEW_EMPLOYEE":
    case "VIEW_APE":       return "view";
    case "EXPORT":         return "export";
    case "DOWNLOAD":       return "download";
    case "SEND_REMINDER":  return "reminder";
    case "BULK_SCHEDULE":  return "export";
    default:               return "view";
  }
}

/* ─── action → human-readable label ─── */
function actionLabel(action: string): string {
  switch (action) {
    case "LOGIN":          return "Login";
    case "VIEW_EMPLOYEE":  return "Employee Viewed";
    case "VIEW_APE":       return "APE Record Viewed";
    case "EXPORT":         return "Report Exported";
    case "DOWNLOAD":       return "Bulk Download";
    case "SEND_REMINDER":  return "Reminder Sent";
    case "BULK_SCHEDULE":  return "Bulk Scheduling";
    default:               return action;
  }
}

const TYPE_META: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  login:    { icon: LogIn,    color: "var(--ui-status-info)",    bg: "#DBEAFE" },
  view:     { icon: Eye,      color: "var(--ui-status-success)", bg: "#D1FAE5" },
  export:   { icon: FileText, color: "var(--ui-status-warning)", bg: "#FEF3C7" },
  download: { icon: Download, color: "var(--ui-status-info)",    bg: "#DBEAFE" },
  reminder: { icon: Send,     color: "var(--ui-status-danger)",  bg: "#FEE2E2" },
};

const FILTERS = [
  { val: "all",      label: "All" },
  { val: "login",    label: "Logins" },
  { val: "view",     label: "Views" },
  { val: "export",   label: "Exports" },
  { val: "download", label: "Downloads" },
  { val: "reminder", label: "Reminders" },
];

function maskIp(ip: string | null): string {
  if (!ip) return "—";
  const parts = ip.split(".");
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.**.**`;
  return ip.replace(/:[\da-f]+:[\da-f]+$/i, ":****");
}

export default function AuditTrailPage() {
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState("all");
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logs, setLogs]         = useState<AuditLog[]>([]);
  const [summary, setSummary]   = useState<Summary>({ total: 0, logins: 0, views: 0, exports: 0, downloads: 0, reminders: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true); else setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "50");
      if (filter !== "all") {
        // Map filter key back to API action value
        const actionMap: Record<string, string> = {
          login: "LOGIN", view: "VIEW_EMPLOYEE", export: "EXPORT",
          download: "DOWNLOAD", reminder: "SEND_REMINDER",
        };
        if (actionMap[filter]) params.set("action", actionMap[filter]);
      }
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/hr/audit?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json: ApiResponse = await res.json();
      setLogs(json.data);
      setSummary(json.summary);
      setPagination(json.pagination);
    } catch (err) {
      console.error("[AUDIT_FETCH]", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, filter, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Reset to page 1 when filter/search changes
  useEffect(() => { setPage(1); }, [filter, search]);

  // Group logs by date
  const grouped: Record<string, AuditLog[]> = {};
  logs.forEach((log) => {
    const date = log.createdAt.split("T")[0];
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(log);
  });

  const summaryCards = [
    { label: "Total Actions",  value: summary.total,                        color: "var(--ui-status-info)" },
    { label: "Logins",         value: summary.logins,                       color: "var(--ui-status-info)" },
    { label: "Records Viewed", value: summary.views,                        color: "var(--ui-status-success)" },
    { label: "Exports",        value: summary.exports + summary.downloads,  color: "var(--ui-status-warning)" },
  ];

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div style={{
        borderRadius: 14,
        background: "linear-gradient(135deg, #1E293B 0%, #334155 100%)",
        padding: "20px 24px", position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0, opacity: 0.06,
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <ClipboardList style={{ width: 16, height: 16, color: "rgba(255,255,255,0.8)" }} />
            <span style={{
              fontSize: "0.68rem", fontWeight: 700, color: "rgba(255,255,255,0.7)",
              letterSpacing: "0.1em", textTransform: "uppercase",
            }}>Reports &amp; Tools</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#ffffff", lineHeight: 1.2 }}>
                Audit Trail
              </h1>
              <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.55)", marginTop: 6 }}>
                Complete log of all HR portal access, downloads, and actions
              </p>
            </div>
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 14px", borderRadius: 8,
                background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)",
                color: "#fff", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <RefreshCw size={13} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14 }}>
        {summaryCards.map(({ label, value, color }) => (
          <div key={label} style={{
            background: "var(--ui-card)", borderRadius: 14, padding: "18px 20px",
            border: "1px solid var(--ui-border)",
            boxShadow: "0 1px 3px var(--ui-shadow)",
          }}>
            <p style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>
              {value.toLocaleString()}
            </p>
            <p style={{ fontSize: "0.72rem", color: "var(--ui-text-muted)", marginTop: 6, fontWeight: 500 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 240px" }}>
          <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "var(--ui-text-muted)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search actions, users, details…"
            style={{
              width: "100%", height: 40, paddingLeft: 36, paddingRight: 14,
              borderRadius: 10, fontSize: "0.82rem", outline: "none", boxSizing: "border-box",
              border: "1.5px solid var(--ui-border)",
              background: "var(--ui-card)",
              color: "var(--ui-text-primary)",
              transition: "border-color 0.15s",
            }}
          />
        </div>
        {/* Filter pills */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {FILTERS.map(({ val, label }) => {
            const active = filter === val;
            return (
              <button
                key={val}
                onClick={() => setFilter(val)}
                style={{
                  padding: "6px 14px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 600,
                  border: "1px solid", cursor: "pointer", transition: "all 0.15s",
                  background: active ? "var(--ui-active-bg)" : "var(--ui-card)",
                  color: active ? "var(--ui-active-text)" : "var(--ui-text-muted)",
                  borderColor: active ? "var(--ui-active-text)" : "var(--ui-border)",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Log entries grouped by date ── */}
      {loading ? (
        <div style={{ padding: 48, textAlign: "center", color: "var(--ui-text-muted)" }}>
          Loading audit records…
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {Object.entries(grouped).map(([date, dateLogs]) => (
            <div key={date}>
              <p style={{
                fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                color: "var(--ui-text-muted)", marginBottom: 8,
              }}>
                {new Date(date + "T00:00:00").toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>

              <div style={{
                background: "var(--ui-card)", borderRadius: 14,
                border: "1px solid var(--ui-border)", overflow: "hidden",
                boxShadow: "0 1px 3px var(--ui-shadow)",
              }}>
                {dateLogs.map((log, i) => {
                  const type = actionToType(log.action);
                  const meta = TYPE_META[type] ?? TYPE_META.view;
                  const Icon = meta.icon;
                  const time = new Date(log.createdAt).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
                  return (
                    <div
                      key={log.id}
                      className="nwd-row-hover"
                      style={{
                        display: "flex", alignItems: "center", gap: 14, padding: "14px 20px",
                        borderBottom: i < dateLogs.length - 1 ? "1px solid var(--ui-border)" : "none",
                        transition: "background 0.15s",
                      }}
                    >
                      {/* Icon */}
                      <div style={{
                        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                        background: meta.bg,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Icon style={{ width: 15, height: 15, color: meta.color }} />
                      </div>

                      {/* Text */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--ui-text-primary)", lineHeight: 1 }}>
                            {actionLabel(log.action)}
                          </p>
                          {log.hrUserName && (
                            <span style={{
                              fontSize: "0.65rem", fontWeight: 600,
                              background: "var(--ui-active-bg)", color: "var(--ui-active-text)",
                              borderRadius: 6, padding: "1px 7px",
                            }}>
                              {log.hrUserName}
                            </span>
                          )}
                        </div>
                        <p style={{
                          fontSize: "0.75rem", marginTop: 3,
                          color: "var(--ui-text-muted)",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {log.detail}
                        </p>
                      </div>

                      {/* Time + IP */}
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <p style={{ fontSize: "0.68rem", color: "var(--ui-text-muted)", fontFamily: "var(--font-mono, monospace)" }}>
                          {time}
                        </p>
                        <p style={{ fontSize: "0.62rem", color: "var(--ui-text-faint)", marginTop: 2, fontFamily: "var(--font-mono, monospace)" }}>
                          IP: {maskIp(log.ipAddress)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {logs.length === 0 && (
            <div style={{
              background: "var(--ui-card)", borderRadius: 14,
              border: "1px solid var(--ui-border)",
              padding: "60px 0", textAlign: "center",
            }}>
              <ClipboardList style={{ width: 40, height: 40, color: "var(--ui-text-faint)", margin: "0 auto 12px" }} />
              <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--ui-text-primary)" }}>No audit records found</p>
              <p style={{ fontSize: "0.78rem", color: "var(--ui-text-muted)", marginTop: 6 }}>
                {search || filter !== "all" ? "Try adjusting your search or filter." : "Actions will appear here as HR users interact with the portal."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Pagination ── */}
      {pagination.totalPages > 1 && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
        }}>
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "6px 14px", borderRadius: 8,
              background: "var(--ui-card)", border: "1px solid var(--ui-border)",
              color: page <= 1 ? "var(--ui-text-faint)" : "var(--ui-text-secondary)",
              fontSize: "0.78rem", fontWeight: 600, cursor: page <= 1 ? "not-allowed" : "pointer",
            }}
          >
            <ChevronLeft size={14} /> Previous
          </button>
          <span style={{ fontSize: "0.75rem", color: "var(--ui-text-muted)" }}>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(p => p + 1)}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "6px 14px", borderRadius: 8,
              background: "var(--ui-card)", border: "1px solid var(--ui-border)",
              color: page >= pagination.totalPages ? "var(--ui-text-faint)" : "var(--ui-text-secondary)",
              fontSize: "0.78rem", fontWeight: 600, cursor: page >= pagination.totalPages ? "not-allowed" : "pointer",
            }}
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* ── Compliance note ── */}
      <div style={{
        padding: "14px 18px",
        background: "var(--ui-card)", borderRadius: 12,
        border: "1px solid var(--ui-border)",
        display: "flex", alignItems: "flex-start", gap: 10,
      }}>
        <AlertTriangle style={{ width: 15, height: 15, color: "var(--ui-status-warning)", marginTop: 2, flexShrink: 0 }} />
        <p style={{ fontSize: "0.75rem", color: "var(--ui-text-muted)", lineHeight: 1.6, margin: 0 }}>
          This audit trail is read-only and retained per the NWD data retention policy in compliance with
          RA 10173 (Philippine Data Privacy Act). IP addresses are partially masked for privacy.
        </p>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
