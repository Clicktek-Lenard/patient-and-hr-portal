"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  MessageSquarePlus, Download, RefreshCw, ShieldAlert,
  Bug, Lightbulb, HelpCircle,
  Image as ImageIcon,
} from "lucide-react";

/* Smooth count-up animation */
function CountUp({ to }: { to: number }) {
  const [n, setN] = useState(0);
  const prevRef = useRef(0);
  useEffect(() => {
    const from = prevRef.current;
    const duration = 800;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setN(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else prevRef.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <>{n.toLocaleString()}</>;
}

type UatSeverity = "Bug" | "Suggestion" | "Question" | "Blocker";
type UatStatus   = "Open" | "Acknowledged" | "Resolved";

interface FeedbackRow {
  id:             string;
  submittedBy:    string;
  userFullname:   string | null;
  userRole:       string;
  module:         string;
  pageUrl:        string;
  pageTitle:      string | null;
  severity:       UatSeverity;
  description:    string;
  screenshotPath: string | null;
  status:         UatStatus;
  createdAt:      string;
}

interface Stats {
  total:        number;
  blockers:     number;
  bugs:         number;
  open:         number;
  acknowledged: number;
  resolved:     number;
}

const SEVERITY_STYLE: Record<UatSeverity, { bg: string; color: string; icon: React.ElementType }> = {
  Blocker:    { bg: "#FEE2E2", color: "#991B1B", icon: ShieldAlert },
  Bug:        { bg: "#FEF3C7", color: "#92400E", icon: Bug },
  Suggestion: { bg: "#DBEAFE", color: "#1E40AF", icon: Lightbulb },
  Question:   { bg: "#EDE9FE", color: "#5B21B6", icon: HelpCircle },
};

const STATUS_STYLE: Record<UatStatus, { bg: string; color: string; label: string }> = {
  Open:         { bg: "#FEE2E2", color: "#991B1B",  label: "Open" },
  Acknowledged: { bg: "#FEF3C7", color: "#92400E",  label: "Acknowledged" },
  Resolved:     { bg: "#D1FAE5", color: "#065F46",  label: "Resolved" },
};

const ALL_SEVERITIES: (UatSeverity | "")[] = ["", "Blocker", "Bug", "Suggestion", "Question"];
const ALL_STATUSES:   (UatStatus   | "")[] = ["", "Open", "Acknowledged", "Resolved"];

export default function UatFeedbackPage() {
  const [rows,   setRows]   = useState<FeedbackRow[]>([]);
  const [stats,  setStats]  = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const [filterSeverity, setFilterSeverity] = useState<UatSeverity | "">("");
  const [filterStatus,   setFilterStatus]   = useState<UatStatus | "">("");
  const [filterModule,   setFilterModule]   = useState("");

  const [expandedId,  setExpandedId]  = useState<string | null>(null);
  const [updatingId,  setUpdatingId]  = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterSeverity) params.set("severity", filterSeverity);
      if (filterStatus)   params.set("status",   filterStatus);
      if (filterModule)   params.set("module",   filterModule);

      const res  = await fetch(`/api/uat/feedback?${params}`);
      const json = await res.json();
      setRows(json.data  ?? []);
      setStats(json.stats ?? null);
    } finally {
      setLoading(false);
    }
  }, [filterSeverity, filterStatus, filterModule]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function updateStatus(id: string, status: UatStatus) {
    setUpdatingId(id);
    try {
      await fetch(`/api/uat/feedback/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status }),
      });
      await fetchData();
    } finally {
      setUpdatingId(null);
    }
  }

  function exportCsv() {
    const params = new URLSearchParams({ export: "csv" });
    if (filterSeverity) params.set("severity", filterSeverity);
    if (filterStatus)   params.set("status",   filterStatus);
    if (filterModule)   params.set("module",   filterModule);
    window.open(`/api/uat/feedback?${params}`, "_blank");
  }

  // Unique modules for filter dropdown
  const modules = Array.from(new Set(rows.map((r) => r.module))).sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-500/10 border border-teal-400/20">
            <MessageSquarePlus className="h-4 w-4 text-teal-500" />
          </div>
          <span className="text-xs font-semibold text-teal-500 tracking-widest uppercase">UAT</span>
        </div>
        <h1 className="text-xl font-bold text-foreground">UAT Feedback</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage and review feedback submitted during user acceptance testing
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
          {[
            { label: "Total",        value: stats.total,        color: "#0D9488" },
            { label: "Blockers",     value: stats.blockers,     color: "#E00500" },
            { label: "Bugs",         value: stats.bugs,         color: "#F97316" },
            { label: "Open",         value: stats.open,         color: "#991B1B" },
            { label: "Acknowledged", value: stats.acknowledged, color: "#92400E" },
            { label: "Resolved",     value: stats.resolved,     color: "#065F46" },
          ].map((s) => (
            <div key={s.label} style={{
              background:   "hsl(var(--card))",
              border:       "1.5px solid hsl(var(--border))",
              borderRadius: 12,
              padding:      "14px 16px",
              textAlign:    "center",
            }}>
              <p style={{ fontSize: "1.6rem", fontWeight: 800, color: s.color, lineHeight: 1 }} className="tabular-nums">
                <CountUp to={s.value} />
              </p>
              <p style={{ fontSize: "0.72rem", color: "hsl(var(--muted-foreground))", marginTop: 4, fontWeight: 600 }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Filters + actions */}
      <div style={{
        background:   "hsl(var(--card))",
        border:       "1.5px solid hsl(var(--border))",
        borderRadius: 12,
        padding:      "16px 20px",
        display:      "flex",
        gap:          12,
        flexWrap:     "wrap",
        alignItems:   "center",
      }}>
        {/* Severity filter */}
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value as UatSeverity | "")}
          style={selectStyle}
        >
          <option value="">All Severities</option>
          {ALL_SEVERITIES.filter(Boolean).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as UatStatus | "")}
          style={selectStyle}
        >
          <option value="">All Statuses</option>
          {ALL_STATUSES.filter(Boolean).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Module filter */}
        <select
          value={filterModule}
          onChange={(e) => setFilterModule(e.target.value)}
          style={selectStyle}
        >
          <option value="">All Modules</option>
          {modules.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={fetchData} style={iconBtnStyle} title="Refresh">
            <RefreshCw style={{ width: 15, height: 15 }} />
          </button>
          <button onClick={exportCsv} style={{ ...iconBtnStyle, gap: 6, paddingLeft: 12, paddingRight: 12, fontSize: "0.78rem", fontWeight: 700 }}>
            <Download style={{ width: 15, height: 15 }} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{
        background:   "hsl(var(--card))",
        border:       "1.5px solid hsl(var(--border))",
        borderRadius: 12,
        overflow:     "hidden",
      }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "hsl(var(--muted-foreground))" }}>
            Loading...
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "hsl(var(--muted-foreground))" }}>
            <MessageSquarePlus style={{ width: 32, height: 32, margin: "0 auto 8px", opacity: 0.3 }} />
            <p style={{ fontWeight: 600 }}>No feedback yet</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1.5px solid hsl(var(--border))", background: "hsl(var(--muted))" }}>
                  {["Date", "User", "Role", "Module", "Severity", "Description", "Img", "Status", ""].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const sev = SEVERITY_STYLE[row.severity];
                  const SevIcon = sev.icon;
                  const sta = STATUS_STYLE[row.status];
                  const isExpanded = expandedId === row.id;

                  return (
                    <>
                      <tr
                        key={row.id}
                        style={{
                          borderBottom: "1px solid hsl(var(--border))",
                          background: isExpanded ? "hsl(var(--muted))" : undefined,
                          cursor: "pointer",
                          transition: "background 0.15s",
                        }}
                        onClick={() => setExpandedId(isExpanded ? null : row.id)}
                        className="nwd-row-hover"
                      >
                        {/* Date */}
                        <td style={tdStyle}>
                          <span style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", whiteSpace: "nowrap" }}>
                            {new Date(row.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </td>
                        {/* User */}
                        <td style={tdStyle}>
                          <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "hsl(var(--foreground))", whiteSpace: "nowrap" }}>
                            {row.userFullname ?? row.submittedBy}
                          </p>
                          <p style={{ fontSize: "0.7rem", color: "hsl(var(--muted-foreground))" }}>
                            {row.submittedBy}
                          </p>
                        </td>
                        {/* Role */}
                        <td style={tdStyle}>
                          <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--ui-text-secondary)" }}>
                            {row.userRole}
                          </span>
                        </td>
                        {/* Module */}
                        <td style={tdStyle}>
                          <span style={{
                            fontSize: "0.72rem", fontWeight: 700,
                            background: "var(--ui-active-bg)", color: "var(--ui-active-text)",
                            borderRadius: 6, padding: "2px 8px",
                          }}>
                            {row.module}
                          </span>
                        </td>
                        {/* Severity */}
                        <td style={tdStyle}>
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            fontSize: "0.72rem", fontWeight: 700,
                            background: sev.bg, color: sev.color,
                            borderRadius: 6, padding: "2px 8px",
                          }}>
                            <SevIcon style={{ width: 11, height: 11 }} />
                            {row.severity}
                          </span>
                        </td>
                        {/* Description (truncated) */}
                        <td style={{ ...tdStyle, maxWidth: 260 }}>
                          <p style={{
                            fontSize: "0.8rem", color: "hsl(var(--foreground))",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: isExpanded ? "normal" : "nowrap",
                          }}>
                            {row.description}
                          </p>
                        </td>
                        {/* Img */}
                        <td style={tdStyle}>
                          {row.screenshotPath ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); window.open(row.screenshotPath!, "_blank"); }}
                              style={{ background: "transparent", border: "none", cursor: "pointer", color: "#0D9488" }}
                              title="View screenshot"
                            >
                              <ImageIcon style={{ width: 16, height: 16 }} />
                            </button>
                          ) : (
                            <span style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.7rem" }}>—</span>
                          )}
                        </td>
                        {/* Status badge */}
                        <td style={tdStyle}>
                          <span style={{
                            fontSize: "0.72rem", fontWeight: 700,
                            background: sta.bg, color: sta.color,
                            borderRadius: 6, padding: "2px 8px",
                            whiteSpace: "nowrap",
                          }}>
                            {sta.label}
                          </span>
                        </td>
                        {/* Actions */}
                        <td style={tdStyle} onClick={(e) => e.stopPropagation()}>
                          <select
                            value={row.status}
                            disabled={updatingId === row.id}
                            onChange={(e) => updateStatus(row.id, e.target.value as UatStatus)}
                            style={{
                              ...selectStyle,
                              fontSize: "0.72rem",
                              padding: "4px 8px",
                              minWidth: 130,
                            }}
                          >
                            <option value="Open">Open</option>
                            <option value="Acknowledged">Acknowledged</option>
                            <option value="Resolved">Resolved</option>
                          </select>
                        </td>
                      </tr>
                      {/* Expanded row */}
                      {isExpanded && (
                        <tr key={`${row.id}-expanded`} style={{ borderBottom: "1px solid hsl(var(--border))", background: "hsl(var(--muted))" }}>
                          <td colSpan={9} style={{ padding: "12px 20px" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "start" }}>
                              <div>
                                <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "hsl(var(--muted-foreground))", textTransform: "uppercase", marginBottom: 4 }}>
                                  Full Description
                                </p>
                                <p style={{ fontSize: "0.82rem", color: "hsl(var(--foreground))", lineHeight: 1.6 }}>
                                  {row.description}
                                </p>
                                <p style={{ fontSize: "0.7rem", color: "hsl(var(--muted-foreground))", marginTop: 8 }}>
                                  Page: <a href={row.pageUrl} target="_blank" rel="noreferrer" style={{ color: "#0D9488" }}>{row.pageTitle ?? row.pageUrl}</a>
                                </p>
                              </div>
                              {row.screenshotPath && (
                                <div
                                  style={{ width: 160, borderRadius: 8, overflow: "hidden", border: "1px solid hsl(var(--border))", cursor: "pointer" }}
                                  onClick={() => window.open(row.screenshotPath!, "_blank")}
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={row.screenshotPath} alt="screenshot" style={{ width: "100%", objectFit: "cover" }} />
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

const selectStyle: React.CSSProperties = {
  padding:      "7px 10px",
  borderRadius: 8,
  border:       "1.5px solid hsl(var(--border))",
  background:   "hsl(var(--background))",
  color:        "hsl(var(--foreground))",
  fontSize:     "0.82rem",
  outline:      "none",
  cursor:       "pointer",
};

const iconBtnStyle: React.CSSProperties = {
  display:       "flex",
  alignItems:    "center",
  gap:            6,
  padding:        "7px 10px",
  borderRadius:   8,
  border:         "1.5px solid hsl(var(--border))",
  background:     "hsl(var(--muted))",
  color:          "hsl(var(--foreground))",
  fontSize:       "0.82rem",
  cursor:         "pointer",
};

const thStyle: React.CSSProperties = {
  padding:   "10px 14px",
  textAlign: "left",
  fontSize:  "0.72rem",
  fontWeight: 700,
  color:      "hsl(var(--muted-foreground))",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  whiteSpace:    "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding:  "12px 14px",
  verticalAlign: "middle",
};
