"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted]       = useState(false);
  const [pulling, setPulling]       = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div style={{ width: 36, height: 64 }} />;

  const isDark = resolvedTheme === "dark";

  function handleClick() {
    setPulling(true);
    setTimeout(() => {
      setTheme(isDark ? "light" : "dark");
      setPulling(false);
    }, 420);
  }

  const bulbGlow = isDark
    ? "0 0 18px 6px rgba(251,191,36,0.55), 0 0 6px 2px rgba(251,191,36,0.8)"
    : "none";
  const ropeColor = isDark ? "rgba(251,191,36,0.55)" : "rgba(148,163,184,0.5)";

  return (
    <button
      onClick={handleClick}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        position: "relative",
        width: 36, height: 64,
        background: "transparent", border: "none", cursor: "pointer",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "flex-start",
        padding: 0, flexShrink: 0, gap: 0,
      }}
    >
      {/* Ceiling mount */}
      <div style={{
        width: 14, height: 4, borderRadius: "3px 3px 0 0", flexShrink: 0,
        background: isDark ? "rgba(251,191,36,0.4)" : "rgba(148,163,184,0.35)",
        transition: "background 0.4s",
      }}/>

      {/* Bulb socket */}
      <div style={{
        width: 10, height: 5, borderRadius: "0 0 2px 2px", flexShrink: 0,
        background: isDark ? "#a16207" : "#64748b",
        transition: "background 0.4s",
      }}/>

      {/* Bulb */}
      <div style={{
        width: 22, height: 24, flexShrink: 0,
        borderRadius: "50% 50% 42% 42%",
        background: isDark
          ? "radial-gradient(circle at 40% 35%, #fef3c7, #fbbf24 60%, #d97706)"
          : "radial-gradient(circle at 40% 35%, #f1f5f9, #cbd5e1 60%, #94a3b8)",
        boxShadow: bulbGlow,
        transition: "background 0.4s, box-shadow 0.4s",
        animation: pulling ? "bulb-swing 0.42s ease-in-out" : "none",
        position: "relative",
      }}>
        {/* shine */}
        <div style={{
          position: "absolute", top: 5, left: 5,
          width: 5, height: 4, borderRadius: "50%",
          background: isDark ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.4)",
        }}/>
      </div>

      {/* Rope — hangs below the bulb */}
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        transformOrigin: "top center",
        animation: pulling ? "rope-pull 0.42s ease-in-out" : "rope-idle 3s ease-in-out infinite",
      }}>
        <div style={{
          width: 2, height: 20,
          background: ropeColor,
          borderRadius: 1,
          transition: "background 0.4s",
        }}/>
        {/* knot */}
        <div style={{
          width: 7, height: 7, borderRadius: "50%",
          background: ropeColor,
          transition: "background 0.4s",
          boxShadow: isDark ? "0 0 4px rgba(251,191,36,0.4)" : "none",
        }}/>
      </div>

      <style>{`
        @keyframes rope-idle {
          0%, 100% { transform: rotate(0deg); }
          50%       { transform: rotate(2.5deg); }
        }
        @keyframes rope-pull {
          0%   { transform: translateY(0)   rotate(0deg); }
          30%  { transform: translateY(6px) rotate(0deg); }
          55%  { transform: translateY(2px) rotate(7deg); }
          75%  { transform: translateY(1px) rotate(-4deg); }
          100% { transform: translateY(0)   rotate(0deg); }
        }
        @keyframes bulb-swing {
          0%   { transform: rotate(0deg); }
          30%  { transform: rotate(5deg); }
          65%  { transform: rotate(-3deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>
    </button>
  );
}
