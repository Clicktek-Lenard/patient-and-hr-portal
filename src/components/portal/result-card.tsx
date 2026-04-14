import Link from "next/link";
import { FileDown, FlaskConical, ScanLine, Microscope, FileText, ChevronRight, Calendar } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { LabResult } from "@/types";

const TYPE_CONFIG = {
  lab: {
    icon:   FlaskConical,
    label:  "Laboratory",
    style:  "bg-primary/10 border-primary/20 text-primary",
  },
  imaging: {
    icon:   ScanLine,
    label:  "Imaging",
    style:  "bg-(--color-purple-bg) border-(--color-purple-border) text-(--color-purple)",
  },
  pathology: {
    icon:   Microscope,
    label:  "Pathology",
    style:  "bg-(--color-warning-bg) border-(--color-warning-border) text-(--color-warning)",
  },
  other: {
    icon:   FileText,
    label:  "Other",
    style:  "bg-muted border-border text-muted-foreground",
  },
};

const STATUS_VARIANT: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  released: "success",
  verified: "success",
  pending:  "warning",
};

interface ResultCardProps {
  result: LabResult;
  className?: string;
}

export function ResultCard({ result, className }: ResultCardProps) {
  const cfg = TYPE_CONFIG[result.type] ?? TYPE_CONFIG.other;
  const Icon = cfg.icon;
  const statusVariant = STATUS_VARIANT[result.status] ?? "secondary";

  return (
    <Link href={`/results/${result.queueCode}`}>
      <div className={cn(
        "group flex items-center gap-3.5 rounded-xl border border-border bg-card px-4 py-3.5",
        "hover:border-primary/30 hover:shadow-(--glow-primary)",
        "transition-all duration-200 cursor-pointer",
        className
      )}>
        {/* Type icon */}
        <div className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
          "transition-transform duration-200 group-hover:scale-105",
          cfg.style
        )}>
          <Icon className="h-4.5 w-4.5" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground truncate leading-snug">
            {result.description}
          </p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {formatDate(result.date)}
            </span>
            <span className="text-xs text-muted-foreground font-data opacity-60">#{result.transNo}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <Badge variant="secondary" dot={false} className="text-[10px] px-1.5 py-0">
              {cfg.label}
            </Badge>
            <Badge
              variant={statusVariant}
              dot={false}
              className="text-[10px] px-1.5 py-0 capitalize"
            >
              {result.status}
            </Badge>
            {result.hasPdf && (
              <Badge variant="success" dot={false} className="text-[10px] px-1.5 py-0 gap-1">
                <FileDown className="h-2.5 w-2.5" />PDF
              </Badge>
            )}
          </div>
        </div>

        <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-150" />
      </div>
    </Link>
  );
}
