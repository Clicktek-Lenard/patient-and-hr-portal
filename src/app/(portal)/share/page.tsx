"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Share2, Link2, Loader2, Trash2, Copy, Check, Shield, Clock, ChevronDown } from "lucide-react";
import { toast } from "sonner";

type ShareLink = {
  id: string; queueCode: string; resultLabel: string | null; token: string;
  recipient: string | null; expiresAt: string; revokedAt: string | null;
  createdAt: string; viewCount: number;
};

type ResultItem = {
  id: number;
  queueCode: string;
  date: string;
  description: string;
  status: "released" | "pending";
};

const EXPIRY_OPTIONS = [
  { label: "1 min",     hours: 1 / 60 },
  { label: "24 hours",  hours: 24 },
  { label: "7 days",    hours: 168 },
  { label: "30 days",   hours: 720 },
];

function copyToClipboard(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => toast.success("Link copied!"));
  } else {
    // Fallback for HTTP (non-secure) origins
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    toast.success("Link copied!");
  }
}

function getShareUrl(token: string) {
  return `${window.location.origin}/shared/${token}`;
}

function isExpired(expiresAt: string) {
  return new Date(expiresAt) < new Date();
}

function SharePageInner() {
  const qc = useQueryClient();
  const searchParams = useSearchParams();
  const [queueCode, setQueueCode] = useState(searchParams.get("result") ?? "");
  const [recipient, setRecipient] = useState("");
  const [expiryHours, setExpiryHours] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Keep queueCode in sync if URL param changes (e.g. navigating from dashboard Share button)
  useEffect(() => {
    const code = searchParams.get("result");
    if (code) setQueueCode(code);
  }, [searchParams]);

  // Fetch patient's results for the select dropdown
  const { data: resultsData } = useQuery<{ data: { data: ResultItem[] } }>({
    queryKey: ["my-results-for-share"],
    queryFn: () => fetch("/api/results?pageSize=100").then((r) => r.json()),
    staleTime: 60_000,
  });
  const resultOptions = resultsData?.data?.data ?? [];

  // Derive label from selected result
  const selectedResult = resultOptions.find(r => r.queueCode === queueCode);
  const resultLabel = selectedResult
    ? `${selectedResult.description} — ${new Date(selectedResult.date).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}`
    : "";

  const { data, isLoading } = useQuery<{ data: ShareLink[] }>({
    queryKey: ["share-links"],
    queryFn: () => fetch("/api/share-links").then((r) => r.json()),
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: (body: object) =>
      fetch("/api/share-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => {
      toast.success("Secure link generated!");
      setQueueCode(""); setRecipient(""); setExpiryHours(null);
      qc.invalidateQueries({ queryKey: ["share-links"] });
    },
    onError: () => toast.error("Failed to generate link"),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/share-links/${id}/revoke`, { method: "POST" }).then((r) => r.json()),
    onSuccess: () => {
      toast.success("Link revoked");
      qc.invalidateQueries({ queryKey: ["share-links"] });
    },
    onError: () => toast.error("Failed to revoke link"),
  });

  function handleCopy(link: ShareLink) {
    copyToClipboard(getShareUrl(link.token));
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const links = data?.data ?? [];
  const activeLinks = links.filter((l) => !l.revokedAt && !isExpired(l.expiresAt));
  const expiredLinks = links.filter((l) => l.revokedAt || isExpired(l.expiresAt));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div style={{ borderRadius: 14, background: "linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)", padding: "20px 24px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.06, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <Share2 style={{ width: 16, height: 16, color: "rgba(255,255,255,0.8)" }} />
            <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Tools</span>
          </div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#ffffff", lineHeight: 1.2 }}>Share Results</h1>
          <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.55)", marginTop: 6 }}>Generate secure, time-limited links to share your lab results</p>
        </div>
      </div>

      {/* Info banner */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, borderRadius: 12, border: "1px solid var(--ui-border)", background: "var(--ui-active-bg)", padding: "12px 16px" }}>
        <Shield size={15} style={{ color: "var(--ui-active-text)", flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: "0.75rem", color: "var(--ui-text-muted)", lineHeight: 1.6, margin: 0 }}>
          Shared links are encrypted and expire automatically. Recipients can view the result without logging in.
          You can revoke access at any time.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Generate form */}
        <div style={{ background: "var(--ui-card)", border: "1px solid var(--ui-border)", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px var(--ui-shadow)" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--ui-border)" }}>
            <h2 style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--ui-text-primary)" }}>Generate Secure Link</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Select Result</label>
              <div className="relative">
                <select
                  value={queueCode}
                  onChange={(e) => setQueueCode(e.target.value)}
                  style={{ width: "100%", height: 40, borderRadius: 10, border: "1.5px solid var(--ui-border)", background: "var(--ui-card)", color: "var(--ui-text-primary)", fontSize: "0.78rem", padding: "0 30px 0 12px", appearance: "none" as const, outline: "none", boxSizing: "border-box" as const, overflow: "hidden", textOverflow: "ellipsis" }}
                >
                  <option value="">— Choose a result to share —</option>
                  {resultOptions.map((r) => {
                    const desc = r.description.length > 40 ? r.description.slice(0, 40) + "…" : r.description;
                    const date = new Date(r.date).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
                    return (
                      <option key={r.queueCode} value={r.queueCode}>
                        {desc} — {date}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
              <p className="text-xs text-muted-foreground">Results are loaded from your My Results page</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recipient (optional)</label>
              <input
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="e.g. Dr. Santos"
                style={{ width: "100%", height: 40, borderRadius: 10, border: "1.5px solid var(--ui-border)", background: "var(--ui-card)", color: "var(--ui-text-primary)", fontSize: "0.82rem", padding: "0 12px", outline: "none", boxSizing: "border-box" as const }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Link Expires After</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {EXPIRY_OPTIONS.map((opt) => {
                  const active = expiryHours === opt.hours;
                  return (
                    <button
                      key={opt.hours}
                      type="button"
                      onClick={() => setExpiryHours(opt.hours)}
                      style={{
                        height: 36, borderRadius: 8,
                        fontSize: "0.75rem", fontWeight: 600,
                        cursor: "pointer", transition: "all 0.15s",
                        background: active ? "var(--ui-active-bg)" : "var(--ui-card)",
                        color: active ? "var(--ui-active-text)" : "var(--ui-text-muted)",
                        border: `1.5px solid ${active ? "var(--ui-active-text)" : "var(--ui-border)"}`,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => createMutation.mutate({ queueCode, resultLabel, recipient, expiryHours })}
              disabled={!queueCode || !expiryHours || createMutation.isPending}
              style={{
                width: "100%", height: 42, borderRadius: 10, border: "none",
                background: (!queueCode || !expiryHours) ? "var(--ui-border)" : "#4F46E5",
                color: (!queueCode || !expiryHours) ? "var(--ui-text-faint)" : "#fff",
                fontSize: "0.85rem", fontWeight: 600,
                cursor: (!queueCode || !expiryHours || createMutation.isPending) ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                opacity: createMutation.isPending ? 0.7 : 1,
                transition: "all 0.15s",
              }}
            >
              {createMutation.isPending
                ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />Generating…</>
                : <><Link2 size={15} />Generate Link</>
              }
            </button>
          </div>
        </div>

        {/* Active links */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-widest">
            Active Links ({activeLinks.length})
          </h2>

          {isLoading ? (
            <div className="space-y-3">
              {[0, 1].map((i) => (
                <div key={i} className="rounded-2xl bg-card border border-border p-4 animate-pulse">
                  <div className="h-4 w-40 rounded bg-muted mb-2" />
                  <div className="h-3 w-56 rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : activeLinks.length === 0 ? (
            <div style={{ background: "var(--ui-card)", border: "1px solid var(--ui-border)", borderRadius: 12, padding: 32, textAlign: "center", boxShadow: "0 1px 3px var(--ui-shadow)" }}>
              <Link2 style={{ width: 32, height: 32, color: "var(--ui-text-faint)", margin: "0 auto 8px" }} />
              <p style={{ fontSize: "0.85rem", color: "var(--ui-text-muted)" }}>No active share links</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeLinks.map((link) => (
                <div key={link.id} style={{ background: "var(--ui-card)", border: "1px solid var(--ui-border)", borderRadius: 12, padding: 16, boxShadow: "0 1px 3px var(--ui-shadow)" }} className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {link.resultLabel ?? link.queueCode}
                      </p>
                      {link.recipient && (
                        <p className="text-xs text-muted-foreground mt-0.5">For: {link.recipient}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-[10px] font-semibold text-green-600 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-full px-2 py-0.5">
                      Active
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Expires {new Date(link.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    <span className="mx-1 opacity-40">·</span>
                    <span>{link.viewCount} view{link.viewCount !== 1 ? "s" : ""}</span>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      onClick={() => handleCopy(link)}
                      style={{
                        flex: "1 1 120px", height: 34, borderRadius: 8,
                        border: "1px solid var(--ui-border)", background: "var(--ui-card)",
                        color: "var(--ui-text-primary)", fontSize: "0.75rem", fontWeight: 600,
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        transition: "all 0.15s",
                      }}
                    >
                      {copiedId === link.id
                        ? <><Check size={13} style={{ color: "#16A34A" }} />Copied!</>
                        : <><Copy size={13} />Copy Link</>
                      }
                    </button>
                    <button
                      onClick={() => revokeMutation.mutate(link.id)}
                      disabled={revokeMutation.isPending}
                      style={{
                        flex: "0 1 auto", height: 34, padding: "0 14px", borderRadius: 8,
                        border: "1px solid var(--ui-status-danger)", background: "transparent",
                        color: "var(--ui-status-danger)", fontSize: "0.75rem", fontWeight: 600,
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                        transition: "all 0.15s",
                      }}
                    >
                      <Trash2 size={13} /> Revoke
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Expired / revoked */}
          {expiredLinks.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                Expired / Revoked
              </h3>
              <div className="space-y-2">
                {expiredLinks.map((link) => (
                  <div key={link.id} style={{ background: "var(--ui-card)", border: "1px solid var(--ui-border)", borderRadius: 10, padding: 12, boxShadow: "0 1px 2px var(--ui-shadow)", opacity: 0.65 }}>
                    <p className="text-xs font-medium text-foreground truncate">{link.resultLabel ?? link.queueCode}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {link.revokedAt ? "Revoked" : "Expired"} · {new Date(link.revokedAt ?? link.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SharePage() {
  return (
    <Suspense>
      <SharePageInner />
    </Suspense>
  );
}
