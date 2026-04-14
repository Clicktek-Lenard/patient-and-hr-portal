"use client";

import {
  CheckCircle,
  Clock,
  Loader2,
  RefreshCw,
  AlertCircle,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQueuePolling } from "@/hooks/use-queue-polling";
import { QUEUE_STATIONS, STATUS_MAP } from "@/types";
import type { QueueStatusCode } from "@/types";
import { formatTimeAgo } from "@/lib/utils";

interface QueueTrackerProps {
  queueCode: string;
  className?: string;
}

const TERMINAL_STATUSES: QueueStatusCode[] = ["complete", "exit"];
const CALL_STATUSES: QueueStatusCode[] = ["in_progress", "next_room"];

function getStationIndex(stationKey: string): number {
  return QUEUE_STATIONS.findIndex((s) => s.key === stationKey);
}

export function QueueTracker({ queueCode, className }: QueueTrackerProps) {
  const { status, isLoading, isError, refetch } = useQueuePolling(queueCode, {
    enabled: true,
  });

  const currentStationIndex = status ? getStationIndex(status.station) : -1;
  const isComplete = status && TERMINAL_STATUSES.includes(status.status as QueueStatusCode);
  const isBeingCalled = status && CALL_STATUSES.includes(status.status as QueueStatusCode);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Queue Status</CardTitle>
          {!isComplete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              className="h-7 text-xs"
            >
              <RefreshCw className={cn("h-3 w-3 mr-1", isLoading && "animate-spin")} />
              Refresh
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Queue #{queueCode} · Updates automatically
        </p>
      </CardHeader>

      <CardContent className="space-y-4">

        {isLoading && !status && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Loading queue status...</span>
          </div>
        )}

        {isError && !status && (
          <div className="flex flex-col items-center justify-center py-6 gap-2">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-muted-foreground">Unable to load queue status</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>Try Again</Button>
          </div>
        )}

        {status && (
          <div className="space-y-4">

            {/* Current status banner */}
            <div className={cn(
              "flex items-center gap-3 rounded-xl p-4 border transition-all duration-300",
              isComplete
                ? "bg-(--color-success-bg) border-(--color-success)/25"
                : isBeingCalled
                ? "bg-primary/8 border-primary/30"
                : "bg-muted/40 border-border"
            )}>
              {isComplete ? (
                <CheckCircle className="h-6 w-6 text-(--color-success) shrink-0" />
              ) : isBeingCalled ? (
                <div className="relative shrink-0">
                  <Bell className="h-6 w-6 text-primary" />
                  <span className="absolute -right-1 -top-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
                  </span>
                </div>
              ) : (
                <div className="relative shrink-0">
                  <Clock className="h-6 w-6 text-primary" />
                  <span className="absolute -right-1 -top-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">
                  {STATUS_MAP[status.status as QueueStatusCode] ?? status.friendlyStatus}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {isComplete
                    ? "Your visit has been completed"
                    : `Current station: ${status.stationLabel}`}
                </p>
              </div>
              <Badge
                variant={isComplete ? "success" : isBeingCalled ? "active" : "secondary"}
                dot={isBeingCalled && !isComplete}
                className="shrink-0"
              >
                #{status.numOfCall}
              </Badge>
            </div>

            {/* Waiting info */}
            {!isComplete && status.waitingAhead > 0 && (
              <div className="flex items-center justify-between text-sm px-1">
                <span className="text-muted-foreground">Patients ahead</span>
                <span className="font-semibold tabular-nums">{status.waitingAhead}</span>
              </div>
            )}
            {!isComplete && status.estimatedWait !== undefined && (
              <div className="flex items-center justify-between text-sm px-1">
                <span className="text-muted-foreground">Estimated wait</span>
                <span className="font-semibold tabular-nums">{status.estimatedWait} min</span>
              </div>
            )}

            {/* Station progress */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">
                Visit Progress
              </p>
              <div className="relative">
                <div className="absolute left-2.75 top-3 bottom-3 w-0.5 bg-border" />
                <div
                  className="absolute left-2.75 top-3 w-0.5 bg-primary transition-all duration-500"
                  style={{
                    height: currentStationIndex >= 0
                      ? `${(currentStationIndex / (QUEUE_STATIONS.length - 1)) * 100}%`
                      : "0%",
                  }}
                />
                <ul className="space-y-3 relative">
                  {QUEUE_STATIONS.map((station, index) => {
                    const isDone = index < currentStationIndex;
                    const isCurrent = index === currentStationIndex;
                    return (
                      <li key={station.key} className="flex items-center gap-3">
                        <div className={cn(
                          "relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                          isDone      ? "border-primary bg-primary"
                          : isCurrent ? "border-primary bg-background"
                          : "border-border bg-background"
                        )}>
                          {isDone ? (
                            <CheckCircle className="h-3 w-3 text-primary-foreground" />
                          ) : isCurrent ? (
                            <div className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
                          ) : null}
                        </div>
                        <span className={cn(
                          "text-sm",
                          isCurrent ? "font-semibold text-foreground"
                          : isDone   ? "text-muted-foreground line-through"
                          : "text-muted-foreground"
                        )}>
                          {station.label}
                          {isCurrent && (
                            <span className="ml-2 text-xs text-primary font-normal">(current)</span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-right pt-1">
              Last updated: {formatTimeAgo(status.lastUpdated)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
