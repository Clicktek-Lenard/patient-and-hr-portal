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
    <div style={{
      background: "#ffffff", border: "1px solid #E8EAED", borderRadius: 12,
      padding: "18px 20px", position: "relative", overflow: "hidden",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)", transition: "all 0.2s ease",
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
      <p style={{ fontSize: "1.8rem", fontWeight: 700, color: "#111827", lineHeight: 1, letterSpacing: "-0.02em" }} className="tabular-nums">
        {typeof value === "number" ? value.toLocaleString() : value}
        {suffix && <span style={{ fontSize: "0.85rem", fontWeight: 400, color: "#9CA3AF", marginLeft: 4 }}>{suffix}</span>}
      </p>
      <p style={{ fontSize: "0.8rem", color: "#374151", marginTop: 3, fontWeight: 500 }}>{label}</p>
      {sub && <p style={{ fontSize: "0.72rem", color: "#9CA3AF", marginTop: 2 }}>{sub}</p>}
    </div>
  );
}

function ServiceCard({ label, value, icon: Icon, color }: {
  label: string; value: number | string; icon: React.ElementType; color: string;
}) {
  return (
    <div style={{ background: "#ffffff", border: "1px solid #E8EAED", borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }} className={color}>
      <Icon className="h-4 w-4 shrink-0 opacity-60" />
      <div className="min-w-0 flex-1">
        <p style={{ fontSize: "0.72rem", color: "#6B7280", marginBottom: 1 }} className="truncate">{label}</p>
        <p style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111827" }} className="tabular-nums">{typeof value === "number" ? value.toLocaleString() : value}</p>
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
        <div style={{ background: "#ffffff", border: "1px solid #E8EAED", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }} className="">
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
        <div style={{ background: "#ffffff", border: "1px solid #E8EAED", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }} className="">
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

      {/* ── Recent visits + Top patients ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Recent visits */}
        <div className="lg:col-span-2 rounded-2xl bg-card border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Recent Visits</h2>
            </div>
            <Link href="/hr/visits" style={{ fontSize: "0.75rem", color: "#4F46E5", display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }} className="hover:opacity-70 transition-opacity">
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
                  <div key={String(v.id)} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
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
        <div style={{ background: "#ffffff", border: "1px solid #E8EAED", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }} className="">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Top Patients</h2>
            </div>
            <Link href="/hr/employees" style={{ fontSize: "0.75rem", color: "#4F46E5", display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }} className="hover:opacity-70 transition-opacity">
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
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/10 border border-violet-400/20 text-xs font-bold text-violet-600">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-indigo-600 transition-colors">
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
          { href: "/hr/employees",  label: "Browse Employees", icon: Users,        color: "hover:bg-indigo-50 hover:border-indigo-200" },
          { href: "/hr/visits",     label: "View All Visits",  icon: ClipboardList, color: "hover:bg-green-50 hover:border-green-200" },
          { href: "/hr/results",    label: "Lab Results",      icon: FlaskConical,  color: "hover:bg-purple-50 hover:border-purple-200" },
          { href: "/hr/compliance", label: "PE Compliance",    icon: CheckCircle2,  color: "hover:bg-amber-50 hover:border-amber-200" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{ background: "#ffffff", border: "1px solid #E8EAED", borderRadius: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", textDecoration: "none" }}
            className={`flex items-center gap-3 p-4 transition-all ${item.color}`}
          >
            <item.icon className="h-4 w-4 text-foreground/70 shrink-0" />
            <span className="text-sm font-medium text-foreground">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
