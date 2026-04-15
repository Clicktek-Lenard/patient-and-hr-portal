import type { Metadata } from "next";
import { PortalBadge } from "./portal-badge";

export const metadata: Metadata = {
  title: { default: "Sign In", template: "%s | Patient Portal" },
};

/* ── ECG waveform path shared across uses ── */
const ECG_PATH =
  "M0,25 L35,25 L47,4 L59,46 L71,25 L110,25 L120,14 L132,36 L144,25 L185,25 L197,2 L209,48 L221,25 L270,25 L282,12 L294,40 L306,25 L360,25 L372,8 L384,44 L396,25 L440,25";

/* ── Animated ECG line ── */
function EcgWave({
  top,
  opacity,
  delay,
  strokeWidth = 1.5,
  color = "rgba(255,255,255,0.6)",
}: {
  top: string;
  opacity: number;
  delay: string;
  strokeWidth?: number;
  color?: string;
}) {
  return (
    <div
      className="absolute left-0 right-0 pointer-events-none overflow-hidden"
      style={{ top, height: 50, opacity }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 440 50" preserveAspectRatio="none" className="w-full h-full">
        <path
          d={ECG_PATH}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="1200"
          className="animate-ecg-loop"
          style={{ animationDelay: delay }}
        />
      </svg>
    </div>
  );
}


/* ── Radial ping dot ── */
function RadialPing({
  style,
  color = "rgba(255,255,255,0.4)",
}: {
  style: React.CSSProperties;
  color?: string;
}) {
  return (
    <div className="absolute pointer-events-none" style={{ width: 10, height: 10, ...style }} aria-hidden="true">
      <div className="absolute inset-0 rounded-full animate-radial-ping" style={{ background: color, opacity: 0.5 }} />
      <div className="absolute inset-0 rounded-full animate-radial-ping" style={{ background: color, opacity: 0.4, animationDelay: "0.7s" }} />
      <div className="absolute inset-0 rounded-full" style={{ background: color }} />
    </div>
  );
}

/* ── Floating particles ── */
const PARTICLES = [
  { left: "10%", top: "30%", size: 3, delay: "0s",   dur: "6s" },
  { left: "80%", top: "20%", size: 2, delay: "1.5s", dur: "8s" },
  { left: "55%", top: "65%", size: 4, delay: "0.8s", dur: "5s" },
  { left: "25%", top: "78%", size: 2, delay: "2.2s", dur: "7s" },
  { left: "70%", top: "50%", size: 3, delay: "3s",   dur: "6.5s" },
  { left: "40%", top: "85%", size: 2, delay: "1s",   dur: "9s" },
];

function Particles() {
  return (
    <>
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            background: "rgba(255,255,255,0.25)",
            animation: `particle-drift ${p.dur} ease-in-out infinite`,
            animationDelay: p.delay,
          }}
          aria-hidden="true"
        />
      ))}
    </>
  );
}

/* ── Horizontal scan line ── */
function ScanLine() {
  return (
    <div
      className="absolute left-0 right-0 h-px pointer-events-none animate-scan-line"
      style={{
        top: 0,
        background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 40%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.2) 60%, transparent 100%)",
      }}
      aria-hidden="true"
    />
  );
}

/* ── Grid dot pattern ── */
function GridDots() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      aria-hidden="true"
      style={{
        backgroundImage: "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
        backgroundSize: "30px 30px",
      }}
    />
  );
}

/* ── Orbit rings ── */
function OrbitRing({ size, delay, opacity }: { size: number; delay: string; opacity: number }) {
  return (
    <div
      className="absolute rounded-full border border-primary/20 animate-spin-slow"
      style={{
        width: size, height: size,
        top: "50%", left: "50%",
        marginTop: -size / 2, marginLeft: -size / 2,
        animationDelay: delay,
        opacity,
      }}
      aria-hidden="true"
    />
  );
}

