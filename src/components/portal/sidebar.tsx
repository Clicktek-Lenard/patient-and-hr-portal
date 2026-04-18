"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FlaskConical, TrendingUp, CalendarPlus,
  Share2, History, Bell,
  User, Heart, MapPin, HelpCircle, Star,
  MessageSquarePlus,
  X, PanelLeftClose, PanelLeftOpen,
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
      { href: "/feedback",      label: "UAT Feedback",        icon: MessageSquarePlus },
    ],
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ isOpen = true, onClose, collapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname    = usePathname();
  const { unreadCount } = useNotifications();

  const sidebarWidth = collapsed ? 64 : 240;

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
          "transition-all duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        style={{
          width: sidebarWidth,
          flexShrink: 0,
          backgroundColor: "var(--ui-sidebar)",
          borderRight: "1px solid var(--ui-border)",
          height: "100vh",
          overflowY: "auto",
          overflowX: "hidden",
          boxShadow: "2px 0 8px var(--ui-shadow)",
        }}
      >
        {/* ── Brand section ── */}
        <div style={{
          padding: collapsed ? "16px 12px 14px" : "16px 20px 14px",
          borderBottom: "1px solid var(--ui-border)",
          position: "relative",
        }}>
          <Link href="/dashboard" style={{ display: "flex", flexDirection: "column", alignItems: collapsed ? "center" : "flex-start", gap: 4, textDecoration: "none" }}>
            {collapsed ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src="/ico.png" alt="NWDI" style={{ width: 32, height: 32, objectFit: "contain" }} />
            ) : (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/nwdi-logo.png"
                  alt="NWDI"
                  style={{ width: "100%", height: 32, objectFit: "contain", objectPosition: "left" }}
                />
                <p style={{ fontSize: "0.6rem", color: "var(--ui-text-faint)", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>
                  Patient Portal
                </p>
              </>
            )}
          </Link>
          {onClose && (
            <Button
              variant="ghost" size="icon"
              className="lg:hidden absolute top-3 right-3"
              style={{ color: "var(--ui-text-muted)" }}
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
              {!collapsed && (
                <p style={{
                  padding: "10px 16px 4px",
                  fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: "var(--ui-section-label)",
                }}>
                  {group.label}
                </p>
              )}
              {collapsed && <div style={{ height: 8 }} />}
              {group.items.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    title={collapsed ? item.label : undefined}
                    style={{
                      display: "flex", alignItems: "center",
                      gap: collapsed ? 0 : 9,
                      padding: collapsed ? "9px 0" : "7px 12px",
                      margin: collapsed ? "1px 8px" : "1px 8px",
                      borderRadius: 8,
                      fontSize: "0.84rem",
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? "var(--ui-active-text)" : "var(--ui-text-secondary)",
                      background: isActive ? "var(--ui-active-bg)" : "transparent",
                      transition: "all 0.15s",
                      textDecoration: "none",
                      userSelect: "none",
                      justifyContent: collapsed ? "center" : "flex-start",
                      position: "relative",
                    }}
                    className="nwd-nav-item"
                  >
                    <span style={{ width: 18, textAlign: "center", flexShrink: 0 }}>
                      <Icon style={{ width: 15, height: 15, color: isActive ? "var(--ui-active-icon)" : "var(--ui-text-muted)" }} />
                    </span>
                    {!collapsed && (
                      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.label}
                      </span>
                    )}
                    {!collapsed && item.comingSoon && (
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
                        ...(collapsed ? { position: "absolute", top: 2, right: 4 } : {}),
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

        {/* ── Collapse toggle (desktop only) ── */}
        {onToggleCollapse && (
          <div className="hidden lg:block" style={{
            padding: collapsed ? "8px 0" : "8px 12px",
            borderTop: "1px solid var(--ui-border)",
            display: "flex", justifyContent: collapsed ? "center" : "flex-end",
          }}>
            <button
              onClick={onToggleCollapse}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: collapsed ? 40 : 32, height: 32, borderRadius: 8,
                background: "transparent", border: "none", cursor: "pointer",
                color: "var(--ui-text-muted)", transition: "all 0.15s",
                margin: collapsed ? "0 auto" : undefined,
              }}
              className="nwd-nav-item"
            >
              {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
          </div>
        )}

        {/* ── Tagline ── */}
        {!collapsed && (
          <div style={{
            padding: "10px 20px",
            borderTop: onToggleCollapse ? "none" : "1px solid var(--ui-border)",
          }}>
            <p style={{
              fontSize: "0.6rem", color: "var(--ui-text-faint)",
              fontStyle: "italic", letterSpacing: "0.03em", textAlign: "center",
            }}>
              &ldquo;Your Health is Our Commitment&rdquo;
            </p>
          </div>
        )}

      </aside>
    </>
  );
}
