"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, Download, Share2, RotateCcw, User } from "lucide-react";
import { toast } from "sonner";
import type { UserProfile } from "@/types";

async function fetchProfile(): Promise<UserProfile> {
  const res = await fetch("/api/profile");
  if (!res.ok) throw new Error("Failed");
  return (await res.json()).data;
}

/* ── QR SVG (inline, no external dep) ── */
function QrCode({ size = 120 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
      <rect width="128" height="128" fill="white" />
      {/* top-left finder */}
      <rect x="8"  y="8"  width="40" height="40" rx="4" fill="#1e1b4b" />
      <rect x="14" y="14" width="28" height="28" rx="2" fill="white" />
      <rect x="20" y="20" width="16" height="16"         fill="#1e1b4b" />
      {/* top-right finder */}
      <rect x="80" y="8"  width="40" height="40" rx="4" fill="#1e1b4b" />
      <rect x="86" y="14" width="28" height="28" rx="2" fill="white" />
      <rect x="92" y="20" width="16" height="16"         fill="#1e1b4b" />
      {/* bottom-left finder */}
      <rect x="8"  y="80" width="40" height="40" rx="4" fill="#1e1b4b" />
      <rect x="14" y="86" width="28" height="28" rx="2" fill="white" />
      <rect x="20" y="92" width="16" height="16"         fill="#1e1b4b" />
      {/* timing + data modules */}
      <rect x="56" y="8"   width="8" height="8" fill="#1e1b4b" />
      <rect x="68" y="8"   width="8" height="8" fill="#1e1b4b" />
      <rect x="56" y="20"  width="8" height="8" fill="#1e1b4b" />
      <rect x="68" y="32"  width="8" height="8" fill="#1e1b4b" />
      <rect x="56" y="44"  width="8" height="8" fill="#1e1b4b" />
      <rect x="56" y="56"  width="8" height="8" fill="#1e1b4b" />
      <rect x="68" y="56"  width="8" height="8" fill="#1e1b4b" />
      <rect x="80" y="56"  width="8" height="8" fill="#1e1b4b" />
      <rect x="92" y="56"  width="8" height="8" fill="#1e1b4b" />
      <rect x="104" y="56" width="8" height="8" fill="#1e1b4b" />
      <rect x="56" y="68"  width="8" height="8" fill="#1e1b4b" />
      <rect x="80" y="68"  width="8" height="8" fill="#1e1b4b" />
      <rect x="104" y="68" width="8" height="8" fill="#1e1b4b" />
      <rect x="56" y="80"  width="8" height="8" fill="#1e1b4b" />
      <rect x="68" y="80"  width="8" height="8" fill="#1e1b4b" />
      <rect x="80" y="80"  width="8" height="8" fill="#1e1b4b" />
      <rect x="104" y="80" width="8" height="8" fill="#1e1b4b" />
      <rect x="56" y="92"  width="8" height="8" fill="#1e1b4b" />
      <rect x="92" y="92"  width="8" height="8" fill="#1e1b4b" />
      <rect x="56" y="104" width="8" height="8" fill="#1e1b4b" />
      <rect x="68" y="104" width="8" height="8" fill="#1e1b4b" />
      <rect x="92" y="104" width="8" height="8" fill="#1e1b4b" />
      <rect x="104" y="104" width="8" height="8" fill="#1e1b4b" />
    </svg>
  );
}

/* ── Avatar placeholder with initials ── */
function AvatarPlaceholder({ initials }: { initials: string }) {
  return (
    <div
      className="flex items-center justify-center rounded-2xl text-white font-bold text-3xl shadow-lg"
      style={{
        width: 96, height: 96,
        background: "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.08) 100%)",
        border: "2px solid rgba(255,255,255,0.3)",
        backdropFilter: "blur(4px)",
      }}
    >
      {initials || <User className="h-10 w-10 text-white/60" />}
    </div>
  );
}

