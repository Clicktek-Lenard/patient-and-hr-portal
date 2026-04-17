"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, AlertTriangle, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

type DataPoint = { date: string; value: number; flag: string | null; unit: string; normalRange: string };
type Series = { name: string; points: DataPoint[]; unit: string; normalRange: string; group: string; insight: string | null };

function parseNormalRange(range: string): { low: number | null; high: number | null } {
  if (!range) return { low: null, high: null };
  const m = range.match(/([\d.]+)\s*[-–]\s*([\d.]+)/);
  if (m) return { low: parseFloat(m[1]), high: parseFloat(m[2]) };
  const lt = range.match(/[<≤]\s*([\d.]+)/);
  if (lt) return { low: null, high: parseFloat(lt[1]) };
  const gt = range.match(/[>≥]\s*([\d.]+)/);
  if (gt) return { low: parseFloat(gt[1]), high: null };
  return { low: null, high: null };
}

const MONTH_ABBR = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function getMonthLabel(iso: string) {
  return MONTH_ABBR[new Date(iso).getMonth()];
}

// Deduplicate month labels for X-axis
function buildXLabels(points: DataPoint[]): { idx: number; label: string }[] {
  const seen = new Set<string>();
  const labels: { idx: number; label: string }[] = [];
  points.forEach((p, i) => {
    const label = getMonthLabel(p.date);
    if (!seen.has(label)) {
      seen.add(label);
      labels.push({ idx: i, label });
    }
  });
  return labels;
}

const LINE_COLORS = [
  "hsl(var(--primary))",
  "#ef4444",
  "#22c55e",
  "#f59e0b",
  "#8b5cf6",
];

