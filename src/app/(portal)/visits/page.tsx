"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Search, X, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { VisitCard } from "@/components/portal/visit-card";
import type { VisitListItem, PaginatedResponse } from "@/types";
import { cn } from "@/lib/utils";

async function fetchVisits(page: number, search: string): Promise<PaginatedResponse<VisitListItem>> {
  const params = new URLSearchParams({ page: String(page), pageSize: "10" });
  if (search) params.set("search", search);
  const res = await fetch(`/api/visits?${params}`);
  if (!res.ok) throw new Error("Failed to fetch visits");
  const json = await res.json();
  return json.data;
}

export default function VisitsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["visits", page, search],
    queryFn: () => fetchVisits(page, search),
  });

  const handleSearch = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleClear = () => {
    setSearch("");
    setSearchInput("");
    setPage(1);
  };

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xs font-semibold text-primary tracking-widest uppercase">History</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground leading-tight">Visit History</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            All your clinic visits and real-time queue status
          </p>
        </div>

        {data && !isLoading && (
          <div className="hidden sm:flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 shadow-(--shadow-xs) shrink-0">
            <span className="text-2xl font-bold text-foreground font-data tabular-nums">
              {data.total}
            </span>
            <span className="text-xs text-muted-foreground font-medium">total visits</span>
          </div>
        )}
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <Input
              placeholder="Search by visit code…"
              className="pl-10 h-10 rounded-xl border-border focus-visible:border-primary/50 focus-visible:ring-primary/15 bg-card"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Button type="submit" variant="secondary" className="h-10 rounded-xl px-4 gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Search</span>
          </Button>
        </form>
      </div>

      {/* Active filter pill */}
      {search && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Showing results for:</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-xs font-semibold text-primary">
            {search}
            <button onClick={handleClear} className="hover:opacity-70 transition-opacity">
              <X className="h-3 w-3" />
            </button>
          </span>
        </div>
      )}

      {/* Visit list */}
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
            <p className="text-sm font-medium text-foreground">Failed to load visits</p>
            <p className="text-xs text-muted-foreground">Please try refreshing the page</p>
          </div>
        ) : data?.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl border border-dashed border-border bg-card/50">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Calendar className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-foreground">No visits found</p>
            <p className="text-xs text-muted-foreground">
              {search ? "Try a different search term" : "Your visit history will appear here"}
            </p>
            {search && (
              <Button variant="ghost" size="sm" onClick={handleClear} className="mt-1 rounded-xl">
                Clear search
              </Button>
            )}
          </div>
        ) : (
          data?.data.map((visit) => (
            <VisitCard key={visit.id} visit={visit} />
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
            <span className="font-data">{data.total}</span> visits
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
