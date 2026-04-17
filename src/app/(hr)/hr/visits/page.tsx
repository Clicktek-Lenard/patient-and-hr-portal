"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ClipboardList, ChevronLeft, ChevronRight, X, UserCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

type Visit = {
  id: number;
  code: string | null;
  qFullName: string | null;
  qGender: string | null;
  agePatient: number | null;
  status: number;
  patientType: string | null;
  date: string;
  dateTime: string;
  idPatient: number;
  patientCode: string | null;
};

type PaginatedResponse = {
  data: Visit[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

function resolveStatus(code: number): { label: string; color: string } {
  if ([100, 201].includes(code))                             return { label: "Waiting",     color: "text-warning bg-warning-bg border-warning-border" };
  if ([202, 210, 212, 250, 260, 280, 300].includes(code))   return { label: "In Progress", color: "text-info bg-info-bg border-info-border" };
  if (code === 203)                                          return { label: "On Hold",     color: "text-muted-foreground bg-muted border-border" };
  if (code === 900)                                          return { label: "Exited",      color: "text-muted-foreground bg-muted border-border" };
  if (code >= 360)                                           return { label: "Complete",    color: "text-success bg-success-bg border-success-border" };
  return                                                            { label: "Unknown",     color: "text-muted-foreground bg-muted border-border" };
}

const STATUS_FILTERS = [
  { label: "All",         value: "" },
  { label: "Waiting",     value: "201" },
  { label: "In Progress", value: "210" },
  { label: "Complete",    value: "400" },
  { label: "Exited",      value: "900" },
];

export default function HrVisitsPage() {
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const debouncedSearch     = useDebounce(search, 400);

  const params = new URLSearchParams({ page: String(page), limit: "25" });
  if (debouncedSearch) params.set("search", debouncedSearch);
  if (status)          params.set("status", status);

  const { data, isLoading } = useQuery<PaginatedResponse>({
    queryKey: ["hr-visits", page, debouncedSearch, status],
    queryFn:  () => fetch(`/api/hr/visits?${params}`).then((r) => r.json()),
  });

  const visits     = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">All Visits</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {pagination ? `${pagination.total.toLocaleString()} total visits` : "Hospital-wide visit records"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
          <Input
            placeholder="Search by name or queue code…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 h-9 rounded-xl text-sm bg-card border-border"
          />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s.value}
              onClick={() => { setStatus(s.value); setPage(1); }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                status === s.value
                  ? "bg-violet-600 text-white border-violet-600"
                  : "bg-card text-muted-foreground border-border hover:bg-muted"
              )}
            >{s.label}</button>
          ))}
        </div>
        {(search || status) && (
          <button
            onClick={() => { setSearch(""); setStatus(""); setPage(1); }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-destructive border border-destructive/20 bg-destructive/5"
          ><X className="h-3 w-3" /> Clear</button>
        )}
      </div>

      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Employee</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Queue Code</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className="h-4 w-40 rounded bg-muted" /></td>
                    <td className="px-4 py-3 hidden sm:table-cell"><div className="h-4 w-28 rounded bg-muted" /></td>
                    <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 w-20 rounded bg-muted" /></td>
                    <td className="px-4 py-3 hidden lg:table-cell"><div className="h-4 w-24 rounded bg-muted" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-16 rounded-full bg-muted" /></td>
                    <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 w-12 rounded bg-muted" /></td>
                  </tr>
                ))
              ) : visits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <ClipboardList className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No visits found</p>
                  </td>
                </tr>
              ) : (
                visits.map((v) => {
                  const st   = resolveStatus(v.status);
                  const href = v.patientCode ? `/hr/employees/${v.patientCode}` : null;
                  return (
                    <tr
                      key={v.id}
                      className={cn("transition-colors group", href ? "hover:bg-muted/30 cursor-pointer" : "")}
                      onClick={() => href && (window.location.href = href)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/10">
                            <UserCheck className="h-3.5 w-3.5 text-violet-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate max-w-40">{v.qFullName ?? "—"}</p>
                            <p className="text-xs text-muted-foreground">
                              {v.qGender === "M" ? "Male" : v.qGender === "F" ? "Female" : v.qGender ?? "—"}
                              {v.agePatient ? ` · ${v.agePatient}y` : ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="font-mono text-xs text-foreground">{v.code ?? "—"}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-muted-foreground">{v.patientType ?? "—"}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs text-muted-foreground">
                          {v.dateTime ? new Date(v.dateTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold", st.color)}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {href && (
                          <ChevronRight className="h-3.5 w-3.5 text-violet-500 opacity-40 group-hover:opacity-100 transition-opacity" />
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
            <p className="text-xs text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages} · {pagination.total.toLocaleString()} visits
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={() => setPage((p) => p + 1)} disabled={page >= pagination.totalPages}>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
