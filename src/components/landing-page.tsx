"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  ShieldCheck, Activity, Heart, FileText,
  ArrowRight, Lock, TrendingUp, Share2,
  Phone, Mail, ChevronDown, CheckCircle2, Star,
  Microscope, Stethoscope, FlaskConical, Users,
  BarChart3, ClipboardList,
} from "lucide-react";

/* ─── design tokens (Teams-inspired, consistent with dashboard) ─── */
const FONT    = "var(--font-sans,'Inter',system-ui,sans-serif)";
const BLUE    = "#1006A0";
const RED     = "#E00500";
const NAVY    = "#050330";
const GOLD    = "#D4A017";

/* ─── smooth counter ─── */
function Counter({ to, suffix }: { to: number; suffix: string }) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const done = useRef(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !done.current) {
        done.current = true;
        let v = 0; const step = to / 60;
        const t = setInterval(() => { v += step; if (v >= to) { setN(to); clearInterval(t); } else setN(Math.floor(v)); }, 16);
      }
    }, { threshold: 0.6 });
    io.observe(el); return () => io.disconnect();
  }, [to]);
  return <span ref={ref}>{n.toLocaleString()}{suffix}</span>;
}

/* ─── privacy modal ─── */
function PrivacyModal({ onAccept }: { onAccept: () => void }) {
  const [ok, setOk] = useState(false);
  return (
    <div style={{ position:"fixed",inset:0,zIndex:9999,background:"rgba(5,3,48,0.92)",backdropFilter:"blur(20px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:FONT }}>
      <div style={{ background:"#fff",borderRadius:20,width:"100%",maxWidth:500,maxHeight:"88vh",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 40px 100px rgba(0,0,0,0.6)" }}>
        <div style={{ background:`linear-gradient(135deg,${NAVY},${BLUE})`,padding:"20px 24px",display:"flex",alignItems:"center",gap:14,borderBottom:`1px solid ${RED}`,flexShrink:0 }}>
          <div style={{ width:38,height:38,borderRadius:10,background:"rgba(255,255,255,0.12)",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <Lock size={16} color={GOLD}/>
          </div>
          <div>
            <p style={{ fontSize:"0.95rem",fontWeight:800,color:"#fff",margin:0 }}>Privacy Notice &amp; Terms of Use</p>
            <p style={{ fontSize:"0.65rem",color:"rgba(255,255,255,0.45)",margin:"2px 0 0",letterSpacing:"0.04em" }}>NEW WORLD DIAGNOSTICS, INC.</p>
          </div>
        </div>
        <div style={{ overflowY:"auto",padding:"22px 24px",flex:1,fontSize:"0.81rem",color:"#374151",lineHeight:1.75 }}>
          <p style={{ marginBottom:18,color:"#1e293b",fontWeight:500 }}>By accessing this portal, you acknowledge and agree:</p>
          {[
            ["01","Data Privacy","Your health information is processed per Data Privacy Act of 2012 (RA 10173). Used solely for healthcare delivery."],
            ["02","Authorized Use","Restricted to authorized users. Unauthorized access is prohibited under Philippine law."],
            ["03","Session Security","Sessions expire after 8 hours. 256-bit SSL encryption. ISO 27001 compliant."],
            ["04","Your Rights","You have rights under RA 10173 — access, correct, object. Contact dpo@nwdi.com.ph."],
          ].map(([num,title,body]) => (
            <div key={num} style={{ marginBottom:16,paddingLeft:12,borderLeft:"2px solid #e0e7ff" }}>
              <p style={{ fontWeight:700,color:BLUE,fontSize:"0.7rem",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4,display:"flex",alignItems:"center",gap:7 }}>
                <span style={{ color:RED }}>{num}</span>{title}
              </p>
              <p style={{ margin:0,color:"#4b5563" }}>{body}</p>
            </div>
          ))}
          <div style={{ background:"#eef2ff",border:"1px solid #c7d2fe",borderRadius:10,padding:"10px 14px",marginTop:4 }}>
            <p style={{ margin:0,fontSize:"0.73rem",color:"#1e3a8a",fontWeight:500 }}>DOH accredited &middot; RA 7432 &middot; Universal Health Care Act (RA 11223)</p>
          </div>
        </div>
        <div style={{ padding:"16px 24px",background:"#f8fafc",borderTop:"1px solid #f1f5f9",flexShrink:0 }}>
          <label style={{ display:"flex",alignItems:"flex-start",gap:10,cursor:"pointer",marginBottom:14 }}>
            <input type="checkbox" checked={ok} onChange={e=>setOk(e.target.checked)} style={{ width:16,height:16,marginTop:2,accentColor:BLUE,cursor:"pointer",flexShrink:0 }}/>
            <span style={{ fontSize:"0.78rem",color:"#374151",lineHeight:1.5 }}>I have read and agree to the <strong style={{ color:BLUE }}>Privacy Notice</strong> and <strong style={{ color:BLUE }}>Terms of Use</strong></span>
          </label>
          <button onClick={onAccept} disabled={!ok} style={{ width:"100%",padding:"12px",borderRadius:12,border:"none",fontSize:"0.88rem",fontWeight:700,cursor:ok?"pointer":"not-allowed",transition:"all 0.2s",background:ok?`linear-gradient(135deg,${NAVY},${BLUE})`:"#e2e8f0",color:ok?"#fff":"#94a3b8",boxShadow:ok?`0 4px 20px ${BLUE}44`:"none" }}>
            Accept &amp; Continue
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── data ─── */
const NAV = [
  { label:"Services",    href:"https://www.nwdi.com.ph/services/" },
  { label:"Our Clinics", href:"https://www.nwdi.com.ph/clinic-maps/" },
  { label:"Contact",     href:"https://www.nwdi.com.ph/contact-us/" },
];

const SERVICES = [
  { icon:Microscope,    label:"Laboratory",         color:"#0ea5e9" },
  { icon:FlaskConical,  label:"Clinical Chemistry", color:"#8b5cf6" },
  { icon:Stethoscope,   label:"Annual PE",          color:"#10b981" },
  { icon:Activity,      label:"ECG / Holter",       color:RED },
  { icon:Heart,         label:"Cardiology",         color:"#f43f5e" },
  { icon:Users,         label:"Corporate Health",   color:BLUE },
];

const FEATURES = [
  { icon:FileText,     title:"Lab Results & Records",    desc:"View lab results, visit histories, and abnormal flags — download as PDF or share securely with your physician." },
  { icon:TrendingUp,   title:"Health Trends & Insights", desc:"Track vitals, lab values, and wellness scores over time with interactive trend charts and AI-powered explanations." },
  { icon:Users,        title:"Employee & PE Compliance",  desc:"Monitor Annual PE completion rates, workforce health conditions, and department-level compliance from one dashboard." },
  { icon:BarChart3,    title:"Reports & Analytics",       desc:"Generate exportable reports, view real-time visit activity, and gain actionable health analytics across your organization." },
];

const WORKFLOW = [
  { step:"01", icon:Lock,           title:"Sign In Securely",       desc:"Access your Patient or HR portal with encrypted, session-protected authentication." },
  { step:"02", icon:ClipboardList,  title:"View Results & Records", desc:"Browse lab results, employee health data, visit histories, and compliance reports." },
  { step:"03", icon:BarChart3,      title:"Track & Analyze",        desc:"Monitor health trends, PE compliance rates, and generate exportable analytics." },
];

const STATS = [
  { n:50000, s:"+",  label:"Patients Served"      },
  { n:98,    s:"%",  label:"Satisfaction Rate"     },
  { n:15,    s:"+",  label:"Years of Excellence"   },
  { n:24,    s:"/7", label:"Portal Availability"   },
];

/* ─── section observer for fade-in ─── */
function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); io.disconnect(); }
    }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, style: {
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(28px)",
    transition: "opacity 0.7s ease, transform 0.7s ease",
  } as React.CSSProperties };
}

/* ═══════════════════════════════════════════════
   MAIN LANDING PAGE
═══════════════════════════════════════════════ */
export default function LandingPage() {
  const router = useRouter();
  const [showPrivacy, setShowPrivacy] = useState(true);
  const [menuOpen, setMenuOpen]       = useState(false);
  const [mobile, setMobile]           = useState(false);
  const [scrolled, setScrolled]       = useState(false);
  const [cardHov, setCardHov]         = useState<"patient"|"hr"|null>(null);
  const [heroVis, setHeroVis]         = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width:767px)");
    setMobile(mq.matches);
    const hMq = (e:MediaQueryListEvent) => { setMobile(e.matches); if(!e.matches) setMenuOpen(false); };
    mq.addEventListener("change", hMq);
    const hScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", hScroll);
    setTimeout(() => setHeroVis(true), 80);
    return () => { mq.removeEventListener("change", hMq); window.removeEventListener("scroll", hScroll); };
  }, []);

  return (
    <div style={{ fontFamily: FONT, background: "#ffffff", overflowX: "hidden" }}>
      {showPrivacy && <PrivacyModal onAccept={() => setShowPrivacy(false)} />}

      {/* ════════════════════════════════
          HEADER — Clean sticky nav
      ════════════════════════════════ */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
        background: scrolled ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.98)",
        backdropFilter: "blur(16px)",
        borderBottom: scrolled ? "1px solid #E8EAED" : "1px solid transparent",
        transition: "all 0.35s ease",
        padding: "0 clamp(16px, 5vw, 64px)",
        height: 64, display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: scrolled ? "0 1px 8px rgba(0,0,0,0.06)" : "none",
      }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/nwdi-logo.png" alt="NWDI" style={{ height: 32, objectFit: "contain", display: "block" }} />
          {!mobile && (
            <div style={{ paddingLeft: 12, borderLeft: "1px solid #E8EAED", display: "flex", flexDirection: "column", gap: 1 }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#111827", lineHeight: 1 }}>Patient &amp; HR Portal</span>
              <span style={{ fontSize: "0.58rem", color: "#9CA3AF", fontStyle: "italic" }}>&ldquo;Your Health is Our Commitment&rdquo;</span>
            </div>
          )}
        </div>

        {/* Desktop nav */}
        {!mobile && (
          <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {NAV.map(({ label, href }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                style={{
                  fontFamily: FONT, fontSize: "0.84rem", fontWeight: 500, textDecoration: "none",
                  padding: "7px 14px", borderRadius: 8, transition: "all 0.18s",
                  color: "#4B5563", background: "transparent",
                }}
                onMouseEnter={e => { e.currentTarget.style.color = "#111827"; e.currentTarget.style.background = "#F3F4F6"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "#4B5563"; e.currentTarget.style.background = "transparent"; }}
              >{label}</a>
            ))}
          </nav>
        )}

        {/* Hamburger */}
        {mobile && !showPrivacy && (
          <button onClick={() => setMenuOpen(v => !v)} aria-label="Menu" style={{ background: "transparent", border: "none", cursor: "pointer", padding: 6, display: "flex", flexDirection: "column", gap: 5 }}>
            {[0, 1, 2].map(i => (
              <span key={i} style={{
                display: "block", width: 22, height: 2, borderRadius: 2, transition: "all 0.25s",
                background: "#374151",
                transform: menuOpen ? (i === 0 ? "rotate(45deg) translate(5px,5px)" : i === 2 ? "rotate(-45deg) translate(5px,-5px)" : "none") : "none",
                opacity: menuOpen && i === 1 ? 0 : 1,
              }} />
            ))}
          </button>
        )}
      </header>

      {/* spacer for fixed header */}
      <div style={{ height: 64 }} />

      {/* mobile menu */}
      {mobile && menuOpen && !showPrivacy && (
        <div style={{
          position: "fixed", top: 64, left: 0, right: 0, zIndex: 199,
          background: "rgba(255,255,255,0.98)", backdropFilter: "blur(16px)",
          borderBottom: "1px solid #E8EAED", boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
        }}>
          {NAV.map(({ label, href }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer"
              onClick={() => setMenuOpen(false)}
              style={{
                display: "block", width: "100%", textAlign: "left",
                padding: "14px 20px", color: "#374151", fontSize: "0.9rem", fontWeight: 500,
                background: "transparent", borderBottom: "1px solid #F3F4F6",
                textDecoration: "none", fontFamily: FONT,
              }}
            >{label}</a>
          ))}
          <div style={{ padding: "12px 20px", display: "flex", gap: 10 }}>
            <button onClick={() => router.push("/login?portal=patient")} style={{
              flex: 1, padding: "10px", borderRadius: 10, border: "none",
              background: BLUE, color: "#fff", fontSize: "0.84rem", fontWeight: 600, cursor: "pointer",
            }}>Patient Login</button>
            <button onClick={() => router.push("/login?portal=hr")} style={{
              flex: 1, padding: "10px", borderRadius: 10, border: `1.5px solid ${RED}`,
              background: "#fff", color: RED, fontSize: "0.84rem", fontWeight: 600, cursor: "pointer",
            }}>HR Login</button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════
          HERO — Light, clean, modern
      ════════════════════════════════ */}
      <section style={{
        minHeight: mobile ? "auto" : "92vh",
        background: "linear-gradient(180deg, #ffffff 0%, #F3F4F6 100%)",
        position: "relative", overflow: "hidden",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: mobile ? "56px 20px 48px" : "72px 32px 80px",
      }}>
        {/* subtle background pattern */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.4,
          backgroundImage: "radial-gradient(#E8EAED 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }} />
        {/* accent glow */}
        <div style={{ position: "absolute", top: "-20%", right: "-10%", width: "50%", height: "120%",
          background: `radial-gradient(ellipse, ${BLUE}08 0%, transparent 60%)`, pointerEvents: "none" }} />

        {/* hero content */}
        <div style={{
          position: "relative", zIndex: 1, textAlign: "center", width: "100%", maxWidth: 960,
          opacity: heroVis ? 1 : 0, transform: heroVis ? "translateY(0)" : "translateY(28px)",
          transition: "opacity 0.8s ease, transform 0.8s ease",
        }}>
          {/* pill badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 24,
            background: "#EEF2FF", border: "1px solid #C7D2FE",
            borderRadius: 100, padding: "6px 18px",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e", flexShrink: 0 }} />
            <span style={{ fontSize: mobile ? "0.65rem" : "0.72rem", color: BLUE, fontWeight: 600, letterSpacing: "0.04em" }}>
              ISO Certified &middot; CAP Accredited &middot; DOH Compliant
            </span>
          </div>

          {/* headline */}
          <h1 style={{
            fontWeight: 700, letterSpacing: "-0.025em",
            fontSize: mobile ? "1.8rem" : "clamp(2.2rem, 4vw, 3.2rem)",
            lineHeight: 1.15, color: "#111827", margin: "0 0 16px",
          }}>
            Simplify{" "}
            <span style={{ color: BLUE }}>Patient</span> &amp;{" "}
            <span style={{ color: RED }}>HR</span>{" "}
            Management
          </h1>

          {/* sub */}
          <p style={{
            fontSize: mobile ? "0.9rem" : "1.05rem", color: "#6B7280",
            lineHeight: 1.7, maxWidth: 560, margin: "0 auto 40px", fontWeight: 400,
          }}>
            Access your lab results, track health trends, monitor employee compliance, and generate reports — all from one secure, modern platform.
          </p>

          {/* ── Portal Cards ── */}
          <div style={{
            display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr",
            gap: 16, width: "100%", maxWidth: 640, margin: "0 auto 48px",
          }}>
            {([
              {
                key: "patient" as const, title: "Patient Portal", accent: BLUE,
                icon: <Activity size={16} color={BLUE} />, iconBg: "#EEF2FF",
                href: "/login?portal=patient", btn: "Access Patient Portal",
                items: ["View lab results & abnormal flags", "Health trends & AI explanations", "Share records with your physician", "Appointments & digital health card"],
              },
              {
                key: "hr" as const, title: "HR Portal", accent: RED,
                icon: <ShieldCheck size={16} color={RED} />, iconBg: "#FEE2E2",
                href: "/login?portal=hr", btn: "Access HR Portal",
                items: ["Real-time employee visit tracking", "Annual PE compliance by department", "Workforce conditions & wellness score", "Reports, exports & audit trail"],
              },
            ] as const).map(card => {
              const h = cardHov === card.key;
              return (
                <div key={card.key}
                  onMouseEnter={() => setCardHov(card.key)}
                  onMouseLeave={() => setCardHov(null)}
                  style={{
                    background: "#ffffff",
                    borderRadius: 16,
                    border: `1px solid ${h ? card.accent + "40" : "#E8EAED"}`,
                    boxShadow: h ? "0 8px 32px rgba(0,0,0,0.10)" : "0 1px 4px rgba(0,0,0,0.05)",
                    transform: h ? "translateY(-4px)" : "none",
                    transition: "all 0.25s ease",
                    padding: "24px 22px",
                    textAlign: "left",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: card.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {card.icon}
                    </div>
                    <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#111827" }}>{card.title}</span>
                  </div>
                  <div style={{ marginBottom: 18 }}>
                    {card.items.map(item => (
                      <div key={item} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <CheckCircle2 size={14} color={card.accent} style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: "0.78rem", color: "#6B7280" }}>{item}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => router.push(card.href)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      width: "100%", padding: "10px 14px", borderRadius: 10,
                      border: h ? "none" : `1.5px solid ${card.accent}`,
                      fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
                      background: h ? card.accent : "#fff",
                      color: h ? "#fff" : card.accent,
                      transition: "all 0.25s",
                      boxShadow: h ? `0 4px 16px ${card.accent}30` : "none",
                    }}
                  >
                    {card.btn} <ArrowRight size={13} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* stats row */}
          <div style={{
            display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(4, 1fr)",
            background: "#ffffff", border: "1px solid #E8EAED",
            borderRadius: 16, overflow: "hidden",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}>
            {STATS.map((s, i) => (
              <div key={s.label} style={{
                padding: mobile ? "20px 10px" : "24px 0", textAlign: "center",
                borderRight: (!mobile && i < STATS.length - 1) || (mobile && i % 2 === 0) ? "1px solid #E8EAED" : "none",
                borderBottom: (mobile && i < 2) ? "1px solid #E8EAED" : "none",
              }}>
                <p style={{ fontSize: "clamp(1.4rem, 2.5vw, 1.8rem)", fontWeight: 700, color: BLUE, margin: 0, lineHeight: 1 }}>
                  <Counter to={s.n} suffix={s.s} />
                </p>
                <p style={{ fontSize: "0.68rem", color: "#9CA3AF", margin: "6px 0 0", letterSpacing: "0.08em", textTransform: "uppercase" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* scroll cue */}
        <div style={{ position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, opacity: 0.35 }}>
          <span style={{ fontSize: "0.6rem", color: "#9CA3AF", letterSpacing: "0.12em", textTransform: "uppercase" }}>Scroll</span>
          <ChevronDown size={14} color="#9CA3AF" style={{ animation: "bounce 1.8s ease-in-out infinite" }} />
        </div>
      </section>

      {/* ════════════════════════════════
          SERVICES STRIP
      ════════════════════════════════ */}
      <section style={{
        background: "#ffffff", borderTop: "1px solid #E8EAED", borderBottom: "1px solid #E8EAED",
        padding: mobile ? "32px 20px" : "28px 64px",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ textAlign: "center", fontSize: "0.68rem", fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 20 }}>Our Core Services</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
            {SERVICES.map(({ icon: Icon, label, color }) => (
              <ServiceChip key={label} Icon={Icon} label={label} color={color} />
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════
          FEATURES — 4 clean cards
      ════════════════════════════════ */}
      <FeaturesSection mobile={mobile} />

      {/* ════════════════════════════════
          HOW IT WORKS — Workflow
      ════════════════════════════════ */}
      <WorkflowSection mobile={mobile} />

      {/* ════════════════════════════════
          WHY US / ABOUT
      ════════════════════════════════ */}
      <AboutSection mobile={mobile} />

      {/* ════════════════════════════════
          TESTIMONIALS
      ════════════════════════════════ */}
      <TestimonialsSection mobile={mobile} />

      {/* ════════════════════════════════
          CTA BAND — clean with contrast
      ════════════════════════════════ */}
      <section style={{
        background: "#F3F4F6", padding: mobile ? "56px 20px" : "72px 64px",
        textAlign: "center", position: "relative", overflow: "hidden",
        borderTop: "1px solid #E8EAED",
      }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.3,
          backgroundImage: "radial-gradient(#D1D5DB 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 640, margin: "0 auto" }}>
          <p style={{ fontSize: "0.68rem", fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 14 }}>Get Started Today</p>
          <h2 style={{ fontSize: mobile ? "1.4rem" : "1.9rem", fontWeight: 700, color: "#111827", lineHeight: 1.2, margin: "0 0 12px", letterSpacing: "-0.015em" }}>
            Ready to take control of your health?
          </h2>
          <p style={{ fontSize: "0.9rem", color: "#6B7280", margin: "0 0 32px", lineHeight: 1.7 }}>
            Sign in to access your complete health profile in seconds.
          </p>
          <div style={{ display: "flex", flexDirection: mobile ? "column" : "row", gap: 12, justifyContent: "center", alignItems: "center" }}>
            <CtaButton label="Patient Portal" icon={<Activity size={17} />} primary onClick={() => router.push("/login?portal=patient")} />
            <CtaButton label="HR Portal" icon={<ShieldCheck size={17} />} onClick={() => router.push("/login?portal=hr")} />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════
          FOOTER
      ════════════════════════════════ */}
      <footer id="contact" style={{ background: "#111827", padding: mobile ? "36px 20px 24px" : "48px 64px 32px", borderTop: "1px solid #1F2937" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", flexDirection: mobile ? "column" : "row", gap: 32, justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
            <div style={{ maxWidth: 280 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/nwdi-logo.png" alt="NWDI" style={{ height: 28, objectFit: "contain", display: "block", marginBottom: 10, opacity: 0.85 }} />
              <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.35)", lineHeight: 1.7, margin: 0 }}>New World Diagnostics, Inc. — delivering world-class diagnostic services since 2009.</p>
            </div>
            <div style={{ display: "flex", gap: mobile ? 32 : 56, flexWrap: "wrap" }}>
              <div>
                <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Portal</p>
                <a href="/login?portal=patient" style={{ display: "block", fontSize: "0.78rem", color: "rgba(255,255,255,0.4)", textDecoration: "none", marginBottom: 8, transition: "color 0.18s" }}
                  onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.8)"}
                  onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}
                >Patient Sign In</a>
                <a href="/login?portal=hr" style={{ display: "block", fontSize: "0.78rem", color: "rgba(255,255,255,0.4)", textDecoration: "none", marginBottom: 8, transition: "color 0.18s" }}
                  onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.8)"}
                  onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}
                >HR Sign In</a>
              </div>
              <div>
                <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Contact</p>
                <a href="tel:+63" style={{ display: "flex", alignItems: "center", gap: 7, fontSize: "0.78rem", color: "rgba(255,255,255,0.4)", textDecoration: "none", marginBottom: 9, transition: "color 0.18s" }}
                  onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.8)"}
                  onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}
                ><Phone size={13} /> Call Support</a>
                <a href="mailto:support@nwdi.com" style={{ display: "flex", alignItems: "center", gap: 7, fontSize: "0.78rem", color: "rgba(255,255,255,0.4)", textDecoration: "none", transition: "color 0.18s" }}
                  onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.8)"}
                  onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}
                ><Mail size={13} /> support@nwdi.com</a>
              </div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 20, display: "flex", flexDirection: mobile ? "column" : "row", gap: 10, justifyContent: "space-between", alignItems: mobile ? "flex-start" : "center" }}>
            <p style={{ fontSize: "0.66rem", color: "rgba(255,255,255,0.2)", margin: 0 }}>&copy; {new Date().getFullYear()} NEW WORLD DIAGNOSTICS, INC. All rights reserved.</p>
            <div style={{ display: "flex", gap: 20 }}>
              {["Privacy Policy", "Terms of Use", "Accessibility"].map(l => (
                <a key={l} href="#" style={{ fontSize: "0.66rem", color: "rgba(255,255,255,0.25)", textDecoration: "none", transition: "color 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.65)"}
                  onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.25)"}
                >{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ── Scroll to top button ── */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Scroll to top"
        style={{
          position: "fixed", bottom: 28, right: 24, zIndex: 300,
          width: 42, height: 42, borderRadius: "50%",
          background: "#ffffff", border: "1px solid #E8EAED",
          boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
          opacity: scrolled ? 1 : 0,
          pointerEvents: scrolled ? "auto" : "none",
          transform: scrolled ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 0.3s ease, transform 0.3s ease",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = BLUE; e.currentTarget.style.borderColor = BLUE; const svg = e.currentTarget.querySelector("svg"); if (svg) svg.style.stroke = "#fff"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "#ffffff"; e.currentTarget.style.borderColor = "#E8EAED"; const svg = e.currentTarget.querySelector("svg"); if (svg) svg.style.stroke = "#6B7280"; }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ transition: "stroke 0.2s" }}>
          <path d="M8 12V4M8 4L4 8M8 4l4 4" stroke="#6B7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <style>{`
        @keyframes bounce {
          0%,100%{transform:translateY(0)}
          50%{transform:translateY(5px)}
        }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SUB-COMPONENTS (separate to avoid hook violations)
═══════════════════════════════════════════════ */

/* ── Service chip ── */
function ServiceChip({ Icon, label, color }: { Icon: React.ElementType; label: string; color: string }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 9,
        background: "#fff", border: `1px solid ${hov ? color + "50" : "#E8EAED"}`,
        borderRadius: 10, padding: "9px 16px",
        boxShadow: hov ? `0 4px 14px ${color}18` : "0 1px 3px rgba(0,0,0,0.03)",
        transition: "all 0.2s", cursor: "default",
      }}
    >
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: `${color}12`, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={14} color={color} />
      </div>
      <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#374151" }}>{label}</span>
    </div>
  );
}

/* ── Features section ── */
function FeaturesSection({ mobile }: { mobile: boolean }) {
  const fade = useFadeIn();
  return (
    <section id="features" style={{ background: "#F9FAFB", padding: mobile ? "64px 20px" : "88px 64px", borderTop: "1px solid #E8EAED" }}>
      <div ref={fade.ref} style={{ ...fade.style, maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: mobile ? 40 : 56 }}>
          <span style={{ display: "inline-block", fontSize: "0.68rem", fontWeight: 700, color: BLUE, letterSpacing: "0.12em", textTransform: "uppercase", background: "#EEF2FF", borderRadius: 8, padding: "5px 14px", marginBottom: 14 }}>Features</span>
          <h2 style={{ fontSize: mobile ? "1.4rem" : "1.9rem", fontWeight: 700, color: "#111827", lineHeight: 1.2, margin: "0 0 12px", letterSpacing: "-0.015em" }}>
            Everything you need, <span style={{ color: BLUE }}>in one place</span>
          </h2>
          <p style={{ fontSize: "0.9rem", color: "#6B7280", maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>
            Designed for modern healthcare — manage patients, employees, and reports from a single unified platform.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(2, 1fr)", gap: 16 }}>
          {FEATURES.map(f => (
            <FeatureCard key={f.title} Icon={f.icon} title={f.title} desc={f.desc} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Feature card ── */
function FeatureCard({ Icon, title, desc }: { Icon: React.ElementType; title: string; desc: string }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: "#ffffff",
        borderRadius: 14, padding: "26px 24px",
        border: `1px solid ${hov ? "#C7D2FE" : "#E8EAED"}`,
        boxShadow: hov ? "0 8px 28px rgba(0,0,0,0.07)" : "0 1px 3px rgba(0,0,0,0.03)",
        transform: hov ? "translateY(-3px)" : "none",
        transition: "all 0.25s ease",
        cursor: "default", display: "flex", alignItems: "flex-start", gap: 16,
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: hov ? `linear-gradient(135deg, ${BLUE}, #1a14c8)` : "#EEF2FF",
        boxShadow: hov ? `0 4px 14px ${BLUE}25` : "none",
        transition: "all 0.25s",
      }}>
        <Icon size={20} color={hov ? "#fff" : BLUE} style={{ transition: "color 0.25s" }} />
      </div>
      <div>
        <p style={{ fontWeight: 700, fontSize: "0.92rem", color: "#111827", margin: "0 0 6px", lineHeight: 1.3 }}>{title}</p>
        <p style={{ fontSize: "0.83rem", color: "#6B7280", lineHeight: 1.65, margin: 0 }}>{desc}</p>
      </div>
    </div>
  );
}

/* ── Workflow section ── */
function WorkflowSection({ mobile }: { mobile: boolean }) {
  const fade = useFadeIn();
  return (
    <section style={{ background: "#ffffff", padding: mobile ? "64px 20px" : "88px 64px", borderTop: "1px solid #E8EAED" }}>
      <div ref={fade.ref} style={{ ...fade.style, maxWidth: 900, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: mobile ? 40 : 56 }}>
          <span style={{ display: "inline-block", fontSize: "0.68rem", fontWeight: 700, color: BLUE, letterSpacing: "0.12em", textTransform: "uppercase", background: "#EEF2FF", borderRadius: 8, padding: "5px 14px", marginBottom: 14 }}>How It Works</span>
          <h2 style={{ fontSize: mobile ? "1.4rem" : "1.9rem", fontWeight: 700, color: "#111827", lineHeight: 1.2, margin: "0 0 12px", letterSpacing: "-0.015em" }}>
            Get started in <span style={{ color: BLUE }}>three simple steps</span>
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(3, 1fr)", gap: 20, position: "relative" }}>
          {/* connecting line (desktop only) */}
          {!mobile && (
            <div style={{
              position: "absolute", top: 40, left: "17%", right: "17%", height: 2,
              background: `linear-gradient(90deg, ${BLUE}30, ${BLUE}60, ${BLUE}30)`,
              borderRadius: 1, zIndex: 0,
            }} />
          )}
          {WORKFLOW.map(w => (
            <WorkflowCard key={w.step} {...w} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Workflow card ── */
function WorkflowCard({ step, icon: Icon, title, desc }: { step: string; icon: React.ElementType; title: string; desc: string }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: "relative", zIndex: 1, textAlign: "center",
        background: "#ffffff", borderRadius: 14, padding: "28px 20px",
        border: `1px solid ${hov ? "#C7D2FE" : "#E8EAED"}`,
        boxShadow: hov ? "0 8px 28px rgba(0,0,0,0.07)" : "0 1px 3px rgba(0,0,0,0.03)",
        transform: hov ? "translateY(-3px)" : "none",
        transition: "all 0.25s ease",
      }}
    >
      <div style={{
        width: 52, height: 52, borderRadius: 14, margin: "0 auto 16px",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: hov ? `linear-gradient(135deg, ${BLUE}, #1a14c8)` : "#EEF2FF",
        boxShadow: hov ? `0 4px 14px ${BLUE}25` : "none",
        transition: "all 0.25s", position: "relative",
      }}>
        <Icon size={22} color={hov ? "#fff" : BLUE} style={{ transition: "color 0.25s" }} />
        <span style={{
          position: "absolute", top: -6, right: -6,
          width: 22, height: 22, borderRadius: "50%",
          background: BLUE, color: "#fff",
          fontSize: "0.6rem", fontWeight: 800,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
        }}>{step}</span>
      </div>
      <p style={{ fontWeight: 700, fontSize: "0.92rem", color: "#111827", margin: "0 0 6px" }}>{title}</p>
      <p style={{ fontSize: "0.82rem", color: "#6B7280", lineHeight: 1.65, margin: 0 }}>{desc}</p>
    </div>
  );
}

/* ── About / Why Us section ── */
function AboutSection({ mobile }: { mobile: boolean }) {
  const fade = useFadeIn();
  return (
    <section id="about" style={{ background: "#F9FAFB", padding: mobile ? "64px 20px" : "88px 64px", borderTop: "1px solid #E8EAED" }}>
      <div ref={fade.ref} style={{ ...fade.style, maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: mobile ? "column" : "row", gap: mobile ? 40 : 72, alignItems: "center" }}>

        {/* left — visual card */}
        <div style={{ flex: "0 0 auto", position: "relative", width: mobile ? "100%" : 380 }}>
          <div style={{
            background: `linear-gradient(135deg, ${NAVY}, ${BLUE})`,
            borderRadius: 20, padding: "32px 28px", color: "#fff",
            boxShadow: `0 20px 48px ${BLUE}35`,
          }}>
            <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: 12 }}>Patient Satisfaction</p>
            <p style={{ fontSize: "2.4rem", fontWeight: 700, color: "#fff", margin: "0 0 4px", lineHeight: 1 }}>98%</p>
            <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.6)", margin: 0 }}>Based on 2024 patient survey</p>
            <div style={{ display: "flex", gap: 3, marginTop: 14 }}>
              {[...Array(5)].map((_, i) => <Star key={i} size={14} color={GOLD} fill={GOLD} />)}
            </div>
          </div>
          {!mobile && (
            <div style={{
              position: "absolute", bottom: -32, right: -20,
              width: 200, background: "#fff", borderRadius: 14, padding: "18px 16px",
              boxShadow: "0 8px 28px rgba(0,0,0,0.08)", border: "1px solid #E8EAED",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: `${RED}10`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ShieldCheck size={14} color={RED} />
                </div>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#111827" }}>Accredited</span>
              </div>
              {["ISO Certified", "DOH Compliant", "CAP Ready"].map(t => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                  <CheckCircle2 size={13} color="#22c55e" />
                  <span style={{ fontSize: "0.73rem", color: "#6B7280" }}>{t}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* right — copy */}
        <div style={{ flex: 1 }}>
          <span style={{ display: "inline-block", fontSize: "0.68rem", fontWeight: 700, color: BLUE, letterSpacing: "0.12em", textTransform: "uppercase", background: "#EEF2FF", borderRadius: 8, padding: "5px 14px", marginBottom: 16 }}>Why Choose NWD</span>
          <h2 style={{ fontSize: mobile ? "1.4rem" : "1.9rem", fontWeight: 700, color: "#111827", lineHeight: 1.2, margin: "0 0 14px", letterSpacing: "-0.015em" }}>
            Trusted by thousands.<br /><span style={{ color: BLUE }}>Built for you.</span>
          </h2>
          <p style={{ fontSize: "0.88rem", color: "#6B7280", lineHeight: 1.8, margin: "0 0 24px" }}>
            New World Diagnostics combines 15+ years of clinical excellence with modern digital infrastructure — giving you instant, secure access to the health information that matters most.
          </p>
          {[
            "Instant access to lab results with abnormal value flagging",
            "Secure record sharing via encrypted, time-limited links",
            "AI-powered result explanations and health trend tracking",
            "Real-time PE compliance monitoring for HR professionals",
          ].map(t => (
            <div key={t} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                <CheckCircle2 size={12} color={BLUE} />
              </div>
              <p style={{ fontSize: "0.86rem", color: "#374151", margin: 0, lineHeight: 1.6 }}>{t}</p>
            </div>
          ))}
          <a href="https://www.nwdi.com.ph/" target="_blank" rel="noopener noreferrer" style={{
            display: "inline-flex", alignItems: "center", gap: 8, marginTop: 24,
            padding: "11px 24px", borderRadius: 10,
            background: BLUE, color: "#fff", fontSize: "0.86rem", fontWeight: 600,
            cursor: "pointer", transition: "all 0.22s", boxShadow: `0 3px 14px ${BLUE}30`,
            textDecoration: "none",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "#0B0480"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = BLUE; e.currentTarget.style.transform = "none"; }}
          >Learn More <ArrowRight size={15} /></a>
        </div>
      </div>
    </section>
  );
}

/* ── Testimonials section ── */
function TestimonialsSection({ mobile }: { mobile: boolean }) {
  const fade = useFadeIn();
  const testimonials = [
    { quote: "Finally I can view my lab results anytime without going to the clinic. This portal changed everything.", name: "Maria S.", role: "Patient", initial: "M" },
    { quote: "Managing APE compliance for 200+ employees has never been this smooth. The HR dashboard is excellent.", name: "Rodel A.", role: "HR Manager", initial: "R" },
    { quote: "The AI result explanation feature is a game changer. My patients come in better informed.", name: "Dr. Cruz", role: "Physician", initial: "C" },
  ];
  return (
    <section style={{ background: "#ffffff", padding: mobile ? "64px 20px" : "88px 64px", borderTop: "1px solid #E8EAED" }}>
      <div ref={fade.ref} style={{ ...fade.style, maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: mobile ? 40 : 56 }}>
          <span style={{ display: "inline-block", fontSize: "0.68rem", fontWeight: 700, color: BLUE, letterSpacing: "0.12em", textTransform: "uppercase", background: "#EEF2FF", borderRadius: 8, padding: "5px 14px", marginBottom: 14 }}>Patient Stories</span>
          <h2 style={{ fontSize: mobile ? "1.4rem" : "1.9rem", fontWeight: 700, color: "#111827", lineHeight: 1.2, margin: 0, letterSpacing: "-0.015em" }}>
            Trusted by our <span style={{ color: BLUE }}>community</span>
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(3, 1fr)", gap: 16 }}>
          {testimonials.map(t => (
            <TestimonialCard key={t.name} {...t} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Testimonial card ── */
function TestimonialCard({ quote, name, role, initial }: { quote: string; name: string; role: string; initial: string }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? "#ffffff" : "#F9FAFB",
        borderRadius: 14, padding: "26px 22px",
        border: `1px solid ${hov ? "#C7D2FE" : "#E8EAED"}`,
        boxShadow: hov ? "0 8px 28px rgba(0,0,0,0.06)" : "0 1px 3px rgba(0,0,0,0.02)",
        transition: "all 0.25s ease", cursor: "default",
      }}
    >
      <div style={{ display: "flex", gap: 3, marginBottom: 14 }}>
        {[...Array(5)].map((_, i) => <Star key={i} size={13} color={GOLD} fill={GOLD} />)}
      </div>
      <p style={{ fontSize: "0.86rem", color: "#374151", lineHeight: 1.7, margin: "0 0 18px", fontStyle: "italic" }}>&ldquo;{quote}&rdquo;</p>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: `linear-gradient(135deg, ${BLUE}, #1a14c8)`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff" }}>{initial}</span>
        </div>
        <div>
          <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#111827", margin: 0 }}>{name}</p>
          <p style={{ fontSize: "0.7rem", color: "#9CA3AF", margin: 0 }}>{role}</p>
        </div>
      </div>
    </div>
  );
}

/* ── CTA button ── */
function CtaButton({ label, icon, primary, onClick }: { label: string; icon: React.ReactNode; primary?: boolean; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontFamily: FONT, padding: "12px 28px", borderRadius: 12,
        fontSize: "0.86rem", fontWeight: 600, cursor: "pointer",
        transition: "all 0.22s", display: "flex", alignItems: "center", gap: 8,
        whiteSpace: "nowrap",
        background: primary ? BLUE : "#ffffff",
        color: primary ? "#fff" : "#111827",
        border: primary ? "none" : "1px solid #E8EAED",
        boxShadow: hov
          ? (primary ? `0 8px 28px ${BLUE}40` : "0 8px 28px rgba(0,0,0,0.08)")
          : (primary ? `0 3px 14px ${BLUE}25` : "0 1px 4px rgba(0,0,0,0.04)"),
        transform: hov ? "translateY(-2px)" : "none",
      }}
    >{icon} {label}</button>
  );
}
