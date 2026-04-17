"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FlaskConical, ScanLine, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ResultCard } from "@/components/portal/result-card";
import type { LabResult, PaginatedResponse } from "@/types";

async function fetchResults(page: number, type: string): Promise<PaginatedResponse<LabResult>> {
  const params = new URLSearchParams({ page: String(page), pageSize: "10" });
  if (type && type !== "all") params.set("type", type);
  const res = await fetch(`/api/results?${params}`);
  if (!res.ok) throw new Error("Failed to fetch results");
  const json = await res.json();
  return json.data;
}

const TYPE_FILTERS = [
  { value: "all",     label: "All Results", icon: FileText,    style: "text-foreground" },
  { value: "lab",     label: "Laboratory",  icon: FlaskConical, style: "text-primary" },
  { value: "imaging", label: "Imaging",     icon: ScanLine,    style: "text-(--color-purple)" },
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
      <div style={{ borderRadius: 14, background: "linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)", padding: "20px 24px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.06, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <FlaskConical style={{ width: 16, height: 16, color: "rgba(255,255,255,0.8)" }} />
              <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Main</span>
            </div>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#ffffff", lineHeight: 1.2 }}>Lab Results</h1>
            <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.55)", marginTop: 6 }}>Laboratory, imaging, and pathology reports</p>
          </div>
          {data && !isLoading && (
            <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 10, padding: "8px 16px", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: "1.4rem", fontWeight: 700, color: "#fff" }}>{data.total}</span>
              <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.6)" }}>results</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter */}
      <div style={{ background: "var(--ui-card)", border: "1px solid var(--ui-border)", borderRadius: 12, padding: "12px 16px", boxShadow: "0 1px 3px var(--ui-shadow)", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--ui-text-muted)", whiteSpace: "nowrap" }}>Filter by:</span>
        <select
          value={typeFilter}
          onChange={(e) => handleFilter(e.target.value)}
          style={{
            height: 36, padding: "0 12px", borderRadius: 8,
            border: "1.5px solid var(--ui-border)", background: "var(--ui-card)",
            color: "var(--ui-text-primary)", fontSize: "0.82rem", fontWeight: 500,
            outline: "none", cursor: "pointer", minWidth: 160,
          }}
        >
          {TYPE_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
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
              className="rounded-xl h-9 px-4"
              style={{ opacity: page === 1 ? 0.5 : 1 }}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= data.totalPages}
              className="rounded-xl h-9 px-4"
              style={{ opacity: page >= data.totalPages ? 0.5 : 1 }}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
