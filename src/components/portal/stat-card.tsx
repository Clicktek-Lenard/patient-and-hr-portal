import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  accent?: "blue" | "amber" | "green" | "red" | "cyan" | "purple";
  trend?: { value: number; label: string; positive?: boolean };
  isLoading?: boolean;
  className?: string;
}

const ACCENT: Record<string, { iconBg: string; iconColor: string }> = {
  blue:   { iconBg: "var(--color-info-bg)",    iconColor: "var(--color-info)" },
  cyan:   { iconBg: "var(--color-info-bg)",    iconColor: "var(--color-info)" },
  purple: { iconBg: "var(--color-info-bg)",    iconColor: "var(--color-info)" },
  amber:  { iconBg: "var(--color-warning-bg)", iconColor: "var(--color-warning)" },
  green:  { iconBg: "var(--color-success-bg)", iconColor: "var(--color-success)" },
  red:    { iconBg: "var(--color-danger-bg)",  iconColor: "var(--color-danger)" },
};

export function StatCard({
  title, value, description, icon: Icon,
  accent = "blue", trend, isLoading = false, className,
}: StatCardProps) {
  const a = ACCENT[accent] ?? ACCENT.blue;

  if (isLoading) {
    return (
      <div
        className={cn("rounded-xl p-5", className)}
        style={{
          background: "hsl(var(--card))",
          border: "1.5px solid hsl(var(--border))",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2.5 flex-1">
            <div className="skeleton-shimmer h-3 w-24 rounded-full" />
            <div className="skeleton-shimmer h-8 w-16 rounded-lg" />
            <div className="skeleton-shimmer h-2.5 w-32 rounded-full" />
          </div>
          <div className="skeleton-shimmer h-10 w-10 rounded-lg shrink-0" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("group cursor-default", className)}
      style={{
        background: "hsl(var(--card))",
        border: "1.5px solid hsl(var(--border))",
        borderRadius: 12,
        padding: "18px 20px",
        boxShadow: "var(--shadow-sm)",
        transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "hsl(var(--primary))";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-lg)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "hsl(var(--border))";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-sm)";
        (e.currentTarget as HTMLDivElement).style.transform = "none";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{
            fontFamily: "var(--font-sans, 'Inter', system-ui, sans-serif)",
            fontSize: "1.9rem", lineHeight: 1,
            color: "hsl(var(--foreground))",
            marginBottom: 3, fontWeight: 700,
            letterSpacing: "-0.02em",
          }}>
            {value}
          </p>
          <p style={{ fontSize: "0.78rem", color: "hsl(var(--muted-foreground))" }}>{title}</p>
          {description && (
            <p style={{ fontSize: "0.72rem", color: "hsl(var(--muted-foreground) / 0.6)", marginTop: 4 }}>{description}</p>
          )}
        </div>
        <div style={{
          width: 36, height: 36, borderRadius: 8, flexShrink: 0,
          background: a.iconBg,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon style={{ width: 18, height: 18, color: a.iconColor }} />
        </div>
      </div>
      {trend && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
          {trend.positive === true  && <TrendingUp  style={{ width: 12, height: 12, color: "var(--color-success)" }} />}
          {trend.positive === false && <TrendingDown style={{ width: 12, height: 12, color: "var(--color-danger)" }} />}
          <span style={{
            fontSize: "0.74rem", fontWeight: 600,
            color: trend.positive === true ? "var(--color-success)" : trend.positive === false ? "var(--color-danger)" : "hsl(var(--muted-foreground))",
          }}>
            {trend.value > 0 ? "+" : ""}{trend.value}%
          </span>
          <span style={{ fontSize: "0.72rem", color: "hsl(var(--muted-foreground) / 0.6)" }}>{trend.label}</span>
        </div>
      )}
    </div>
  );
}
