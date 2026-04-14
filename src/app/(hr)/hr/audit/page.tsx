"use client";

import { useState } from "react";
import { ClipboardList, Download, Eye, AlertTriangle, LogIn, Send, FileText, Search } from "lucide-react";

const MOCK_LOGS = [
  { id: 1,  action: "Login",           detail: "Successful login from Chrome/Windows",           ts: "2026-04-13 09:14:22", ip: "123.45.**.***", type: "login" },
  { id: 2,  action: "Employee Viewed", detail: "Viewed record of Juan dela Cruz (PT-001)",        ts: "2026-04-13 09:16:05", ip: "123.45.**.***", type: "view" },
  { id: 3,  action: "Report Exported", detail: "PE Compliance Report — April 2026 (PDF)",         ts: "2026-04-13 09:22:48", ip: "123.45.**.***", type: "export" },
  { id: 4,  action: "Bulk Download",   detail: "Downloaded ZIP — 12 employee results",            ts: "2026-04-13 09:45:10", ip: "123.45.**.***", type: "download" },
  { id: 5,  action: "Reminder Sent",   detail: "Bulk PE reminder sent to 8 overdue employees",   ts: "2026-04-13 10:02:33", ip: "123.45.**.***", type: "reminder" },
  { id: 6,  action: "Employee Viewed", detail: "Viewed record of Maria Santos (PT-002)",          ts: "2026-04-13 10:18:00", ip: "123.45.**.***", type: "view" },
  { id: 7,  action: "Report Exported", detail: "Wellness Trend Report — Q1 2026 (PDF)",           ts: "2026-04-12 14:30:11", ip: "123.45.**.***", type: "export" },
  { id: 8,  action: "Login",           detail: "Successful login from Firefox/macOS",             ts: "2026-04-12 08:59:44", ip: "123.45.**.***", type: "login" },
  { id: 9,  action: "Bulk Scheduling", detail: "Uploaded 25-employee PE schedule list",           ts: "2026-04-11 11:20:15", ip: "123.45.**.***", type: "export" },
  { id: 10, action: "Report Exported", detail: "Demographic Report — All Departments (PDF)",      ts: "2026-04-11 13:44:52", ip: "123.45.**.***", type: "export" },
];

const TYPE_META: Record<string, { icon: React.ElementType; colorVar: string; bgClass: string }> = {
  login:    { icon: LogIn,    colorVar: "var(--color-info)",    bgClass: "var(--color-info-bg)" },
  view:     { icon: Eye,      colorVar: "var(--color-success)", bgClass: "var(--color-success-bg)" },
  export:   { icon: FileText, colorVar: "var(--color-warning)", bgClass: "var(--color-warning-bg)" },
  download: { icon: Download, colorVar: "var(--color-info)",    bgClass: "var(--color-info-bg)" },
  reminder: { icon: Send,     colorVar: "var(--color-danger)",  bgClass: "var(--color-danger-bg)" },
};

const FILTERS = [
  { val: "all",      label: "All" },
  { val: "login",    label: "Logins" },
  { val: "view",     label: "Views" },
  { val: "export",   label: "Exports" },
  { val: "download", label: "Downloads" },
  { val: "reminder", label: "Reminders" },
];

const SUMMARY_CARDS = [
  { label: "Total Actions",   value: () => MOCK_LOGS.length,                                                              colorVar: "var(--color-info)" },
  { label: "Logins",          value: () => MOCK_LOGS.filter((l) => l.type === "login").length,                            colorVar: "var(--color-info)" },
  { label: "Records Viewed",  value: () => MOCK_LOGS.filter((l) => l.type === "view").length,                             colorVar: "var(--color-success)" },
  { label: "Exports",         value: () => MOCK_LOGS.filter((l) => l.type === "export" || l.type === "download").length,  colorVar: "var(--color-warning)" },
];

