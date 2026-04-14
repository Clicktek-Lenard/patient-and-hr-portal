"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, CreditCard, Tag, QrCode, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { formatDate, formatDateTime, formatCurrency } from "@/lib/utils";
import type { Payment } from "@/types";
import QRCode from "react-qr-code";

async function fetchPayment(queueCode: string): Promise<Payment> {
  const res = await fetch(`/api/payments/${queueCode}`);
  if (!res.ok) throw new Error("Payment not found");
  const json = await res.json();
  return json.data;
}

interface PageProps {
  params: Promise<{ queueCode: string }>;
}

const methodLabels: Record<string, string> = {
  CASH: "Cash",
  GCASH: "GCash",
  MAYA: "Maya",
  CARD: "Credit/Debit Card",
  BANK_TRANSFER: "Bank Transfer",
  HMO: "HMO",
  PHILHEALTH: "PhilHealth",
};

export default function PaymentDetailPage({ params }: PageProps) {
  const { queueCode } = use(params);

  const { data: payment, isLoading, isError } = useQuery({
    queryKey: ["payment", queueCode],
    queryFn: () => fetchPayment(queueCode),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !payment) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Payment Not Found</h2>
        <p className="text-muted-foreground mb-4">
          No payment record found for this visit.
        </p>
        <Button asChild>
          <Link href="/payments">Back to Payments</Link>
        </Button>
      </div>
    );
  }

  const statusVariant: Record<string, "default" | "success" | "warning" | "destructive"> = {
    paid:     "success",
    pending:  "warning",
    refunded: "default",
    partial:  "warning",
  };

  const statusIcon = {
    paid:     <CheckCircle2 className="h-4 w-4" />,
    pending:  <Clock className="h-4 w-4" />,
    refunded: <AlertCircle className="h-4 w-4" />,
    partial:  <Clock className="h-4 w-4" />,
  };

  // QR payload — cashier scans this to pull up the receipt
  const qrPayload = JSON.stringify({
    queueCode: payment.queueCode,
    receiptNo: payment.receiptNo,
    amount:    payment.totalAmount,
    status:    payment.status,
  });

  const hasDiscounts = (payment.discount ?? 0) > 0 || (payment.coverage ?? 0) > 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/payments">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Payments
        </Link>
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Receipt #{payment.receiptNo || "—"}
          </h1>
          <p className="text-muted-foreground text-sm">
            Visit #{payment.queueCode} · {formatDate(payment.date)}
          </p>
        </div>
        <Badge variant={statusVariant[payment.status] ?? "default"} className="flex items-center gap-1 capitalize">
          {statusIcon[payment.status as keyof typeof statusIcon]}
          {payment.status}
        </Badge>
      </div>

      {/* QR Reference Card */}
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <QrCode className="h-4 w-4 text-primary" />
            Payment Reference
            <span className="text-xs font-normal text-muted-foreground ml-1">
              — Present this at the cashier / counter
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* QR Code */}
            <div className="bg-white p-3 rounded-xl shadow-sm border shrink-0">
              <QRCode
                value={qrPayload}
                size={140}
                level="M"
              />
            </div>
            {/* Reference details */}
            <div className="space-y-3 text-sm flex-1 w-full">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Queue Code</p>
                  <p className="font-semibold tracking-wide">{payment.queueCode}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">OR Number</p>
                  <p className="font-semibold">{payment.receiptNo || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Payment Method</p>
                  <p className="font-medium">{methodLabels[payment.paymentMethod] ?? payment.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Paid</p>
                  <p className="font-bold text-primary text-base">{formatCurrency(payment.totalAmount)}</p>
                </div>
              </div>
              {payment.paidAt && (
                <p className="text-xs text-muted-foreground">
                  Paid on {formatDateTime(payment.paidAt)}
                  {payment.cashier ? ` by ${payment.cashier}` : ""}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Discount / Coverage Details */}
      {hasDiscounts && (
        <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-green-700 dark:text-green-400">
              <Tag className="h-4 w-4" />
              Discounts & Coverage Applied
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(payment.discount ?? 0) > 0 && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-700 dark:text-green-400">
                    {payment.discountLabel ?? "Discount"}
                  </p>
                  <p className="text-xs text-muted-foreground">Applied to total billing</p>
                </div>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  -{formatCurrency(payment.discount!)}
                </span>
              </div>
            )}
            {(payment.coverage ?? 0) > 0 && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-700 dark:text-green-400">
                    {payment.coverageLabel ?? "HMO / Coverage"}
                  </p>
                  <p className="text-xs text-muted-foreground">Insurance / HMO coverage</p>
                </div>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  -{formatCurrency(payment.coverage!)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Itemized Billing */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Itemized Billing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {/* Header row */}
            <div className="flex items-center gap-4 pb-2 border-b text-xs text-muted-foreground font-medium">
              <span className="flex-1">Description</span>
              <span className="w-24 text-right">Amount</span>
            </div>

            {/* Items */}
            {payment.items.length > 0 ? (
              payment.items.map((item) => (
                <div key={item.id} className="flex items-start gap-4 py-1">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.description}</p>
                    {item.category && (
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    )}
                  </div>
                  <span className="w-24 text-right text-sm font-medium">
                    {formatCurrency(item.total)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-2">No itemized breakdown available.</p>
            )}

            <Separator className="my-2" />

            {/* Totals */}
            <div className="space-y-1 text-sm">
              {payment.amount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatCurrency(payment.amount)}</span>
                </div>
              )}
              {(payment.discount ?? 0) > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>{payment.discountLabel ?? "Discount"}</span>
                  <span>-{formatCurrency(payment.discount!)}</span>
                </div>
              )}
              {(payment.coverage ?? 0) > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>{payment.coverageLabel ?? "Coverage"}</span>
                  <span>-{formatCurrency(payment.coverage!)}</span>
                </div>
              )}
              {payment.tax && payment.tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatCurrency(payment.tax)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-base pt-1">
                <span>Total Paid</span>
                <span className="text-primary">{formatCurrency(payment.totalAmount)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
