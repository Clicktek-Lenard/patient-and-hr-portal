"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart2, Download, Users, CalendarDays,
  FlaskConical, TrendingUp, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type SummaryData = {
  totals: {
    totalVisits: number;
    completedVisits: number;
    totalPatients: number;
    totalRevenue: number;
    labResults: number;
  };
  visitsByDate: Array<{ date: string; total: number; completed: number }>;
  visitsByType: Array<{ type: string; count: number }>;
};

type DemographicData = {
  gender: { male: number; female: number; other: number; total: number };
  top10Diseases: Array<{ rank: number; diagnosis: string; count: number }>;
};

const FORMAT_OPTIONS = [
  { value: "excel", label: "Excel (.xlsx)" },
  { value: "csv",   label: "CSV (.csv)"   },
];

export default function ReportsPage() {
  const [tab,    setTab]    = useState<"summary" | "demographic">("summary");
  const [format, setFormat] = useState("excel");
  const [from,   setFrom]   = useState("");
  const [to,     setTo]     = useState("");
  const [downloading, setDownloading] = useState(false);

  function buildUrl(fmt: string) {
    const p = new URLSearchParams({ type: tab, format: fmt });
    if (from) p.set("from", from);
    if (to)   p.set("to", to);
    return `/api/hr/reports?${p}`;
  }

  const { data: summaryData, isLoading: summaryLoading } = useQuery<{ data: SummaryData }>({
    queryKey: ["hr-reports-summary", from, to],
    queryFn:  () => fetch(buildUrl("json")).then((r) => r.json()),
    enabled:  tab === "summary",
  });

  const { data: demoData, isLoading: demoLoading } = useQuery<{ data: DemographicData }>({
    queryKey: ["hr-reports-demographic"],
    queryFn:  () => fetch("/api/hr/reports?type=demographic&format=json").then((r) => r.json()),
    enabled:  tab === "demographic",
  });

  async function handleDownload() {
    setDownloading(true);
    try {
      const url = buildUrl(format);
      const res = await fetch(url);
      if (!res.ok) { toast.error("Failed to generate report"); return; }

      const blob     = await res.blob();
      const ext      = format === "csv" ? "csv" : "xlsx";
      const filename = `${tab}-report-${new Date().toISOString().split("T")[0]}.${ext}`;
      const a        = document.createElement("a");
      a.href         = URL.createObjectURL(blob);
      a.download     = filename;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success(`${filename} downloaded`);
    } catch {
      toast.error("Download failed");
    } finally {
      setDownloading(false);
    }
  }

  const summary = summaryData?.data;
  const demo    = demoData?.data;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Generate summary and demographic reports</p>
        </div>

        {/* Download controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="h-9 rounded-lg border border-border bg-card text-sm px-3 text-foreground"
          >
            {FORMAT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold disabled:opacity-60 transition-colors"
          >
            {downloading
              ? <><Loader2 className="h-4 w-4 animate-spin" />Generating…</>
              : <><Download className="h-4 w-4" />Download</>
            }
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl border border-border bg-muted/40 p-1 gap-1 w-fit">
        {(["summary", "demographic"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all",
              tab === t
                ? "bg-violet-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t === "summary" ? "Summary Report" : "Demographic Report"}
          </button>
        ))}
      </div>

      {/* Date filter (summary only) */}
      {tab === "summary" && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground font-medium">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-9 rounded-lg border border-border bg-card text-sm px-3 text-foreground"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground font-medium">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-9 rounded-lg border border-border bg-card text-sm px-3 text-foreground"
            />
          </div>
          {(from || to) && (
            <button
              onClick={() => { setFrom(""); setTo(""); }}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* ── SUMMARY ── */}
      {tab === "summary" && (
        <div className="space-y-6">
          {/* Totals */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {summaryLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-card border border-border p-5 animate-pulse">
                  <div className="h-8 w-12 rounded bg-muted mb-2" />
                  <div className="h-3 w-20 rounded bg-muted" />
                </div>
              ))
            ) : summary ? (
              [
                { label: "Total Visits",     value: summary.totals.totalVisits,     icon: CalendarDays, color: "text-violet-500" },
                { label: "Completed",        value: summary.totals.completedVisits, icon: TrendingUp,   color: "text-success" },
                { label: "Total Employees",  value: summary.totals.totalPatients,   icon: Users,        color: "text-info" },
                { label: "Lab Results",      value: summary.totals.labResults,      icon: FlaskConical, color: "text-warning" },
                { label: "Revenue (₱)",     value: `₱${Number(summary.totals.totalRevenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: BarChart2, color: "text-success" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl bg-card border border-border p-5">
                  <s.icon className={`h-5 w-5 mb-3 ${s.color}`} />
                  <p className="text-xl font-bold text-foreground tabular-nums">{typeof s.value === "number" ? s.value.toLocaleString() : s.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))
            ) : null}
          </div>

          {/* Visits by type */}
          {summary && summary.visitsByType.length > 0 && (
            <div className="rounded-2xl bg-card border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground">Visits by Patient Type</h2>
              </div>
              <div className="divide-y divide-border">
                {summary.visitsByType
                  .sort((a, b) => b.count - a.count)
                  .map((t) => {
                    const pct = summary.totals.totalVisits
                      ? Math.round((t.count / summary.totals.totalVisits) * 100)
                      : 0;
                    return (
                      <div key={t.type} className="flex items-center gap-4 px-5 py-3">
                        <span className="text-sm text-foreground min-w-32 truncate">{t.type || "Unknown"}</span>
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-violet-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-foreground tabular-nums w-12 text-right">{t.count.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground w-10 text-right">{pct}%</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── DEMOGRAPHIC ── */}
      {tab === "demographic" && (
        <div className="space-y-6">

          {/* Gender distribution */}
          <div className="rounded-2xl bg-card border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Gender Distribution</h2>
            </div>
            {demoLoading ? (
              <div className="px-5 py-8 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : demo ? (
              <div className="grid grid-cols-3 divide-x divide-border">
                {[
                  { label: "Male",   count: demo.gender.male,   color: "text-info",    bg: "bg-info" },
                  { label: "Female", count: demo.gender.female, color: "text-pink-500", bg: "bg-pink-500" },
                  { label: "Other",  count: demo.gender.other,  color: "text-muted-foreground", bg: "bg-muted-foreground" },
                ].map((g) => {
                  const pct = demo.gender.total ? Math.round((g.count / demo.gender.total) * 100) : 0;
                  return (
                    <div key={g.label} className="px-5 py-6 text-center">
                      <p className={`text-3xl font-bold ${g.color}`}>{g.count.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground mt-1">{g.label}</p>
                      <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full ${g.bg}`} style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{pct}%</p>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>

          {/* Top 10 diseases */}
          <div className="rounded-2xl bg-card border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Top 10 Chief Complaints / Diagnoses</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Based on patient visit chief complaints</p>
            </div>
            {demoLoading ? (
              <div className="divide-y divide-border">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-3.5 animate-pulse">
                    <div className="h-6 w-6 rounded-full bg-muted" />
                    <div className="flex-1 h-3 rounded bg-muted" />
                    <div className="h-3 w-10 rounded bg-muted" />
                  </div>
                ))}
              </div>
            ) : demo ? (
              <div className="divide-y divide-border">
                {demo.top10Diseases.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-muted-foreground">No data available</div>
                ) : (
                  demo.top10Diseases.map((d) => {
                    const maxCount = demo.top10Diseases[0]?.count ?? 1;
                    const pct = Math.round((d.count / maxCount) * 100);
                    return (
                      <div key={d.rank} className="flex items-center gap-4 px-5 py-3.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/10 border border-violet-400/20 text-xs font-bold text-violet-600 dark:text-violet-400">
                          {d.rank}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{d.diagnosis}</p>
                          <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-violet-500" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <span className="text-sm font-bold text-foreground tabular-nums shrink-0">{d.count.toLocaleString()}</span>
                      </div>
                    );
                  })
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
