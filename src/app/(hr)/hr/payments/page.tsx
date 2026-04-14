"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "next-themes";
import { useQuery } from "@tanstack/react-query";
import { Search, CreditCard, ChevronLeft, ChevronRight, X, UserCheck, Receipt } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

type PaymentItem = {
  id: number;
  description: string;
  amount: number;
  type: string | null;
  group: string | null;
  company: string | null;
};

type Payment = {
  id: number;
  queueCode: string;
  patientCode: string;
  patientName: string;
  date: string;
  totalAmount: number;
  paymentType: string;
  status: "paid" | "pending";
  items: PaymentItem[];
};

type PaginatedResponse = {
  data: Payment[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

const STATUS_FILTERS = [
  { label: "All",     value: "" },
  { label: "Paid",    value: "paid" },
  { label: "Pending", value: "pending" },
];

function PaymentModal({ payment, onClose }: { payment: Payment; onClose: () => void }) {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  const bg      = dark ? "#18181b" : "#ffffff";
  const bgAlt   = dark ? "#27272a" : "#f9fafb";
  const border  = dark ? "#3f3f46" : "#e5e7eb";
  const text     = dark ? "#f4f4f5" : "#111827";
  const textMuted = dark ? "#a1a1aa" : "#6b7280";
  const rowHover = dark ? "#27272a" : "#f9fafb";
  const rowDiv   = dark ? "#3f3f46" : "#f3f4f6";

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: bg, color: text, border: `1px solid ${border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4" style={{ borderBottom: `1px solid ${border}` }}>
          <div>
            <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: text }}>
              <Receipt className="h-4 w-4 text-violet-500" /> Payment Details
            </h2>
            <p className="text-xs mt-0.5" style={{ color: textMuted }}>{payment.queueCode}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors"
            style={{ color: textMuted }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = rowHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Patient + summary */}
        <div className="px-5 py-4 space-y-2" style={{ borderBottom: `1px solid ${border}`, backgroundColor: bgAlt }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: text }}>{payment.patientName}</p>
              <p className="text-xs" style={{ color: textMuted }}>{payment.patientCode}</p>
            </div>
            <span
              className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold"
              style={payment.status === "paid"
                ? { backgroundColor: "#dcfce7", color: "#15803d", border: "1px solid #86efac" }
                : { backgroundColor: "#fef9c3", color: "#a16207", border: "1px solid #fde047" }}
            >
              {payment.status === "paid" ? "Paid" : "Pending"}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: textMuted }}>
            <span>{payment.date ? new Date(payment.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—"}</span>
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={payment.paymentType.startsWith("HMO")
                ? { backgroundColor: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }
                : { backgroundColor: dark ? "#3f3f46" : "#f3f4f6", color: textMuted, border: `1px solid ${border}` }}
            >
              {payment.paymentType}
            </span>
          </div>
        </div>

        {/* Line items */}
        <div className="overflow-y-auto max-h-72" style={{ backgroundColor: bg }}>
          {payment.items.length === 0 ? (
            <p className="px-5 py-8 text-center text-xs" style={{ color: textMuted }}>No line items available.</p>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0" style={{ backgroundColor: bg, borderBottom: `1px solid ${border}` }}>
                <tr>
                  <th className="text-left px-5 py-2.5 font-semibold" style={{ color: textMuted }}>Description</th>
                  <th className="text-left px-3 py-2.5 font-semibold hidden sm:table-cell" style={{ color: textMuted }}>Group</th>
                  <th className="text-right px-5 py-2.5 font-semibold" style={{ color: textMuted }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {payment.items.map((item, i) => (
                  <tr key={item.id} style={{ borderTop: i > 0 ? `1px solid ${rowDiv}` : undefined }}>
                    <td className="px-5 py-2.5" style={{ color: text }}>{item.description}</td>
                    <td className="px-3 py-2.5 hidden sm:table-cell" style={{ color: textMuted }}>{item.group ?? "—"}</td>
                    <td className="px-5 py-2.5 text-right font-medium" style={{ color: text }}>
                      ₱{item.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Total footer */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderTop: `1px solid ${border}`, backgroundColor: bgAlt }}>
          <span className="text-sm font-semibold" style={{ color: text }}>Total</span>
          <span className="text-lg font-bold" style={{ color: text }}>
            ₱{payment.totalAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function HrPaymentsPage() {
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState("");
  const [status, setStatus]         = useState("");
  const [selected, setSelected]     = useState<Payment | null>(null);
  const debouncedSearch             = useDebounce(search, 400);

  const params = new URLSearchParams({ page: String(page), limit: "25" });
  if (debouncedSearch) params.set("search", debouncedSearch);

  const { data, isLoading } = useQuery<PaginatedResponse>({
    queryKey: ["hr-payments", page, debouncedSearch],
    queryFn:  () => fetch(`/api/hr/payments?${params}`).then((r) => r.json()),
  });

  const allPayments = data?.data ?? [];
  const pagination  = data?.pagination;
  const payments    = status ? allPayments.filter((p) => p.status === status) : allPayments;
  const pageTotal   = payments.reduce((sum, p) => sum + p.totalAmount, 0);

  return (
    <>
      {selected && <PaymentModal payment={selected} onClose={() => setSelected(null)} />}

      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">Payments</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {pagination ? `${pagination.total.toLocaleString()} records` : "All payment transactions"}
            </p>
          </div>
          {payments.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5">
              <CreditCard className="h-4 w-4 text-success" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Page Total</p>
                <p className="text-sm font-bold text-foreground">
                  ₱{pageTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          )}
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
          <div className="flex items-center gap-1">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s.value}
                onClick={() => setStatus(s.value)}
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
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Patient</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Queue Code</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Date</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-4 py-3"><div className="h-4 w-36 rounded bg-muted" /></td>
                      <td className="px-4 py-3 hidden sm:table-cell"><div className="h-4 w-24 rounded bg-muted" /></td>
                      <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 w-16 rounded bg-muted" /></td>
                      <td className="px-4 py-3 hidden lg:table-cell"><div className="h-4 w-20 rounded bg-muted" /></td>
                      <td className="px-4 py-3"><div className="h-4 w-16 rounded bg-muted ml-auto" /></td>
                      <td className="px-4 py-3"><div className="h-5 w-14 rounded-full bg-muted" /></td>
                    </tr>
                  ))
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <CreditCard className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No payments found</p>
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setSelected(p)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/10">
                            <UserCheck className="h-3.5 w-3.5 text-violet-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate max-w-[130px]">{p.patientName}</p>
                            <p className="text-xs text-muted-foreground">{p.patientCode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="font-mono text-xs text-foreground">{p.queueCode}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                          p.paymentType.startsWith("HMO")
                            ? "text-info bg-info-bg border-info-border"
                            : "text-muted-foreground bg-muted border-border"
                        )}>
                          {p.paymentType}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs text-muted-foreground">
                          {p.date ? new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-semibold text-foreground">
                          ₱{p.totalAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                          p.status === "paid"
                            ? "text-success bg-success-bg border-success-border"
                            : "text-warning bg-warning-bg border-warning-border"
                        )}>
                          {p.status === "paid" ? "Paid" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))
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
    </>
  );
}
