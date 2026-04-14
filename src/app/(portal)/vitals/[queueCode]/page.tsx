"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Activity, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { Vitals } from "@/types";

async function fetchVitalsDetail(queueCode: string): Promise<Vitals> {
  const res = await fetch(`/api/vitals/${queueCode}`);
  if (!res.ok) throw new Error("Vitals not found");
  const json = await res.json();
  return json.data;
}

interface PageProps {
  params: Promise<{ queueCode: string }>;
}

interface VitalRowProps {
  label: string;
  value?: string | number | null;
  unit?: string;
  normalRange?: string;
}

function VitalRow({ label, value, unit, normalRange }: VitalRowProps) {
  if (value === undefined || value === null) return null;
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {normalRange && (
          <p className="text-xs text-muted-foreground">Normal: {normalRange}</p>
        )}
      </div>
      <p className="text-sm font-semibold">
        {value}
        {unit && (
          <span className="text-xs text-muted-foreground ml-1">{unit}</span>
        )}
      </p>
    </div>
  );
}

export default function VitalsDetailPage({ params }: PageProps) {
  const { queueCode } = use(params);

  const { data: vitals, isLoading, isError } = useQuery({
    queryKey: ["vitals", queueCode],
    queryFn: () => fetchVitalsDetail(queueCode),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !vitals) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Vitals Not Found</h2>
        <p className="text-muted-foreground mb-4">
          No vital signs found for this visit.
        </p>
        <Button asChild>
          <Link href="/vitals">Back to Vitals</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/vitals">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Vitals
        </Link>
      </Button>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Vital Signs
          </h1>
          <p className="text-muted-foreground">
            Visit #{vitals.queueCode} · {formatDate(vitals.date)}
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <Activity className="h-5 w-5 text-red-600" />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Measurements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <VitalRow
            label="Blood Pressure"
            value={vitals.bp}
            normalRange="90-120 / 60-80 mmHg"
          />
          <VitalRow
            label="Temperature"
            value={vitals.temp}
            unit="°C"
            normalRange="36.1 - 37.2 °C"
          />
          <VitalRow
            label="Pulse Rate"
            value={vitals.pulse}
            unit="bpm"
            normalRange="60 - 100 bpm"
          />
          <VitalRow
            label="Respiratory Rate"
            value={vitals.respiratoryRate}
            unit="/min"
            normalRange="12 - 20 /min"
          />
          <VitalRow
            label="Oxygen Saturation"
            value={vitals.o2sat}
            unit="%"
            normalRange=">= 95%"
          />
          <VitalRow
            label="Weight"
            value={vitals.weight}
            unit="kg"
          />
          <VitalRow
            label="Height"
            value={vitals.height}
            unit="cm"
          />
          {vitals.bmi && (
            <VitalRow
              label="BMI"
              value={vitals.bmi.toFixed(1)}
              normalRange="18.5 - 24.9"
            />
          )}
          {vitals.painScale !== undefined && vitals.painScale !== null && (
            <VitalRow
              label="Pain Scale"
              value={`${vitals.painScale}/10`}
              normalRange="0 = No pain"
            />
          )}
        </CardContent>
      </Card>

      {vitals.recordedBy && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Recorded By</p>
                <p className="text-sm font-medium">{vitals.recordedBy}</p>
              </div>
              {vitals.recordedAt && (
                <div>
                  <p className="text-xs text-muted-foreground">Recorded At</p>
                  <p className="text-sm font-medium">
                    {formatDateTime(vitals.recordedAt)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
