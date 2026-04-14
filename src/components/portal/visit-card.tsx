import Link from "next/link";
import { Calendar, ChevronRight, Stethoscope, Clock } from "lucide-react";
import { cn, formatDate, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { STATUS_MAP } from "@/types";
import type { VisitListItem, QueueStatusCode } from "@/types";

const STATUS_VARIANT: Record<string, "active" | "success" | "warning" | "hold" | "secondary"> = {
  in_progress:  "active",
  waiting:      "warning",
  complete:     "success",
  exit:         "success",
  on_hold:      "hold",
  startQueue:   "secondary",
  resume_queue: "warning",
  next_room:    "active",
};

const STATUS_COLORS: Record<string, string> = {
  in_progress:  "bg-primary/10 border-primary/20 text-primary",
  next_room:    "bg-primary/10 border-primary/20 text-primary",
  waiting:      "bg-(--color-warning-bg) border-(--color-warning-border) text-(--color-warning)",
  resume_queue: "bg-(--color-warning-bg) border-(--color-warning-border) text-(--color-warning)",
  complete:     "bg-(--color-success-bg) border-(--color-success-border) text-(--color-success)",
  exit:         "bg-(--color-success-bg) border-(--color-success-border) text-(--color-success)",
};

interface VisitCardProps {
  visit: VisitListItem;
  className?: string;
}

export function VisitCard({ visit, className }: VisitCardProps) {
  const variant = STATUS_VARIANT[visit.status] ?? "secondary";
  const isActive = variant === "active" || variant === "warning";
  const iconColor = STATUS_COLORS[visit.status] ?? "bg-muted border-border text-muted-foreground";

  return (
    <Link href={`/visits/${visit.code}`}>
      <div className={cn(
        "group relative flex items-center gap-3.5 rounded-xl border border-border bg-card px-4 py-3.5",
        "hover:border-primary/30 hover:shadow-(--glow-primary)",
        "transition-all duration-200 cursor-pointer overflow-hidden",
        isActive && "border-primary/20 bg-primary/2",
        className
      )}>
        {/* Active left accent */}
        {isActive && (
          <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl animate-glow-pulse"
            style={{ background: "var(--gradient-primary)" }} />
        )}

        {/* Icon */}
        <div className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
          "transition-transform duration-200 group-hover:scale-105",
          iconColor
        )}>
          {isActive ? <Stethoscope className="h-4.5 w-4.5" /> : <Calendar className="h-4.5 w-4.5" />}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-sm text-foreground font-data tracking-wide">
              #{visit.code}
            </p>
            <Badge variant={variant} dot={isActive}>
              {STATUS_MAP[visit.status as QueueStatusCode] ?? visit.friendlyStatus}
            </Badge>
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatDate(visit.date)}
            </span>
            {visit.doctor && (
              <span className="text-xs text-muted-foreground truncate">Dr. {visit.doctor}</span>
            )}
          </div>
        </div>

        {/* Amount + chevron */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="text-right">
            <p className="font-bold text-sm text-foreground tabular-nums font-data">
              {formatCurrency(visit.totalAmount)}
            </p>
            <Badge
              variant={visit.isPaid ? "success" : "warning"}
              dot={false}
              className="text-[10px] px-1.5 py-0 mt-0.5"
            >
              {visit.isPaid ? "Paid" : "Unpaid"}
            </Badge>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-150" />
        </div>
      </div>
    </Link>
  );
}
