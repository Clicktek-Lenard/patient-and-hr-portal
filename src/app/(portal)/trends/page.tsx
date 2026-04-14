"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type DataPoint = { date: string; value: number; flag: string | null; unit: string; normalRange: string };
type Series = { name: string; points: DataPoint[]; unit: string; normalRange: string };

const FLAG_COLORS: Record<string, string> = {
  H: "text-red-500",
  L: "text-blue-500",
  A: "text-orange-500",
  C: "text-purple-500",
};

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

function MiniChart({ series }: { series: Series }) {
  const pts = series.points;
  if (pts.length === 0) return null;

  const values = pts.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 280;
  const H = 80;
  const PAD = 10;

  const xPos = (i: number) =>
    PAD + (i / Math.max(pts.length - 1, 1)) * (W - PAD * 2);
  const yPos = (v: number) =>
    H - PAD - ((v - min) / range) * (H - PAD * 2);

  const { low, high } = parseNormalRange(series.normalRange);

  const pathD = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${xPos(i).toFixed(1)},${yPos(p.value).toFixed(1)}`)
    .join(" ");

  const hasAbnormal = pts.some((p) => p.flag && p.flag !== "N");
  const latestFlag = pts[pts.length - 1]?.flag;

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">{series.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {series.unit && <span className="font-data">{series.unit}</span>}
            {series.normalRange && (
              <span className="ml-2 text-muted-foreground/70">Normal: {series.normalRange}</span>
            )}
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-1.5">
          {hasAbnormal && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-orange-500 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-full px-2 py-0.5">
              <AlertTriangle className="h-2.5 w-2.5" /> Abnormal
            </span>
          )}
          {latestFlag && latestFlag !== "N" && (
            <span className={cn("text-xs font-bold", FLAG_COLORS[latestFlag] ?? "text-foreground")}>
              {latestFlag === "H" ? "↑ High" : latestFlag === "L" ? "↓ Low" : latestFlag}
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        {/* Latest value */}
        <div className="flex items-baseline gap-1.5 mb-3">
          <span className={cn(
            "text-2xl font-bold tabular-nums",
            latestFlag === "H" ? "text-red-500"
            : latestFlag === "L" ? "text-blue-500"
            : "text-foreground"
          )}>
            {pts[pts.length - 1]?.value}
          </span>
          <span className="text-xs text-muted-foreground">{series.unit}</span>
          <span className="text-xs text-muted-foreground ml-auto">{pts[pts.length - 1]?.date}</span>
        </div>

        {/* SVG chart */}
        {pts.length >= 2 && (
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-20 overflow-visible">
            {/* Normal range band */}
            {low !== null && high !== null && (
              <rect
                x={PAD}
                y={yPos(high)}
                width={W - PAD * 2}
                height={Math.abs(yPos(low) - yPos(high))}
                fill="currentColor"
                className="text-green-500/10"
              />
            )}
            {/* Grid lines */}
            {[0.25, 0.5, 0.75].map((t) => (
              <line
                key={t}
                x1={PAD} y1={PAD + t * (H - PAD * 2)}
                x2={W - PAD} y2={PAD + t * (H - PAD * 2)}
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-border"
              />
            ))}
            {/* Line */}
            <path
              d={pathD}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Data points */}
            {pts.map((p, i) => (
              <circle
                key={i}
                cx={xPos(i)}
                cy={yPos(p.value)}
                r="3"
                fill={
                  p.flag === "H" ? "#ef4444"
                  : p.flag === "L" ? "#3b82f6"
                  : "hsl(var(--primary))"
                }
                stroke="white"
                strokeWidth="1.5"
              />
            ))}
          </svg>
        )}

        {/* Date range */}
        {pts.length >= 2 && (
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-muted-foreground">{pts[0]?.date}</span>
            <span className="text-[10px] text-muted-foreground">{pts[pts.length - 1]?.date}</span>
          </div>
        )}

        {pts.length === 1 && (
          <p className="text-xs text-muted-foreground text-center py-2 flex items-center justify-center gap-1">
            <Info className="h-3 w-3" /> Only one data point — check back after next visit
          </p>
        )}
      </div>
    </div>
  );
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

  const hasAbnormal = series.filter((s) =>
    s.points.some((p) => p.flag && p.flag !== "N")
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <span className="text-xs font-semibold text-primary tracking-widest uppercase">Analytics</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Health Trends</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Your lab result values tracked over time</p>
      </div>

      {/* Summary badges */}
      {!isLoading && series.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">{series.length}</span>
            <span className="text-xs text-muted-foreground">Tests tracked</span>
          </div>
          {hasAbnormal > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-orange-200 dark:border-orange-500/20 bg-orange-50 dark:bg-orange-500/10 px-4 py-2.5">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">{hasAbnormal}</span>
              <span className="text-xs text-orange-500/80">with abnormal values</span>
            </div>
          )}
        </div>
      )}

      {/* Search */}
      {!isLoading && series.length > 0 && (
        <input
          type="text"
          placeholder="Search test name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 w-full max-w-xs rounded-xl border border-border bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      )}

      {/* Charts grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-card border border-border p-4 animate-pulse">
              <div className="h-4 w-40 rounded bg-muted mb-2" />
              <div className="h-3 w-24 rounded bg-muted mb-4" />
              <div className="h-20 w-full rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <TrendingUp className="h-8 w-8 text-muted-foreground/30" />
          </div>
          <p className="text-sm text-muted-foreground">
            {search ? "No tests match your search" : "No lab results with numeric values found"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <MiniChart key={s.name} series={s} />
          ))}
        </div>
      )}
    </div>
  );
}
