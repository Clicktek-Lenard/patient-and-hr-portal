"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Share2, Link2, Loader2, Trash2, Copy, Check, Shield, Clock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ShareLink = {
  id: string; queueCode: string; resultLabel: string | null; token: string;
  recipient: string | null; expiresAt: string; revokedAt: string | null;
  createdAt: string; viewCount: number;
};

const EXPIRY_OPTIONS = [
  { label: "24 hours",  hours: 24 },
  { label: "7 days",   hours: 168 },
  { label: "30 days",  hours: 720 },
];

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(() => toast.success("Link copied!"));
}

function getShareUrl(token: string) {
  return `${window.location.origin}/shared/${token}`;
}

function isExpired(expiresAt: string) {
  return new Date(expiresAt) < new Date();
}

export default function SharePage() {
  const qc = useQueryClient();
  const [queueCode, setQueueCode] = useState("");
  const [resultLabel, setResultLabel] = useState("");
  const [recipient, setRecipient] = useState("");
  const [expiryHours, setExpiryHours] = useState(168);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
      setQueueCode(""); setResultLabel(""); setRecipient("");
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
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
            <Share2 className="h-4 w-4 text-primary" />
          </div>
          <span className="text-xs font-semibold text-primary tracking-widest uppercase">Sharing</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Share Results</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Generate secure, time-limited links to share your lab results</p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3.5">
        <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Shared links are encrypted and expire automatically. Recipients can view the result without logging in.
          You can revoke access at any time. Links never expose your personal account.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Generate form */}
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Generate Secure Link</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Visit / Queue Code</label>
              <input
                value={queueCode}
                onChange={(e) => setQueueCode(e.target.value)}
                placeholder="e.g. Q-2024-001"
                className="w-full h-10 rounded-xl border border-border bg-background text-sm px-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <p className="text-xs text-muted-foreground">Find the code in your Results or Visits page</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Label (optional)</label>
              <input
                value={resultLabel}
                onChange={(e) => setResultLabel(e.target.value)}
                placeholder="e.g. Annual PE – Jan 2025"
                className="w-full h-10 rounded-xl border border-border bg-background text-sm px-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recipient (optional)</label>
              <input
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="e.g. Dr. Santos"
                className="w-full h-10 rounded-xl border border-border bg-background text-sm px-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Link Expires After</label>
              <div className="flex gap-2">
                {EXPIRY_OPTIONS.map((opt) => (
                  <button
                    key={opt.hours}
                    onClick={() => setExpiryHours(opt.hours)}
                    className={cn(
                      "flex-1 h-9 rounded-xl border text-xs font-semibold transition-colors",
                      expiryHours === opt.hours
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-muted-foreground border-border hover:bg-muted"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => createMutation.mutate({ queueCode, resultLabel, recipient, expiryHours })}
              disabled={!queueCode || createMutation.isPending}
              className="w-full h-10 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity hover:opacity-90"
              style={{ background: "var(--gradient-primary)" }}
            >
              {createMutation.isPending
                ? <><Loader2 className="h-4 w-4 animate-spin" />Generating…</>
                : <><Link2 className="h-4 w-4" />Generate Secure Link</>
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
            <div className="rounded-2xl bg-card border border-border p-8 text-center">
              <Link2 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No active share links</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeLinks.map((link) => (
                <div key={link.id} className="rounded-2xl bg-card border border-border p-4 space-y-3">
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

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopy(link)}
                      className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg border border-border bg-muted/30 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      {copiedId === link.id
                        ? <><Check className="h-3 w-3 text-green-500" />Copied!</>
                        : <><Copy className="h-3 w-3" />Copy Link</>
                      }
                    </button>
                    <button
                      onClick={() => revokeMutation.mutate(link.id)}
                      disabled={revokeMutation.isPending}
                      className="flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg border border-destructive/20 bg-destructive/5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" /> Revoke
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
                  <div key={link.id} className="rounded-xl bg-muted/30 border border-border p-3 opacity-60">
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
