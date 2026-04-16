"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Menu, LogOut, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBell } from "@/components/portal/notification-bell";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getInitials } from "@/lib/utils";
import { useAvatar } from "@/hooks/use-avatar";

const PAGE_LABELS: Record<string, string> = {
  dashboard:      "Dashboard",
  visits:         "Visit History",
  results:        "My Results",
  vitals:         "Vital Signs",
  trends:         "Health Trends",
  payments:       "Payments",
  notifications:  "Notifications",
  profile:        "My Profile",
  appointments:   "Appointments",
  share:          "Share Results",
  "access-history": "Access History",
  "health-card":  "Digital Health Card",
  "find-a-clinic": "Find a Clinic",
  help:           "Help & FAQ",
  loyalty:        "Loyalty Card",
};

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const firstName = session?.user?.firstName ?? "";
  const lastName  = session?.user?.lastName  ?? "";
  const email     = session?.user?.email     ?? "";
  const initials  = firstName && lastName ? getInitials(firstName, lastName) : "?";
  const avatarUrl = useAvatar();

  const section = pathname.split("/").filter(Boolean)[0] ?? "dashboard";
  const pageTitle = PAGE_LABELS[section] ?? section;

  return (
    <header style={{
      background: "hsl(var(--card))",
      borderBottom: "2.5px solid #E00500",
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
          style={{ color: "#1006A0" }}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>

        <h1 style={{
          fontFamily: "var(--font-sans, 'Inter', system-ui, sans-serif)",
          fontSize: "1.05rem",
          color: "hsl(var(--foreground))",
          fontWeight: 600,
          lineHeight: 1,
          letterSpacing: "-0.01em",
        }}>
          {pageTitle}
        </h1>
      </div>

      {/* Right: theme toggle + notifications + user */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <ThemeToggle />
        {/* Notification bell */}
        <NotificationBell />

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
                background: avatarUrl ? undefined : "#E00500",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.75rem", fontWeight: 700, color: "white",
                overflow: "hidden",
              }}>
                {avatarUrl
                  /* eslint-disable-next-line @next/next/no-img-element */
                  ? <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : initials
                }
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
                  background: avatarUrl ? undefined : "#E00500",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.75rem", fontWeight: 700, color: "white",
                  overflow: "hidden",
                }}>
                  {avatarUrl
                    /* eslint-disable-next-line @next/next/no-img-element */
                    ? <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : initials
                  }
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "hsl(var(--foreground))", lineHeight: 1 }}>
                    {firstName} {lastName}
                  </p>
                  <p style={{ fontSize: "0.72rem", color: "hsl(var(--muted-foreground))", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {email}
                  </p>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link href="/profile" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "#2A2A6A", cursor: "pointer" }}>
                <User className="h-4 w-4" />
                My Profile
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login?portal=patient" })}
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
