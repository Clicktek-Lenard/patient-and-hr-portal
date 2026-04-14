"use client";

import { useEffect } from "react";
import { useQueueStore } from "@/store/queue-store";
import { useQueueAlert } from "@/hooks/use-queue-alert";
import { QueueAlertModal } from "@/components/portal/queue-alert-modal";

/**
 * Mounted once in the portal layout — persists across all page navigations.
 * Reads alert state from Zustand store and owns the audio lifecycle.
 */
export function QueueAlertProvider() {
  const { alertStatus, alertMuted, setAlertMuted, acknowledgeAlert } = useQueueStore();
  const { triggerAlert, stopSound } = useQueueAlert({ muteSound: false, muteVibration: false });

  // Play sound whenever a new alert status arrives
  useEffect(() => {
    if (alertStatus && !alertMuted) {
      triggerAlert(alertStatus.status);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alertStatus?.queueCode, alertStatus?.status]);

  // Stop sound when muted via store
  useEffect(() => {
    if (alertMuted) stopSound();
  }, [alertMuted, stopSound]);

  if (!alertStatus) return null;

  return (
    <QueueAlertModal
      status={alertStatus}
      onDismiss={() => {
        stopSound();
        acknowledgeAlert(alertStatus.queueCode, alertStatus.status);
        setAlertMuted(false);
      }}
      onMute={() => {
        stopSound();
        setAlertMuted(true);
      }}
    />
  );
}
