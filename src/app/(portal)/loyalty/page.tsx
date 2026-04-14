"use client";

import { Star, Gift, ChevronRight, Lock } from "lucide-react";

const TIERS = [
  {
    name: "Starter", range: "0 – 499 pts",
    colorVar: "hsl(var(--muted-foreground))",
    bgVar: "hsl(var(--muted))", borderVar: "hsl(var(--border))",
    perks: ["5% discount on selected packages", "Priority queue notification", "Digital health card"],
    highlight: false,
  },
  {
    name: "Silver", range: "500 – 1,499 pts",
    colorVar: "hsl(var(--muted-foreground))",
    bgVar: "hsl(var(--muted))", borderVar: "hsl(var(--border))",
    perks: ["10% discount on all packages", "Free one (1) Annual PE per year", "Dedicated support line"],
    highlight: false,
  },
  {
    name: "Gold", range: "1,500+ pts",
    colorVar: "#b45309",
    bgVar: "rgba(251,191,36,0.08)", borderVar: "rgba(251,191,36,0.3)",
    perks: ["15% discount on all packages", "Free two (2) Annual PEs per year", "VIP priority scheduling", "Exclusive health packages"],
    highlight: true,
  },
];

const HOW_TO_EARN = [
  { icon: "🧪", label: "Per Visit",            pts: "+10 pts" },
  { icon: "📋", label: "APE Package",          pts: "+50 pts" },
  { icon: "👥", label: "Per Referral",         pts: "+25 pts" },
  { icon: "⭐", label: "Annual Loyalty Bonus", pts: "+100 pts" },
];

export default function LoyaltyPage() {
  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <div style={{ width: 4, height: 28, background: "#1006A0", borderRadius: 4, flexShrink: 0 }} />
          <h1 style={{
            fontSize: 24, fontWeight: 800, letterSpacing: "-0.01em",
            color: "hsl(var(--foreground))",
            fontFamily: "var(--font-playfair, Georgia, serif)",
          }}>
            Loyalty Card
          </h1>
          <span style={{
            fontSize: 10, fontWeight: 700, color: "#b45309",
            background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.35)",
            borderRadius: 20, padding: "3px 10px", letterSpacing: "0.08em", textTransform: "uppercase",
          }}>
            Coming Soon
          </span>
        </div>
        <p style={{ fontSize: 13, color: "hsl(var(--muted-foreground))", marginLeft: 16 }}>
          Earn points with every visit and unlock exclusive health benefits.
        </p>
      </div>

      {/* Coming soon banner — always dark, decorative */}
      <div style={{
        background: "linear-gradient(135deg, #08036A, #1006A0)",
        borderRadius: 20, padding: "28px 32px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", right: -40, top: -40, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(224,5,0,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(251,191,36,0.2)", border: "1px solid rgba(251,191,36,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Star style={{ width: 22, height: 22, color: "#fbbf24" }} />
              </div>
              <div>
                <p style={{ fontSize: 17, fontWeight: 800, color: "white" }}>NWD Loyalty Program</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2, fontStyle: "italic" }}>Phase 2 — Launching Soon</p>
              </div>
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, maxWidth: 460 }}>
              Earn points with every diagnostic visit, lab test, and referral. Redeem for discounts,
              free packages, and priority scheduling at any NWD branch nationwide.
            </p>
          </div>
          <div style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 16, padding: "20px 28px", textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", marginBottom: 8 }}>
              <Lock style={{ width: 14, height: 14, color: "rgba(255,255,255,0.4)" }} />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Your Balance</span>
            </div>
            <p style={{ fontSize: 32, fontWeight: 900, color: "#fbbf24" }}>⭐ 0 pts</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 6 }}>Tier: Starter</p>
          </div>
        </div>
      </div>

      {/* Tier ladder */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "hsl(var(--foreground))", marginBottom: 14 }}>Loyalty Tiers</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          {TIERS.map((tier) => (
            <div key={tier.name} style={{
              background: tier.highlight ? tier.bgVar : "hsl(var(--card))",
              borderRadius: 16, padding: "20px",
              border: `2px solid ${tier.highlight ? tier.borderVar : "hsl(var(--border))"}`,
              boxShadow: tier.highlight ? "0 8px 24px rgba(251,191,36,0.12)" : "var(--shadow-sm)",
              position: "relative", overflow: "hidden",
            }}>
              {tier.highlight && (
                <div style={{ position: "absolute", top: 12, right: 12, fontSize: 9, fontWeight: 700, color: "#b45309", background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 20, padding: "3px 8px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Top Tier
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Star style={{ width: 18, height: 18, color: tier.colorVar }} />
                <p style={{ fontSize: 15, fontWeight: 800, color: tier.colorVar }}>{tier.name}</p>
              </div>
              <p style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", marginBottom: 12, fontWeight: 500 }}>{tier.range}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {tier.perks.map((perk) => (
                  <div key={perk} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <ChevronRight style={{ width: 13, height: 13, color: tier.colorVar, marginTop: 2, flexShrink: 0 }} />
                    <p style={{ fontSize: 13, color: "hsl(var(--foreground))", lineHeight: 1.4 }}>{perk}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How to earn */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "hsl(var(--foreground))", marginBottom: 14 }}>How to Earn Points</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
          {HOW_TO_EARN.map(({ icon, label, pts }) => (
            <div key={label} style={{
              background: "hsl(var(--card))", borderRadius: 14, padding: "18px 16px",
              border: "1px solid hsl(var(--border))", textAlign: "center",
              boxShadow: "var(--shadow-sm)",
            }}>
              <div style={{ fontSize: 26, marginBottom: 8 }}>{icon}</div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "hsl(var(--foreground))", marginBottom: 6 }}>{label}</p>
              <p style={{ fontSize: 14, fontWeight: 800, color: "hsl(var(--primary))" }}>{pts}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Register interest */}
      <div style={{
        background: "hsl(var(--card))", borderRadius: 16, padding: "24px 28px",
        border: "1px solid hsl(var(--border))", boxShadow: "var(--shadow-sm)",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Gift style={{ width: 20, height: 20, color: "var(--color-info)" }} />
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: "hsl(var(--foreground))", marginBottom: 4 }}>Be the first to know</p>
            <p style={{ fontSize: 13, color: "hsl(var(--muted-foreground))", lineHeight: 1.6 }}>
              Register your interest and we&apos;ll notify you when the Loyalty Program launches.
            </p>
          </div>
        </div>
        <button
          style={{
            display: "flex", alignItems: "center", gap: 8, padding: "11px 22px",
            borderRadius: 12, background: "#1006A0", color: "white",
            border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700,
            boxShadow: "0 4px 14px rgba(16,6,160,0.3)", transition: "all 0.2s",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#08036A"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#1006A0"; }}
        >
          <Star style={{ width: 15, height: 15, color: "#fbbf24" }} />
          Register Interest
        </button>
      </div>
    </div>
  );
}
