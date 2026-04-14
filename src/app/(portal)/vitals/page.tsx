"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { VitalsCard } from "@/components/portal/vitals-card";
import type { Vitals, PaginatedResponse } from "@/types";

async function fetchVitals(page: number): Promise<PaginatedResponse<Vitals>> {
  const params = new URLSearchParams({ page: String(page), pageSize: "10" });
  const res = await fetch(`/api/vitals?${params}`);
  if (!res.ok) throw new Error("Failed to fetch vitals");
  const json = await res.json();
  return json.data;
}

export default function VitalsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["vitals", page],
    queryFn: () => fetchVitals(page),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vital Signs</h1>
          <p className="text-muted-foreground">
            Your recorded vital signs per visit
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <Activity className="h-5 w-5 text-red-600" />
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))
        ) : isError ? (
          <div className="text-center py-12">
            <p className="text-destructive">Failed to load vitals</p>
          </div>
        ) : data?.data.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No vital signs recorded</p>
          </div>
        ) : (
          data?.data.map((vitals) => (
            <VitalsCard key={vitals.id} vitals={vitals} />
          ))
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {data.page} of {data.totalPages} · {data.total} records
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= data.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
