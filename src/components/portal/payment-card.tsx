import { CreditCard } from "lucide-react";
import { cn, formatDate, formatCurrency } from "@/lib/utils";
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

export function PaymentCard({ payment, className }: PaymentCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground">
                Visit #{payment.queueCode}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatDate(payment.date)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {methodLabels[payment.paymentMethod] ?? payment.paymentMethod}
              </p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-bold text-lg text-foreground">
              {formatCurrency(payment.totalAmount)}
            </p>
            <p className="text-xs font-semibold text-green-600 dark:text-green-400 mt-0.5">
              Fully Paid
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
