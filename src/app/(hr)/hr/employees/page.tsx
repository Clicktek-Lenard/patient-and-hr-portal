"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Users,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  ExternalLink,

  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

type Patient = {
  id: string;
  code: string | null;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  gender: string | null;
  dob: string;
  email: string | null;
  mobile: string | null;
  contactNo: string | null;
  isActive: number;
  lastVisit: string | null;
};

type PaginatedResponse = {
  data: Patient[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

function getAge(dob: string) {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export default function HrEmployeesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState("");
  const [active, setActive] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "20");
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (gender) params.set("gender", gender);
    if (active !== "") params.set("active", active);
    return `/api/hr/employees?${params}`;
  }, [page, debouncedSearch, gender, active]);

  const { data, isLoading } = useQuery<PaginatedResponse>({
    queryKey: ["hr-employees", page, debouncedSearch, gender, active],
    queryFn: () => fetch(buildUrl()).then((r) => r.json()),
  });

  const patients = data?.data ?? [];
  const pagination = data?.pagination;

  const hasFilters = search || gender || active !== "";

  function clearFilters() {
    setSearch("");
    setGender("");
    setActive("");
    setPage(1);
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Employees</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {pagination ? (
              <>{pagination.total.toLocaleString()} total records</>
            ) : (
              "All registered employees"
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
          <Input
            placeholder="Search by name, code, email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 h-9 rounded-xl text-sm bg-card border-border"
          />
        </div>

        {/* Gender filter */}
        <div className="flex items-center gap-1">
          {["", "Male", "Female"].map((g) => (
            <button
              key={g}
              onClick={() => { setGender(g); setPage(1); }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                gender === g
                  ? "bg-violet-600 text-white border-violet-600"
                  : "bg-card text-muted-foreground border-border hover:bg-muted"
              )}
            >
              {g === "" ? "All" : g}
            </button>
          ))}
        </div>

        {/* Active filter */}
        <div className="flex items-center gap-1">
          {[
            { value: "", label: "All Status" },
            { value: "1", label: "Active" },
            { value: "0", label: "Inactive" },
          ].map((a) => (
            <button
              key={a.value}
              onClick={() => { setActive(a.value); setPage(1); }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                active === a.value
                  ? "bg-violet-600 text-white border-violet-600"
                  : "bg-card text-muted-foreground border-border hover:bg-muted"
              )}
            >
              {a.label}
            </button>
          ))}
        </div>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-destructive border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-colors"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground tracking-wide">Employee</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground tracking-wide hidden sm:table-cell">Code</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground tracking-wide hidden md:table-cell">Gender</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground tracking-wide hidden md:table-cell">Age</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground tracking-wide hidden lg:table-cell">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground tracking-wide hidden lg:table-cell">Last Visit</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground tracking-wide">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground tracking-wide"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
                        <div className="space-y-1.5">
                          <div className="h-3 w-32 rounded bg-muted" />
                          <div className="h-2.5 w-20 rounded bg-muted" />
                        </div>
                      </div>
                    </td>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3.5 hidden sm:table-cell">
                        <div className="h-3 w-16 rounded bg-muted" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No employees found</p>
                  </td>
                </tr>
              ) : (
                patients.map((p) => {
                  const initials = ((p.firstName?.[0] ?? "") + (p.lastName?.[0] ?? "")).toUpperCase() || "?";
                  const age = getAge(p.dob);
                  const href = p.code ? `/hr/employees/${encodeURIComponent(p.code)}` : null;
                  return (
                    <tr
                      key={String(p.id)}
                      className={cn("transition-colors group", href ? "hover:bg-muted/40 cursor-pointer" : "")}
                      onClick={() => href && (window.location.href = href)}
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/10 border border-violet-400/20 text-xs font-bold text-violet-600 dark:text-violet-400">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate max-w-35">{p.fullName ?? "—"}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-35">{p.email ?? p.mobile ?? "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        <span className="font-mono text-xs text-muted-foreground">{p.code ?? "—"}</span>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell text-muted-foreground text-xs">{p.gender ?? "—"}</td>
                      <td className="px-4 py-3.5 hidden md:table-cell text-muted-foreground text-xs">{age} yrs</td>
                      <td className="px-4 py-3.5 hidden lg:table-cell text-muted-foreground text-xs">{p.mobile ?? p.contactNo ?? "—"}</td>
                      <td className="px-4 py-3.5 hidden lg:table-cell text-muted-foreground text-xs">
                        {p.lastVisit ? new Date(p.lastVisit).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                          p.isActive
                            ? "text-success bg-success-bg border-success-border"
                            : "text-muted-foreground bg-muted border-border"
                        )}>
                          {p.isActive
                            ? <><UserCheck className="h-2.5 w-2.5" /> Active</>
                            : <><UserX className="h-2.5 w-2.5" /> Inactive</>
                          }
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {href && (
                          <ExternalLink className="h-3.5 w-3.5 text-violet-500 opacity-40 group-hover:opacity-100 transition-opacity" />
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages} · {pagination.total.toLocaleString()} total
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 rounded-lg"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, pagination.totalPages - 4));
                const pg = start + i;
                return (
                  <Button
                    key={pg}
                    variant={pg === page ? "default" : "outline"}
                    size="icon"
                    className="h-7 w-7 rounded-lg text-xs"
                    onClick={() => setPage(pg)}
                  >
                    {pg}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 rounded-lg"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
