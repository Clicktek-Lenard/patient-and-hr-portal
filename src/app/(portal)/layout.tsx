"use client";

import { useState } from "react";
import { Sidebar } from "@/components/portal/sidebar";
import { Header } from "@/components/portal/header";
import { QueueAlertProvider } from "@/components/portal/queue-alert-provider";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "hsl(var(--background))" }}>
      <QueueAlertProvider />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div style={{ display: "flex", flex: 1, flexDirection: "column", overflow: "hidden" }}>
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main style={{ flex: 1, overflowY: "auto" }} className="scrollbar-thin">
          <div style={{ padding: "28px 32px", maxWidth: 1280, margin: "0 auto" }} className="animate-slide-up">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
