"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FlaskConical, ScanLine, Microscope, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ResultCard } from "@/components/portal/result-card";
import type { LabResult, PaginatedResponse } from "@/types";
import { cn } from "@/lib/utils";

async function fetchResults(page: number, type: string): Promise<PaginatedResponse<LabResult>> {
  const params = new URLSearchParams({ page: String(page), pageSize: "10" });
  if (type && type !== "all") params.set("type", type);
  const res = await fetch(`/api/results?${params}`);
  if (!res.ok) throw new Error("Failed to fetch results");
  const json = await res.json();
  return json.data;
}

const TYPE_FILTERS = [
  { value: "all",       label: "All Results", icon: FileText,   style: "text-foreground" },
  { value: "lab",       label: "Laboratory",  icon: FlaskConical, style: "text-primary" },
  { value: "imaging",   label: "Imaging",     icon: ScanLine,   style: "text-(--color-purple)" },
  { value: "pathology", label: "Pathology",   icon: Microscope, style: "text-(--color-warning)" },
];

export default function ResultsPage() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("all");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["results", page, typeFilter],
    queryFn: () => fetchResults(page, typeFilter),
  });

  const handleFilter = (value: string) => {
    setTypeFilter(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-(--color-purple-bg) border border-(--color-purple-border)">
              <FlaskConical className="h-4 w-4 text-(--color-purple)" />
            </div>
            <span className="text-xs font-semibold text-(--color-purple) tracking-widest uppercase">Records</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground leading-tight">Lab Results</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Laboratory, imaging, and pathology reports
          </p>
        </div>

        {data && !isLoading && (
          <div className="hidden sm:flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 shadow-(--shadow-xs) shrink-0">
            <span className="text-2xl font-bold text-foreground font-data tabular-nums">{data.total}</span>
            <span className="text-xs text-muted-foreground font-medium">results</span>
          </div>
        )}
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {TYPE_FILTERS.map((f) => {
          const Icon = f.icon;
          const isActive = typeFilter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => handleFilter(f.value)}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all duration-150",
                isActive
                  ? "border-primary/30 bg-primary/10 text-primary shadow-(--glow-primary)"
                  : "border-border bg-card text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className={cn("h-3.5 w-3.5", isActive ? "text-primary" : f.style)} />
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Results list */}
      <div className="space-y-2.5">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl border border-border bg-card">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-(--color-danger-bg) border border-(--color-danger-border)">
              <X className="h-5 w-5 text-(--color-danger)" />
            </div>
            <p className="text-sm font-medium text-foreground">Failed to load results</p>
            <p className="text-xs text-muted-foreground">Please try refreshing the page</p>
          </div>
        ) : data?.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl border border-dashed border-border bg-card/50">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <FlaskConical className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-foreground">No results found</p>
            <p className="text-xs text-muted-foreground">
              {typeFilter !== "all" ? "Try selecting a different category" : "Your lab results will appear here"}
            </p>
            {typeFilter !== "all" && (
              <Button variant="ghost" size="sm" onClick={() => handleFilter("all")} className="mt-1 rounded-xl">
                View all results
              </Button>
            )}
          </div>
        ) : (
          data?.data.map((result) => (
            <ResultCard key={result.id} result={result} />
          ))
        )}
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Page <span className="font-semibold text-foreground">{data.page}</span> of{" "}
            <span className="font-semibold text-foreground">{data.totalPages}</span>
            <span className="mx-1.5 opacity-40">·</span>
            <span className="font-data">{data.total}</span> results
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className={cn("rounded-xl h-9 px-4", page === 1 && "opacity-50")}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= data.totalPages}
              className={cn("rounded-xl h-9 px-4", page >= data.totalPages && "opacity-50")}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
