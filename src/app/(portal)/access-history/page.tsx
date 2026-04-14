"use client";

import { useQuery } from "@tanstack/react-query";
import { History, FileText, Download, Eye, MapPin, Clock, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type AccessLog = {
  id: string; queueCode: string; accessType: string;
  ipAddress: string | null; accessedAt: string; filePath: string | null;
};

const TYPE_META: Record<string, { label: string; icon: typeof Eye; color: string; dot: string }> = {
  LAB_PDF:  { label: "Downloaded PDF",  icon: Download, color: "text-violet-500 bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20", dot: "bg-violet-400" },
  VITALS:   { label: "Viewed Vitals",   icon: Eye,      color: "text-blue-500 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20",           dot: "bg-blue-400" },
  RECEIPT:  { label: "Viewed Receipt",  icon: FileText, color: "text-amber-500 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20",       dot: "bg-amber-400" },
  SUMMARY:  { label: "Viewed Summary",  icon: Eye,      color: "text-green-500 bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20",       dot: "bg-green-400" },
};

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
function formatFull(d: string) {
  return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function groupByDate(logs: AccessLog[]) {
  const groups: Record<string, AccessLog[]> = {};
  for (const log of logs) {
    const key = new Date(log.accessedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    if (!groups[key]) groups[key] = [];
    groups[key].push(log);
  }
  return groups;
}

export default function AccessHistoryPage() {
  const { data, isLoading } = useQuery<{ data: AccessLog[] }>({
    queryKey: ["access-history"],
    queryFn: () => fetch("/api/access-history").then((r) => r.json()),
    staleTime: 60_000,
  });

  const logs = data?.data ?? [];
  const grouped = groupByDate(logs);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
              <History className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xs font-semibold text-primary tracking-widest uppercase">Security</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Access History</h1>
          <p className="text-sm text-muted-foreground mt-0.5">A record of every time your records were accessed</p>
        </div>
        {logs.length > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-2.5 self-start sm:self-auto shrink-0">
            <ShieldAlert className="h-4 w-4 text-muted-foreground/60" />
            <span className="text-xs text-muted-foreground">{logs.length} record{logs.length !== 1 ? "s" : ""} found</span>
          </div>
        )}
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/30 px-4 py-3.5">
        <Clock className="h-4 w-4 text-muted-foreground/60 shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          This log shows the last 100 accesses to your records. If you notice any suspicious activity,
          contact our support team immediately.
        </p>
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="space-y-8">
          {[0, 1].map((g) => (
            <div key={g} className="space-y-3">
              <div className="h-4 w-36 rounded bg-muted animate-pulse" />
              <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                    <div className="h-9 w-9 rounded-xl bg-muted shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-40 rounded bg-muted" />
                      <div className="h-3 w-28 rounded bg-muted" />
                    </div>
                    <div className="h-3 w-24 rounded bg-muted hidden sm:block" />
                    <div className="h-3 w-20 rounded bg-muted hidden md:block" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <History className="h-8 w-8 text-muted-foreground/30" />
          </div>
          <p className="text-sm text-muted-foreground">No access history yet</p>
          <p className="text-xs text-muted-foreground">Your record views and downloads will appear here</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([date, dayLogs]) => (
            <div key={date}>
              {/* Date header */}
              <div className="flex items-center gap-3 mb-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">{date}</p>
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground shrink-0">{dayLogs.length} event{dayLogs.length !== 1 ? "s" : ""}</span>
              </div>

              {/* Rows card */}
              <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
                {dayLogs.map((log) => {
                  const meta = TYPE_META[log.accessType] ?? TYPE_META.SUMMARY;
                  const Icon = meta.icon;
                  return (
                    <div key={log.id} className="flex items-center gap-4 px-4 sm:px-5 py-3.5 hover:bg-muted/30 transition-colors">

                      {/* Icon */}
                      <div className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
                        meta.color
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>

                      {/* Action + visit code */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{meta.label}</p>
                        <p className="text-xs text-muted-foreground font-mono truncate">Visit #{log.queueCode}</p>
                      </div>

                      {/* Time — always visible */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Clock className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {/* Short time on mobile, full datetime on sm+ */}
                          <span className="sm:hidden">{formatTime(log.accessedAt)}</span>
                          <span className="hidden sm:inline">{formatFull(log.accessedAt)}</span>
                        </span>
                      </div>

                      {/* IP — hidden on small mobile */}
                      {log.ipAddress && (
                        <div className="hidden md:flex items-center gap-1.5 shrink-0">
                          <MapPin className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                          <span className="text-xs text-muted-foreground/60 font-mono">{log.ipAddress}</span>
                        </div>
                      )}

                      {/* Type badge — hidden on xs */}
                      <span className={cn(
                        "hidden sm:inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold shrink-0",
                        meta.color
                      )}>
                        {log.accessType}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
