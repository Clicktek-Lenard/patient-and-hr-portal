"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  FileText,
  Activity,
  CreditCard,
  Stethoscope,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { QueueTracker } from "@/components/portal/queue-tracker";
import { formatDate, formatCurrency, getStatusColor } from "@/lib/utils";
import { STATUS_MAP } from "@/types";
import type { VisitDetail } from "@/types";

async function fetchVisit(code: string): Promise<VisitDetail> {
  const res = await fetch(`/api/visits/${code}`);
  if (!res.ok) throw new Error("Visit not found");
  const json = await res.json();
  return json.data;
}

interface PageProps {
  params: Promise<{ code: string }>;
}

export default function VisitDetailPage({ params }: PageProps) {
  const { code } = use(params);

  const { data: visit, isLoading, isError } = useQuery({
    queryKey: ["visit", code],
    queryFn: () => fetchVisit(code),
  });

  const isActiveVisit =
    visit &&
    visit.status !== "complete" &&
    visit.status !== "exit";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !visit) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Visit Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The visit you&apos;re looking for doesn&apos;t exist or you don&apos;t have access.
        </p>
        <Button asChild>
          <Link href="/visits">Back to Visits</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/visits">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Visits
        </Link>
      </Button>

      {/* Visit header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Visit #{visit.code}
          </h1>
          <p className="text-muted-foreground">{formatDate(visit.date)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            className={getStatusColor(visit.status)}
            variant="outline"
          >
            {STATUS_MAP[visit.status] ?? visit.status}
          </Badge>
          <Badge variant={visit.isPaid ? "success" : "warning"}>
            {visit.isPaid ? "Paid" : "Unpaid"}
          </Badge>
        </div>
      </div>

      {/* Queue tracker for active visits */}
      {isActiveVisit && (
        <QueueTracker queueCode={visit.code} />
      )}

      {/* Visit info card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Visit Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {visit.doctor && (
              <div>
                <p className="text-xs text-muted-foreground">Physician</p>
                <p className="text-sm font-medium">Dr. {visit.doctor.name}</p>
                {visit.doctor.specialty && (
                  <p className="text-xs text-muted-foreground">{visit.doctor.specialty}</p>
                )}
              </div>
            )}
            {visit.department && (
              <div>
                <p className="text-xs text-muted-foreground">Department</p>
                <p className="text-sm font-medium">{visit.department}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Total Amount</p>
              <p className="text-sm font-bold">{formatCurrency(visit.totalAmount)}</p>
            </div>
          </div>

          {visit.chiefComplaint && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-1">Chief Complaint</p>
                <p className="text-sm">{visit.chiefComplaint}</p>
              </div>
            </>
          )}

          {visit.diagnosis && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Diagnosis</p>
              <p className="text-sm">{visit.diagnosis}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Services */}
      {visit.services && visit.services.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {visit.services.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between py-1"
                >
                  <div>
                    <p className="text-sm font-medium">{service.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Code: {service.code}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">
                    {formatCurrency(service.amount)}
                  </p>
                </div>
              ))}
              <Separator />
              <div className="flex items-center justify-between">
                <p className="font-semibold">Total</p>
                <p className="font-bold text-lg">
                  {formatCurrency(visit.totalAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {visit.hasResults && (
          <Button variant="outline" asChild>
            <Link href={`/results/${visit.code}`}>
              <FileText className="mr-2 h-4 w-4" />
              View Results
            </Link>
          </Button>
        )}
        {visit.hasVitals && (
          <Button variant="outline" asChild>
            <Link href={`/vitals/${visit.code}`}>
              <Activity className="mr-2 h-4 w-4" />
              View Vitals
            </Link>
          </Button>
        )}
        <Button variant="outline" asChild>
          <Link href={`/payments/${visit.code}`}>
            <CreditCard className="mr-2 h-4 w-4" />
            View Payment
          </Link>
        </Button>
      </div>
    </div>
  );
}
