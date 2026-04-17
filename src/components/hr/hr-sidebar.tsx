"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, BarChart2, X,
  ShieldAlert, Heart, CalendarClock, Settings, ClipboardList,
  MessageSquarePlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type NavItem  = { href: string; label: string; icon: React.ElementType };
type NavGroup = { label: string; items: NavItem[] };

/* Spec §4.1 — 8 nav items */
const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/hr/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/hr/employees", label: "Employees", icon: Users },
    ],
  },
  {
    label: "Compliance & Wellness",
    items: [
      { href: "/hr/compliance", label: "PE Compliance",   icon: ShieldAlert },
      { href: "/hr/wellness",   label: "Wellness Trends", icon: Heart },
    ],
  },
  {
    label: "Reports & Tools",
    items: [
      { href: "/hr/reports",       label: "Reports & Exports", icon: BarChart2 },
      { href: "/hr/scheduling",    label: "Bulk Scheduling",   icon: CalendarClock },
      { href: "/hr/audit",         label: "Audit Trail",       icon: ClipboardList },
      { href: "/hr/uat-feedback",  label: "UAT Feedback",      icon: MessageSquarePlus },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/hr/settings", label: "Account Settings", icon: Settings },
    ],
  },
];

interface HrSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function HrSidebar({ isOpen = true, onClose }: HrSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex flex-col",
          "lg:static lg:translate-x-0",
          "transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        style={{
          width: 240,
          flexShrink: 0,
          backgroundColor: "#ffffff",
          borderRight: "1px solid #E8EAED",
          height: "100vh",
          overflowY: "auto",
          boxShadow: "2px 0 8px rgba(0,0,0,0.04)",
        }}
      >
        {/* ── Brand section ── */}
        <div style={{
          padding: "16px 20px 14px",
          borderBottom: "1px solid #E8EAED",
        }}>
          <Link href="/hr/dashboard" style={{ display: "flex", flexDirection: "column", gap: 4, textDecoration: "none" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/nwdi-logo-color.png" alt="NWDI"
              onError={(e) => { (e.target as HTMLImageElement).src = "/nwdi-logo.png"; }}
              style={{ width: "100%", height: 32, objectFit: "contain", objectPosition: "left" }}
            />
            <p style={{ fontSize: "0.6rem", color: "#9CA3AF", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>
              HR Staff Portal
            </p>
          </Link>
          {onClose && (
            <Button
              variant="ghost" size="icon"
              className="lg:hidden absolute top-3 right-3"
              style={{ color: "#6B7280" }}
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* ── Navigation ── */}
        <nav style={{ flex: 1, padding: "8px 0", overflowY: "auto" }}>
          {navGroups.map((group) => (
            <div key={group.label}>
              <p style={{
                padding: "10px 16px 4px",
                fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", color: "#9CA3AF",
              }}>
                {group.label}
              </p>
              {group.items.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== "/hr/dashboard" && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    style={{
                      display: "flex", alignItems: "center", gap: 9,
                      padding: "7px 12px",
                      margin: "1px 8px",
                      borderRadius: 8,
                      fontSize: "0.84rem",
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? "#08036A" : "#374151",
                      background: isActive ? "#EEF2FF" : "transparent",
                      transition: "all 0.15s",
                      textDecoration: "none",
                    }}
                    className="hover:bg-gray-100"
                  >
                    <span style={{ width: 18, textAlign: "center", flexShrink: 0 }}>
                      <Icon style={{ width: 15, height: 15, color: isActive ? "#08036A" : "#6B7280" }} />
                    </span>
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* ── Tagline ── */}
        <div style={{
          padding: "10px 20px",
          borderTop: "1px solid #E8EAED",
        }}>
          <p style={{
            fontSize: "0.6rem", color: "#9CA3AF",
            fontStyle: "italic", letterSpacing: "0.03em", textAlign: "center",
          }}>
            &ldquo;Your Health is Our Commitment&rdquo;
          </p>
        </div>

      </aside>
    </>
  );
}
