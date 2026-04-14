"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Calendar, FlaskConical, CreditCard, Bell,
  ArrowRight, Radio, Activity, ChevronRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/portal/stat-card";
import { VisitCard } from "@/components/portal/visit-card";
import { ResultCard } from "@/components/portal/result-card";
import { QueueTracker } from "@/components/portal/queue-tracker";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { DashboardData } from "@/types";

type DashboardRaw = DashboardData & {
  totalVisits: number;
  totalResults: number;
};

async function fetchDashboard(): Promise<DashboardRaw> {
  const [visitsRes, resultsRes, paymentsRes, notifRes] = await Promise.all([
    fetch("/api/visits?page=1&pageSize=3"),
    fetch("/api/results?page=1&pageSize=3"),
    fetch("/api/payments?page=1&pageSize=50"),
    fetch("/api/notifications"),
  ]);
  const [visitsJson, resultsJson, paymentsJson, notifJson] = await Promise.all([
    visitsRes.json(), resultsRes.json(), paymentsRes.json(), notifRes.json(),
  ]);
  const visits = visitsJson.data?.data ?? [];
  const activeVisit = visits.find(
    (v: { status: string }) => v.status !== "complete" && v.status !== "exit"
  );
  const allPayments = paymentsJson.data?.data ?? [];
  const pendingPayments = allPayments.filter(
    (p: { status: string }) => p.status === "pending"
  );
  const unreadNotifications = (notifJson.data ?? []).filter(
    (n: { isRead: boolean }) => !n.isRead
  ).length;
  return {
    activeVisit,
    recentResults:        resultsJson.data?.data ?? [],
    pendingPayments,
    recentVisits:         visits.slice(0, 3),
    unreadNotifications,
    totalVisits:          visitsJson.data?.total  ?? 0,
    totalResults:         resultsJson.data?.total ?? 0,
  };
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
    staleTime: 30_000,
  });

  const firstName = session?.user?.firstName ?? "Patient";
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="space-y-6">

      {/* ── Hero welcome banner ── */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-(--shadow-sm) page-header-pattern">
        <div className="px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary tracking-widest uppercase">{getGreeting()}</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground leading-tight">
              {firstName} <span className="text-muted-foreground font-normal text-lg">— welcome back</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-1 tracking-wide">{dateStr}</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3.5 py-1.5 shrink-0">
            <span className="live-dot" />
            <span className="text-xs font-semibold text-primary tracking-widest uppercase">Live</span>
          </div>
        </div>
      </div>

      {/* ── Active visit banner ── */}
      {isLoading ? (
        <Skeleton className="h-20 w-full rounded-2xl" />
      ) : data?.activeVisit ? (
        <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-primary/5 p-4 animate-glow-pulse">
          <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: "var(--gradient-primary)" }} />
          <div className="flex items-center justify-between gap-4 pl-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 border border-primary/25">
                <Radio className="h-5 w-5 text-primary animate-live-blink" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-foreground text-sm">Active Visit in Progress</p>
                  <Badge variant="active" dot className="text-[10px] px-2 py-0.5">LIVE</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Queue <span className="font-data text-primary font-semibold">#{data.activeVisit.code}</span>
                  <span className="mx-1.5 opacity-40">·</span>
                  {data.activeVisit.friendlyStatus}
                </p>
              </div>
            </div>
            <Button size="sm" asChild className="shrink-0 rounded-xl" style={{ background: "var(--gradient-primary)" }}>
              <Link href={`/visits/${data.activeVisit.code}`}>
                Track <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      ) : null}

      {/* ── Stats grid ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Visits"
          value={isLoading ? "—" : data?.totalVisits ?? 0}
          description="All time"
          icon={Calendar}
          accent="cyan"
          isLoading={isLoading}
        />
        <StatCard
          title="Lab Results"
          value={isLoading ? "—" : data?.totalResults ?? 0}
          description="Available"
          icon={FlaskConical}
          accent="purple"
          isLoading={isLoading}
        />
        <StatCard
          title="Pending Payments"
          value={isLoading ? "—" : data?.pendingPayments.length ?? 0}
          description="Awaiting settlement"
          icon={CreditCard}
          accent="amber"
          isLoading={isLoading}
        />
        <StatCard
          title="Notifications"
          value={isLoading ? "—" : data?.unreadNotifications ?? 0}
          description="Unread"
          icon={Bell}
          accent="green"
          isLoading={isLoading}
        />
      </div>

      {/* ── Main two-col grid ── */}
      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard
          title="Recent Visits"
          icon={<Calendar className="h-4 w-4 text-primary" />}
          href="/visits"
        >
          {isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
            </div>
          ) : data?.recentVisits.length ? (
            <div className="space-y-2.5">
              {data.recentVisits.map(v => <VisitCard key={v.id} visit={v} />)}
            </div>
          ) : (
            <EmptyState label="No visits found" />
          )}
        </SectionCard>

        <SectionCard
          title="Recent Results"
          icon={<FlaskConical className="h-4 w-4 text-(--color-purple)" />}
          href="/results"
        >
          {isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
            </div>
          ) : data?.recentResults.length ? (
            <div className="space-y-2.5">
              {data.recentResults.map(r => <ResultCard key={r.id} result={r} />)}
            </div>
          ) : (
            <EmptyState label="No results available" />
          )}
        </SectionCard>
      </div>

      {/* ── Pending payments ── */}
      {!isLoading && data?.pendingPayments && data.pendingPayments.length > 0 && (
        <SectionCard
          title="Pending Payments"
          icon={<CreditCard className="h-4 w-4 text-(--color-warning)" />}
          href="/payments"
          accent="warning"
        >
          <div className="space-y-2.5">
            {data.pendingPayments.map(payment => (
              <Link
                key={payment.id}
                href={`/payments/${payment.queueCode}`}
                className="group flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3 hover:border-(--color-warning-border) hover:bg-(--color-warning-bg) transition-all duration-150"
              >
                <div>
                  <p className="font-semibold text-sm text-foreground">Receipt #{payment.receiptNo}</p>
                  <p className="text-xs text-muted-foreground font-data mt-0.5">
                    Visit #{payment.queueCode} · {formatDate(payment.date)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-bold text-sm text-(--color-warning) tabular-nums">{formatCurrency(payment.totalAmount)}</p>
                    <Badge variant="warning" dot={false} className="text-[10px] px-2 py-0.5 mt-0.5">Pending</Badge>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-(--color-warning) group-hover:translate-x-0.5 transition-all duration-150 shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ── Queue tracker ── */}
      {!isLoading && data?.activeVisit && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-sm text-foreground uppercase tracking-widest">Queue Tracker</h2>
          </div>
          <QueueTracker queueCode={data.activeVisit.code} />
        </div>
      )}
    </div>
  );
}

/* ── Local sub-components ── */

function SectionCard({
  title, icon, href, children, accent,
}: {
  title: string;
  icon: React.ReactNode;
  href: string;
  children: React.ReactNode;
  accent?: "warning";
}) {
  return (
    <div className={`rounded-2xl border bg-card shadow-(--shadow-xs) overflow-hidden transition-all duration-200 ${
      accent === "warning"
        ? "border-(--color-warning-border) hover:border-(--color-warning)/40"
        : "border-border hover:border-primary/20"
    }`}>
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-(--surface-1)">
        <div className="flex items-center gap-2.5">
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${
            accent === "warning" ? "bg-(--color-warning-bg)" : "bg-primary/8"
          }`}>
            {icon}
          </div>
          <h2 className="font-semibold text-sm text-foreground">{title}</h2>
        </div>
        <Button variant="ghost" size="sm" asChild className="text-xs h-7 px-2.5 text-muted-foreground hover:text-primary rounded-lg gap-1">
          <Link href={href}>
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-2.5">
      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
        <span className="text-lg opacity-25">—</span>
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
