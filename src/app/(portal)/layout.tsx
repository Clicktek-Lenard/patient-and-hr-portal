"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/portal/sidebar";
import { Header } from "@/components/portal/header";
import { QueueAlertProvider } from "@/components/portal/queue-alert-provider";
import { UatFeedbackButton } from "@/components/hr/uat-feedback-button";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed]     = useState(false);
  const pathname                      = usePathname();

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--ui-bg)" }}>
      <QueueAlertProvider />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(c => !c)}
      />

      <div style={{ display: "flex", flex: 1, flexDirection: "column", overflow: "hidden" }}>
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main style={{ flex: 1, overflowY: "auto" }} className="scrollbar-thin">
          <div
            key={pathname}
            style={{ padding: "28px 32px", maxWidth: 1280, margin: "0 auto" }}
            className="nwd-page-fade"
          >
            {children}
          </div>
        </main>
      </div>
      <UatFeedbackButton />
    </div>
  );
}
