"use client";

import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Menu, LogOut, ChevronDown, ShieldCheck, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getInitials } from "@/lib/utils";

const PAGE_LABELS: Record<string, string> = {
  dashboard:  "Dashboard",
  employees:  "Employees",
  compliance: "PE Compliance",
  wellness:   "Wellness Trends",
  reports:    "Reports & Exports",
  scheduling: "Bulk Scheduling",
  audit:      "Audit Trail",
  settings:        "Account Settings",
  "uat-feedback":  "UAT Feedback",
  visits:          "All Visits",
  results:    "Lab Results",
  vitals:     "Vital Signs",
  payments:   "Payments",
};

interface HrHeaderProps {
  onMenuClick?: () => void;
}

export function HrHeader({ onMenuClick }: HrHeaderProps) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const firstName = session?.user?.firstName ?? "";
  const lastName  = session?.user?.lastName  ?? "";
  const email     = session?.user?.email     ?? "";
  const initials  = firstName && lastName ? getInitials(firstName, lastName) : "HR";

  const segments = pathname.split("/").filter(Boolean);
  const section = segments[1] ?? "dashboard";
  const pageTitle = PAGE_LABELS[section] ?? section;

  return (
    <header style={{
      background: "#ffffff",
      borderBottom: "1px solid #E8EAED",
      padding: "0 24px",
      height: 56,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      position: "sticky",
      top: 0,
      zIndex: 50,
      boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      flexShrink: 0,
    }}>
      {/* Left: mobile menu + page title */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
          style={{ color: "#6B7280" }}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>

        <h1 style={{
          fontFamily: "var(--font-sans, 'Inter', system-ui, sans-serif)",
          fontSize: "0.95rem",
          color: "#111827",
          fontWeight: 600,
          lineHeight: 1,
          letterSpacing: "-0.01em",
        }}>
          {pageTitle}
        </h1>
      </div>

      {/* Right: theme toggle + HR badge + user */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <ThemeToggle />
        {/* HR access badge */}
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "3px 10px", borderRadius: 20,
          background: "#EEF2FF", border: "1px solid #C7D2FE",
        }}
        className="hidden sm:flex"
        >
          <ShieldCheck style={{ width: 12, height: 12, color: "#4F46E5" }} />
          <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#4F46E5", letterSpacing: "0.06em" }}>
            HR ACCESS
          </span>
        </div>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "4px 8px", borderRadius: 8,
              background: "transparent", border: "none", cursor: "pointer",
              transition: "background 0.15s",
            }}
            className="hover:bg-gray-100"
            >
              <div style={{
                width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                background: "#08036A",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.72rem", fontWeight: 700, color: "white",
              }}>
                {initials}
              </div>
              <span style={{
                fontSize: "0.84rem", fontWeight: 500, color: "#111827",
                maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}
              className="hidden sm:block"
              >
                {firstName} {lastName[0]}.
              </span>
              <ChevronDown className="hidden sm:block h-3.5 w-3.5" style={{ color: "#9CA3AF" }} />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            style={{
              width: 220,
              background: "#ffffff",
              border: "1px solid #E8EAED",
              borderRadius: 10,
              boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
            }}
          >
            <DropdownMenuLabel style={{ padding: "12px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                  background: "#08036A",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.75rem", fontWeight: 700, color: "white",
                }}>
                  {initials}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#111827", lineHeight: 1 }}>
                    {firstName} {lastName}
                  </p>
                  <p style={{ fontSize: "0.72rem", color: "#6B7280", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {email}
                  </p>
                  <p style={{ fontSize: "0.68rem", color: "#4F46E5", marginTop: 2, fontWeight: 600 }}>HR Staff</p>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link href="/hr/settings" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.84rem", color: "#374151", cursor: "pointer" }}>
                <Settings className="h-4 w-4" />
                Account Settings
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login?portal=hr" })}
              style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.84rem", color: "#DC2626", cursor: "pointer" }}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
