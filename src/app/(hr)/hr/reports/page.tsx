"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart2, Download, Users, CalendarDays,
  FlaskConical, TrendingUp, Loader2, FileText, Package,
} from "lucide-react";
import { toast } from "sonner";
import { useAuditLog } from "@/hooks/use-audit-log";

const cs = {
  card: { background: "var(--ui-card)", border: "1px solid var(--ui-border)", borderRadius: 12, boxShadow: "0 1px 3px var(--ui-shadow)", overflow: "hidden" } as React.CSSProperties,
  header: { padding: "14px 20px", borderBottom: "1px solid var(--ui-border)" } as React.CSSProperties,
  body: { padding: "20px" } as React.CSSProperties,
  label: { display: "block", fontSize: "0.72rem", fontWeight: 600, color: "var(--ui-text-muted)", letterSpacing: "0.04em", textTransform: "uppercase" as const, marginBottom: 6 } as React.CSSProperties,
  select: { width: "100%", height: 38, padding: "0 12px", borderRadius: 8, border: "1.5px solid var(--ui-border)", background: "var(--ui-card)", color: "var(--ui-text-primary)", fontSize: "0.82rem", outline: "none", cursor: "pointer" } as React.CSSProperties,
  dateInput: { width: "100%", height: 38, padding: "0 12px", borderRadius: 8, border: "1.5px solid var(--ui-border)", background: "var(--ui-card)", color: "var(--ui-text-primary)", fontSize: "0.82rem", outline: "none" } as React.CSSProperties,
};

const REPORT_TYPES = [
  { value: "summary",     label: "Summary Report" },
  { value: "demographic", label: "Demographic Report" },
  { value: "compliance",  label: "PE Compliance Report" },
  { value: "conditions",  label: "Top Conditions Report" },
  { value: "wellness",    label: "Wellness Trend Report" },
];

const FORMAT_OPTIONS = [
  { value: "excel", label: "Excel (.xlsx)" },
  { value: "csv",   label: "CSV (.csv)" },
];

type SummaryData = {
  totals: { totalVisits: number; completedVisits: number; totalPatients: number; totalRevenue: number; labResults: number };
  visitsByType: Array<{ type: string; count: number }>;
};

type DemographicData = {
  gender: { male: number; female: number; other: number; total: number };
  top10Diseases: Array<{ rank: number; diagnosis: string; count: number }>;
};

