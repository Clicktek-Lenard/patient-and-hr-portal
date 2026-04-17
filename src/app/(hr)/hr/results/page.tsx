"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, FlaskConical, ChevronLeft, ChevronRight, X, UserCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

type Result = {
  id: number;
  queueCode: string;
  patientCode: string;
  patientName: string;
  date: string;
  itemCode: string | null;
  description: string | null;
  group: string | null;
  type: string | null;
  amount: number;
  doctor: string | null;
  company: string | null;
  status: string;
};

type PaginatedResponse = {
  data: Result[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

const STATUS_FILTERS = [
  { label: "All",     value: "" },
  { label: "Pending", value: "pending" },
  { label: "Done",    value: "done" },
];

export default function HrResultsPage() {
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const debouncedSearch     = useDebounce(search, 400);

  const params = new URLSearchParams({ page: String(page), limit: "25" });
  if (debouncedSearch) params.set("search", debouncedSearch);
  if (status)          params.set("status", status);

  const { data, isLoading } = useQuery<PaginatedResponse>({
    queryKey: ["hr-results", page, debouncedSearch, status],
    queryFn:  () => fetch(`/api/hr/results?${params}`).then((r) => r.json()),
  });

  const results    = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Lab Results</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {pagination ? `${pagination.total.toLocaleString()} total records` : "All lab & imaging results"}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
          <Input
            placeholder="Search by employee or queue code…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 h-9 rounded-xl text-sm bg-card border-border"
          />
        </div>
        <div className="flex items-center gap-1">
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
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Description</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Date</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className="h-4 w-36 rounded bg-muted" /></td>
                    <td className="px-4 py-3 hidden sm:table-cell"><div className="h-4 w-24 rounded bg-muted" /></td>
                    <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 w-32 rounded bg-muted" /></td>
                    <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 w-16 rounded bg-muted" /></td>
                    <td className="px-4 py-3 hidden lg:table-cell"><div className="h-4 w-20 rounded bg-muted" /></td>
                    <td className="px-4 py-3 hidden lg:table-cell"><div className="h-4 w-16 rounded bg-muted" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-14 rounded-full bg-muted" /></td>
                  </tr>
                ))
              ) : results.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <FlaskConical className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No results found</p>
                  </td>
                </tr>
              ) : (
                results.map((r) => {
                  const href = r.patientCode !== "—" ? `/hr/employees/${r.patientCode}` : null;
                  return (
                  <tr
                    key={r.id}
                    className={cn("transition-colors group", href ? "hover:bg-muted/30 cursor-pointer" : "")}
                    onClick={() => href && (window.location.href = href)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/10">
                          <UserCheck className="h-3.5 w-3.5 text-violet-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate max-w-35">{r.patientName}</p>
                          <p className="text-xs text-muted-foreground">{r.patientCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="font-mono text-xs text-foreground">{r.queueCode}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-muted-foreground truncate max-w-45 block">{r.description ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-muted-foreground">{r.type ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground">
                        {r.date ? new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-right">
                      <span className="text-xs font-medium text-foreground">
                        ₱{r.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                        r.status === "done"
                          ? "text-success bg-success-bg border-success-border"
                          : "text-warning bg-warning-bg border-warning-border"
                      )}>
                        {r.status === "done" ? "Done" : "Pending"}
                      </span>
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
              Page {pagination.page} of {pagination.totalPages} · {pagination.total.toLocaleString()} records
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
