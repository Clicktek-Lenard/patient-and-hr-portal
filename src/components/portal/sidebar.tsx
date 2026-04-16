"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard, FlaskConical, TrendingUp, CalendarPlus,
  Share2, History, CreditCard, Bell,
  User, Heart, MapPin, HelpCircle, Star,
  X, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/use-notifications";
import { getInitials } from "@/lib/utils";

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
  const { data: session } = useSession();

  const firstName = session?.user?.firstName ?? "";
  const lastName  = session?.user?.lastName  ?? "";
  const patientId = (session?.user as { patientId?: string })?.patientId ?? "";
  const initials  = firstName && lastName ? getInitials(firstName, lastName) : "?";

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
          backgroundColor: "#1006A0",
          borderRight: "2.5px solid #E00500",
          height: "100vh",
          overflowY: "auto",
        }}
      >
        {/* ── Brand section ── */}
        <div style={{
          padding: "16px 20px",
          borderBottom: "2.5px solid #E00500",
          background: "#0B0480",
        }}>
          <Link href="/dashboard" style={{ display: "flex", flexDirection: "column", gap: 6, textDecoration: "none" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/nwdi-logo.png" alt="NWDI" style={{ width: "100%", height: 36, objectFit: "contain", objectPosition: "left" }} />
            <p style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.45)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Patient Portal
            </p>
          </Link>
          {onClose && (
            <Button
              variant="ghost" size="icon"
              className="lg:hidden absolute top-3 right-3"
              style={{ color: "rgba(255,255,255,0.7)" }}
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* ── User section ── */}
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8, flexShrink: 0,
            background: "#E00500",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.75rem", fontWeight: 700, color: "white",
          }}>
            {initials}
          </div>
          <div style={{ overflow: "hidden" }}>
            <p style={{
              fontSize: "0.82rem", fontWeight: 600, color: "white",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {firstName} {lastName}
            </p>
            <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-mono, monospace)" }}>
              {patientId || "Patient"}
            </p>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
          {navGroups.map((group) => (
            <div key={group.label}>
              <p style={{
                padding: "12px 20px 6px",
                fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em",
                textTransform: "uppercase", color: "rgba(255,255,255,0.3)",
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
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "9px 16px",
                      margin: isActive ? "2px 0 2px 12px" : "2px 0 2px 0",
                      borderRadius: isActive ? "10px 0 0 10px" : 0,
                      borderLeft: isActive ? "4px solid #E00500" : "4px solid transparent",
                      fontSize: "0.86rem",
                      color: isActive ? "#ffffff" : "rgba(255,255,255,0.65)",
                      background: isActive ? "#1006A0" : "transparent",
                      boxShadow: isActive ? "-4px 4px 16px rgba(0,0,0,0.35)" : "none",
                      transition: "all 0.2s",
                      textDecoration: "none",
                      userSelect: "none",
                      position: "relative",
                    }}
                    className="group hover:bg-white/6 hover:text-white"
                  >
                    <span style={{ width: 20, textAlign: "center", flexShrink: 0 }}>
                      <Icon style={{ width: 16, height: 16, color: isActive ? "#ffffff" : "rgba(255,255,255,0.6)" }} />
                    </span>
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.label}
                    </span>
                    {item.comingSoon && (
                      <span style={{
                        fontSize: "0.65rem", fontWeight: 700, color: "#F0B429",
                        background: "rgba(240,180,41,0.15)", border: "1px solid rgba(240,180,41,0.3)",
                        borderRadius: 10, padding: "1px 7px", letterSpacing: "0.04em",
                      }}>
                        Soon
                      </span>
                    )}
                    {item.showBadge && unreadCount > 0 && (
                      <span style={{
                        minWidth: 18, height: 18, borderRadius: 10, padding: "0 4px",
                        background: "#E00500", color: "white",
                        fontSize: "0.65rem", fontWeight: 700,
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
          padding: "8px 20px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}>
          <p style={{
            fontSize: "0.65rem", color: "rgba(255,255,255,0.3)",
            fontStyle: "italic", letterSpacing: "0.04em", textAlign: "center",
          }}>
            &ldquo;Your Health is Our Commitment&rdquo;
          </p>
        </div>

        {/* ── Logout footer ── */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <Link
            href="/profile"
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 12px", borderRadius: 8,
              textDecoration: "none",
              transition: "background 0.2s",
            }}
            className="hover:bg-white/10"
          >
            <div style={{
              width: 34, height: 34, borderRadius: 8, flexShrink: 0,
              background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.75rem", fontWeight: 700, color: "white",
            }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: "0.82rem", fontWeight: 600, color: "white",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {firstName} {lastName}
              </p>
              <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.45)", marginTop: 1 }}>
                View profile
              </p>
            </div>
            <ChevronRight style={{ width: 14, height: 14, color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
          </Link>
        </div>
      </aside>
    </>
  );
}