export default function ReportsPage() {
  const { log: auditLog } = useAuditLog();

  // Generate Reports state
  const [reportType, setReportType]   = useState("summary");
  const [format, setFormat]           = useState("excel");
  const [department, setDepartment]   = useState("");
  const [from, setFrom]               = useState("");
  const [to, setTo]                   = useState("");
  const [downloading, setDownloading] = useState(false);

  // Fetch department list
  const { data: deptData } = useQuery<{ data: string[] }>({
    queryKey: ["hr-departments"],
    queryFn: () => fetch("/api/hr/reports?type=departments&format=json").then((r) => r.json()),
    staleTime: 5 * 60_000,
  });
  const departments = deptData?.data ?? [];

  // Bulk Download state
  const [bulkDept, setBulkDept]       = useState("");
  const [bulkPeriod, setBulkPeriod]   = useState("");
  const [bulkDownloading, setBulkDownloading] = useState(false);

  // Generate quarter options (current year + previous year)
  const currentYear = new Date().getFullYear();
  const quarterOptions: { value: string; label: string; from: string; to: string }[] = [];
  for (const yr of [currentYear, currentYear - 1]) {
    for (const q of [1, 2, 3, 4]) {
      const fromMonth = (q - 1) * 3;
      const toMonth = q * 3 - 1;
      const qFrom = `${yr}-${String(fromMonth + 1).padStart(2, "0")}-01`;
      const lastDay = new Date(yr, toMonth + 1, 0).getDate();
      const qTo = `${yr}-${String(toMonth + 1).padStart(2, "0")}-${lastDay}`;
      quarterOptions.push({ value: `Q${q}-${yr}`, label: `Q${q} ${yr}`, from: qFrom, to: qTo });
    }
  }

  // Preview data
  const apiType = reportType === "compliance" || reportType === "conditions" || reportType === "wellness" ? "summary" : reportType;
  const { data: summaryData, isLoading: summaryLoading } = useQuery<{ data: SummaryData }>({
    queryKey: ["hr-reports-summary", from, to, department],
    queryFn: () => {
      const p = new URLSearchParams({ type: "summary", format: "json" });
      if (from) p.set("from", from);
      if (to) p.set("to", to);
      if (department) p.set("department", department);
      return fetch(`/api/hr/reports?${p}`).then((r) => r.json());
    },
    enabled: apiType === "summary",
  });
  const { data: demoData, isLoading: demoLoading } = useQuery<{ data: DemographicData }>({
    queryKey: ["hr-reports-demographic", department],
    queryFn: () => {
      const p = new URLSearchParams({ type: "demographic", format: "json" });
      if (department) p.set("department", department);
      return fetch(`/api/hr/reports?${p}`).then((r) => r.json());
    },
    enabled: apiType === "demographic",
  });

  async function handleExport() {
    setDownloading(true);
    try {
      const p = new URLSearchParams({ type: apiType, format });
      if (from) p.set("from", from);
      if (to) p.set("to", to);
      if (department) p.set("department", department);
      const res = await fetch(`/api/hr/reports?${p}`);
      if (!res.ok) { toast.error("Failed to generate report"); return; }
      const blob = await res.blob();
      const ext = format === "csv" ? "csv" : "xlsx";
      const filename = `${reportType}-report-${new Date().toISOString().split("T")[0]}.${ext}`;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success(`${filename} downloaded`);
      auditLog("EXPORT", `${reportType} report exported as ${ext.toUpperCase()} — ${filename}`);
    } catch { toast.error("Download failed"); }
    finally { setDownloading(false); }
  }

  async function handleBulkDownload() {
    setBulkDownloading(true);
    try {
      const p = new URLSearchParams({ type: "summary", format: "excel" });
      if (bulkDept) p.set("department", bulkDept);
      const selectedQ = quarterOptions.find((q) => q.value === bulkPeriod);
      if (selectedQ) { p.set("from", selectedQ.from); p.set("to", selectedQ.to); }
      const res = await fetch(`/api/hr/reports?${p}`);
      if (!res.ok) { toast.error("Failed to generate bulk download"); return; }
      const blob = await res.blob();
      const filename = `bulk-results-${new Date().toISOString().split("T")[0]}.xlsx`;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success(`${filename} downloaded`);
      auditLog("DOWNLOAD", `Bulk results downloaded — ${filename}`);
    } catch { toast.error("Download failed"); }
    finally { setBulkDownloading(false); }
  }

  const summary = summaryData?.data;
  const demo = demoData?.data;
  const isPreviewLoading = apiType === "summary" ? summaryLoading : demoLoading;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div style={{ borderRadius: 14, background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)", padding: "20px 24px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.06, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <BarChart2 style={{ width: 16, height: 16, color: "rgba(255,255,255,0.8)" }} />
            <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Reports &amp; Tools</span>
          </div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#ffffff", lineHeight: 1.2 }}>Reports &amp; Exports</h1>
          <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.55)", marginTop: 6 }}>Generate, preview, and download compliance and demographic reports</p>
        </div>
      </div>

      {/* Two-column cards */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* ── Generate Reports Card ── */}
        <div style={cs.card}>
          <div style={{ ...cs.header, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileText size={16} style={{ color: "#4F46E5" }} />
            </div>
            <h2 style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--ui-text-primary)" }}>Generate Reports</h2>
          </div>
          <div style={cs.body} className="space-y-4">
            {/* Report Type */}
            <div>
              <label style={cs.label}>Report Type</label>
              <select value={reportType} onChange={(e) => setReportType(e.target.value)} style={cs.select}>
                {REPORT_TYPES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            {/* Department */}
            <div>
              <label style={cs.label}>Department</label>
              <select value={department} onChange={(e) => setDepartment(e.target.value)} style={cs.select}>
                <option value="">All Departments</option>
                {departments.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {/* Date Range */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={cs.label}>Date From</label>
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={cs.dateInput} />
              </div>
              <div>
                <label style={cs.label}>Date To</label>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={cs.dateInput} />
              </div>
            </div>

            {/* Format */}
            <div>
              <label style={cs.label}>Export Format</label>
              <select value={format} onChange={(e) => setFormat(e.target.value)} style={cs.select}>
                {FORMAT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>

            {/* Export button */}
            <button
              onClick={handleExport}
              disabled={downloading}
              style={{
                width: "100%", height: 40, borderRadius: 10, border: "none",
                background: downloading ? "var(--ui-border)" : "#4F46E5",
                color: "#fff", fontSize: "0.85rem", fontWeight: 600,
                cursor: downloading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "all 0.15s",
              }}
            >
              {downloading
                ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Generating…</>
                : <><Download size={15} /> Export Report</>
              }
            </button>
          </div>
        </div>

        {/* ── Bulk Download Card ── */}
        <div style={cs.card}>
          <div style={{ ...cs.header, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Package size={16} style={{ color: "#D97706" }} />
            </div>
            <h2 style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--ui-text-primary)" }}>Bulk Download Results</h2>
          </div>
          <div style={cs.body} className="space-y-4">
            <p style={{ fontSize: "0.78rem", color: "var(--ui-text-muted)", lineHeight: 1.6 }}>
              Download all employee results for a given period as an Excel file.
            </p>

            {/* Department */}
            <div>
              <label style={cs.label}>Department</label>
              <select value={bulkDept} onChange={(e) => setBulkDept(e.target.value)} style={cs.select}>
                <option value="">All Departments</option>
                {departments.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {/* Results Period */}
            <div>
              <label style={cs.label}>Results Period</label>
              <select value={bulkPeriod} onChange={(e) => setBulkPeriod(e.target.value)} style={cs.select}>
                <option value="">All Periods</option>
                {quarterOptions.map((q) => (
                  <option key={q.value} value={q.value}>{q.label}</option>
                ))}
              </select>
            </div>

            {/* Download button */}
            <button
              onClick={handleBulkDownload}
              disabled={bulkDownloading}
              style={{
                width: "100%", height: 40, borderRadius: 10, border: "none",
                background: bulkDownloading ? "var(--ui-border)" : "#D97706",
                color: "#fff", fontSize: "0.85rem", fontWeight: 600,
                cursor: bulkDownloading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "all 0.15s",
              }}
            >
              {bulkDownloading
                ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Preparing…</>
                : <><Download size={15} /> Download ZIP Package</>
              }
            </button>
          </div>
        </div>
      </div>

      {/* ── Preview Section ── */}
      <div style={cs.card}>
        <div style={{ ...cs.header, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--ui-text-primary)" }}>
            Report Preview — {REPORT_TYPES.find(r => r.value === reportType)?.label}
          </h2>
          <span style={{ fontSize: "0.68rem", color: "var(--ui-text-faint)" }}>Live data</span>
        </div>
        <div style={{ padding: 20 }}>
          {isPreviewLoading ? (
            <div style={{ padding: 32, textAlign: "center", color: "var(--ui-text-muted)" }}>
              <Loader2 size={24} style={{ margin: "0 auto 8px", animation: "spin 1s linear infinite" }} />
              Loading preview…
            </div>
          ) : apiType === "summary" && summary ? (
            <div className="space-y-6">
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {[
                  { label: "Total Visits",    value: summary.totals.totalVisits,     icon: CalendarDays, color: "#7C3AED" },
                  { label: "Completed",        value: summary.totals.completedVisits, icon: TrendingUp,   color: "#16A34A" },
                  { label: "Employees",  value: summary.totals.totalPatients,   icon: Users,        color: "#2563EB" },
                  { label: "Lab Results",      value: summary.totals.labResults,      icon: FlaskConical, color: "#D97706" },
                  { label: "Revenue",          value: `₱${Number(summary.totals.totalRevenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: BarChart2, color: "#16A34A" },
                ].map((s) => (
                  <div key={s.label} style={{ background: "var(--ui-card)", border: "1px solid var(--ui-border)", borderRadius: 10, padding: "14px 16px" }}>
                    <s.icon size={16} style={{ color: s.color, marginBottom: 8 }} />
                    <p style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--ui-text-primary)" }}>
                      {typeof s.value === "number" ? s.value.toLocaleString() : s.value}
                    </p>
                    <p style={{ fontSize: "0.7rem", color: "var(--ui-text-muted)", marginTop: 2 }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Visits by type */}
              {summary.visitsByType.length > 0 && (
                <div>
                  <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--ui-text-secondary)", marginBottom: 8 }}>Visits by Patient Type</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {summary.visitsByType.sort((a, b) => b.count - a.count).slice(0, 8).map((t) => {
                      const pct = summary.totals.totalVisits ? Math.round((t.count / summary.totals.totalVisits) * 100) : 0;
                      return (
                        <div key={t.type} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={{ fontSize: "0.78rem", color: "var(--ui-text-primary)", minWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.type || "Unknown"}</span>
                          <div style={{ flex: 1, height: 6, borderRadius: 3, background: "var(--ui-border)", overflow: "hidden" }}>
                            <div style={{ height: "100%", borderRadius: 3, background: "#7C3AED", width: `${pct}%` }} />
                          </div>
                          <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--ui-text-primary)", minWidth: 40, textAlign: "right" }}>{t.count.toLocaleString()}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : apiType === "demographic" && demo ? (
            <div className="space-y-6">
              {/* Gender */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {[
                  { label: "Male",   count: demo.gender.male,   color: "#2563EB" },
                  { label: "Female", count: demo.gender.female, color: "#EC4899" },
                  { label: "Other",  count: demo.gender.other,  color: "#6B7280" },
                ].map((g) => {
                  const pct = demo.gender.total ? Math.round((g.count / demo.gender.total) * 100) : 0;
                  return (
                    <div key={g.label} style={{ background: "var(--ui-card)", border: "1px solid var(--ui-border)", borderRadius: 10, padding: "16px", textAlign: "center" }}>
                      <p style={{ fontSize: "1.6rem", fontWeight: 700, color: g.color }}>{g.count.toLocaleString()}</p>
                      <p style={{ fontSize: "0.78rem", color: "var(--ui-text-muted)", marginTop: 4 }}>{g.label} ({pct}%)</p>
                    </div>
                  );
                })}
              </div>

              {/* Top diseases */}
              {demo.top10Diseases.length > 0 && (
                <div>
                  <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--ui-text-secondary)", marginBottom: 8 }}>Top 10 Chief Complaints</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {demo.top10Diseases.map((d) => {
                      const maxCount = demo.top10Diseases[0]?.count ?? 1;
                      const pct = Math.round((d.count / maxCount) * 100);
                      return (
                        <div key={d.rank} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--ui-active-bg)", color: "var(--ui-active-text)", fontSize: "0.65rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{d.rank}</span>
                          <span style={{ fontSize: "0.78rem", color: "var(--ui-text-primary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.diagnosis}</span>
                          <div style={{ width: 80, height: 6, borderRadius: 3, background: "var(--ui-border)", overflow: "hidden", flexShrink: 0 }}>
                            <div style={{ height: "100%", borderRadius: 3, background: "#7C3AED", width: `${pct}%` }} />
                          </div>
                          <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--ui-text-primary)", minWidth: 32, textAlign: "right" }}>{d.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: 32, textAlign: "center", color: "var(--ui-text-muted)", fontSize: "0.85rem" }}>
              Select a report type to see a preview
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
