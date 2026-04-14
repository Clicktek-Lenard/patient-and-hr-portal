"use client";

import { useEffect, useRef } from "react";
import { Bell, X, VolumeX, MapPin, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_MAP } from "@/types";
import type { QueueStatusData, QueueStatusCode } from "@/types";

interface QueueAlertModalProps {
  status: QueueStatusData;
  onDismiss: () => void;   // close + stop sound
  onMute: () => void;      // stop sound, keep modal open briefly then close
}

export function QueueAlertModal({ status, onDismiss, onMute }: QueueAlertModalProps) {
  const isNextRoom = status.status === "next_room";

  // Trap focus inside modal
  const dismissBtnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    dismissBtnRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onDismiss]);

  return (
    <>
      {/* Backdrop — dark solid, no blur */}
      <div
        className="fixed inset-0 z-50 bg-black/70 animate-in fade-in duration-150"
        onClick={onDismiss}
        aria-hidden="true"
      />

      {/* Modal — solid white (light) / solid gray-900 (dark) */}
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="queue-alert-title"
        className={cn(
          "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
          "w-[calc(100vw-2rem)] max-w-sm",
          "animate-in zoom-in-95 fade-in duration-150"
        )}
      >
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-2xl">

          {/* Close button */}
          <button
            onClick={onDismiss}
            className="absolute right-4 top-4 rounded-full p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="px-6 pt-8 pb-6 space-y-6">

            {/* Bell icon */}
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950">
                <span className="absolute inline-flex h-full w-full rounded-full bg-blue-100 dark:bg-blue-900 animate-ping opacity-60" />
                <Bell className="relative h-9 w-9 text-blue-600 dark:text-blue-400 animate-live-blink" />
              </div>

              <div>
                <p
                  id="queue-alert-title"
                  className="text-xl font-bold text-gray-900 dark:text-white"
                >
                  {isNextRoom ? "Proceed to Next Station" : "You Are Being Called!"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {isNextRoom
                    ? "Please move to the next station now"
                    : "Please approach the station immediately"}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 dark:border-gray-800" />

            {/* Queue info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Station
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">{status.stationLabel}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Queue #</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 font-data">{status.queueCode}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Status</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {STATUS_MAP[status.status as QueueStatusCode] ?? status.friendlyStatus}
                </span>
              </div>
              {status.numOfCall > 1 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> Times called
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">{status.numOfCall}×</span>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 dark:border-gray-800" />

            {/* Action buttons */}
            <div className="flex flex-col gap-2">
              <button
                ref={dismissBtnRef}
                onClick={onDismiss}
                className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-base transition-colors flex items-center justify-center gap-2"
              >
                <Bell className="h-4 w-4" />
                Got it, I&apos;m on my way!
              </button>

              <button
                onClick={onMute}
                className="w-full h-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <VolumeX className="h-4 w-4" />
                Mute sound
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
