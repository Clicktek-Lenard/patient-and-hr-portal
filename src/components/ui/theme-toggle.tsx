"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div style={{ width: 34, height: 34 }} />;

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        width: 34, height: 34,
        display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: 8, border: "1.5px solid hsl(var(--border))",
        background: "transparent", cursor: "pointer",
        color: "hsl(var(--foreground))",
        transition: "all 0.15s",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "hsl(var(--accent))";
        e.currentTarget.style.borderColor = "hsl(var(--primary))";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.borderColor = "hsl(var(--border))";
      }}
    >
      {isDark
        ? <Sun  style={{ width: 15, height: 15 }} />
        : <Moon style={{ width: 15, height: 15 }} />
      }
    </button>
  );
}
