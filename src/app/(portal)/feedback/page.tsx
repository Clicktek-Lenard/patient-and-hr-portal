"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MessageSquarePlus, ShieldAlert, Bug, Lightbulb, HelpCircle,
} from "lucide-react";

type UatSeverity = "Bug" | "Suggestion" | "Question" | "Blocker";
type UatStatus   = "Open" | "Acknowledged" | "Resolved";

interface MyFeedbackRow {
  id:             string;
  module:         string;
  pageTitle:      string | null;
  pageUrl:        string;
  severity:       UatSeverity;
  description:    string;
  screenshotPath: string | null;
  status:         UatStatus;
  createdAt:      string;
}

const SEVERITY_STYLE: Record<UatSeverity, { bg: string; color: string; icon: React.ElementType }> = {
  Blocker:    { bg: "#FEE2E2", color: "#991B1B", icon: ShieldAlert },
  Bug:        { bg: "#FEF3C7", color: "#92400E", icon: Bug },
  Suggestion: { bg: "#DBEAFE", color: "#1E40AF", icon: Lightbulb },
  Question:   { bg: "#EDE9FE", color: "#5B21B6", icon: HelpCircle },
};

const STATUS_STYLE: Record<UatStatus, { bg: string; color: string; label: string }> = {
  Open:         { bg: "#FEE2E2", color: "#991B1B",  label: "Open" },
  Acknowledged: { bg: "#FEF3C7", color: "#92400E",  label: "In Review" },
  Resolved:     { bg: "#D1FAE5", color: "#065F46",  label: "Resolved" },
};

export default function MyFeedbackPage() {
  const [rows,    setRows]    = useState<MyFeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/uat/my-feedback");
      const json = await res.json();
      setRows(json.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div style={{
        borderRadius: 14, background: "linear-gradient(135deg, #0D9488 0%, #0891B2 100%)",
        padding: "20px 24px", position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0, opacity: 0.06,
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <MessageSquarePlus style={{ width: 16, height: 16, color: "rgba(255,255,255,0.8)" }} />
            <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              UAT Feedback
            </span>
          </div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#ffffff", lineHeight: 1.2 }}>
            My Submitted Feedback
          </h1>
          <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.55)", marginTop: 6 }}>
            Track the status of feedback you submitted during testing
          </p>
        </div>
      </div>

      {/* List */}
      <div style={{
        background: "var(--ui-card)", border: "1px solid var(--ui-border)",
        borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px var(--ui-shadow)",
      }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: "var(--ui-text-muted)" }}>
            Loading your feedback…
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <MessageSquarePlus style={{ width: 36, height: 36, margin: "0 auto 10px", color: "var(--ui-text-faint)" }} />
            <p style={{ fontWeight: 600, color: "var(--ui-text-primary)", fontSize: "0.9rem" }}>No feedback submitted yet</p>
            <p style={{ fontSize: "0.78rem", color: "var(--ui-text-muted)", marginTop: 4 }}>
              Use the <strong>Feedback UAT</strong> button at the bottom-right to report issues or suggestions.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--ui-border)", background: "var(--surface-1)" }}>
                  {["Date", "Module / Page", "Severity", "Description", "Status"].map((h) => (
                    <th key={h} style={{
                      padding: "10px 16px", textAlign: "left",
                      fontSize: "0.68rem", fontWeight: 700,
                      color: "var(--ui-text-muted)",
                      textTransform: "uppercase", letterSpacing: "0.08em",
                      whiteSpace: "nowrap",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const sev    = SEVERITY_STYLE[row.severity];
                  const sta    = STATUS_STYLE[row.status];
                  const SevIcon = sev.icon;
                  return (
                    <tr key={row.id} className="nwd-row-hover" style={{
                      borderBottom: "1px solid var(--ui-border)",
                      transition: "background 0.15s",
                    }}>
                      {/* Date */}
                      <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                        <span style={{ fontSize: "0.75rem", color: "var(--ui-text-muted)" }}>
                          {new Date(row.createdAt).toLocaleDateString("en-PH", {
                            month: "short", day: "numeric", year: "numeric",
                          })}
                        </span>
                      </td>
                      {/* Module / Page */}
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          fontSize: "0.72rem", fontWeight: 700,
                          background: "var(--ui-active-bg)", color: "var(--ui-active-text)",
                          borderRadius: 6, padding: "2px 8px", display: "inline-block", marginBottom: 3,
                        }}>
                          {row.module}
                        </span>
                        {row.pageTitle && (
                          <p style={{ fontSize: "0.7rem", color: "var(--ui-text-muted)", marginTop: 2 }}>
                            {row.pageTitle}
                          </p>
                        )}
                      </td>
                      {/* Severity */}
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          fontSize: "0.72rem", fontWeight: 700,
                          background: sev.bg, color: sev.color,
                          borderRadius: 6, padding: "2px 8px",
                        }}>
                          <SevIcon style={{ width: 11, height: 11 }} />
                          {row.severity}
                        </span>
                      </td>
                      {/* Description */}
                      <td style={{ padding: "12px 16px", maxWidth: 320 }}>
                        <p style={{
                          fontSize: "0.8rem", color: "var(--ui-text-secondary)",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {row.description}
                        </p>
                      </td>
                      {/* Status */}
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          fontSize: "0.72rem", fontWeight: 700,
                          background: sta.bg, color: sta.color,
                          borderRadius: 6, padding: "2px 8px", whiteSpace: "nowrap",
                        }}>
                          {sta.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
