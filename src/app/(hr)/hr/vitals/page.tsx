"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Search, Activity, Heart, Thermometer, Scale, Ruler, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

type Vital = {
  id: number;
  queueCode: string;
  patientCode: string;
  patientName: string;
  date: string;
  bpSystolic: number | null;
  bpDiastolic: number | null;
  heartRate: number | null;
  temperature: number | null;
  respiratoryRate: number | null;
  weightKg: number | null;
  heightCm: number | null;
  bmi: number | null;
  chiefComplaint: string | null;
  pcpDoctor: string | null;
  recordedBy: string | null;
  bpCategory: "normal" | "pre-hypertension" | "hypertension" | null;
  createdAt: string;
};

type PaginatedResponse = {
  data: Vital[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

const BP_CATEGORY_STYLE: Record<string, string> = {
  normal:           "text-success bg-success-bg border-success-border",
  "pre-hypertension": "text-warning bg-warning-bg border-warning-border",
  hypertension:     "text-danger bg-danger-bg border-danger-border",
};

export default function HrVitalsPage() {
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch     = useDebounce(search, 400);

  const params = new URLSearchParams({ page: String(page), limit: "24" });
  if (debouncedSearch) params.set("search", debouncedSearch);

  const { data, isLoading } = useQuery<PaginatedResponse>({
    queryKey: ["hr-vitals", page, debouncedSearch],
    queryFn:  () => fetch(`/api/hr/vitals?${params}`).then((r) => r.json()),
  });

  const vitals     = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Vital Signs</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {pagination ? `${pagination.total.toLocaleString()} records` : "Hospital-wide vital sign records"}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
          <Input
            placeholder="Search by patient or queue code…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 h-9 rounded-xl text-sm bg-card border-border"
          />
        </div>
        {search && (
          <button
            onClick={() => { setSearch(""); setPage(1); }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-destructive border border-destructive/20 bg-destructive/5"
          ><X className="h-3 w-3" /> Clear</button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-card border border-border p-5 animate-pulse space-y-3">
              <div className="h-4 w-32 rounded bg-muted" />
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="h-12 rounded-xl bg-muted" />
                ))}
              </div>
            </div>
          ))
        ) : vitals.length === 0 ? (
          <div className="col-span-full py-12 text-center">
            <Activity className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No vitals found</p>
          </div>
        ) : (
          vitals.map((v) => (
            <div key={v.id} className="rounded-2xl bg-card border border-border p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{v.patientName}</p>
                  <p className="text-xs text-muted-foreground">
                    {v.patientCode !== "—" ? (
                      <Link href={`/hr/employees/${v.patientCode}`} className="text-violet-500 hover:underline">
                        {v.patientCode}
                      </Link>
                    ) : v.patientCode}
                    {" · "}
                    {v.date ? new Date(v.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                  </p>
                </div>
                {v.bpCategory && (
                  <span className={cn(
                    "shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize",
                    BP_CATEGORY_STYLE[v.bpCategory]
                  )}>
                    {v.bpCategory.replace("-", " ")}
                  </span>
                )}
              </div>

              {v.chiefComplaint && (
                <p className="text-xs text-muted-foreground italic">&ldquo;{v.chiefComplaint}&rdquo;</p>
              )}

              <div className="grid grid-cols-2 gap-2">
                {v.bpSystolic != null && v.bpDiastolic != null && (
                  <div className="col-span-2 rounded-xl bg-muted/50 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Heart className="h-3 w-3 text-danger" />
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Blood Pressure</span>
                    </div>
                    <p className="text-sm font-bold text-foreground">
                      {v.bpSystolic}/{v.bpDiastolic}{" "}
                      <span className="text-xs font-normal text-muted-foreground">mmHg</span>
                    </p>
                  </div>
                )}
                {v.heartRate != null && (
                  <div className="rounded-xl bg-muted/50 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Activity className="h-3 w-3 text-violet-500 dark:text-violet-400" />
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Heart Rate</span>
                    </div>
                    <p className="text-sm font-bold text-foreground">
                      {v.heartRate} <span className="text-xs font-normal text-muted-foreground">bpm</span>
                    </p>
                  </div>
                )}
                {v.temperature != null && (
                  <div className="rounded-xl bg-muted/50 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Thermometer className="h-3 w-3 text-warning" />
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Temp</span>
                    </div>
                    <p className="text-sm font-bold text-foreground">
                      {v.temperature} <span className="text-xs font-normal text-muted-foreground">°C</span>
                    </p>
                  </div>
                )}
                {v.weightKg != null && (
                  <div className="rounded-xl bg-muted/50 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Scale className="h-3 w-3 text-info" />
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Weight</span>
                    </div>
                    <p className="text-sm font-bold text-foreground">
                      {v.weightKg} <span className="text-xs font-normal text-muted-foreground">kg</span>
                    </p>
                  </div>
                )}
                {v.heightCm != null && (
                  <div className="rounded-xl bg-muted/50 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Ruler className="h-3 w-3 text-success" />
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Height</span>
                    </div>
                    <p className="text-sm font-bold text-foreground">
                      {v.heightCm} <span className="text-xs font-normal text-muted-foreground">cm</span>
                    </p>
                  </div>
                )}
                {v.bmi != null && (
                  <div className="rounded-xl bg-muted/50 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Activity className="h-3 w-3 text-violet-400" />
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">BMI</span>
                    </div>
                    <p className="text-sm font-bold text-foreground">{v.bmi}</p>
                  </div>
                )}
              </div>

              {v.pcpDoctor && (
                <p className="text-xs text-muted-foreground">Dr. {v.pcpDoctor}</p>
              )}
              {v.queueCode !== "—" && (
                <p className="text-[10px] font-mono text-muted-foreground/60">{v.queueCode}</p>
              )}
            </div>
          ))
        )}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-1 py-2">
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
  );
}
