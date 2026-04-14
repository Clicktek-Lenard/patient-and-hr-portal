"use client";

import { useQuery } from "@tanstack/react-query";
import { Heart, TrendingUp, Users, Loader2, Activity } from "lucide-react";

type WellnessData = {
  months: string[];
  peCompliance: number[];
  hypertension: number[];
  preHypertension: number[];
  totalPatients: number;
};

function LineChart({
  title,
  labels,
  series,
  target,
  colors,
}: {
  title: string;
  labels: string[];
  series: { name: string; data: number[]; color: string }[];
  target?: number;
  colors: string[];
}) {
  if (!labels.length || !series[0]?.data.length) return null;

  const allValues = series.flatMap((s) => s.data);
  const maxVal = Math.max(...allValues, target ?? 0, 10);
  const minVal = 0;
  const range = maxVal - minVal || 1;

  const W = 500;
  const H = 120;
  const PAD_L = 30;
  const PAD_R = 10;
  const PAD_T = 10;
  const PAD_B = 20;

  const xPos = (i: number) => PAD_L + (i / Math.max(labels.length - 1, 1)) * (W - PAD_L - PAD_R);
  const yPos = (v: number) => PAD_T + (1 - (v - minVal) / range) * (H - PAD_T - PAD_B);

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="p-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-32 overflow-visible">
          {/* Grid */}
          {[0, 25, 50, 75, 100].map((v) => v <= maxVal && (
            <g key={v}>
              <line x1={PAD_L} y1={yPos(v)} x2={W - PAD_R} y2={yPos(v)} stroke="currentColor" strokeWidth="0.5" className="text-border" />
              <text x={PAD_L - 4} y={yPos(v) + 4} fontSize="8" textAnchor="end" fill="currentColor" className="text-muted-foreground">{v}</text>
            </g>
          ))}

          {/* Target line */}
          {target !== undefined && (
            <line
              x1={PAD_L} y1={yPos(target)} x2={W - PAD_R} y2={yPos(target)}
              stroke="#22c55e" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.7"
            />
          )}

          {/* Series */}
          {series.map((s, si) => (
            <g key={si}>
              <path
                d={s.data.map((v, i) => `${i === 0 ? "M" : "L"}${xPos(i).toFixed(1)},${yPos(v).toFixed(1)}`).join(" ")}
                fill="none"
                stroke={s.color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {s.data.map((v, i) => (
                <circle key={i} cx={xPos(i)} cy={yPos(v)} r="2.5" fill={s.color} stroke="white" strokeWidth="1.5" />
              ))}
            </g>
          ))}

          {/* X labels (every 2nd) */}
          {labels.map((l, i) => i % 2 === 0 && (
            <text key={i} x={xPos(i)} y={H - 4} fontSize="8" textAnchor="middle" fill="currentColor" className="text-muted-foreground">{l}</text>
          ))}
        </svg>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-3">
          {series.map((s) => (
            <div key={s.name} className="flex items-center gap-1.5">
              <div className="h-2 w-4 rounded-full" style={{ background: s.color }} />
              <span className="text-xs text-muted-foreground">{s.name}</span>
            </div>
          ))}
          {target !== undefined && (
            <div className="flex items-center gap-1.5">
              <div className="h-0.5 w-4 border-t-2 border-dashed border-green-500" />
              <span className="text-xs text-muted-foreground">Target ({target}%)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WellnessPage() {
  const { data, isLoading } = useQuery<{ data: WellnessData }>({
    queryKey: ["hr-wellness"],
    queryFn: () => fetch("/api/hr/wellness").then((r) => r.json()),
    staleTime: 5 * 60_000,
  });

  const d = data?.data;

  const latestPE       = d?.peCompliance[d.peCompliance.length - 1] ?? 0;
  const latestHyper    = d?.hypertension[d.hypertension.length - 1] ?? 0;
  const latestPreHyper = d?.preHypertension[d.preHypertension.length - 1] ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Wellness Trends</h1>
        <p className="text-sm text-muted-foreground mt-0.5">12-month workforce health analytics</p>
      </div>

      {/* KPI cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-card border border-border p-5 animate-pulse">
              <div className="h-7 w-14 rounded bg-muted mb-2" />
              <div className="h-3 w-24 rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : d && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-card border border-border p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-violet-500" />
              <span className="text-xs text-muted-foreground">PE Compliance</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{latestPE}%</p>
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-violet-500" style={{ width: `${latestPE}%` }} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Target: 95%</p>
          </div>
          <div className="rounded-2xl bg-card border border-border p-5">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="h-4 w-4 text-red-500" />
              <span className="text-xs text-muted-foreground">Hypertension Rate</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{latestHyper}%</p>
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-red-500" style={{ width: `${latestHyper}%` }} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">BP ≥140/90 mmHg</p>
          </div>
          <div className="rounded-2xl bg-card border border-border p-5">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Active Patients</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{(d.totalPatients ?? 0).toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Registered in system</p>
          </div>
        </div>
      )}

      {/* Charts */}
      {isLoading ? (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-2xl bg-card border border-border p-5 animate-pulse">
              <div className="h-4 w-48 rounded bg-muted mb-4" />
              <div className="h-32 w-full rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : d && (
        <div className="space-y-4">
          <LineChart
            title="Annual PE Compliance Rate (%)"
            labels={d.months}
            series={[{ name: "PE Compliance", data: d.peCompliance, color: "#1006A0" }]}
            target={95}
            colors={["#1006A0"]}
          />
          <LineChart
            title="Blood Pressure Trends (%)"
            labels={d.months}
            series={[
              { name: "Hypertension (≥140/90)",    data: d.hypertension,    color: "#ef4444" },
              { name: "Pre-Hypertension (120–139)", data: d.preHypertension, color: "#f97316" },
            ]}
            colors={["#ef4444", "#f97316"]}
          />
        </div>
      )}

      {/* Clinical insight */}
      {!isLoading && d && (
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/30 px-4 py-4">
          <Activity className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">Clinical Insights</p>
            <p>
              Current PE compliance is <strong>{latestPE}%</strong>
              {latestPE >= 95 ? " — above the 95% target. Excellent!" : " — below the 95% target. Consider scheduling reminders."}
            </p>
            {latestHyper > 20 && (
              <p>
                Hypertension rate of <strong>{latestHyper}%</strong> is elevated. Consider a workforce wellness program focused on cardiovascular health.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
