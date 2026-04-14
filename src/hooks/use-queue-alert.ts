"use client";

import { useCallback, useRef } from "react";
import type { QueueStatusCode } from "@/types";

const ALERT_STATUSES: QueueStatusCode[] = ["in_progress", "next_room"];

const BEEP_DURATION = 0.08; // 80ms on
const BEEP_GAP     = 0.10; // 100ms off
const BEEPS_PER_BURST = 4; // 4 beeps then a longer pause
const BURST_PAUSE  = 0.6;  // 600ms pause between bursts

function scheduleBurst(ctx: AudioContext, startTime: number, frequency: number) {
  for (let i = 0; i < BEEPS_PER_BURST; i++) {
    const t = startTime + i * (BEEP_DURATION + BEEP_GAP);
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "square";
    osc.frequency.setValueAtTime(frequency, t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.35, t + 0.005);
    gain.gain.setValueAtTime(0.35, t + BEEP_DURATION - 0.005);
    gain.gain.linearRampToValueAtTime(0, t + BEEP_DURATION);
    osc.start(t);
    osc.stop(t + BEEP_DURATION);
  }
}

function triggerVibration() {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  navigator.vibrate([80, 100, 80, 100, 80, 100, 80, 600, 80, 100, 80, 100, 80, 100, 80]);
}

export interface UseQueueAlertOptions {
  alertStatuses?: QueueStatusCode[];
  muteSound?: boolean;
  muteVibration?: boolean;
}

export function useQueueAlert(options: UseQueueAlertOptions = {}) {
  const {
    alertStatuses = ALERT_STATUSES,
    muteSound = false,
    muteVibration = false,
  } = options;

  const lastAlertedStatusRef = useRef<string | null>(null);
  // AudioContext kept alive while alert is ringing so we can close it to stop
  const audioCtxRef = useRef<AudioContext | null>(null);
  const loopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Stop sound immediately */
  const stopSound = useCallback(() => {
    if (loopTimerRef.current) {
      clearTimeout(loopTimerRef.current);
      loopTimerRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(0); // cancel vibration
    }
  }, []);

  const startLoopingSound = useCallback(async () => {
    try {
      const AudioCtx =
        window.AudioContext ??
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      // Stop any previous instance first
      stopSound();

      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      if (ctx.state === "suspended") await ctx.resume();

      const burstDuration = BEEPS_PER_BURST * (BEEP_DURATION + BEEP_GAP);
      const repeatInterval = (burstDuration + BURST_PAUSE) * 1000; // ms

      // Schedule first burst immediately, then repeat
      const scheduleNext = () => {
        if (!audioCtxRef.current) return; // stopped
        scheduleBurst(ctx, ctx.currentTime + 0.01, 1050);
        loopTimerRef.current = setTimeout(scheduleNext, repeatInterval);
      };

      scheduleNext();
    } catch {
      // Silently fail
    }
  }, [stopSound]);

  const triggerAlert = useCallback(
    async (newStatus: QueueStatusCode) => {
      const shouldAlert = alertStatuses.includes(newStatus);
      const isNewStatus = lastAlertedStatusRef.current !== newStatus;
      if (!shouldAlert || !isNewStatus) return;

      lastAlertedStatusRef.current = newStatus;

      if (!muteSound) await startLoopingSound();
      if (!muteVibration) triggerVibration();
    },
    [alertStatuses, muteSound, muteVibration, startLoopingSound]
  );

  const resetAlert = useCallback(() => {
    lastAlertedStatusRef.current = null;
    stopSound();
  }, [stopSound]);

  return { triggerAlert, stopSound, resetAlert };
}
