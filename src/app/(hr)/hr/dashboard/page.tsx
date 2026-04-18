"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Users, CalendarDays, ClipboardList, FlaskConical,
  ArrowRight, TrendingUp, CheckCircle2,
  Activity, Stethoscope,
  Loader2, AlertTriangle, HeartPulse, Star,
} from "lucide-react";

type Top5Condition = { name: string; count: number };
type PeByDept = { dept: string; total: number; compliant: number; rate: number };

type DashboardData = {
  stats: {
    totalPatients:       number;
    todayVisits:         number;
    totalVisits:         number;
    ongoingVisits:       number;
    completedVisits:     number;
    employeesWithResults: number;
    overdueAnnualPe:     number;
    peComplianceRate:    number;
    wellnessScore:       number;
  };
  top5Conditions: Top5Condition[];
  peByDept: PeByDept[];
  recentVisits: Array<{
    id: number;
    code: string | null;
    qFullName: string | null;
    qGender: string | null;
    agePatient: number | null;
    status: number;
    statusLabel: string;
    patientType: string | null;
    date: string;
    dateTime: string;
    patientCode: string | null;
  }>;
  topPatients: Array<{
    idPatient: number;
    visitCount: number;
    patient: {
      id: string;
      fullName: string | null;
      code: string | null;
      gender: string | null;
      lastVisit: string | null;
    } | null;
  }>;
};

