"use client";

import { useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useQueueStore } from "@/store/queue-store";
import type { QueueStatusData, QueueStatusCode } from "@/types";

const POLL_INTERVAL = process.env.NODE_ENV === "development" ? 10_000 : 30_000;

const ALERT_STATUSES: QueueStatusCode[] = ["in_progress", "next_room"];

async function fetchQueueStatus(queueCode: string): Promise<QueueStatusData> {
  const response = await fetch(`/api/visits/${queueCode}/queue-status`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Failed to fetch queue status");
  const json = await response.json();
  return json.data as QueueStatusData;
}

interface UseQueuePollingOptions {
  enabled?: boolean;
  onStatusChange?: (status: QueueStatusData) => void;
}

export function useQueuePolling(
  queueCode: string | null | undefined,
  options: UseQueuePollingOptions = {}
) {
  const { enabled = true, onStatusChange } = options;
  const {
    setQueueStatus,
    addPollingCode,
    removePollingCode,
    getQueueStatus,
    setAlert,
    alertMuted,
    isAlertAcknowledged,
  } = useQueueStore();

  const previousStatusRef = useRef<string | null>(null);
  const onStatusChangeRef = useRef(onStatusChange);
  useEffect(() => { onStatusChangeRef.current = onStatusChange; }, [onStatusChange]);

  const isEnabled = enabled && !!queueCode;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["queue-status", queueCode],
    queryFn: () => fetchQueueStatus(queueCode!),
    enabled: isEnabled,
    refetchInterval: POLL_INTERVAL,
    refetchIntervalInBackground: false,
    staleTime: POLL_INTERVAL - 5_000,
    retry: 2,
  });

  useEffect(() => {
    if (data && queueCode) {
      setQueueStatus(queueCode, data);

      if (previousStatusRef.current !== data.status) {
        if (previousStatusRef.current !== null) {
          // Push alert into global store — layout will show modal + play sound
          if (
            !alertMuted &&
            ALERT_STATUSES.includes(data.status as QueueStatusCode) &&
            !isAlertAcknowledged(queueCode, data.status)
          ) {
            setAlert(data);
          }
          onStatusChangeRef.current?.(data);
        }
        previousStatusRef.current = data.status;
      }
    }
  }, [data, queueCode, setQueueStatus, setAlert, alertMuted, isAlertAcknowledged]);

  useEffect(() => {
    if (isEnabled && queueCode) {
      addPollingCode(queueCode);
      return () => removePollingCode(queueCode);
    }
  }, [isEnabled, queueCode, addPollingCode, removePollingCode]);

  const cachedStatus = queueCode ? getQueueStatus(queueCode) : undefined;
  const currentStatus = data ?? cachedStatus;

  const manualRefetch = useCallback(() => {
    if (isEnabled) return refetch();
  }, [isEnabled, refetch]);

  return {
    status: currentStatus,
    isLoading: isLoading && !cachedStatus,
    isError,
    error,
    refetch: manualRefetch,
    isStale: !data && !!cachedStatus,
  };
}