export default function AuditTrailPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = MOCK_LOGS.filter((log) => {
    const matchSearch = log.action.toLowerCase().includes(search.toLowerCase()) ||
                        log.detail.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || log.type === filter;
    return matchSearch && matchFilter;
  });

  const grouped: Record<string, typeof MOCK_LOGS> = {};
  filtered.forEach((log) => {
    const date = log.ts.split(" ")[0];
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(log);
  });

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <div style={{ width: 4, height: 28, background: "#E00500", borderRadius: 4, flexShrink: 0 }} />
          <h1 style={{
            fontSize: 24, fontWeight: 800, letterSpacing: "-0.01em",
            color: "hsl(var(--foreground))",
            fontFamily: "var(--font-playfair, Georgia, serif)",
          }}>
            Audit Trail
          </h1>
        </div>
        <p style={{ fontSize: 13, color: "hsl(var(--muted-foreground))", marginLeft: 16 }}>
          Complete log of all HR portal access, downloads, and actions.
        </p>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14 }}>
        {SUMMARY_CARDS.map(({ label, value, colorVar }) => (
          <div key={label} style={{
            background: "hsl(var(--card))", borderRadius: 14, padding: "18px 20px",
            border: "1px solid hsl(var(--border))",
            boxShadow: "var(--shadow-sm)",
          }}>
            <p style={{ fontSize: 28, fontWeight: 900, color: colorVar, lineHeight: 1, fontFamily: "var(--font-playfair, Georgia, serif)" }}>
              {value()}
            </p>
            <p style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", marginTop: 6, fontWeight: 500 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 240px" }}>
          <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "hsl(var(--muted-foreground))" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search actions…"
            style={{
              width: "100%", height: 40, paddingLeft: 36, paddingRight: 14,
              borderRadius: 10, fontSize: 13, outline: "none", boxSizing: "border-box",
              border: "1.5px solid hsl(var(--border))",
              background: "hsl(var(--card))",
              color: "hsl(var(--foreground))",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "hsl(var(--ring))")}
            onBlur={(e)  => (e.currentTarget.style.borderColor = "hsl(var(--border))")}
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
                  padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                  border: "1px solid", cursor: "pointer", transition: "all 0.15s",
                  background: active ? "#1006A0" : "hsl(var(--card))",
                  color:      active ? "white"   : "hsl(var(--muted-foreground))",
                  borderColor: active ? "#1006A0" : "hsl(var(--border))",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Log entries grouped by date */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {Object.entries(grouped).map(([date, logs]) => (
          <div key={date}>
            <p style={{
              fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
              color: "hsl(var(--muted-foreground))", marginBottom: 8,
            }}>
              {new Date(date).toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>

            <div style={{
              background: "hsl(var(--card))",
              borderRadius: 14,
              border: "1px solid hsl(var(--border))",
              overflow: "hidden",
              boxShadow: "var(--shadow-sm)",
            }}>
              {logs.map((log, i) => {
                const meta = TYPE_META[log.type] ?? TYPE_META.view;
                const Icon = meta.icon;
                return (
                  <div
                    key={log.id}
                    style={{
                      display: "flex", alignItems: "center", gap: 14, padding: "14px 20px",
                      borderBottom: i < logs.length - 1 ? "1px solid hsl(var(--border))" : "none",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "hsl(var(--muted))")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                      background: meta.bgClass,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon style={{ width: 15, height: 15, color: meta.colorVar }} />
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "hsl(var(--foreground))", lineHeight: 1 }}>
                        {log.action}
                      </p>
                      <p style={{
                        fontSize: 12, marginTop: 3,
                        color: "hsl(var(--muted-foreground))",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {log.detail}
                      </p>
                    </div>

                    {/* Time + IP */}
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-mono, monospace)" }}>
                        {log.ts.split(" ")[1]}
                      </p>
                      <p style={{ fontSize: 10, color: "hsl(var(--muted-foreground) / 0.5)", marginTop: 2, fontFamily: "var(--font-mono, monospace)" }}>
                        IP: {log.ip}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{
            background: "hsl(var(--card))", borderRadius: 14,
            border: "1px solid hsl(var(--border))",
            padding: "60px 0", textAlign: "center",
          }}>
            <ClipboardList style={{ width: 40, height: 40, color: "hsl(var(--border))", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: "hsl(var(--muted-foreground))" }}>No audit records found</p>
            <p style={{ fontSize: 13, color: "hsl(var(--muted-foreground) / 0.6)", marginTop: 6 }}>Try adjusting your search or filter.</p>
          </div>
        )}
      </div>

      {/* Compliance note */}
      <div style={{
        padding: "14px 18px",
        background: "hsl(var(--card))", borderRadius: 12,
        border: "1px solid hsl(var(--border))",
        display: "flex", alignItems: "flex-start", gap: 10,
      }}>
        <AlertTriangle style={{ width: 15, height: 15, color: "var(--color-warning)", marginTop: 2, flexShrink: 0 }} />
        <p style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", lineHeight: 1.6, margin: 0 }}>
          This audit trail is read-only and retained per the NWD data retention policy in compliance with
          RA 10173 (Philippine Data Privacy Act). IP addresses are partially masked for privacy.
        </p>
      </div>
    </div>
  );
}