function TrendChart({ series }: { series: Series }) {
  const pts = series.points;
  if (pts.length === 0) return null;

  const { low, high } = parseNormalRange(series.normalRange);

  // Chart dimensions
  const W = 600;
  const H = 140;
  const PAD_L = 40;
  const PAD_R = 16;
  const PAD_T = 16;
  const PAD_B = 28;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const values = pts.map((p) => p.value);
  const allVals = [...values];
  if (low !== null) allVals.push(low);
  if (high !== null) allVals.push(high);
  const dataMin = Math.min(...allVals);
  const dataMax = Math.max(...allVals);
  const dataRange = dataMax - dataMin || 1;
  const padded = dataRange * 0.15;
  const yMin = dataMin - padded;
  const yMax = dataMax + padded;
  const yRange = yMax - yMin;

  const xPos = (i: number) => PAD_L + (i / Math.max(pts.length - 1, 1)) * chartW;
  const yPos = (v: number) => PAD_T + (1 - (v - yMin) / yRange) * chartH;

  // Y-axis labels (3 evenly spaced)
  const yLabels = [yMax, (yMax + yMin) / 2, yMin].map((v) => ({
    y: yPos(v),
    label: Number(v.toFixed(1)),
  }));

  const hasAbnormal = pts.some((p) => p.flag && p.flag !== "N");
  const latestFlag = pts[pts.length - 1]?.flag;

  // Path
  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${xPos(i).toFixed(1)},${yPos(p.value).toFixed(1)}`).join(" ");

  // Fill area under line
  const fillD = pathD + ` L${xPos(pts.length - 1).toFixed(1)},${(PAD_T + chartH).toFixed(1)} L${PAD_L},${(PAD_T + chartH).toFixed(1)} Z`;

  // X-axis labels
  const xLabels = buildXLabels(pts);

  // Normal range band Y coords
  const bandTop    = high !== null ? yPos(high) : PAD_T;
  const bandBottom = low  !== null ? yPos(low)  : PAD_T + chartH;
  const bandHeight = Math.max(0, bandBottom - bandTop);

  return (
    <div style={{ background: "var(--ui-card)", border: "1px solid var(--ui-border)", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px var(--ui-shadow)" }}>
      {/* Card header */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--ui-border)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h3 style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--ui-active-text)", lineHeight: 1.3 }}>
            {series.name} {series.unit ? <span style={{ color: "var(--ui-text-faint)", fontWeight: 400, fontSize: "0.85rem" }}>({series.unit})</span> : ""}
          </h3>
          <p style={{ fontSize: "0.72rem", color: "var(--ui-text-faint)", marginTop: 2 }}>
            {series.group} results over time
            {series.normalRange ? ` · Normal range: ${series.normalRange} ${series.unit}` : ""}
          </p>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-3 shrink-0" style={{ fontSize: "0.72rem", color: "var(--ui-text-muted)" }}>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-0.5 rounded bg-indigo-600" />
            {series.name}
          </span>
          {series.normalRange && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-2 rounded bg-green-100 border border-green-300" />
              Normal Range
            </span>
          )}
          {hasAbnormal && latestFlag === "H" && (
            <span className="text-red-500 font-semibold">↑ High</span>
          )}
          {hasAbnormal && latestFlag === "L" && (
            <span className="text-blue-500 font-semibold">↓ Low</span>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="px-4 pt-2 pb-3">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 160 }}>
          {/* Y-axis labels */}
          {yLabels.map((yl, i) => (
            <text key={i} x={PAD_L - 6} y={yl.y + 4} textAnchor="end" fontSize={9} fill="#9ca3af">
              {yl.label}
            </text>
          ))}

          {/* Horizontal grid lines */}
          {yLabels.map((yl, i) => (
            <line key={i} x1={PAD_L} y1={yl.y} x2={W - PAD_R} y2={yl.y}
              stroke="#f3f4f6" strokeWidth={1} />
          ))}

          {/* Normal range band */}
          {series.normalRange && (
            <rect
              x={PAD_L} y={bandTop}
              width={chartW} height={bandHeight}
              fill="#bbf7d0" fillOpacity={0.35}
            />
          )}

          {/* Fill under line */}
          <path d={fillD} fill="url(#lineGrad)" fillOpacity={0.15} />

          {/* Gradient def */}
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4338ca" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#4338ca" stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* Line */}
          <path d={pathD} fill="none" stroke="#1e3a8a" strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round" />

          {/* Data points */}
          {pts.map((p, i) => (
            <circle
              key={i}
              cx={xPos(i)} cy={yPos(p.value)} r={3.5}
              fill={p.flag === "H" ? "#ef4444" : p.flag === "L" ? "#ef4444" : "#ffffff"}
              stroke={p.flag === "H" || p.flag === "L" ? "#ef4444" : "#1e3a8a"}
              strokeWidth={2}
            />
          ))}

          {/* X-axis month labels */}
          {xLabels.map(({ idx, label }) => (
            <text key={label} x={xPos(idx)} y={H - 6}
              textAnchor="middle" fontSize={9} fill="#9ca3af">
              {label}
            </text>
          ))}
        </svg>
      </div>

      {/* Insight message */}
      {series.insight && (
        <div className={cn(
          "px-5 py-2.5 border-t text-xs font-medium",
          series.insight.startsWith("⚠")
            ? "border-amber-100 bg-amber-50 text-amber-700"
            : "border-green-100 bg-green-50 text-green-700"
        )}>
          {series.insight}
        </div>
      )}
    </div>
  );
}

// Group series by group name for section headers
function groupBySectionGroup(series: Series[]): { group: string; items: Series[] }[] {
  const map: Record<string, Series[]> = {};
  for (const s of series) {
    if (!map[s.group]) map[s.group] = [];
    map[s.group].push(s);
  }
  return Object.entries(map).map(([group, items]) => ({ group, items }));
}

export default function TrendsPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery<{ data: Series[] }>({
    queryKey: ["trends"],
    queryFn: () => fetch("/api/trends").then((r) => r.json()),
    staleTime: 5 * 60_000,
  });

  const series = data?.data ?? [];
  const filtered = search
    ? series.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    : series;

  const abnormalCount = series.filter((s) =>
    s.points.some((p) => p.flag && p.flag !== "N")
  ).length;

  const sections = groupBySectionGroup(filtered);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div style={{ borderRadius: 14, background: "linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)", padding: "20px 24px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.06, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <TrendingUp style={{ width: 16, height: 16, color: "rgba(255,255,255,0.8)" }} />
            <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Main</span>
          </div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#ffffff", lineHeight: 1.2 }}>Health Trends</h1>
          <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.55)", marginTop: 6 }}>Vital sign readings tracked across your visits — 12 months</p>
        </div>
      </div>

      {/* Summary badges */}
      {!isLoading && series.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5">
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">{series.length}</span>
            <span className="text-xs text-muted-foreground">Vitals tracked</span>
          </div>
          {abnormalCount > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-semibold text-amber-600">{abnormalCount}</span>
              <span className="text-xs text-amber-500/80">with out-of-range readings</span>
            </div>
          )}
        </div>
      )}

      {/* Search */}
      {!isLoading && series.length > 0 && (
        <input
          type="text"
          placeholder="Search vital sign…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 w-full max-w-xs rounded-xl border border-border bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      )}

      {/* Charts — section grouped */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-card border border-border p-5 animate-pulse">
              <div className="h-4 w-48 rounded bg-muted mb-2" />
              <div className="h-3 w-32 rounded bg-muted mb-5" />
              <div className="h-40 w-full rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <TrendingUp className="h-8 w-8 text-muted-foreground/30" />
          </div>
          <p className="text-sm font-medium text-foreground">
            {search ? "No vitals match your search" : "No vital signs recorded yet"}
          </p>
          <p className="text-xs text-muted-foreground max-w-xs text-center">
            {search
              ? "Try a different keyword."
              : "Blood pressure, heart rate, weight, BMI, and temperature will appear here once your vitals are recorded at your next visit."}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {sections.map(({ group, items }) => (
            <div key={group}>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-2">
                  Cumulative Health Trends — {group}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="space-y-4">
                {items.map((s) => (
                  <TrendChart key={s.name} series={s} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
