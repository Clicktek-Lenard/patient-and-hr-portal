"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { Printer, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatDateTime, formatCurrency } from "@/lib/utils";
import type { Payment } from "@/types";

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

export default function ReceiptPage({ params }: PageProps) {
  const { queueCode } = use(params);

  const { data: payment, isLoading } = useQuery({
    queryKey: ["payment", queueCode],
    queryFn: () => fetchPayment(queueCode),
  });

  if (isLoading) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!payment) return null;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 p-4">
      {/* Print button - hidden on actual print */}
      <div className="no-print flex justify-end mb-4 max-w-2xl mx-auto">
        <Button onClick={() => window.print()} className="gap-2">
          <Printer className="h-4 w-4" />
          Print Receipt
        </Button>
      </div>

      {/* Receipt */}
      <div
        id="receipt"
        className="max-w-2xl mx-auto bg-white dark:bg-gray-950 border rounded-lg p-8 shadow-sm"
        style={{ fontFamily: "Arial, sans-serif" }}
      >
        {/* Header */}
        <div className="text-center mb-6 border-b pb-6">
          <div className="flex justify-center mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            NWD Health Services
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Patient Portal Receipt
          </p>
          <p className="text-xs text-gray-500 mt-1">
            123 Healthcare Avenue, City, Province | Tel: (02) 8888-0000
          </p>
        </div>

        {/* Receipt details */}
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Official Receipt
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Receipt #: <strong>{payment.receiptNo}</strong>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Queue Code: <strong>#{payment.queueCode}</strong>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Date: <strong>{formatDate(payment.date)}</strong>
              </p>
              {payment.paidAt && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Paid: <strong>{formatDateTime(payment.paidAt)}</strong>
                </p>
              )}
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Method:{" "}
                <strong>
                  {methodLabels[payment.paymentMethod] ?? payment.paymentMethod}
                </strong>
              </p>
            </div>
          </div>
        </div>

        {/* Itemized table */}
        <table className="w-full mb-6">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left py-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Description
              </th>
              <th className="text-center py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 w-12">
                Qty
              </th>
              <th className="text-right py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 w-28">
                Unit Price
              </th>
              <th className="text-right py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 w-28">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {payment.items.map((item) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="py-2">
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {item.description}
                  </p>
                  {item.category && (
                    <p className="text-xs text-gray-500">{item.category}</p>
                  )}
                </td>
                <td className="py-2 text-center text-sm text-gray-700 dark:text-gray-300">
                  {item.quantity}
                </td>
                <td className="py-2 text-right text-sm text-gray-700 dark:text-gray-300">
                  {formatCurrency(item.unitPrice)}
                </td>
                <td className="py-2 text-right text-sm text-gray-900 dark:text-gray-100 font-medium">
                  {formatCurrency(item.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="space-y-1 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
            <span className="text-gray-900 dark:text-gray-100">
              {formatCurrency(payment.amount)}
            </span>
          </div>
          {payment.discount && payment.discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span>-{formatCurrency(payment.discount)}</span>
            </div>
          )}
          {payment.tax && payment.tax > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Tax (12%)</span>
              <span className="text-gray-900 dark:text-gray-100">
                {formatCurrency(payment.tax)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold border-t-2 border-gray-300 pt-2 mt-2">
            <span className="text-gray-900 dark:text-gray-100">TOTAL AMOUNT</span>
            <span className="text-gray-900 dark:text-gray-100">
              {formatCurrency(payment.totalAmount)}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t pt-4 text-center">
          <p className="text-xs text-gray-500">
            This is your official receipt. Please keep it for your records.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            For inquiries, contact us at billing@nwdi.com or call (02) 8888-0000
          </p>
          {payment.cashier && (
            <p className="text-xs text-gray-500 mt-2">
              Processed by: {payment.cashier}
            </p>
          )}
          <div className="mt-4 border-t pt-4">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Patient Signature
            </p>
            <div className="h-12 mt-2 border-b border-gray-300 w-48 mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}
