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
  settings:   "Account Settings",
  visits:     "All Visits",
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
      background: "hsl(var(--card))",
      borderBottom: "3px solid #E00500",
      padding: "0 32px",
      height: 60,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      position: "sticky",
      top: 0,
      zIndex: 50,
      boxShadow: "0 2px 8px rgba(16,6,160,0.08)",
      flexShrink: 0,
    }}>
      {/* Left: mobile menu + page title */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
          style={{ color: "#08036A" }}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>

        <h1 style={{
          fontFamily: "var(--font-playfair, Georgia, serif)",
          fontSize: "1.15rem",
          color: "hsl(var(--foreground))",
          fontWeight: 700,
          lineHeight: 1,
        }}>
          {pageTitle}
        </h1>
      </div>

      {/* Right: theme toggle + HR badge + user */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <ThemeToggle />
        {/* HR access badge */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "4px 12px", borderRadius: 20,
          background: "rgba(8,3,106,0.06)", border: "1px solid rgba(8,3,106,0.15)",
        }}
        className="hidden sm:flex"
        >
          <ShieldCheck style={{ width: 13, height: 13, color: "#08036A" }} />
          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#08036A", letterSpacing: "0.08em" }}>
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
            className="hover:bg-[#F5F7FA]"
            >
              <div style={{
                width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                background: "#08036A",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.75rem", fontWeight: 700, color: "white",
              }}>
                {initials}
              </div>
              <span style={{
                fontSize: "0.85rem", fontWeight: 600, color: "hsl(var(--foreground))",
                maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}
              className="hidden sm:block"
              >
                {firstName} {lastName[0]}.
              </span>
              <ChevronDown className="hidden sm:block h-3.5 w-3.5" style={{ color: "#7A7AAA" }} />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            style={{
              width: 220,
              background: "hsl(var(--card))",
              border: "1.5px solid hsl(var(--border))",
              borderRadius: 12,
              boxShadow: "0 8px 32px rgba(16,6,160,0.14)",
            }}
          >
            <DropdownMenuLabel style={{ padding: "12px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                  background: "#08036A",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.75rem", fontWeight: 700, color: "white",
                }}>
                  {initials}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "hsl(var(--foreground))", lineHeight: 1 }}>
                    {firstName} {lastName}
                  </p>
                  <p style={{ fontSize: "0.72rem", color: "hsl(var(--muted-foreground))", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {email}
                  </p>
                  <p style={{ fontSize: "0.68rem", color: "#E00500", marginTop: 2, fontWeight: 600 }}>HR Staff</p>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link href="/hr/settings" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "#2A2A6A", cursor: "pointer" }}>
                <Settings className="h-4 w-4" />
                Account Settings
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login?portal=hr" })}
              style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "#E00500", cursor: "pointer" }}
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
