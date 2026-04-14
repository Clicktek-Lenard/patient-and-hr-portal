import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide transition-colors",
  {
    variants: {
      variant: {
        default:     "bg-primary/15 text-primary border border-primary/30",
        secondary:   "bg-muted text-muted-foreground border border-border",
        success:     "bg-[var(--color-success-bg)] text-[var(--color-success)] border border-[var(--color-success)]/30",
        warning:     "bg-[var(--color-warning-bg)] text-[var(--color-warning)] border border-[var(--color-warning)]/30",
        destructive: "bg-[var(--color-danger-bg)] text-[var(--color-danger)] border border-[var(--color-danger)]/30",
        info:        "bg-[var(--color-info-bg)] text-[var(--color-info)] border border-[var(--color-info)]/30",
        outline:     "border border-border text-muted-foreground bg-transparent",
        active:      "bg-primary/15 text-primary border border-primary/30 animate-glow-pulse",
        hold:        "bg-[var(--color-danger-bg)] text-[var(--color-danger)] border border-[var(--color-danger)]/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, dot = true, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