/* ── Main layout ── */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex" style={{ background: "#f8fafc" }}>

      {/* ══ LEFT PANEL — dark hero with all animations ══ */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col relative overflow-hidden"
        style={{ background: "var(--gradient-hero)" }}
      >
        {/* Layer 1 — grid dots */}
        <GridDots />

        {/* Layer 2 — orbit rings */}
        <div className="absolute inset-0 pointer-events-none">
          <OrbitRing size={300} delay="0s"  opacity={0.18} />
          <OrbitRing size={500} delay="-5s" opacity={0.10} />
          <OrbitRing size={700} delay="-9s" opacity={0.06} />
        </div>

        {/* Layer 3 — radial glow center */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 70% 55% at 50% 40%, rgba(224,5,0,0.1) 0%, transparent 70%)" }}
          aria-hidden="true"
        />

        {/* Layer 4 — ECG waveforms */}
        <EcgWave top="18%"  opacity={0.55} delay="0s"   strokeWidth={2} />
        <EcgWave top="44%"  opacity={0.30} delay="1.6s" strokeWidth={1.5} />
        <EcgWave top="70%"  opacity={0.18} delay="3.2s" strokeWidth={1} />

        {/* Layer 6 — radial pings */}
        <RadialPing style={{ left: "30%", top: "55%" }} />
        <RadialPing style={{ right: "28%", top: "30%" }} color="rgba(255,255,255,0.3)" />
        <RadialPing style={{ left: "60%", bottom: "28%" }} color="rgba(224,5,0,0.4)" />

        {/* Layer 7 — floating particles */}
        <Particles />

        {/* Layer 8 — horizontal scan line */}
        <ScanLine />

        {/* ── Content ── */}
        <div className="relative z-10 flex flex-col h-full px-12 py-12">

          {/* Logo */}
          <div className="mb-12">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/nwdi-logo.png" alt="NEW WORLD DIAGNOSTICS" style={{ height: 36, width: "auto", display: "block" }} />
            <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.5)", fontStyle: "italic" }}>&ldquo;Your Health is Our Commitment&rdquo;</p>
          </div>

          {/* Hero copy */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="mb-8">
              <PortalBadge />
              <h1 className="text-4xl xl:text-5xl font-bold text-white leading-[1.1] mb-4">
                Your health,<br />
                <span style={{ color: "#E00500" }}>at your</span><br />
                fingertips.
              </h1>
              <p className="text-sm text-white/55 leading-relaxed max-w-xs">
                Securely access your complete medical records, real-time queue status, lab results, and payment history — all in one place.
              </p>
            </div>

            {/* Feature cards */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: "📈", label: "Health trend charts across all your visits" },
                { icon: "🤖", label: "AI-powered plain-language result explanations" },
                { icon: "🔗", label: "Secure result sharing with your physician" },
                { icon: "📅", label: "Online appointment booking" },
              ].map((f) => (
                <div key={f.label} className="flex items-start gap-2.5 rounded-xl border px-3 py-2.5"
                  style={{ borderColor: "rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.07)" }}>
                  <span className="text-base leading-none mt-0.5 shrink-0">{f.icon}</span>
                  <span className="text-xs font-medium text-white/75 leading-tight">{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom ECG strip — static decorative */}
          <div className="mt-10">
            <svg viewBox="0 0 400 40" className="w-full" style={{ opacity: 0.35 }} aria-hidden="true">
              <path
                d={ECG_PATH}
                fill="none"
                stroke="rgba(255,255,255,0.6)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="1200"
                className="animate-ecg-loop"
                style={{ animationDelay: "0.5s" }}
              />
            </svg>
            <p className="text-[10px] text-white/25 text-center mt-3 tracking-[0.2em] uppercase">
              BAESA Clinical Management System
            </p>
          </div>
        </div>
      </div>

      {/* ══ RIGHT PANEL — form ══ */}
      <div className="flex lg:w-1/2 flex-1 flex-col relative overflow-hidden" style={{ background: "#f8fafc" }}>

        {/* Mobile-only subtle animations behind the form */}
        <div className="absolute inset-0 pointer-events-none lg:hidden" aria-hidden="true">
          <GridDots />
          <EcgWave top="15%"  opacity={0.10} delay="0s"   strokeWidth={1.5} color="rgba(16,6,160,0.5)" />
          <EcgWave top="55%"  opacity={0.06} delay="2s"   strokeWidth={1}   color="rgba(16,6,160,0.4)" />
          <RadialPing style={{ left: "8%", bottom: "30%" }} color="rgba(16,6,160,0.3)" />
        </div>

        {/* Mobile header */}
        <header className="relative z-10 flex items-center gap-3 px-6 py-5 lg:hidden" style={{ borderBottom: "1px solid #e2e8f0" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/nwdi-logo.png" alt="NWDI" style={{ height: 32, width: "auto", display: "block" }} />
        </header>

        <main className="relative z-10 flex flex-1 items-center justify-center px-12 py-12">
          <div className="w-full max-w-md animate-slide-up">
            {children}
          </div>
        </main>

        <footer className="relative z-10 px-6 py-5 text-center" style={{ borderTop: "1px solid #e2e8f0" }}>
          <p className="text-sm font-bold tracking-wide" style={{ color: "#1006A0" }}>NEW WORLD DIAGNOSTICS, INC.</p>
          <p className="text-xs mt-0.5" style={{ color: "#E00500", fontStyle: "italic" }}>&ldquo;Your Health is Our Commitment&rdquo;</p>
          <p className="text-xs mt-1" style={{ color: "#6b7280" }}>
            &copy; {new Date().getFullYear()} · All rights reserved.
          </p>
          <div className="flex items-center justify-center gap-4 mt-1.5">
            <a href="tel:+63" className="text-xs transition-colors" style={{ color: "#6b7280" }}>Call Support</a>
            <span className="text-xs" style={{ color: "#d1d5db" }}>|</span>
            <a href="mailto:support@nwdi.com" className="text-xs transition-colors" style={{ color: "#6b7280" }}>Email Support</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
