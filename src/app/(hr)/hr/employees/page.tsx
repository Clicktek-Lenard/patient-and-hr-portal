"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search, Users, UserCheck, UserX,
  ChevronLeft, ChevronRight, ExternalLink,
  X, Building2, ChevronDown, ChevronUp,
  Plus, Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "sonner";

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
  company: string | null;
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

const DEPT_LABEL = "No Department";

export default function HrEmployeesPage() {
  const qc = useQueryClient();
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState("");
  const [gender, setGender]   = useState("");
  const [active, setActive]   = useState("");
  const [company, setCompany] = useState("");
  const [groupByDept, setGroupByDept] = useState(false);
  const [collapsedDepts, setCollapsedDepts] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const debouncedSearch = useDebounce(search, 400);

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "100"); // load more when grouping
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (gender)  params.set("gender", gender);
    if (active !== "") params.set("active", active);
    return `/api/hr/employees?${params}`;
  }, [page, debouncedSearch, gender, active]);

  const { data, isLoading } = useQuery<PaginatedResponse>({
    queryKey: ["hr-employees", page, debouncedSearch, gender, active],
    queryFn: () => fetch(buildUrl()).then((r) => r.json()),
  });

  const allPatients = data?.data ?? [];
  const pagination  = data?.pagination;

  // Unique companies for dept filter
  const companies = Array.from(
    new Set(allPatients.map((p) => p.company ?? DEPT_LABEL))
  ).sort();

  // Apply company filter
  const patients = company
    ? allPatients.filter((p) => (p.company ?? DEPT_LABEL) === company)
    : allPatients;

  // Group by department
  const grouped: Record<string, Patient[]> = {};
  if (groupByDept) {
    for (const p of patients) {
      const dept = p.company ?? DEPT_LABEL;
      if (!grouped[dept]) grouped[dept] = [];
      grouped[dept].push(p);
    }
  }

  const hasFilters = search || gender || active !== "" || company;

  function clearFilters() {
    setSearch(""); setGender(""); setActive(""); setCompany(""); setPage(1);
  }

  function toggleDept(dept: string) {
    setCollapsedDepts((prev) => {
      const next = new Set(prev);
      next.has(dept) ? next.delete(dept) : next.add(dept);
      return next;
    });
  }

  function renderRow(p: Patient) {
    const initials = ((p.firstName?.[0] ?? "") + (p.lastName?.[0] ?? "")).toUpperCase() || "?";
    const age  = getAge(p.dob);
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
        {!groupByDept && (
          <td className="px-4 py-3.5 hidden md:table-cell">
            {p.company ? (
              <span className="text-xs font-medium text-foreground truncate max-w-40 block">{p.company}</span>
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            )}
          </td>
        )}
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
              ? "text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-500/10 dark:border-green-500/20"
              : "text-muted-foreground bg-muted border-border"
          )}>
            {p.isActive
              ? <><UserCheck className="h-2.5 w-2.5" /> Active</>
              : <><UserX className="h-2.5 w-2.5" /> Inactive</>
            }
          </span>
        </td>
        <td className="px-4 py-3.5 text-right">
          {href && <ExternalLink className="h-3.5 w-3.5 text-violet-500 opacity-40 group-hover:opacity-100 transition-opacity" />}
        </td>
      </tr>
    );
  }

  const colSpan = groupByDept ? 7 : 8;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div style={{
        borderRadius: 14,
        background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
        padding: "20px 24px", position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0, opacity: 0.06,
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <Users style={{ width: 16, height: 16, color: "rgba(255,255,255,0.8)" }} />
            <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Overview</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#ffffff", lineHeight: 1.2 }}>Employees</h1>
              <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.55)", marginTop: 6 }}>
                {pagination ? `${pagination.total.toLocaleString()} total records` : "All registered employees"}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setGroupByDept((v) => !v)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "7px 14px", borderRadius: 8,
                  background: groupByDept ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: groupByDept ? "#4F46E5" : "#fff",
                  fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                }}
              >
                <Building2 size={13} /> Group by Dept
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "7px 14px", borderRadius: 8,
                  background: "rgba(255,255,255,0.95)", border: "none",
                  color: "#4F46E5", fontSize: "0.75rem", fontWeight: 600,
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                <Plus size={13} /> Add Employee
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: "var(--ui-card)", border: "1px solid var(--ui-border)", borderRadius: 12, padding: "14px 18px", boxShadow: "0 1px 3px var(--ui-shadow)" }} className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
          <Input
            placeholder="Search by name, code, email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 h-9 rounded-xl text-sm bg-card border-border"
          />
        </div>

        {/* Department filter */}
        {companies.length > 1 && (
          <select
            value={company}
            onChange={(e) => { setCompany(e.target.value); setPage(1); }}
            className="h-9 px-3 rounded-xl text-xs font-medium border border-border bg-card text-foreground focus:outline-none"
          >
            <option value="">All Departments</option>
            {companies.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}

        {/* Gender filter */}
        <select
          value={gender}
          onChange={(e) => { setGender(e.target.value); setPage(1); }}
          style={{ height: 36, padding: "0 12px", borderRadius: 8, border: "1.5px solid var(--ui-border)", background: "var(--ui-card)", color: "var(--ui-text-primary)", fontSize: "0.78rem", fontWeight: 500, outline: "none", cursor: "pointer" }}
        >
          <option value="">All Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>

        {/* Active filter */}
        <select
          value={active}
          onChange={(e) => { setActive(e.target.value); setPage(1); }}
          style={{ height: 36, padding: "0 12px", borderRadius: 8, border: "1.5px solid var(--ui-border)", background: "var(--ui-card)", color: "var(--ui-text-primary)", fontSize: "0.78rem", fontWeight: 500, outline: "none", cursor: "pointer" }}
        >
          <option value="">All Status</option>
          <option value="1">Active</option>
          <option value="0">Inactive</option>
        </select>

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
      <div style={{ background: "var(--ui-card)", border: "1px solid var(--ui-border)", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px var(--ui-shadow)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground tracking-wide">Employee</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground tracking-wide hidden sm:table-cell">Code</th>
                {!groupByDept && (
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground tracking-wide hidden md:table-cell">Department</th>
                )}
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
                  <td colSpan={colSpan} className="px-4 py-12 text-center">
                    <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No employees found</p>
                  </td>
                </tr>
              ) : groupByDept ? (
                Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([dept, emps]) => {
                  const collapsed = collapsedDepts.has(dept);
                  return (
                    <>
                      {/* Department header row */}
                      <tr
                        key={`dept-${dept}`}
                        className="bg-violet-50 dark:bg-violet-500/10 cursor-pointer hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-colors"
                        onClick={() => toggleDept(dept)}
                      >
                        <td colSpan={colSpan} className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3.5 w-3.5 text-violet-500" />
                            <span className="text-xs font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wider">
                              {dept}
                            </span>
                            <span className="text-[10px] font-semibold text-violet-500 bg-violet-100 dark:bg-violet-500/20 rounded-full px-2 py-0.5">
                              {emps.length} employee{emps.length !== 1 ? "s" : ""}
                            </span>
                            <span className="ml-auto">
                              {collapsed
                                ? <ChevronDown className="h-3.5 w-3.5 text-violet-400" />
                                : <ChevronUp className="h-3.5 w-3.5 text-violet-400" />
                              }
                            </span>
                          </div>
                        </td>
                      </tr>
                      {/* Employee rows */}
                      {!collapsed && emps.map((p) => renderRow(p))}
                    </>
                  );
                })
              ) : (
                patients.map((p) => renderRow(p))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination — only show when not grouping */}
        {!groupByDept && pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages} · {pagination.total.toLocaleString()} total
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg"
                disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, pagination.totalPages - 4));
                const pg = start + i;
                return (
                  <Button key={pg} variant={pg === page ? "default" : "outline"}
                    size="icon" className="h-7 w-7 rounded-lg text-xs" onClick={() => setPage(pg)}>
                    {pg}
                  </Button>
                );
              })}
              <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg"
                disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <AddEmployeeModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            qc.invalidateQueries({ queryKey: ["hr-employees"] });
          }}
        />
      )}
    </div>
  );
}

