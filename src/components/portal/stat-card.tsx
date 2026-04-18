"use client";

import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

/* Smooth count-up animation */
function CountUp({ to }: { to: number }) {
  const [n, setN] = useState(0);
  const prevRef = useRef(0);
  useEffect(() => {
    const from = prevRef.current;
    const duration = 800;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setN(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else prevRef.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <>{n.toLocaleString()}</>;
}

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

const ACCENT: Record<string, { iconBg: string; iconColor: string; bar: string }> = {
  blue:   { iconBg: "#EEF2FF", iconColor: "#4F46E5", bar: "#4F46E5" },
  cyan:   { iconBg: "#EFF6FF", iconColor: "#2563EB", bar: "#2563EB" },
  purple: { iconBg: "#F5F3FF", iconColor: "#7C3AED", bar: "#7C3AED" },
  amber:  { iconBg: "#FFFBEB", iconColor: "#D97706", bar: "#D97706" },
  green:  { iconBg: "#F0FDF4", iconColor: "#16A34A", bar: "#16A34A" },
  red:    { iconBg: "#FEF2F2", iconColor: "#DC2626", bar: "#DC2626" },
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
          background: "var(--ui-card)",
          border: "1px solid var(--ui-border)",
          boxShadow: "0 1px 3px var(--ui-shadow)",
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
        background: "var(--ui-card)",
        border: "1px solid var(--ui-border)",
        borderRadius: 12,
        padding: "18px 20px",
        boxShadow: "0 1px 3px var(--ui-shadow)",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = a.bar + "66";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 12px var(--ui-shadow-md)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--ui-border)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 3px var(--ui-shadow)";
        (e.currentTarget as HTMLDivElement).style.transform = "none";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            className="tabular-nums"
            style={{
              fontFamily: "var(--font-sans, 'Inter', system-ui, sans-serif)",
              fontSize: "1.85rem", lineHeight: 1,
              color: "var(--ui-text-primary)",
              marginBottom: 4, fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            {typeof value === "number" ? <CountUp to={value} /> : value}
          </p>
          <p style={{ fontSize: "0.78rem", color: "var(--ui-text-secondary)", fontWeight: 500 }}>{title}</p>
          {description && (
            <p style={{ fontSize: "0.72rem", color: "var(--ui-text-faint)", marginTop: 3 }}>{description}</p>
          )}
        </div>
        <div style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: a.iconBg,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon style={{ width: 18, height: 18, color: a.iconColor }} />
        </div>
      </div>
      {trend && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
          {trend.positive === true  && <TrendingUp  style={{ width: 12, height: 12, color: "#16A34A" }} />}
          {trend.positive === false && <TrendingDown style={{ width: 12, height: 12, color: "#DC2626" }} />}
          <span style={{
            fontSize: "0.74rem", fontWeight: 600,
            color: trend.positive === true ? "#16A34A" : trend.positive === false ? "#DC2626" : "#6B7280",
          }}>
            {trend.value > 0 ? "+" : ""}{trend.value}%
          </span>
          <span style={{ fontSize: "0.72rem", color: "#9CA3AF" }}>{trend.label}</span>
        </div>
      )}
    </div>
  );
}
