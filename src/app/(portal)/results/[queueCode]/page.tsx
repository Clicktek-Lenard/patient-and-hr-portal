"use client";

import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  FileText,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { ResultDetail } from "@/types";

async function fetchResult(queueCode: string): Promise<ResultDetail> {
  const res = await fetch(`/api/results/${queueCode}`);
  if (!res.ok) throw new Error("Result not found");
  const json = await res.json();
  return json.data;
}

interface PageProps {
  params: Promise<{ queueCode: string }>;
}

export default function ResultDetailPage({ params }: PageProps) {
  const { queueCode } = use(params);
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: result, isLoading, isError } = useQuery({
    queryKey: ["result", queueCode],
    queryFn: () => fetchResult(queueCode),
  });

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      const res = await fetch(`/api/results/${queueCode}/pdf`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("PDF not available for this result");
        throw new Error("Failed to get PDF");
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `result-${queueCode}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to open PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !result) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Result Not Found</h2>
        <p className="text-muted-foreground mb-4">
          This result doesn&apos;t exist or you don&apos;t have access.
        </p>
        <Button asChild>
          <Link href="/results">Back to Results</Link>
        </Button>
      </div>
    );
  }

  const typeLabels = {
    lab: "Laboratory",
    imaging: "Imaging",
    pathology: "Pathology",
    other: "Other",
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/results">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Results
        </Link>
      </Button>

      {/* Result header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {result.description}
          </h1>
          <p className="text-muted-foreground">
            {formatDate(result.date)}{result.transNo ? ` · Accession #${result.transNo}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {typeLabels[result.type] && (
            <Badge variant="outline" className="capitalize">
              {typeLabels[result.type]}
            </Badge>
          )}
          <Badge
            variant={result.status === "released" || result.status === "verified" ? "success" : "warning"}
            className="capitalize"
          >
            {result.status}
          </Badge>
        </div>
      </div>

      {/* PDF action */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              <div>
                <p className="font-medium text-sm">PDF Report</p>
                <p className="text-xs text-muted-foreground">
                  Download your complete result report as PDF
                </p>
              </div>
            </div>
            <Button
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              size="sm"
              className="gap-2"
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Download PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Result info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Result Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Visit Code</p>
              <p className="text-sm font-medium">#{result.queueCode}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="text-sm font-medium">{formatDate(result.date)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Type</p>
              <p className="text-sm font-medium">{typeLabels[result.type]}</p>
            </div>
            {result.requestedBy && (
              <div>
                <p className="text-xs text-muted-foreground">Requested By</p>
                <p className="text-sm font-medium">Dr. {result.requestedBy}</p>
              </div>
            )}
            {result.releasedAt && (
              <div>
                <p className="text-xs text-muted-foreground">Released At</p>
                <p className="text-sm font-medium">{formatDateTime(result.releasedAt)}</p>
              </div>
            )}
            {result.verifiedBy && (
              <div>
                <p className="text-xs text-muted-foreground">Verified By</p>
                <p className="text-sm font-medium">{result.verifiedBy}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Services ordered */}
      {result.parameters && result.parameters.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Services Ordered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {result.parameters.map((param, index) => (
                <div key={index} className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3.5 py-2.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
                  <p className="text-sm font-medium text-foreground">{param.name}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Detailed result values are available in the PDF report. Download it above.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