function resolveStatus(code: number): { label: string; color: string } {
  if (code <= 100) return { label: "Waiting",     color: "text-warning bg-warning-bg border-warning-border" };
  if (code < 300)  return { label: "In Progress", color: "text-info bg-info-bg border-info-border" };
  if (code < 500)  return { label: "Done",        color: "text-success bg-success-bg border-success-border" };
  if (code === 900) return { label: "Exited",     color: "text-muted-foreground bg-muted border-border" };
  return               { label: "Complete",    color: "text-success bg-success-bg border-success-border" };
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/* Smooth count-up animation for numeric values */
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
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setN(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else prevRef.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <>{n.toLocaleString()}</>;
}

function StatCard({
  label, value, icon: Icon, accent, sub, live, suffix,
}: {
  label: string; value: number | string;
  icon: React.ElementType; accent: string; sub?: string; live?: boolean; suffix?: string;
}) {
  return (
    <div style={{
      background: "var(--ui-card)", border: "1px solid var(--ui-border)", borderRadius: 12,
      padding: "18px 20px", position: "relative", overflow: "hidden",
      boxShadow: "0 1px 3px var(--ui-shadow)", transition: "all 0.2s ease",
    }}
    className="group hover:shadow-md"
    >
      <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl ${accent}`} />
      <div className="flex items-start justify-between mb-3 mt-1">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${accent.replace(/bg-(\S+)/, "bg-$1/10")}`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        {live && <span className="live-dot-green" style={{ width: 6, height: 6, marginTop: 2 }} />}
        {!live && <TrendingUp className="h-4 w-4 text-gray-300 group-hover:text-green-500 transition-colors" />}
      </div>
      <p style={{ fontSize: "1.8rem", fontWeight: 700, color: "var(--ui-text-primary)", lineHeight: 1, letterSpacing: "-0.02em" }} className="tabular-nums">
        {typeof value === "number" ? <CountUp to={value} /> : value}
        {suffix && <span style={{ fontSize: "0.85rem", fontWeight: 400, color: "var(--ui-text-faint)", marginLeft: 4 }}>{suffix}</span>}
      </p>
      <p style={{ fontSize: "0.8rem", color: "var(--ui-text-secondary)", marginTop: 3, fontWeight: 500 }}>{label}</p>
      {sub && <p style={{ fontSize: "0.72rem", color: "var(--ui-text-faint)", marginTop: 2 }}>{sub}</p>}
    </div>
  );
}

function ServiceCard({ label, value, icon: Icon, color }: {
  label: string; value: number | string; icon: React.ElementType; color: string;
}) {
  return (
    <div style={{ background: "var(--ui-card)", border: "1px solid var(--ui-border)", borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 1px 3px var(--ui-shadow)" }} className={color}>
      <Icon className="h-4 w-4 shrink-0 opacity-60" />
      <div className="min-w-0 flex-1">
        <p style={{ fontSize: "0.72rem", color: "var(--ui-text-muted)", marginBottom: 1 }} className="truncate">{label}</p>
        <p style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--ui-text-primary)" }} className="tabular-nums">{typeof value === "number" ? <CountUp to={value} /> : value}</p>
      </div>
      <span className="live-dot-green shrink-0" style={{ width: 6, height: 6 }} />
    </div>
  );
}

// Horizontal bar for compliance by dept
function ComplianceBar({ rate }: { rate: number }) {
  const color = rate >= 80 ? "bg-success" : rate >= 50 ? "bg-warning" : "bg-destructive";
  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${rate}%` }} />
      </div>
      <span className="text-xs font-semibold tabular-nums w-8 text-right text-foreground">{rate}%</span>
    </div>
  );
}

export default function HrDashboardPage() {
  const { data: session } = useSession();
  const firstName = session?.user?.firstName ?? "Staff";

  const { data, isLoading, dataUpdatedAt } = useQuery<DashboardData>({
    queryKey: ["hr-dashboard"],
    queryFn: () => fetch("/api/hr/dashboard").then((r) => r.json()),
    refetchInterval: 10_000,
  });

  const stats        = data?.stats;
  const recentVisits = data?.recentVisits  ?? [];
  const topPatients  = data?.topPatients   ?? [];
  const top5         = data?.top5Conditions ?? [];
  const peByDept     = data?.peByDept       ?? [];

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString()
    : null;

  const maxConditionCount = top5.length > 0 ? top5[0].count : 1;

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div style={{
        borderRadius: 14, background: "linear-gradient(135deg, #08036A 0%, #1006A0 50%, #E00500 140%)",
        padding: "20px 24px", position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0, opacity: 0.06,
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <span className="live-dot-green" style={{ width: 6, height: 6 }} />
              <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                HR Dashboard — Live
              </span>
            </div>
            <h1 style={{ fontSize: "1.45rem", fontWeight: 700, color: "#ffffff", lineHeight: 1.2 }}>
              {getGreeting()}, {firstName}.
            </h1>
            <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginTop: 6 }}>
              Hospital-wide overview · updates every 10 seconds
            </p>
          </div>
          {lastUpdated && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>
              {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
              <span>Updated {lastUpdated}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Main KPI stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Employees with Results"
          value={isLoading ? "—" : (stats?.employeesWithResults ?? 0)}
          icon={FlaskConical}
          accent="bg-violet-500"
          sub="Have released results"
        />
        <StatCard
          label="Overdue Annual PE"
          value={isLoading ? "—" : (stats?.overdueAnnualPe ?? 0)}
          icon={AlertTriangle}
          accent="bg-destructive"
          sub="Past 1-year mark"
        />
        <StatCard
          label="PE Compliance Rate"
          value={isLoading ? "—" : (stats?.peComplianceRate ?? 0)}
          suffix="%"
          icon={CheckCircle2}
          accent="bg-success"
          sub="Within 12 months"
        />
        <StatCard
          label="Wellness Score"
          value={isLoading ? "—" : (stats?.wellnessScore ?? 0)}
          suffix="/ 100"
          icon={HeartPulse}
          accent="bg-info"
          sub="Overall health index"
        />
      </div>

      {/* ── Live today ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="live-dot-green" style={{ width: 6, height: 6 }} />
          <h2 className="text-sm font-semibold text-foreground">Today&apos;s Live Activity</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ServiceCard label="Total Employees"  value={isLoading ? "—" : (stats?.totalPatients   ?? 0)} icon={Users}        color="border-violet-400/20 bg-violet-500/5" />
          <ServiceCard label="Today's Visits"   value={isLoading ? "—" : (stats?.todayVisits      ?? 0)} icon={CalendarDays} color="border-success/20 bg-success-bg" />
          <ServiceCard label="Ongoing"          value={isLoading ? "—" : (stats?.ongoingVisits    ?? 0)} icon={Activity}     color="border-warning/20 bg-warning-bg" />
          <ServiceCard label="Completed APE"    value={isLoading ? "—" : (stats?.completedVisits  ?? 0)} icon={Stethoscope}  color="border-info/20 bg-info-bg" />
        </div>
      </div>

      {/* ── Top 5 Conditions + PE Compliance by Dept ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Top 5 Workforce Conditions */}
        <div style={{ background: "var(--ui-card)", border: "1px solid var(--ui-border)", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px var(--ui-shadow)" }} className="">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Top 5 Workforce Conditions</h2>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="h-6 w-6 rounded-full bg-muted shrink-0" />
                  <div className="flex-1 h-3 rounded bg-muted" />
                  <div className="h-3 w-10 rounded bg-muted" />
                </div>
              ))
            ) : top5.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No data available</p>
            ) : (
              top5.map((c, i) => {
                const pct = Math.round((c.count / maxConditionCount) * 100);
                return (
                  <div key={c.name} className="flex items-center gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/10 border border-violet-400/20 text-[10px] font-bold text-violet-600">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{c.name}</p>
                      <div style={{ marginTop: 4, height: 6, borderRadius: 3, background: "var(--ui-border)", overflow: "hidden", position: "relative" }}>
                        <div
                          className="nwd-bar-grow"
                          style={{
                            height: "100%",
                            borderRadius: 3,
                            background: "linear-gradient(90deg, #7C3AED 0%, #A78BFA 50%, #7C3AED 100%)",
                            backgroundSize: "200% 100%",
                            width: `${pct}%`,
                            animation: `nwd-bar-grow 0.9s cubic-bezier(0.22, 1, 0.36, 1) ${i * 90}ms both, nwd-bar-shimmer 3s linear infinite`,
                            transformOrigin: "left",
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground tabular-nums shrink-0">{c.count}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* PE Compliance by Department */}
        <div style={{ background: "var(--ui-card)", border: "1px solid var(--ui-border)", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px var(--ui-shadow)" }} className="">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">PE Compliance by Department</h2>
            </div>
            <Link href="/hr/compliance" style={{ fontSize: "0.75rem", color: "#4F46E5", display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }} className="hover:opacity-70 transition-opacity">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3 animate-pulse">
                  <div className="h-3 w-24 rounded bg-muted" />
                  <div className="flex-1 h-2 rounded-full bg-muted" />
                  <div className="h-3 w-8 rounded bg-muted" />
                </div>
              ))
            ) : peByDept.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">No department data</div>
            ) : (
              peByDept.map((d) => (
                <div key={d.dept} className="flex items-center gap-3 px-5 py-3">
                  <p className="text-xs font-medium text-foreground w-28 truncate shrink-0">{d.dept}</p>
                  <ComplianceBar rate={d.rate} />
                  <span className="text-[10px] text-muted-foreground shrink-0 w-16 text-right">
                    {d.compliant}/{d.total}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
