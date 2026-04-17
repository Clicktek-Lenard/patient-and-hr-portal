"use client";

import { useState } from "react";
import { HrSidebar } from "@/components/hr/hr-sidebar";
import { HrHeader } from "@/components/hr/hr-header";
import { UatFeedbackButton } from "@/components/hr/uat-feedback-button";

export default function HrLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "hsl(var(--background))" }}>
      <HrSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div style={{ display: "flex", flex: 1, flexDirection: "column", overflow: "hidden" }}>
        <HrHeader onMenuClick={() => setSidebarOpen(true)} />
        <main style={{ flex: 1, overflowY: "auto" }} className="scrollbar-thin">
          <div style={{ padding: "28px 32px", maxWidth: 1280, margin: "0 auto" }} className="animate-slide-up">
            {children}
          </div>
        </main>
      </div>
      <UatFeedbackButton />
    </div>
  );
}
