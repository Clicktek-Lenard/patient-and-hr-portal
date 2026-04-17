"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FlaskConical, TrendingUp, CalendarPlus,
  Share2, History, CreditCard, Bell,
  User, Heart, MapPin, HelpCircle, Star,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/use-notifications";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  showBadge?: boolean;
  comingSoon?: boolean;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: "Main",
    items: [
      { href: "/dashboard",    label: "Dashboard",      icon: LayoutDashboard },
      { href: "/results",      label: "My Results",     icon: FlaskConical },
      { href: "/trends",       label: "Health Trends",  icon: TrendingUp },
      { href: "/appointments", label: "Appointments",   icon: CalendarPlus },
    ],
  },
  {
    label: "Tools",
    items: [
      { href: "/share",          label: "Share Results",  icon: Share2 },
      { href: "/access-history", label: "Access History", icon: History },
      { href: "/payments",       label: "Payments",       icon: CreditCard },
      { href: "/notifications",  label: "Notifications",  icon: Bell, showBadge: true },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/profile",       label: "My Profile",          icon: User },
      { href: "/health-card",   label: "Digital Health Card", icon: Heart },
      { href: "/find-a-clinic", label: "Find a Clinic",       icon: MapPin },
      { href: "/help",          label: "Help & FAQ",          icon: HelpCircle },
      { href: "/loyalty",       label: "Loyalty Card",        icon: Star, comingSoon: true },
    ],
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname    = usePathname();
  const { unreadCount } = useNotifications();

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
          <Link href="/dashboard" style={{ display: "flex", flexDirection: "column", gap: 4, textDecoration: "none" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/nwdi-logo-color.png" alt="NWDI"
              onError={(e) => { (e.target as HTMLImageElement).src = "/nwdi-logo.png"; }}
              style={{ width: "100%", height: 32, objectFit: "contain", objectPosition: "left" }}
            />
            <p style={{ fontSize: "0.6rem", color: "#9CA3AF", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>
              Patient Portal
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
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
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
                      color: isActive ? "#1006A0" : "#374151",
                      background: isActive ? "#EEF2FF" : "transparent",
                      transition: "all 0.15s",
                      textDecoration: "none",
                      userSelect: "none",
                    }}
                    className="hover:bg-gray-100"
                  >
                    <span style={{ width: 18, textAlign: "center", flexShrink: 0 }}>
                      <Icon style={{ width: 15, height: 15, color: isActive ? "#1006A0" : "#6B7280" }} />
                    </span>
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.label}
                    </span>
                    {item.comingSoon && (
                      <span style={{
                        fontSize: "0.6rem", fontWeight: 700, color: "#D97706",
                        background: "#FEF3C7", border: "1px solid #FDE68A",
                        borderRadius: 6, padding: "1px 6px", letterSpacing: "0.04em",
                      }}>
                        Soon
                      </span>
                    )}
                    {item.showBadge && unreadCount > 0 && (
                      <span style={{
                        minWidth: 18, height: 18, borderRadius: 9, padding: "0 4px",
                        background: "#E00500", color: "white",
                        fontSize: "0.6rem", fontWeight: 700,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
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
