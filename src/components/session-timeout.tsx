"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { signOut, useSession } from "next-auth/react";
import { Shield, Clock } from "lucide-react";

const IDLE_TIMEOUT_MS  = 15 * 60 * 1000; // 15 minutes idle timeout
const WARNING_MS       =  2 * 60 * 1000; // show warning at 2 minutes remaining
const EVENTS: (keyof WindowEventMap)[] = [
  "mousemove", "mousedown", "keydown", "touchstart", "scroll", "click",
];

function fmt(ms: number) {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function SessionTimeout() {
  const { data: session } = useSession();
  const isHR = (session?.user as { role?: string })?.role === "HR" || (session?.user as { role?: string })?.role === "ADMIN";
  const loginUrl = isHR ? "/login?portal=hr" : "/login?portal=patient";

  const timerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiresAtRef  = useRef<number>(Date.now() + IDLE_TIMEOUT_MS);

  const [remaining, setRemaining] = useState<number | null>(null); // null = hidden
  const [signingOut, setSigningOut] = useState(false);

  const clearTick = useCallback(() => {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
  }, []);

  const startTick = useCallback(() => {
    clearTick();
    tickRef.current = setInterval(() => {
      const left = expiresAtRef.current - Date.now();
      if (left <= 0) {
        clearTick();
        setRemaining(0);
      } else {
        setRemaining(left);
      }
    }, 500);
  }, [clearTick]);

  const scheduleTimeout = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    expiresAtRef.current = Date.now() + IDLE_TIMEOUT_MS;

    // Hide warning (user was active)
    setRemaining(null);
    clearTick();

    // Schedule the warning appearance
    timerRef.current = setTimeout(() => {
      setRemaining(WARNING_MS);
      startTick();
    }, IDLE_TIMEOUT_MS - WARNING_MS);
  }, [clearTick, startTick]);

  // Sign out when countdown hits 0
  useEffect(() => {
    if (remaining !== null && remaining <= 0 && !signingOut) {
      setSigningOut(true);
      signOut({ callbackUrl: loginUrl });
    }
  }, [remaining, signingOut]);

  // Attach activity listeners
  useEffect(() => {
    scheduleTimeout();

    const handler = () => scheduleTimeout();
    EVENTS.forEach((e) => window.addEventListener(e, handler, { passive: true }));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      clearTick();
      EVENTS.forEach((e) => window.removeEventListener(e, handler));
    };
  }, [scheduleTimeout, clearTick]);

  function handleStayLoggedIn() {
    scheduleTimeout();
  }

  if (remaining === null) return null;

  const pct = Math.min(100, (remaining / WARNING_MS) * 100);
  const urgent = remaining < 60_000; // last minute — turn red

  return (
    <div
      style={{
        position: "fixed",
        bottom: 28,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        width: "min(420px, calc(100vw - 32px))",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 8px 40px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.12)",
        border: urgent ? "1.5px solid #E00500" : "1.5px solid #1006A0",
        background: "hsl(var(--card))",
        animation: "slide-up-banner 0.3s ease",
      }}
    >
      {/* Progress bar */}
      <div style={{ height: 3, background: "hsl(var(--muted))" }}>
        <div style={{
          height: "100%",
          width: `${pct}%`,
          background: urgent ? "#E00500" : "#1006A0",
          transition: "width 0.5s linear, background 0.3s",
        }} />
      </div>

      <div style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
        {/* Icon */}
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: urgent ? "#fff0f0" : "#eef2ff",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {urgent
            ? <Clock style={{ width: 20, height: 20, color: "#E00500" }} />
            : <Shield style={{ width: 20, height: 20, color: "#1006A0" }} />
          }
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: "0.82rem", fontWeight: 700,
            color: urgent ? "#E00500" : "#1006A0",
            lineHeight: 1.2, margin: 0,
          }}>
            {signingOut ? "Signing you out…" : "Session expiring soon"}
          </p>
          <p style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", margin: "3px 0 0", lineHeight: 1.3 }}>
            {signingOut
              ? "Redirecting to login…"
              : <>Your session will expire in <strong style={{ fontVariantNumeric: "tabular-nums", color: urgent ? "#E00500" : "hsl(var(--foreground))" }}>{fmt(remaining ?? 0)}</strong> due to inactivity.</>
            }
          </p>
        </div>

        {/* Button */}
        {!signingOut && (
          <button
            onClick={handleStayLoggedIn}
            style={{
              flexShrink: 0,
              padding: "8px 14px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              fontSize: "0.78rem",
              fontWeight: 700,
              color: "white",
              background: urgent ? "#E00500" : "#1006A0",
              transition: "opacity 0.15s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Stay Logged In
          </button>
        )}
      </div>

      <style>{`
        @keyframes slide-up-banner {
          from { opacity: 0; transform: translateX(-50%) translateY(16px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