/* ── Add Employee Modal ── */
const inputStyle: React.CSSProperties = {
  width: "100%", height: 38, padding: "0 12px", borderRadius: 8,
  border: "1.5px solid var(--ui-border)", background: "var(--ui-card)",
  color: "var(--ui-text-primary)", fontSize: "0.82rem", outline: "none", boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "0.7rem", fontWeight: 600, color: "var(--ui-text-muted)",
  letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 5,
};

function AddEmployeeModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [firstName, setFirstName]     = useState("");
  const [lastName, setLastName]       = useState("");
  const [dob, setDob]                 = useState("");
  const [department, setDepartment]   = useState("");
  const [gender, setGender]           = useState("");
  const [mobile, setMobile]           = useState("");
  const [status, setStatus]           = useState("1");

  const age = dob
    ? (() => {
        const today = new Date();
        const birth = new Date(dob);
        let a = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) a--;
        return a;
      })()
    : null;

  const createMutation = useMutation({
    mutationFn: () =>
      fetch("/api/hr/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, dob, department, gender, mobile, isActive: Number(status) }),
      }).then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error ?? "Failed to create employee");
        return json;
      }),
    onSuccess: (data) => {
      toast.success(`Employee ${data.data?.fullName ?? "created"} added (${data.data?.code})`);
      onSuccess();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const isUnderage = age !== null && age < 18;
  const canSubmit = firstName.trim() && lastName.trim() && dob && !isUnderage && !createMutation.isPending;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--ui-card)", borderRadius: 14, width: "calc(100% - 40px)", maxWidth: 520, maxHeight: "85vh", border: "1px solid var(--ui-border)", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflowY: "auto" }}>
        {/* Header */}
        <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--ui-border)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "var(--ui-card)", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--ui-active-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Plus size={14} style={{ color: "var(--ui-active-text)" }} />
            </div>
            <h2 style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--ui-text-primary)" }}>Add Employee</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ui-text-muted)", padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: "18px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Row: First Name + Last Name */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>First Name <span style={{ color: "#E00500" }}>*</span></label>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Juan" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Last Name <span style={{ color: "#E00500" }}>*</span></label>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Dela Cruz" style={inputStyle} />
            </div>
          </div>

          {/* Row: Code (auto) + Department */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Code</label>
              <div style={{ ...inputStyle, background: "var(--ui-active-bg)", color: "var(--ui-text-faint)", display: "flex", alignItems: "center", fontSize: "0.78rem", fontStyle: "italic" }}>
                Auto-generated
              </div>
            </div>
            <div>
              <label style={labelStyle}>Department</label>
              <input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Operations" style={inputStyle} />
            </div>
          </div>

          {/* Row: Gender + Date of Birth + Age */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12 }}>
            <div>
              <label style={labelStyle}>Gender</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)} style={inputStyle}>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Date of Birth <span style={{ color: "#E00500" }}>*</span></label>
              <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Age</label>
              <div style={{ ...inputStyle, width: 52, background: isUnderage ? "#FEE2E2" : "var(--ui-active-bg)", color: isUnderage ? "#DC2626" : "var(--ui-active-text)", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {age !== null ? age : "—"}
              </div>
            </div>
          </div>
          {isUnderage && (
            <p style={{ fontSize: "0.72rem", color: "#DC2626", margin: "-6px 0 0", fontWeight: 500 }}>
              Employee must be at least 18 years old (working age).
            </p>
          )}

          {/* Row: Contact + Status */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Contact</label>
              <input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="e.g. 09171234567" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle}>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--ui-border)", display: "flex", justifyContent: "flex-end", gap: 10, position: "sticky", bottom: 0, background: "var(--ui-card)" }}>
          <button onClick={onClose} style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid var(--ui-border)", background: "var(--ui-card)", color: "var(--ui-text-muted)", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}>
            Cancel
          </button>
          <button
            onClick={() => createMutation.mutate()}
            disabled={!canSubmit}
            style={{
              padding: "8px 22px", borderRadius: 8, border: "none",
              background: canSubmit ? "#7C3AED" : "var(--ui-border)",
              color: canSubmit ? "#fff" : "var(--ui-text-faint)",
              fontSize: "0.82rem", fontWeight: 600,
              cursor: canSubmit ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            {createMutation.isPending
              ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Saving…</>
              : <><Plus size={14} /> Add Employee</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
