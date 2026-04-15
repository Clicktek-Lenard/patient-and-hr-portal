"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ShieldCheck, Activity } from "lucide-react";

/* ── Privacy / Terms Modal ── */
function PrivacyModal({ onAccept }: { onAccept: () => void }) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
      background: "rgba(8,3,106,0.75)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px", boxSizing: "border-box",
    }}>
      <div style={{
        background: "white", borderRadius: 16, width: "100%", maxWidth: 540,
        height: "100%", maxHeight: 620,
        display: "flex", flexDirection: "column",
        boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
        overflow: "hidden",
      }}>
        {/* Modal header */}
        <div style={{
          background: "#08036A", padding: "16px 20px",
          display: "flex", alignItems: "center", gap: 12,
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 20 }}>🔒</span>
          <div style={{ minWidth: 0 }}>
            <p style={{
              fontFamily: "var(--font-playfair, Georgia, serif)",
              fontSize: "1rem", fontWeight: 700, color: "white",
              lineHeight: 1.2, margin: 0,
            }}>
              Privacy Notice &amp; Terms of Use
            </p>
            <p style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.55)", margin: 0, marginTop: 2, lineHeight: 1.4 }}>
              NEW WORLD DIAGNOSTICS, INC. · Patient &amp; HR Portal
            </p>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{
          overflowY: "auto", padding: "16px 20px",
          flex: 1, fontSize: "0.82rem", color: "#374151", lineHeight: 1.7,
        }}>
          <p style={{ marginBottom: 14, color: "#1e293b" }}>
            By accessing this portal, you acknowledge and agree to the following:
          </p>

          {[
            { num: "01", title: "Data Privacy & Confidentiality", body: "Your personal health information is collected, stored, and processed in accordance with the Data Privacy Act of 2012 (RA 10173). NWD is committed to protecting the confidentiality, integrity, and availability of all patient and employee data. Information shared through this portal is used solely for healthcare delivery and administrative purposes." },
            { num: "02", title: "Authorized Use Only", body: "This portal is restricted to authorized users only. Unauthorized access, sharing of credentials, or misuse of health information is strictly prohibited and may result in legal action under applicable Philippine laws. All sessions are logged and monitored for security purposes." },
            { num: "03", title: "Session & Security Policy", body: "For your protection, sessions automatically expire after 15 minutes of inactivity. Always log out after use, especially on shared devices. NWD uses 256-bit SSL encryption and complies with ISO 27001 information security standards." },
            { num: "04", title: "Your Rights as a Data Subject", body: "Under RA 10173, you have the right to be informed, to access, to correct, to object, and to data portability. To exercise these rights or report a concern, contact our Data Protection Officer at dpo@nwdi.com.ph." },
          ].map(({ num, title, body }) => (
            <div key={num} style={{ marginBottom: 16 }}>
              <p style={{ fontWeight: 700, color: "#08036A", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: "#E00500" }}>{num}</span> {title}
              </p>
              <p style={{ margin: 0 }}>{body}</p>
            </div>
          ))}

          <div style={{ background: "#f0f4ff", border: "1px solid #c7d2fe", borderRadius: 10, padding: "10px 14px" }}>
            <p style={{ margin: 0, fontSize: "0.76rem", color: "#1e3a8a", fontWeight: 500 }}>
              🛡 This portal is DOH accredited and compliant with Philippine healthcare regulations including the Magna Carta of Patients&apos; Rights (RA 7432) and the Universal Health Care Act (RA 11223).
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid #e2e8f0", background: "#f8fafc", flexShrink: 0 }}>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginBottom: 12 }}>
            <input
              type="checkbox" checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{ width: 16, height: 16, marginTop: 2, accentColor: "#08036A", flexShrink: 0, cursor: "pointer" }}
            />
            <span style={{ fontSize: "0.79rem", color: "#374151", lineHeight: 1.5 }}>
              I have read and agree to the <strong>Privacy Notice</strong> and <strong>Terms of Use</strong> of the NWD Patient &amp; HR Portal
            </span>
          </label>
          <button
            onClick={onAccept} disabled={!agreed}
            style={{
              width: "100%", padding: "11px", borderRadius: 12, border: "none",
              background: agreed ? "#08036A" : "#cbd5e1", color: "white",
              fontSize: "0.88rem", fontWeight: 700,
              cursor: agreed ? "pointer" : "not-allowed", transition: "background 0.2s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxSizing: "border-box",
            }}
            onMouseEnter={(e) => { if (agreed) e.currentTarget.style.background = "#060280"; }}
            onMouseLeave={(e) => { if (agreed) e.currentTarget.style.background = "#08036A"; }}
          >
            <span>✓</span> Accept &amp; Continue
          </button>
        </div>
      </div>
    </div>
  );
}

