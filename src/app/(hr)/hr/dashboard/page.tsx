"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Users, CalendarDays, ClipboardList, FlaskConical,
  ArrowRight, TrendingUp, Clock, CheckCircle2,
  UserCheck, Activity, Stethoscope,
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

function StatCard({
  label, value, icon: Icon, accent, sub, live, suffix,
}: {
  label: string; value: number | string;
  icon: React.ElementType; accent: string; sub?: string; live?: boolean; suffix?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-5 group hover:shadow-(--shadow-md) transition-shadow">
      <div className={`absolute top-0 left-0 right-0 h-0.75 ${accent}`} />
      <div className="flex items-start justify-between mb-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent.replace("bg-", "bg-").replace(/bg-(\S+)/, "bg-$1/10")} border border-current/10`}>
          <Icon className="h-5 w-5" />
        </div>
        {live && <span className="live-dot-green" style={{ width: 6, height: 6, marginTop: 2 }} />}
        {!live && <TrendingUp className="h-4 w-4 text-muted-foreground/30 group-hover:text-success transition-colors" />}
      </div>
      <p className="text-2xl font-bold text-foreground tabular-nums">
        {typeof value === "number" ? value.toLocaleString() : value}
        {suffix && <span className="text-sm font-normal text-muted-foreground ml-1">{suffix}</span>}
      </p>
      <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
      {sub && <p className="text-xs text-muted-foreground/50 mt-1">{sub}</p>}
    </div>
  );
}

function ServiceCard({ label, value, icon: Icon, color }: {
  label: string; value: number | string; icon: React.ElementType; color: string;
}) {
  return (
    <div className={`rounded-xl border p-4 flex items-center gap-3 ${color}`}>
      <Icon className="h-5 w-5 shrink-0 opacity-70" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="text-lg font-bold text-foreground tabular-nums">{typeof value === "number" ? value.toLocaleString() : value}</p>
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
      <div
        className="relative overflow-hidden rounded-2xl p-6 border border-border"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: "radial-gradient(rgba(167,139,250,0.15) 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="live-dot-green" style={{ width: 6, height: 6 }} />
              <span className="text-xs font-semibold text-white/60 tracking-widest uppercase">HR Dashboard — Live</span>
            </div>
            <h1 className="text-2xl font-bold text-white">
              {getGreeting()}, {firstName}.
            </h1>
            <p className="text-sm text-white/55 mt-1">
              Hospital-wide overview · updates every 10 seconds
            </p>
          </div>
          {lastUpdated && (
            <div className="flex items-center gap-1.5 text-xs text-white/40 shrink-0">
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
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
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
              top5.map((c, i) => (
                <div key={c.name} className="flex items-center gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/10 border border-violet-400/20 text-[10px] font-bold text-violet-600">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{c.name}</p>
                    <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-violet-500/70"
                        style={{ width: `${Math.round((c.count / maxConditionCount) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground tabular-nums shrink-0">{c.count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* PE Compliance by Department */}
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">PE Compliance by Department</h2>
            </div>
            <Link href="/hr/compliance" className="text-xs text-violet-500 hover:text-violet-600 flex items-center gap-1">
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

      {/* ── Recent visits + Top patients ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Recent visits */}
        <div className="lg:col-span-2 rounded-2xl bg-card border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Recent Visits</h2>
            </div>
            <Link href="/hr/visits" className="flex items-center gap-1 text-xs text-violet-500 hover:text-violet-600 transition-colors">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3.5 animate-pulse">
                  <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-32 rounded bg-muted" />
                    <div className="h-2.5 w-24 rounded bg-muted" />
                  </div>
                  <div className="h-5 w-14 rounded-full bg-muted" />
                </div>
              ))
            ) : recentVisits.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">No visits found</div>
            ) : (
              recentVisits.map((v) => {
                const statusInfo = resolveStatus(v.status);
                return (
                  <div key={String(v.id)} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/40 transition-colors">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/10 border border-violet-400/15">
                      <UserCheck className="h-3.5 w-3.5 text-violet-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{v.qFullName ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        {v.code} · {v.patientType ?? "General"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground/50">
                        {new Date(v.dateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Top patients */}
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Top Patients</h2>
            </div>
            <Link href="/hr/employees" className="flex items-center gap-1 text-xs text-violet-500 hover:text-violet-600 transition-colors">
              All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3.5 animate-pulse">
                  <div className="h-7 w-7 rounded-full bg-muted shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-28 rounded bg-muted" />
                    <div className="h-2.5 w-16 rounded bg-muted" />
                  </div>
                  <div className="h-4 w-8 rounded bg-muted" />
                </div>
              ))
            ) : topPatients.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">No data</div>
            ) : (
              topPatients.map((tp, idx) => (
                <Link
                  key={String(tp.idPatient)}
                  href={`/hr/employees/${encodeURIComponent(tp.patient?.code ?? tp.idPatient)}`}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/40 transition-colors group"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/10 border border-violet-400/20 text-xs font-bold text-violet-600">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-violet-500 transition-colors">
                      {tp.patient?.fullName ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">{tp.patient?.code}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="h-3 w-3 text-success" />
                    <span className="text-xs font-semibold text-foreground">{tp.visitCount}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: "/hr/employees",  label: "Browse Employees", icon: Users,        color: "border-violet-400/20 bg-violet-500/5 hover:bg-violet-500/10" },
          { href: "/hr/visits",     label: "View All Visits",  icon: ClipboardList, color: "border-success/20 bg-success-bg hover:bg-success/10" },
          { href: "/hr/results",    label: "Lab Results",      icon: FlaskConical,  color: "border-purple/20 bg-purple-bg hover:bg-purple/10" },
          { href: "/hr/compliance", label: "PE Compliance",    icon: CheckCircle2,  color: "border-warning/20 bg-warning-bg hover:bg-warning/10" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-xl border p-4 transition-colors ${item.color}`}
          >
            <item.icon className="h-4 w-4 text-foreground/70 shrink-0" />
            <span className="text-sm font-medium text-foreground">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
