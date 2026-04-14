import Link from "next/link";
import { CreditCard, ChevronRight } from "lucide-react";
import { cn, formatDate, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { PaymentListItem } from "@/types";

interface PaymentCardProps {
  payment: PaymentListItem;
  className?: string;
}

const methodLabels: Record<string, string> = {
  CASH: "Cash",
  GCASH: "GCash",
  MAYA: "Maya",
  CARD: "Card",
  BANK_TRANSFER: "Bank Transfer",
  HMO: "HMO",
  PHILHEALTH: "PhilHealth",
};

const statusVariant: Record<string, "default" | "success" | "warning" | "destructive"> = {
  pending: "warning",
  paid: "success",
  refunded: "info" as "default",
  partial: "warning",
};

export function PaymentCard({ payment, className }: PaymentCardProps) {
  return (
    <Link href={`/payments/${payment.queueCode}`}>
      <Card
        className={cn(
          "hover:bg-accent/50 transition-colors cursor-pointer",
          className
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-foreground">
                    Receipt #{payment.receiptNo}
                  </p>
                  <Badge
                    variant={statusVariant[payment.status] ?? "default"}
                    className="text-xs capitalize"
                  >
                    {payment.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatDate(payment.date)} · Visit #{payment.queueCode}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {methodLabels[payment.paymentMethod] ?? payment.paymentMethod}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <p className="font-bold text-lg text-foreground">
                {formatCurrency(payment.totalAmount)}
              </p>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
