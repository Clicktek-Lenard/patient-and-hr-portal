"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Calendar, FlaskConical, Share2,
  ArrowRight, Download, TrendingUp,
  AlertTriangle, FileText, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/portal/stat-card";
import { formatDate } from "@/lib/utils";
import type { LabResult } from "@/types";

type DashboardRaw = {
  recentResults: LabResult[];
  totalResults: number;
  totalAbnormal: number;
  nextAppointment: string | null;
  sharedRecords: number;
};

async function fetchDashboard(): Promise<DashboardRaw> {
  const [resultsRes, appointmentsRes, shareRes] = await Promise.all([
    fetch("/api/results?page=1&pageSize=5"),
    fetch("/api/appointments?page=1&pageSize=1&upcoming=true"),
    fetch("/api/share-links"),
  ]);
  const [resultsJson, appointmentsJson, shareJson] = await Promise.all([
    resultsRes.json(),
    appointmentsRes.ok ? appointmentsRes.json() : { data: null },
    shareRes.ok ? shareRes.json() : { data: [] },
  ]);

  const results: LabResult[] = resultsJson.data?.data ?? [];
  const totalResults: number = resultsJson.data?.total ?? 0;

  // Count results marked as having abnormal values (hasPdf serves as proxy — real abnormal count not in API yet)
  const totalAbnormal = 0; // placeholder until abnormal flag API is ready

  const nextAppt = appointmentsJson.data?.data?.[0] ?? null;
  const nextAppointment: string | null = nextAppt?.date ?? null;

  const sharedRecords: number = Array.isArray(shareJson.data) ? shareJson.data.length : 0;

  return {
    recentResults: results,
    totalResults,
    totalAbnormal,
    nextAppointment,
    sharedRecords,
  };
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

// ── Result row for the expanded recent results card ──────────────

type ResultParam = {
  name: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  flag?: string;
  group?: string;
};

async function fetchResultDetail(queueCode: string): Promise<{ parameters: ResultParam[] }> {
  const res = await fetch(`/api/results/${queueCode}`);
  if (!res.ok) return { parameters: [] };
  const json = await res.json();
  return { parameters: json.data?.parameters ?? [] };
}

function ResultStatusBadge({ flag }: { flag?: string }) {
  if (!flag || flag === "N" || flag === "") return (
    <span className="text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded px-1.5 py-0.5">Normal</span>
  );
  if (flag === "H" || flag === "L") return (
    <span className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded px-1.5 py-0.5">
      {flag === "H" ? "High" : "Low"}
    </span>
  );
  return (
    <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">{flag}</span>
  );
}

function RecentResultCard({ result }: { result: LabResult }) {
  const { data: detail } = useQuery({
    queryKey: ["result-detail", result.queueCode],
    queryFn: () => fetchResultDetail(result.queueCode),
    staleTime: 60_000,
  });

  const params = detail?.parameters ?? [];
  const abnormalCount = params.filter(p => p.flag && p.flag !== "N" && p.flag !== "").length;
  const hasParams = params.length > 0;

  const [downloading, setDownloading] = React.useState(false);
  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/results/${result.queueCode}/pdf`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `result-${result.queueCode}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch { /* silent */ } finally { setDownloading(false); }
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Card header */}
      <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-border bg-(--surface-1)">
        <div>
          <p className="font-semibold text-sm text-foreground leading-snug">{result.description}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatDate(result.date)}
          </p>
        </div>
        <div className="shrink-0 mt-0.5">
          {abnormalCount > 0 ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-2 py-0.5">
              <AlertTriangle className="h-3 w-3" />
              {abnormalCount} Abnormal
            </span>
          ) : hasParams ? (
            <span className="text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg px-2 py-0.5">All Normal</span>
          ) : (
            <Badge variant="secondary" dot={false} className="text-[10px]">Visit Record</Badge>
          )}
        </div>
      </div>

      {/* Parameters table */}
      {hasParams && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-2 font-semibold text-muted-foreground w-[40%]">Test</th>
                <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Result</th>
                <th className="text-left px-3 py-2 font-semibold text-muted-foreground hidden sm:table-cell">Range</th>
                <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {params.slice(0, 6).map((p, i) => (
                <tr key={i} className={`border-b border-border/50 ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                  <td className="px-4 py-2 font-medium text-foreground truncate max-w-40">{p.name}</td>
                  <td className={`px-3 py-2 font-data font-semibold ${
                    p.flag === "H" ? "text-red-600" : p.flag === "L" ? "text-amber-600" : "text-foreground"
                  }`}>
                    {p.value}{p.unit ? ` ${p.unit}` : ""}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell">{p.referenceRange ?? "—"}</td>
                  <td className="px-3 py-2"><ResultStatusBadge flag={p.flag} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {params.length > 6 && (
            <p className="text-xs text-muted-foreground px-4 py-2 border-t border-border/50">
              +{params.length - 6} more tests — <Link href={`/results/${result.queueCode}`} className="text-primary hover:underline">view all</Link>
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 px-3 py-2.5 border-t border-border bg-(--surface-1)">
        <Button
          variant="ghost" size="sm"
          className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-primary rounded-lg px-2.5"
          onClick={handleDownload}
          disabled={downloading}
        >
          <Download className="h-3.5 w-3.5" />
          {downloading ? "…" : "Download"}
        </Button>
        <Button variant="ghost" size="sm" asChild
          className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-primary rounded-lg px-2.5"
        >
          <Link href={`/share?result=${result.queueCode}`}>
            <Share2 className="h-3.5 w-3.5" />
            Share
          </Link>
        </Button>
        <Button variant="ghost" size="sm" asChild
          className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-primary rounded-lg px-2.5"
        >
          <Link href={`/trends?result=${result.queueCode}`}>
            <TrendingUp className="h-3.5 w-3.5" />
            Trend
          </Link>
        </Button>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" asChild
          className="h-7 gap-1 text-xs text-muted-foreground hover:text-primary rounded-lg px-2.5"
        >
          <Link href={`/results/${result.queueCode}`}>
            View <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </div>
    </div>
  );
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
        </div>
      </div>

      {/* ── Stats grid ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Results on File"
          value={isLoading ? "—" : data?.totalResults ?? 0}
          description="All records"
          icon={FileText}
          accent="cyan"
          isLoading={isLoading}
        />
        <StatCard
          title="Abnormal Values"
          value={isLoading ? "—" : data?.totalAbnormal ?? 0}
          description="Needs attention"
          icon={AlertTriangle}
          accent="amber"
          isLoading={isLoading}
        />
        <StatCard
          title="Next Appointment"
          value={isLoading ? "—" : data?.nextAppointment ? formatDate(data.nextAppointment) : "—"}
          description="Upcoming visit"
          icon={Calendar}
          accent="purple"
          isLoading={isLoading}
        />
        <StatCard
          title="Shared Records"
          value={isLoading ? "—" : data?.sharedRecords ?? 0}
          description="Active shares"
          icon={Share2}
          accent="green"
          isLoading={isLoading}
        />
      </div>

      {/* ── Recent Results ── */}
      <div className="rounded-2xl border border-border bg-card shadow-(--shadow-xs) overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-(--surface-1)">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/8">
              <FlaskConical className="h-4 w-4 text-primary" />
            </div>
            <h2 className="font-semibold text-sm text-foreground">Recent Results</h2>
          </div>
          <Button variant="ghost" size="sm" asChild className="text-xs h-7 px-2.5 text-muted-foreground hover:text-primary rounded-lg gap-1">
            <Link href="/results">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
        <div className="p-4 space-y-3">
          {isLoading ? (
            [0, 1, 2].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
          ) : data?.recentResults.length ? (
            data.recentResults.map(r => <RecentResultCard key={r.id} result={r} />)
          ) : (
            <div className="flex flex-col items-center justify-center py-10 gap-2.5">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <FlaskConical className="h-5 w-5 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground">No results on file yet</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
