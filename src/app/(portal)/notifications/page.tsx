"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Bell, CheckCheck, Info, CheckCircle, AlertTriangle, AlertCircle,
  ChevronDown, ChevronUp, Clock, FlaskConical, CreditCard, Eye, EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotifications } from "@/hooks/use-notifications";
import { useNotificationStore } from "@/store/notification-store";
import { formatTimeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { AppNotification, NotificationType } from "@/types";

// ── Type config ───────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<
  NotificationType,
  { icon: React.ElementType; iconColor: string; iconBg: string; label: string; badgeCls: string }
> = {
  success: {
    icon: CheckCircle,
    iconColor: "text-green-600 dark:text-green-400",
    iconBg: "bg-green-100 dark:bg-green-900/40",
    label: "Success",
    badgeCls: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 border-0",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-100 dark:bg-amber-900/40",
    label: "Action Needed",
    badgeCls: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-0",
  },
  alert: {
    icon: AlertCircle,
    iconColor: "text-red-600 dark:text-red-400",
    iconBg: "bg-red-100 dark:bg-red-900/40",
    label: "Alert",
    badgeCls: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 border-0",
  },
  info: {
    icon: Info,
    iconColor: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-100 dark:bg-blue-900/40",
    label: "Info",
    badgeCls: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-0",
  },
};

// Guess a context icon from notification title
function getContextIcon(title: string) {
  const t = title.toLowerCase();
  if (t.includes("result") || t.includes("lab")) return FlaskConical;
  if (t.includes("payment") || t.includes("balance") || t.includes("receipt")) return CreditCard;
  return null;
}

async function markAllReadApi() {
  const res = await fetch("/api/notifications/mark-all-read", { method: "POST" });
  if (!res.ok) throw new Error("Failed");
}

// ── Single notification card ──────────────────────────────────────────────────
function NotificationCard({
  notification,
  isOpen,
  onToggle,
  onMarkRead,
  onMarkUnread,
}: {
  notification: AppNotification;
  isOpen: boolean;
  onToggle: () => void;
  onMarkRead: (id: string) => void;
  onMarkUnread: (id: string) => void;
}) {
  const cfg = TYPE_CONFIG[notification.type as NotificationType] ?? TYPE_CONFIG.info;
  const Icon = cfg.icon;
  const CtxIcon = getContextIcon(notification.title);
  const timeAgo = formatTimeAgo(notification.createdAt);

  function handleCardClick() {
    // Auto-mark as read when opened
    if (!notification.isRead && !isOpen) onMarkRead(notification.id);
    onToggle();
  }

  function handleReadToggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (notification.isRead) {
      onMarkUnread(notification.id);
    } else {
      onMarkRead(notification.id);
    }
  }

  return (
    <div
      style={{
        background: "var(--ui-card)",
        border: !notification.isRead ? "1.5px solid var(--ui-active-text)" : "1px solid var(--ui-border)",
        borderRadius: 12,
        boxShadow: !notification.isRead ? "0 2px 8px var(--ui-shadow)" : "0 1px 3px var(--ui-shadow)",
        transition: "all 0.2s",
        ...(isOpen ? { outline: "2px solid var(--ui-active-text)", outlineOffset: 1 } : {}),
      }}
    >
      {/* ── Collapsed row ── */}
      <div
        className="flex items-start gap-3 p-4 cursor-pointer"
        onClick={handleCardClick}
      >
        {/* Type icon */}
        <div className={cn("mt-0.5 p-2 rounded-full shrink-0", cfg.iconBg)}>
          <Icon className={cn("h-4 w-4", cfg.iconColor)} />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Unread dot */}
              {!notification.isRead && (
                <span className="inline-block w-2 h-2 rounded-full bg-primary shrink-0" />
              )}
              <p className={cn(
                "text-sm leading-snug",
                !notification.isRead ? "font-semibold text-foreground" : "font-medium text-foreground"
              )}>
                {notification.title}
              </p>
              {/* Context icon badge */}
              {CtxIcon && (
                <span className="text-muted-foreground"><CtxIcon className="h-3.5 w-3.5" /></span>
              )}
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1 shrink-0">
              <Clock className="h-3 w-3" />
              {timeAgo}
            </span>
          </div>

          {/* Preview when collapsed */}
          {!isOpen && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {notification.message}
            </p>
          )}
        </div>

        {/* Expand chevron */}
        <div className="shrink-0 text-muted-foreground mt-0.5">
          {isOpen
            ? <ChevronUp className="h-4 w-4" />
            : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>

      {/* ── Expanded detail ── */}
      {isOpen && (
        <div
          className={cn(
            "px-4 pb-4 border-t mx-0",
            !notification.isRead
              ? "bg-primary/5 dark:bg-primary/10"
              : "bg-muted/30"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Full message */}
          <div className="pt-4 space-y-4">
            <div className={cn("rounded-lg p-4", cfg.iconBg)}>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                {notification.message}
              </p>
            </div>

            {/* Meta + actions row */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              {/* Timestamps */}
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p>Received: <span className="text-foreground">{new Date(notification.createdAt).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}</span></p>
                {notification.readAt && (
                  <p>Read: <span className="text-foreground">{new Date(notification.readAt).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}</span></p>
                )}
              </div>

              {/* Read / Unread toggle button */}
              <div className="flex items-center gap-2">
                <Badge className={cfg.badgeCls}>
                  {cfg.label}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={handleReadToggle}
                >
                  {notification.isRead ? (
                    <><EyeOff className="h-3 w-3" /> Mark unread</>
                  ) : (
                    <><Eye className="h-3 w-3" /> Mark as read</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { notifications, unreadCount, isLoading, markAsRead } = useNotifications();
  const { markAllAsRead, notifications: storeNotifs, setNotifications } = useNotificationStore();
  const [openId, setOpenId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  const markAllMutation = useMutation({
    mutationFn: markAllReadApi,
    onMutate: () => {
      markAllAsRead();
      toast.success("All notifications marked as read");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
    onError: () => {
      toast.error("Failed to mark all as read");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  function handleMarkRead(id: string) {
    markAsRead(id);
  }

  function handleMarkUnread(id: string) {
    // Optimistically flip isRead back to false in the store
    const updated = storeNotifs.map((n) =>
      n.id === id ? { ...n, isRead: false, readAt: undefined } : n
    );
    setNotifications(updated);
    // Best-effort API call (portal DB only; mock notifications will silently fail)
    fetch(`/api/notifications/${id}/unread`, { method: "POST" }).catch(() => null);
  }

  const displayed =
    filter === "unread" ? notifications.filter((n) => !n.isRead)
    : filter === "read"  ? notifications.filter((n) => n.isRead)
    : notifications;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div style={{ borderRadius: 14, background: "linear-gradient(135deg, #D97706 0%, #F59E0B 100%)", padding: "20px 24px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.06, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Bell style={{ width: 16, height: 16, color: "rgba(255,255,255,0.8)" }} />
              <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Tools</span>
            </div>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#ffffff", lineHeight: 1.2, display: "flex", alignItems: "center", gap: 10 }}>
              Notifications
              {unreadCount > 0 && (
                <span style={{ fontSize: "0.72rem", fontWeight: 700, background: "rgba(255,255,255,0.2)", borderRadius: 20, padding: "3px 10px", color: "#fff" }}>
                  {unreadCount} new
                </span>
              )}
            </h1>
            <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.55)", marginTop: 6 }}>
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}.`
                : "You're all caught up!"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
              style={{ background: "rgba(255,255,255,0.9)", border: "none", color: "#92400E" }}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["all", "unread", "read"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize",
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            )}
          >
            {f}
            {f === "unread" && unreadCount > 0 && (
              <span className="ml-1.5 text-xs opacity-80">({unreadCount})</span>
            )}
          </button>
        ))}
      </div>

      {/* Notification list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-20">
          <Bell className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="font-medium text-muted-foreground">
            {filter === "unread" ? "No unread notifications" : filter === "read" ? "No read notifications" : "No notifications yet"}
          </p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Updates about your visits, results, and payments will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map((n) => (
            <NotificationCard
              key={n.id}
              notification={n}
              isOpen={openId === n.id}
              onToggle={() => setOpenId(openId === n.id ? null : n.id)}
              onMarkRead={handleMarkRead}
              onMarkUnread={handleMarkUnread}
            />
          ))}
        </div>
      )}
    </div>
  );
}