/* ── Chip pattern SVG (decorative) ── */
function ChipIcon() {
  return (
    <svg width="40" height="32" viewBox="0 0 40 32" fill="none">
      <rect x="8" y="4" width="24" height="24" rx="3" fill="rgba(255,255,255,0.25)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
      <rect x="13" y="9" width="14" height="14" rx="1.5" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.35)" strokeWidth="0.75" />
      <line x1="4" y1="11" x2="8" y2="11" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="4" y1="16" x2="8" y2="16" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="4" y1="21" x2="8" y2="21" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="32" y1="11" x2="36" y2="11" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="32" y1="16" x2="36" y2="16" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="32" y1="21" x2="36" y2="21" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="13" y1="4" x2="13" y2="0" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="20" y1="4" x2="20" y2="0" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="27" y1="4" x2="27" y2="0" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="13" y1="28" x2="13" y2="32" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="20" y1="28" x2="20" y2="32" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="27" y1="28" x2="27" y2="32" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function HealthCardPage() {
  const { data: session } = useSession();
  const { data: profile, isLoading } = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });
  const [flipped, setFlipped] = useState(false);

  const patientId = profile?.patientCode ?? session?.user?.patientCode ?? "—";
  const firstName = profile?.firstName ?? session?.user?.firstName ?? "";
  const lastName  = profile?.lastName  ?? session?.user?.lastName  ?? "";
  const fullName  = firstName && lastName ? `${firstName} ${lastName}` : session?.user?.name ?? "—";
  const initials  = ((firstName[0] ?? "") + (lastName[0] ?? "")).toUpperCase();
  const dob       = profile?.dob
    ? new Date(profile.dob).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "—";
  const mobile    = profile?.mobile ?? "—";

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: "NWDI Health Card", text: `Patient: ${fullName}\nID: ${patientId}` }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`Patient: ${fullName}\nID: ${patientId}`);
      toast.success("Patient info copied to clipboard");
    }
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
            <CreditCard className="h-4 w-4 text-primary" />
          </div>
          <span className="text-xs font-semibold text-primary tracking-widest uppercase">Identity</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Digital Health Card</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Click the card to flip it</p>
      </div>

      {/* ── Flip card container ── */}
      <div className="flex justify-center">
        {/* Perspective wrapper */}
        <div
          className="relative cursor-pointer select-none"
          style={{ width: 360, height: 220, perspective: 1000 }}
          onClick={() => setFlipped((f) => !f)}
        >
          {/* Inner — rotates on flip */}
          <div
            style={{
              position: "absolute", inset: 0,
              transformStyle: "preserve-3d",
              transition: "transform 0.65s cubic-bezier(0.4,0.2,0.2,1)",
              transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >

            {/* ══════════ FRONT ══════════ */}
            <div
              style={{
                position: "absolute", inset: 0,
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                background: "var(--gradient-hero)",
                borderRadius: 20,
                boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
                overflow: "hidden",
              }}
            >
              {/* Decorative circles */}
              <div style={{
                position: "absolute", top: -40, right: -40,
                width: 180, height: 180, borderRadius: "50%",
                background: "rgba(255,255,255,0.04)",
              }} />
              <div style={{
                position: "absolute", bottom: -60, left: -30,
                width: 200, height: 200, borderRadius: "50%",
                background: "rgba(255,255,255,0.03)",
              }} />

              {/* Top bar: logo + status */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "white", fontWeight: 700, fontSize: 11,
                  }}>NW</div>
                  <div>
                    <div style={{ color: "white", fontWeight: 700, fontSize: 12, lineHeight: 1 }}>NWDI</div>
                    <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase" }}>Patient Portal</div>
                  </div>
                </div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 4,
                  background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 20, padding: "3px 10px", fontSize: 9, color: "rgba(255,255,255,0.8)", fontWeight: 600,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
                  ACTIVE
                </div>
              </div>

              {/* Main content: avatar + info */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 20px 0" }}>
                {/* Avatar */}
                {isLoading
                  ? <div style={{ width: 80, height: 80, borderRadius: 16, background: "rgba(255,255,255,0.1)" }} />
                  : <AvatarPlaceholder initials={initials} />
                }

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {isLoading ? (
                    <>
                      <div style={{ height: 14, width: 140, borderRadius: 6, background: "rgba(255,255,255,0.1)", marginBottom: 8 }} />
                      <div style={{ height: 10, width: 100, borderRadius: 6, background: "rgba(255,255,255,0.1)" }} />
                    </>
                  ) : (
                    <>
                      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 8, letterSpacing: "0.12em", textTransform: "uppercase" }}>Patient Name</div>
                      <div style={{
                        color: "white", fontWeight: 700, lineHeight: 1.2, marginTop: 2,
                        fontSize: fullName.length > 24 ? 11 : fullName.length > 18 ? 13 : 15,
                        wordBreak: "break-word",
                      }}>{fullName}</div>
                      <div style={{ marginTop: 10 }}>
                        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 8, letterSpacing: "0.12em", textTransform: "uppercase" }}>Patient ID</div>
                        <div style={{ color: "white", fontFamily: "monospace", fontSize: 13, fontWeight: 600, marginTop: 2 }}>{patientId}</div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Bottom: chip + dob */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px 16px" }}>
                <ChipIcon />
                {!isLoading && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 8, letterSpacing: "0.1em", textTransform: "uppercase" }}>Date of Birth</div>
                    <div style={{ color: "white", fontSize: 11, marginTop: 2 }}>{dob}</div>
                  </div>
                )}
              </div>

              {/* Flip hint */}
              <div style={{
                position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)",
                color: "rgba(255,255,255,0.25)", fontSize: 9, display: "flex", alignItems: "center", gap: 4,
              }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
                tap to flip
              </div>
            </div>

            {/* ══════════ BACK ══════════ */}
            <div
              style={{
                position: "absolute", inset: 0,
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
                background: "var(--gradient-hero)",
                borderRadius: 20,
                boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
                overflow: "hidden",
              }}
            >
              {/* Decorative */}
              <div style={{
                position: "absolute", top: -50, left: -50,
                width: 200, height: 200, borderRadius: "50%",
                background: "rgba(255,255,255,0.04)",
              }} />

              {/* Magnetic strip */}
              <div style={{ height: 36, background: "rgba(0,0,0,0.35)", margin: "16px 0 0" }} />

              {/* Content row: QR + details */}
              <div style={{ display: "flex", gap: 16, padding: "14px 20px 0", alignItems: "flex-start" }}>
                {/* QR */}
                <div style={{ background: "white", borderRadius: 12, padding: 8, flexShrink: 0 }}>
                  <QrCode size={96} />
                </div>

                {/* Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {isLoading ? (
                    <div style={{ height: 80, background: "rgba(255,255,255,0.08)", borderRadius: 8 }} />
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {[
                        { label: "Patient ID", value: patientId, mono: true },
                        { label: "Full Name",  value: fullName },
                        { label: "DOB",        value: dob },
                        { label: "Mobile",     value: mobile },
                      ].map(({ label, value, mono }) => (
                        <div key={label}>
                          <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 8, letterSpacing: "0.12em", textTransform: "uppercase" }}>{label}</div>
                          <div style={{
                            color: "white", fontSize: mono ? 11 : 10, fontWeight: 600, marginTop: 1,
                            fontFamily: mono ? "monospace" : "inherit",
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          }}>{value}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 20px 14px", borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: 12,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 9 }}>NWDI Verified Patient</span>
                </div>
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, fontFamily: "monospace" }}>
                  {new Date().getFullYear()} · nwdi.com
                </div>
              </div>

              {/* Flip hint */}
              <div style={{
                position: "absolute", bottom: 6, left: "50%", transform: "translateX(-50%)",
                color: "rgba(255,255,255,0.2)", fontSize: 9, display: "flex", alignItems: "center", gap: 4,
              }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
                tap to flip back
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Flip button */}
      <div className="flex justify-center">
        <button
          onClick={() => setFlipped((f) => !f)}
          className="flex items-center gap-2 h-9 px-5 rounded-full border border-border bg-card text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {flipped ? "Show Front" : "Show Back"}
        </button>
      </div>

      {/* Info */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Present this digital card at any NWDI branch. The QR code on the back contains your Patient ID and can be scanned by
          our staff to quickly retrieve your records. This card is linked to your registered account.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => window.print()}
          className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl border border-border bg-card text-sm font-semibold text-foreground hover:bg-muted transition-colors"
        >
          <Download className="h-4 w-4" /> Save / Print
        </button>
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Share2 className="h-4 w-4" /> Share Card
        </button>
      </div>
    </div>
  );
}
