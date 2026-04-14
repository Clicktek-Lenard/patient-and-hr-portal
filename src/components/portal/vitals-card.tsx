import Link from "next/link";
import { HeartPulse, Thermometer, Wind, Scale, ChevronRight } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import type { Vitals } from "@/types";

interface VitalPillProps {
  icon: React.ReactNode;
  label: string;
  value?: string | number | null;
  unit?: string;
  accent?: string;
}

function VitalPill({ icon, label, value, unit, accent = "text-primary" }: VitalPillProps) {
  if (value === undefined || value === null) return null;
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-muted/40 px-3 py-2.5 min-w-0">
      <div className={cn("text-base", accent)}>{icon}</div>
      <p className={cn("text-base font-bold tabular-nums font-data leading-none", accent)}>
        {value}
        {unit && <span className="text-[10px] font-normal text-muted-foreground ml-0.5">{unit}</span>}
      </p>
      <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/60 leading-none">
        {label}
      </p>
    </div>
  );
}

interface VitalsCardProps {
  vitals: Vitals;
  className?: string;
}

export function VitalsCard({ vitals, className }: VitalsCardProps) {
  return (
    <Link href={`/vitals/${vitals.queueCode}`}>
      <div className={cn(
        "group relative rounded-xl border border-border bg-card p-4",
        "hover:border-primary/40 hover:shadow-(--glow-primary)",
        "transition-all duration-200 cursor-pointer overflow-hidden",
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-(--color-danger-bg) border border-(--color-danger)/20">
              <HeartPulse className="h-4 w-4 text-(--color-danger) animate-heartbeat" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground font-data">#{vitals.queueCode}</p>
              <p className="text-xs text-muted-foreground">{formatDate(vitals.date)}</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-150 shrink-0" />
        </div>

        {/* Vitals pills grid */}
        <div className="grid grid-cols-4 gap-1.5">
          <VitalPill
            icon={<HeartPulse className="h-3.5 w-3.5" />}
            label="BP"
            value={vitals.bp}
            accent="text-(--color-danger)"
          />
          <VitalPill
            icon={<Thermometer className="h-3.5 w-3.5" />}
            label="Temp"
            value={vitals.temp}
            unit="°C"
            accent="text-(--color-warning)"
          />
          <VitalPill
            icon={<Wind className="h-3.5 w-3.5" />}
            label="O₂ Sat"
            value={vitals.o2sat}
            unit="%"
            accent="text-primary"
          />
          <VitalPill
            icon={<Scale className="h-3.5 w-3.5" />}
            label="Weight"
            value={vitals.weight}
            unit="kg"
            accent="text-[#6C8EFF]"
          />
        </div>
      </div>
    </Link>
  );
}