const NAV_LINKS = [
  { label: "Services",    href: "https://www.nwdi.com.ph/" },
  { label: "Our Clinics", href: "https://www.nwdi.com.ph/" },
  { label: "Contact Us",  href: "https://www.nwdi.com.ph/" },
];

export default function LandingPage() {
  const router = useRouter();
  const [hovering, setHovering]             = useState<"patient" | "hr" | null>(null);
  const [showPrivacy, setShowPrivacy]       = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile]             = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => { setIsMobile(e.matches); if (!e.matches) setMobileMenuOpen(false); };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "var(--font-source-sans, 'Source Sans 3', system-ui, sans-serif)" }}>
      {showPrivacy && <PrivacyModal onAccept={() => setShowPrivacy(false)} />}

      {/* ── Header ── */}
      <header style={{
        background: "linear-gradient(180deg, #1006A0 0%, #1006A0 75%, #E00500 75%, #E00500 100%)",
        padding: "0 clamp(16px, 4vw, 48px)",
        height: 64, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "4px solid #E00500",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/nwdi-logo.png" alt="NEW WORLD DIAGNOSTICS, INC."
            style={{ height: 36, width: "auto", maxWidth: isMobile ? 160 : 200, objectFit: "contain", objectPosition: "left", display: "block", flexShrink: 0 }}
          />
          {!isMobile && (
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "white", letterSpacing: "0.04em", lineHeight: 1.2, whiteSpace: "nowrap" }}>
                NEW WORLD DIAGNOSTICS, INC.
              </span>
              <span style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.6)", fontStyle: "italic", whiteSpace: "nowrap" }}>
                &ldquo;Your Health is Our Commitment&rdquo;
              </span>
            </div>
          )}
        </div>

        {/* Desktop nav */}
        {!isMobile && (
          <nav style={{ display: "flex", gap: 20, flexShrink: 0 }}>
            {NAV_LINKS.map(({ label, href }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.82rem", textDecoration: "none", transition: "color 0.2s", fontWeight: 500, whiteSpace: "nowrap" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.75)")}
              >{label}</a>
            ))}
          </nav>
        )}

        {/* Hamburger — mobile only */}
        {isMobile && !showPrivacy && (
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            style={{ background: "transparent", border: "none", cursor: "pointer", padding: 6, display: "flex", flexDirection: "column", gap: 5, flexShrink: 0 }}
          >
            <span style={{ display: "block", width: 22, height: 2, background: "white", borderRadius: 2, transition: "all 0.2s", transform: mobileMenuOpen ? "rotate(45deg) translate(5px, 5px)" : "none" }} />
            <span style={{ display: "block", width: 22, height: 2, background: "white", borderRadius: 2, transition: "all 0.2s", opacity: mobileMenuOpen ? 0 : 1 }} />
            <span style={{ display: "block", width: 22, height: 2, background: "white", borderRadius: 2, transition: "all 0.2s", transform: mobileMenuOpen ? "rotate(-45deg) translate(5px, -5px)" : "none" }} />
          </button>
        )}
      </header>

      {/* Mobile dropdown */}
      {isMobile && mobileMenuOpen && !showPrivacy && (
        <div style={{ background: "#08036A", borderBottom: "2px solid #E00500", position: "sticky", top: 64, zIndex: 99 }}>
          {NAV_LINKS.map(({ label, href }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              style={{ display: "block", padding: "14px 20px", color: "rgba(255,255,255,0.85)", fontSize: "0.9rem", fontWeight: 600, textDecoration: "none", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "white"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.85)"; }}
            >{label}</a>
          ))}
        </div>
      )}

      {/* ── Hero ── */}
      <section style={{
        flex: 1,
        background: "linear-gradient(150deg, #08036A 0%, #1006A0 55%, #1B3A6B 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: isMobile ? "32px 16px" : "48px 24px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 50% 70% at 80% 50%, rgba(192,57,43,0.12) 0%, transparent 60%)" }} />
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.03, backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

        <div style={{ position: "relative", zIndex: 1, textAlign: "center", width: "100%", maxWidth: 720 }}>

          {/* Badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, marginBottom: 18, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 20, padding: "5px 14px" }}>
            <ShieldCheck style={{ width: 12, height: 12, color: "#F0B429", flexShrink: 0 }} />
            <span style={{ fontSize: isMobile ? "0.65rem" : "0.72rem", color: "rgba(255,255,255,0.75)", fontWeight: 600, letterSpacing: "0.03em" }}>
              ISO Certified · CAP Accredited Laboratory
            </span>
          </div>

          {/* Heading */}
          <h1 style={{
            fontFamily: "var(--font-playfair, Georgia, serif)",
            fontSize: isMobile ? "2rem" : "clamp(2.4rem, 5vw, 3.5rem)",
            lineHeight: 1.15, color: "white", marginBottom: 16, fontWeight: 800,
            letterSpacing: "-0.01em",
          }}>
            Your Health,{" "}
            <em style={{
              color: "#F0B429", fontStyle: "italic",
              textShadow: "0 0 32px rgba(240,180,41,0.45)",
            }}>Accessible</em>{" "}
            Anywhere
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: isMobile ? "0.88rem" : "1.05rem",
            color: "rgba(255,255,255,0.72)", lineHeight: 1.8,
            maxWidth: 500, margin: "0 auto 28px",
            fontWeight: 400, letterSpacing: "0.01em",
          }}>
            Secure self-service access to your lab results, health records, and appointments.{" "}
            <span style={{ color: "rgba(255,255,255,0.5)" }}>One platform for patients and HR professionals.</span>
          </p>

          {/* Portal cards */}
          <div style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: 16, justifyContent: "center", alignItems: "center",
          }}>
            {[
              { key: "patient" as const, title: "Patient Portal", desc: "Access results, book appointments, and manage your health records securely.", btnLabel: "Sign In as Patient", btnColor: "#1006A0", btnHover: "#0B0480", icon: <Activity style={{ width: 26, height: 26, color: "#1006A0" }} />, iconBg: "linear-gradient(135deg, #EBF4FF, #DBEAFE)", href: "/login?portal=patient" },
              { key: "hr" as const,      title: "HR Portal",      desc: "Manage employee health compliance, APE tracking, and workforce analytics.",    btnLabel: "Sign In as HR Staff", btnColor: "#E00500", btnHover: "#B80400", icon: <ShieldCheck style={{ width: 26, height: 26, color: "#E00500" }} />, iconBg: "linear-gradient(135deg, #FFF5E6, #FDEBD0)", href: "/login?portal=hr" },
            ].map((card) => (
              <div
                key={card.key}
                role="button" tabIndex={0}
                onClick={() => router.push(card.href)}
                onKeyDown={(e) => e.key === "Enter" && router.push(card.href)}
                onMouseEnter={() => setHovering(card.key)}
                onMouseLeave={() => setHovering(null)}
                style={{
                  background: "white", borderRadius: 20,
                  padding: isMobile ? "24px 20px" : "28px 24px",
                  width: isMobile ? "100%" : undefined,
                  maxWidth: isMobile ? 360 : 280,
                  flex: isMobile ? undefined : "1 1 240px",
                  cursor: "pointer", textAlign: "center",
                  border: `2px solid ${hovering === card.key ? "#D4A017" : "transparent"}`,
                  boxShadow: hovering === card.key ? "0 24px 64px rgba(0,0,0,0.35)" : "0 16px 48px rgba(0,0,0,0.25)",
                  transform: hovering === card.key ? "translateY(-4px)" : "none",
                  transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
                  boxSizing: "border-box",
                }}
              >
                <div style={{ width: 52, height: 52, borderRadius: 14, margin: "0 auto 12px", background: card.iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {card.icon}
                </div>
                <p style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "1.1rem", color: "#1006A0", marginBottom: 8, fontWeight: 700 }}>{card.title}</p>
                <p style={{ fontSize: "0.8rem", color: "#555577", lineHeight: 1.6, marginBottom: 16 }}>{card.desc}</p>
                <button
                  style={{ display: "block", width: "100%", padding: "10px", borderRadius: 10, border: "none", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", background: card.btnColor, color: "white", transition: "background 0.2s", fontFamily: "inherit", boxSizing: "border-box" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = card.btnHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = card.btnColor)}
                >{card.btnLabel}</button>
              </div>
            ))}
          </div>

          <p style={{ marginTop: 28, fontSize: "0.68rem", color: "rgba(255,255,255,0.3)", letterSpacing: "0.04em" }}>
            © {new Date().getFullYear()} NEW WORLD DIAGNOSTICS, INC. · All rights reserved
          </p>
        </div>
      </section>
    </div>
  );
}
