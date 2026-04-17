"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PaymentCard } from "@/components/portal/payment-card";
import type { PaymentListItem, PaginatedResponse } from "@/types";

async function fetchPayments(page: number): Promise<PaginatedResponse<PaymentListItem>> {
  const params = new URLSearchParams({ page: String(page), pageSize: "10" });
  const res = await fetch(`/api/payments?${params}`);
  if (!res.ok) throw new Error("Failed to fetch payments");
  const json = await res.json();
  return json.data;
}

export default function PaymentsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["payments", page],
    queryFn: () => fetchPayments(page),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Payment History
          </h1>
          <p className="text-muted-foreground">
            View your fully paid billing records
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CreditCard className="h-5 w-5 text-green-600" />
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))
        ) : isError ? (
          <div className="text-center py-12">
            <p className="text-destructive">Failed to load payments</p>
          </div>
        ) : data?.data.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No payment records found</p>
          </div>
        ) : (
          data?.data.map((payment) => (
            <PaymentCard key={payment.id} payment={payment} />
          ))
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {data.page} of {data.totalPages} · {data.total} payments
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
