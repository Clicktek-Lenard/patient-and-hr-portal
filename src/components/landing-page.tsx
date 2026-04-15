"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  ShieldCheck, Activity, Heart, FileText, Calendar,
  Share2, TrendingUp, Cpu, ArrowRight, Lock,
  Phone, Mail, ChevronDown, CheckCircle2, Star,
  Microscope, Stethoscope, FlaskConical, Users,
} from "lucide-react";

const DISPLAY = "var(--font-sans,'Inter',system-ui,sans-serif)";
const BODY    = "var(--font-sans,'Inter',system-ui,sans-serif)";
const BLUE    = "#1006A0";
const RED     = "#E00500";
const GOLD    = "#D4A017";
const NAVY    = "#050330";

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
    <div style={{ position:"fixed",inset:0,zIndex:9999,background:"rgba(5,3,48,0.92)",backdropFilter:"blur(20px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:BODY }}>
      <div style={{ background:"#fff",borderRadius:20,width:"100%",maxWidth:500,maxHeight:"88vh",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 40px 100px rgba(0,0,0,0.6)" }}>
        <div style={{ background:`linear-gradient(135deg,${NAVY},${BLUE})`,padding:"20px 24px",display:"flex",alignItems:"center",gap:14,borderBottom:`3px solid ${RED}`,flexShrink:0 }}>
          <div style={{ width:38,height:38,borderRadius:10,background:"rgba(255,255,255,0.12)",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <Lock size={16} color={GOLD}/>
          </div>
          <div>
            <p style={{ fontFamily:DISPLAY,fontSize:"0.95rem",fontWeight:800,color:"#fff",margin:0 }}>Privacy Notice &amp; Terms of Use</p>
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
            <div key={num} style={{ marginBottom:16,paddingLeft:12,borderLeft:`2px solid #e0e7ff` }}>
              <p style={{ fontWeight:700,color:BLUE,fontSize:"0.7rem",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4,display:"flex",alignItems:"center",gap:7 }}>
                <span style={{ color:RED,fontFamily:DISPLAY }}>{num}</span>{title}
              </p>
              <p style={{ margin:0,color:"#4b5563" }}>{body}</p>
            </div>
          ))}
          <div style={{ background:"#eef2ff",border:"1px solid #c7d2fe",borderRadius:10,padding:"10px 14px",marginTop:4 }}>
            <p style={{ margin:0,fontSize:"0.73rem",color:"#1e3a8a",fontWeight:500 }}>🛡 DOH accredited · RA 7432 · Universal Health Care Act (RA 11223)</p>
          </div>
        </div>
        <div style={{ padding:"16px 24px",background:"#f8fafc",borderTop:"1px solid #f1f5f9",flexShrink:0 }}>
          <label style={{ display:"flex",alignItems:"flex-start",gap:10,cursor:"pointer",marginBottom:14 }}>
            <input type="checkbox" checked={ok} onChange={e=>setOk(e.target.checked)} style={{ width:16,height:16,marginTop:2,accentColor:BLUE,cursor:"pointer",flexShrink:0 }}/>
            <span style={{ fontSize:"0.78rem",color:"#374151",lineHeight:1.5 }}>I have read and agree to the <strong style={{ color:BLUE }}>Privacy Notice</strong> and <strong style={{ color:BLUE }}>Terms of Use</strong></span>
          </label>
          <button onClick={onAccept} disabled={!ok} style={{ width:"100%",padding:"12px",borderRadius:12,border:"none",fontFamily:BODY,fontSize:"0.88rem",fontWeight:700,cursor:ok?"pointer":"not-allowed",transition:"all 0.2s",background:ok?`linear-gradient(135deg,${NAVY},${BLUE})`:"#e2e8f0",color:ok?"#fff":"#94a3b8",boxShadow:ok?`0 4px 20px ${BLUE}44`:"none" }}>
            ✓ Accept &amp; Continue
          </button>
        </div>
      </div>
    </div>
  );
}

const NAV = [
  { label:"Services",    href:"https://www.nwdi.com.ph/" },
  { label:"Our Clinics", href:"https://www.nwdi.com.ph/" },
  { label:"Contact",     href:"https://www.nwdi.com.ph/" },
];

const SERVICES = [
  { icon:Microscope,    label:"Laboratory",         color:"#0ea5e9" },
  { icon:FlaskConical,  label:"Clinical Chemistry",  color:"#8b5cf6" },
  { icon:Stethoscope,   label:"Annual PE",           color:"#10b981" },
  { icon:Activity,      label:"ECG / Holter",        color:RED },
  { icon:Heart,         label:"Cardiology",          color:"#f43f5e" },
  { icon:Users,         label:"Corporate Health",    color:BLUE },
];

const FEATURES = [
  { icon:TrendingUp, title:"Health Trend Charts",       desc:"Visualize your vitals and lab values across every visit in one clean timeline." },
  { icon:Cpu,        title:"AI Result Explanations",    desc:"Plain-language summaries of complex lab results — no medical degree required." },
  { icon:Share2,     title:"Secure Physician Sharing",  desc:"Share results with your doctor via encrypted, time-limited links." },
  { icon:Calendar,   title:"Online Appointments",       desc:"Schedule, reschedule or cancel visits 24/7 — no phone call needed." },
  { icon:FileText,   title:"Medical Records PDF",       desc:"Every visit and receipt organized and downloadable instantly." },
  { icon:Heart,      title:"Vital Signs History",       desc:"Track BP, heart rate, BMI and more across your complete health history." },
];

const STATS = [
  { n:50000, s:"+",  label:"Patients Served"      },
  { n:98,    s:"%",  label:"Satisfaction Rate"     },
  { n:15,    s:"+",  label:"Years of Excellence"   },
  { n:24,    s:"/7", label:"Portal Availability"   },
];

export default function LandingPage() {
  const router = useRouter();
  const [showPrivacy, setShowPrivacy] = useState(true);
  const [menuOpen, setMenuOpen]       = useState(false);
  const [mobile, setMobile]           = useState(false);
  const [scrolled, setScrolled]       = useState(false);
  const [cardHov, setCardHov]         = useState<"patient"|"hr"|null>(null);
  const [visible, setVisible]         = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width:767px)");
    setMobile(mq.matches);
    const hMq = (e:MediaQueryListEvent) => { setMobile(e.matches); if(!e.matches) setMenuOpen(false); };
    mq.addEventListener("change",hMq);
    const hScroll = () => setScrolled(window.scrollY>20);
    window.addEventListener("scroll",hScroll);
    setTimeout(()=>setVisible(true),60);
    return ()=>{ mq.removeEventListener("change",hMq); window.removeEventListener("scroll",hScroll); };
  },[]);

  return (
    <div style={{ fontFamily:BODY, background:"#fff", overflowX:"hidden" }}>
      {showPrivacy && <PrivacyModal onAccept={()=>setShowPrivacy(false)}/>}

      {/* ════════════════════════════════
          HEADER
      ════════════════════════════════ */}
      <header style={{
        position:"sticky",top:0,zIndex:200,
        background: scrolled ? "rgba(255,255,255,0.97)" : NAVY,
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid #e2e8f0" : `1px solid rgba(255,255,255,0.08)`,
        transition:"all 0.35s ease",
        padding:"0 clamp(16px,5vw,64px)",
        height:68, display:"flex",alignItems:"center",justifyContent:"space-between",
      }}>
        {/* Brand */}
        <div style={{ display:"flex",alignItems:"center",gap:12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/nwdi-logo.png" alt="NWDI" style={{ height:34,objectFit:"contain",display:"block" }}/>
          {!mobile && (
            <div style={{ paddingLeft:12,borderLeft:`1px solid ${scrolled?"#e2e8f0":"rgba(255,255,255,0.25)"}`,display:"flex",flexDirection:"column",gap:1,transition:"border-color 0.35s" }}>
              <span style={{ fontFamily:DISPLAY,fontSize:"0.68rem",fontWeight:800,letterSpacing:"0.08em",textTransform:"uppercase",color:scrolled?"#0f172a":"#fff",lineHeight:1,transition:"color 0.35s" }}>Patient &amp; HR Portal</span>
              <span style={{ fontSize:"0.57rem",fontStyle:"italic",color:scrolled?"#94a3b8":"rgba(255,255,255,0.5)",transition:"color 0.35s" }}>&ldquo;Your Health is Our Commitment&rdquo;</span>
            </div>
          )}
        </div>

        {/* Desktop nav */}
        {!mobile && (
          <nav style={{ display:"flex",alignItems:"center",gap:4 }}>
            {NAV.map(({label,href})=>(
              <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                style={{ fontFamily:BODY,fontSize:"0.83rem",fontWeight:500,textDecoration:"none",padding:"6px 13px",borderRadius:8,transition:"all 0.18s",color:scrolled?"#475569":"rgba(255,255,255,0.75)" }}
                onMouseEnter={e=>{e.currentTarget.style.color=scrolled?"#0f172a":"#fff";e.currentTarget.style.background=scrolled?"#f1f5f9":"rgba(255,255,255,0.12)";}}
                onMouseLeave={e=>{e.currentTarget.style.color=scrolled?"#475569":"rgba(255,255,255,0.75)";e.currentTarget.style.background="transparent";}}
              >{label}</a>
            ))}
          </nav>
        )}

        {/* Hamburger */}
        {mobile && !showPrivacy && (
          <button onClick={()=>setMenuOpen(v=>!v)} aria-label="Menu" style={{ background:"transparent",border:"none",cursor:"pointer",padding:6,display:"flex",flexDirection:"column",gap:5 }}>
            {[0,1,2].map(i=>(
              <span key={i} style={{ display:"block",width:22,height:2,borderRadius:2,transition:"all 0.2s",
                background:scrolled?"#0f172a":"#fff",
                transform:menuOpen?(i===0?"rotate(45deg) translate(5px,5px)":i===2?"rotate(-45deg) translate(5px,-5px)":"none"):"none",
                opacity:menuOpen&&i===1?0:1 }}/>
            ))}
          </button>
        )}
      </header>

      {/* mobile menu */}
      {mobile && menuOpen && !showPrivacy && (
        <div style={{ position:"fixed",top:68,left:0,right:0,zIndex:199,background:"rgba(255,255,255,0.98)",backdropFilter:"blur(20px)",borderBottom:"1px solid #e2e8f0",boxShadow:"0 8px 32px rgba(0,0,0,0.1)" }}>
          {NAV.map(({label,href})=>(
            <a key={label} href={href} target="_blank" rel="noopener noreferrer" onClick={()=>setMenuOpen(false)}
              style={{ display:"block",padding:"14px 20px",color:"#334155",fontSize:"0.9rem",fontWeight:500,textDecoration:"none",borderBottom:"1px solid #f1f5f9",fontFamily:BODY }}
            >{label}</a>
          ))}
        </div>
      )}

      {/* ════════════════════════════════
          HERO — full-bleed dark gradient
      ════════════════════════════════ */}
      <section style={{
        minHeight:"100vh",
        background:`linear-gradient(160deg, ${NAVY} 0%, #0a0560 35%, #0e0780 60%, #1a084a 100%)`,
        position:"relative",overflow:"hidden",
        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
        padding: mobile?"100px 20px 64px":"80px 32px 80px",
      }}>

        {/* background decorations */}
        <div style={{ position:"absolute",inset:0,pointerEvents:"none",
          backgroundImage:"radial-gradient(rgba(255,255,255,0.04) 1px,transparent 1px)",
          backgroundSize:"28px 28px" }}/>
        <div style={{ position:"absolute",top:"-20%",right:"-15%",width:"55%",height:"140%",
          background:`radial-gradient(ellipse,${BLUE}40 0%,transparent 65%)`,pointerEvents:"none" }}/>
        <div style={{ position:"absolute",bottom:"-10%",left:"-10%",width:"45%",height:"90%",
          background:`radial-gradient(ellipse,${RED}18 0%,transparent 60%)`,pointerEvents:"none" }}/>
        {/* horizontal glow line */}
        <div style={{ position:"absolute",top:"45%",left:0,right:0,height:1,
          background:`linear-gradient(90deg,transparent 0%,${BLUE}55 25%,rgba(212,160,23,0.4) 50%,${BLUE}55 75%,transparent 100%)`,
          pointerEvents:"none" }}/>

        {/* hero content */}
        <div style={{
          position:"relative",zIndex:1,textAlign:"center",width:"100%",maxWidth:900,
          opacity:visible?1:0,transform:visible?"translateY(0)":"translateY(32px)",
          transition:"opacity 0.8s ease,transform 0.8s ease",
        }}>

          {/* pill badge */}
          <div style={{ display:"inline-flex",alignItems:"center",gap:8,marginBottom:28,
            background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.14)",
            borderRadius:100,padding:"6px 18px",backdropFilter:"blur(8px)" }}>
            <span style={{ width:6,height:6,borderRadius:"50%",background:"#22c55e",
              boxShadow:"0 0 8px #22c55e",flexShrink:0 }}/>
            <span style={{ fontFamily:BODY,fontSize:mobile?"0.65rem":"0.72rem",color:"rgba(255,255,255,0.65)",fontWeight:600,letterSpacing:"0.06em" }}>
              ISO Certified · CAP Accredited · DOH Compliant
            </span>
          </div>

          {/* headline */}
          <h1 style={{
            fontFamily:DISPLAY,fontWeight:700,letterSpacing:"-0.02em",
            fontSize:mobile?"1.7rem":"clamp(1.9rem,3.5vw,2.8rem)",
            lineHeight:1.15,color:"#fff",margin:"0 0 16px",
          }}>
            Your Health,{" "}
            <span style={{ color:GOLD }}>Accessible</span>{" "}
            Online
          </h1>

          {/* sub */}
          <p style={{ fontFamily:BODY,fontSize:mobile?"0.85rem":"0.95rem",color:"rgba(255,255,255,0.55)",lineHeight:1.75,maxWidth:520,margin:"0 auto 40px",fontWeight:400 }}>
            Securely access your lab results, track your health trends, and manage your appointments — anytime, anywhere.
          </p>

          {/* portal cards */}
          <div style={{ display:"grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap:14, width:"100%", maxWidth:600, margin:"0 auto 48px", boxSizing:"border-box" }}>
            {([
              { key:"patient" as const, title:"Patient Portal", accent:BLUE, icon:<Activity size={15} color={BLUE}/>, iconBg:"#dbeafe", href:"/login?portal=patient", btn:"Access Patient Portal",
                items:["View lab results & medical records","Book & manage appointments","AI-powered result explanations","Secure physician sharing"] },
              { key:"hr"      as const, title:"HR Portal",      accent:RED,  icon:<ShieldCheck size={15} color={RED}/>, iconBg:"#fee2e2", href:"/login?portal=hr",      btn:"Access HR Portal",
                items:["Employee APE compliance tracking","Workforce health dashboards","Corporate health analytics","Bulk results management"] },
            ] as const).map(card=>{
              const h = cardHov===card.key;
              return (
                <div key={card.key}
                  onMouseEnter={()=>setCardHov(card.key)}
                  onMouseLeave={()=>setCardHov(null)}
                  style={{
                    background:"#fff",
                    borderRadius:20,
                    border:`1px solid ${h ? card.accent+"60" : "#e8edf8"}`,
                    boxShadow: h ? `0 8px 28px rgba(0,0,0,0.18)` : "0 2px 12px rgba(0,0,0,0.10)",
                    transform: h ? "translateY(-3px)" : "none",
                    transition:"all 0.22s ease",
                    boxSizing:"border-box",
                    width:"100%",
                    padding:"22px 20px",
                  }}
                >
                  {/* header row — icon + title */}
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                    <div style={{ width:32,height:32,borderRadius:10,background:card.iconBg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                      {card.icon}
                    </div>
                    <span style={{ fontFamily:BODY,fontSize:"0.75rem",fontWeight:700,color:"#0f172a" }}>{card.title}</span>
                  </div>

                  {/* checklist items */}
                  <div style={{ marginBottom:16 }}>
                    {card.items.map(item=>(
                      <div key={item} style={{ display:"flex",alignItems:"center",gap:7,marginBottom:7 }}>
                        <CheckCircle2 size={13} color={card.accent}/>
                        <span style={{ fontFamily:BODY,fontSize:"0.73rem",color:"#64748b" }}>{item}</span>
                      </div>
                    ))}
                  </div>

                  {/* button */}
                  <button
                    onClick={()=>router.push(card.href)}
                    style={{
                      display:"flex",alignItems:"center",justifyContent:"center",gap:5,
                      width:"100%",padding:"9px 12px",borderRadius:8,
                      border:`1.5px solid ${card.accent}`,
                      fontFamily:BODY,fontSize:"0.75rem",fontWeight:600,cursor:"pointer",
                      background: h ? card.accent : "#fff",
                      color: h ? "#fff" : card.accent,
                      transition:"all 0.22s",
                      boxSizing:"border-box",
                    }}
                  >
                    {card.btn} <ArrowRight size={12}/>
                  </button>
                </div>
              );
            })}
          </div>

          {/* stats */}
          <div style={{
            display:"grid",gridTemplateColumns:mobile?"1fr 1fr":"repeat(4,1fr)",
            background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",
            borderRadius:20,overflow:"hidden",backdropFilter:"blur(8px)",
          }}>
            {STATS.map((s,i)=>(
              <div key={s.label} style={{ padding:mobile?"20px 10px":"28px 0",textAlign:"center",
                borderRight:(!mobile&&i<STATS.length-1)||(mobile&&i%2===0)?"1px solid rgba(255,255,255,0.08)":"none",
                borderBottom:(mobile&&i<2)?"1px solid rgba(255,255,255,0.08)":"none" }}>
                <p style={{ fontFamily:DISPLAY,fontSize:"clamp(1.4rem,2.5vw,1.9rem)",fontWeight:700,color:"#fff",margin:0,lineHeight:1 }}>
                  <Counter to={s.n} suffix={s.s}/>
                </p>
                <p style={{ fontFamily:BODY,fontSize:"0.68rem",color:"rgba(255,255,255,0.38)",margin:"6px 0 0",letterSpacing:"0.1em",textTransform:"uppercase" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* scroll cue */}
        <div style={{ position:"absolute",bottom:32,left:"50%",transform:"translateX(-50%)",display:"flex",flexDirection:"column",alignItems:"center",gap:4,opacity:0.4 }}>
          <span style={{ fontFamily:BODY,fontSize:"0.6rem",color:"#fff",letterSpacing:"0.12em",textTransform:"uppercase" }}>Scroll</span>
          <ChevronDown size={14} color="#fff" style={{ animation:"bounce 1.8s ease-in-out infinite" }}/>
        </div>
      </section>

      {/* ════════════════════════════════
          SERVICES STRIP
      ════════════════════════════════ */}
      <section style={{ background:"#f8faff",borderTop:"1px solid #e8edf8",borderBottom:"1px solid #e8edf8",padding:mobile?"32px 20px":"28px 64px" }}>
        <div style={{ maxWidth:1100,margin:"0 auto" }}>
          <p style={{ fontFamily:BODY,textAlign:"center",fontSize:"0.68rem",fontWeight:700,color:"#94a3b8",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:24 }}>Our Core Services</p>
          <div style={{ display:"flex",flexWrap:"wrap",gap:12,justifyContent:"center" }}>
            {SERVICES.map(({icon:Icon,label,color})=>(
              <div key={label} style={{ display:"flex",alignItems:"center",gap:9,background:"#fff",border:"1px solid #e8edf8",borderRadius:12,padding:"10px 18px",boxShadow:"0 1px 6px rgba(0,0,0,0.04)",transition:"all 0.2s" }}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=color;(e.currentTarget as HTMLElement).style.boxShadow=`0 4px 16px ${color}25`;}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor="#e8edf8";(e.currentTarget as HTMLElement).style.boxShadow="0 1px 6px rgba(0,0,0,0.04)";}}
              >
                <div style={{ width:28,height:28,borderRadius:8,background:`${color}15`,display:"flex",alignItems:"center",justifyContent:"center" }}>
                  <Icon size={14} color={color}/>
                </div>
                <span style={{ fontFamily:BODY,fontSize:"0.8rem",fontWeight:600,color:"#334155" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════
          WHY US — split section
      ════════════════════════════════ */}
      <section style={{ background:"#fff",padding:mobile?"64px 20px":"96px 64px" }}>
        <div style={{ maxWidth:1100,margin:"0 auto",display:"flex",flexDirection:mobile?"column":"row",gap:mobile?48:80,alignItems:"center" }}>

          {/* left — visual card stack */}
          <div style={{ flex:"0 0 auto",position:"relative",width:mobile?"100%":420,height:mobile?320:420 }}>
            {/* card 1 */}
            <div style={{ position:"absolute",top:0,left:0,right:mobile?0:undefined,width:mobile?"100%":340,background:`linear-gradient(135deg,${NAVY},${BLUE})`,borderRadius:24,padding:"32px 28px",color:"#fff",boxShadow:"0 24px 60px rgba(16,6,160,0.3)" }}>
              <p style={{ fontFamily:BODY,fontSize:"0.7rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(255,255,255,0.5)",marginBottom:12 }}>Patient Satisfaction</p>
              <p style={{ fontFamily:DISPLAY,fontSize:"2.4rem",fontWeight:700,color:"#fff",margin:"0 0 4px",lineHeight:1 }}>98%</p>
              <p style={{ fontFamily:BODY,fontSize:"0.82rem",color:"rgba(255,255,255,0.6)",margin:0 }}>Based on 2024 patient survey</p>
              <div style={{ display:"flex",gap:3,marginTop:14 }}>
                {[...Array(5)].map((_,i)=><Star key={i} size={14} color={GOLD} fill={GOLD}/>)}
              </div>
            </div>
            {/* card 2 */}
            {!mobile && (
              <div style={{ position:"absolute",bottom:0,right:0,width:220,background:"#fff",borderRadius:20,padding:"22px 20px",boxShadow:"0 16px 48px rgba(0,0,0,0.1)",border:"1px solid #e8edf8" }}>
                <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:12 }}>
                  <div style={{ width:32,height:32,borderRadius:10,background:`${RED}12`,display:"flex",alignItems:"center",justifyContent:"center" }}>
                    <ShieldCheck size={15} color={RED}/>
                  </div>
                  <span style={{ fontFamily:BODY,fontSize:"0.75rem",fontWeight:700,color:"#0f172a" }}>CAP Accredited</span>
                </div>
                {["ISO Certified","DOH Compliant","HIPAA Ready"].map(t=>(
                  <div key={t} style={{ display:"flex",alignItems:"center",gap:7,marginBottom:7 }}>
                    <CheckCircle2 size={13} color="#22c55e"/>
                    <span style={{ fontFamily:BODY,fontSize:"0.73rem",color:"#64748b" }}>{t}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* right — copy */}
          <div style={{ flex:1 }}>
            <span style={{ display:"inline-block",fontFamily:BODY,fontSize:"0.68rem",fontWeight:700,color:BLUE,letterSpacing:"0.12em",textTransform:"uppercase",background:"#eef2ff",borderRadius:8,padding:"4px 14px",marginBottom:16 }}>Why Choose NWDI</span>
            <h2 style={{ fontFamily:DISPLAY,fontSize:mobile?"1.4rem":"1.9rem",fontWeight:700,color:"#0a0720",lineHeight:1.2,margin:"0 0 14px",letterSpacing:"-0.015em" }}>
              Trusted by thousands.<br/><span style={{ color:BLUE }}>Built for you.</span>
            </h2>
            <p style={{ fontFamily:BODY,fontSize:"0.88rem",color:"#64748b",lineHeight:1.8,margin:"0 0 28px" }}>
              New World Diagnostics combines 15+ years of clinical excellence with modern digital infrastructure — giving you instant, secure access to the health information that matters most.
            </p>
            {[
              ["World-class laboratory with international accreditation"],
              ["Secure, encrypted health records — always available"],
              ["AI-assisted result interpretation and trend analysis"],
              ["Corporate health management for HR professionals"],
            ].map(([t])=>(
              <div key={t} style={{ display:"flex",alignItems:"flex-start",gap:12,marginBottom:14 }}>
                <div style={{ width:22,height:22,borderRadius:"50%",background:`${BLUE}12`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1 }}>
                  <CheckCircle2 size={13} color={BLUE}/>
                </div>
                <p style={{ fontFamily:BODY,fontSize:"0.88rem",color:"#334155",margin:0,lineHeight:1.6 }}>{t}</p>
              </div>
            ))}
            <a href="https://www.nwdi.com.ph/" target="_blank" rel="noopener noreferrer" style={{
              display:"inline-flex",alignItems:"center",gap:8,marginTop:28,
              padding:"13px 28px",borderRadius:12,
              background:BLUE,color:"#fff",fontFamily:BODY,fontSize:"0.88rem",fontWeight:700,
              cursor:"pointer",transition:"all 0.22s",boxShadow:`0 4px 20px ${BLUE}44`,
              textDecoration:"none",
            }}
              onMouseEnter={e=>{e.currentTarget.style.background="#0B0480";e.currentTarget.style.transform="translateY(-2px)";}}
              onMouseLeave={e=>{e.currentTarget.style.background=BLUE;e.currentTarget.style.transform="none";}}
            >Explore More <ArrowRight size={16}/></a>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════
          FEATURES GRID
      ════════════════════════════════ */}
      <section style={{ background:"#f4f6fb",padding:mobile?"64px 20px":"88px 64px",borderTop:"1px solid #e8edf8" }}>
        <div style={{ maxWidth:1100,margin:"0 auto" }}>
          <div style={{ textAlign:"center",marginBottom:mobile?44:64 }}>
            <span style={{ display:"inline-block",fontFamily:BODY,fontSize:"0.68rem",fontWeight:700,color:BLUE,letterSpacing:"0.12em",textTransform:"uppercase",background:"#eef2ff",borderRadius:8,padding:"4px 14px",marginBottom:14 }}>Portal Features</span>
            <h2 style={{ fontFamily:DISPLAY,fontSize:mobile?"1.4rem":"1.9rem",fontWeight:700,color:"#0a0720",lineHeight:1.2,margin:"0 0 12px",letterSpacing:"-0.015em" }}>
              Everything you need, <span style={{ color:BLUE }}>in one place</span>
            </h2>
            <p style={{ fontFamily:BODY,fontSize:"0.88rem",color:"#64748b",maxWidth:460,margin:"0 auto",lineHeight:1.75 }}>
              Designed for modern healthcare — your records, your way, wherever you are.
            </p>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:mobile?"1fr":mobile?"1fr 1fr":"repeat(3,1fr)",gap:20 }}>
            {FEATURES.map(({icon:Icon,title,desc},i)=>{
              const tags = ["New","AI","Secure","Live","PDF","Charts"];
              return (
                <FeatureCard key={title} Icon={Icon} title={title} desc={desc} tag={tags[i]}/>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════
          TESTIMONIALS
      ════════════════════════════════ */}
      <section style={{ background:"#fff",padding:mobile?"64px 20px":"88px 64px",borderTop:"1px solid #e8edf8" }}>
        <div style={{ maxWidth:1100,margin:"0 auto" }}>
          <div style={{ textAlign:"center",marginBottom:mobile?40:56 }}>
            <span style={{ display:"inline-block",fontFamily:BODY,fontSize:"0.68rem",fontWeight:700,color:BLUE,letterSpacing:"0.12em",textTransform:"uppercase",background:"#eef2ff",borderRadius:8,padding:"4px 14px",marginBottom:14 }}>Patient Stories</span>
            <h2 style={{ fontFamily:DISPLAY,fontSize:mobile?"1.4rem":"1.9rem",fontWeight:700,color:"#0a0720",lineHeight:1.2,margin:0,letterSpacing:"-0.015em" }}>
              Trusted by our <span style={{ color:BLUE }}>community</span>
            </h2>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:mobile?"1fr":"repeat(3,1fr)",gap:20 }}>
            {[
              { quote:"Finally I can view my lab results anytime without going to the clinic. This portal changed everything.", name:"Maria S.", role:"Patient",  initial:"M" },
              { quote:"Managing APE compliance for 200+ employees has never been this smooth. The HR dashboard is excellent.",  name:"Rodel A.", role:"HR Manager",initial:"R" },
              { quote:"The AI result explanation feature is a game changer. My patients come in better informed.",              name:"Dr. Cruz",  role:"Physician", initial:"C" },
            ].map(({quote,name,role,initial})=>(
              <div key={name} style={{ background:"#f8faff",borderRadius:20,padding:"28px 24px",border:"1px solid #e8edf8",fontFamily:BODY,position:"relative" }}>
                <div style={{ display:"flex",gap:3,marginBottom:16 }}>
                  {[...Array(5)].map((_,i)=><Star key={i} size={13} color={GOLD} fill={GOLD}/>)}
                </div>
                <p style={{ fontSize:"0.87rem",color:"#334155",lineHeight:1.75,margin:"0 0 20px",fontStyle:"italic" }}>&ldquo;{quote}&rdquo;</p>
                <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                  <div style={{ width:36,height:36,borderRadius:"50%",background:`linear-gradient(135deg,${BLUE},#1a14c8)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                    <span style={{ fontFamily:DISPLAY,fontSize:"0.9rem",fontWeight:800,color:"#fff" }}>{initial}</span>
                  </div>
                  <div>
                    <p style={{ fontSize:"0.82rem",fontWeight:700,color:"#0f172a",margin:0 }}>{name}</p>
                    <p style={{ fontSize:"0.7rem",color:"#94a3b8",margin:0,letterSpacing:"0.04em" }}>{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════
          CTA BAND
      ════════════════════════════════ */}
      <section style={{
        background:`linear-gradient(135deg,${NAVY} 0%,${BLUE} 55%,#1a084a 100%)`,
        padding:mobile?"56px 20px":"72px 64px",textAlign:"center",
        position:"relative",overflow:"hidden",
      }}>
        <div style={{ position:"absolute",inset:0,pointerEvents:"none",opacity:0.025,backgroundImage:"radial-gradient(rgba(255,255,255,1) 1px,transparent 1px)",backgroundSize:"28px 28px" }}/>
        <div style={{ position:"relative",zIndex:1,maxWidth:640,margin:"0 auto" }}>
          <p style={{ fontFamily:BODY,fontSize:"0.68rem",fontWeight:700,color:"rgba(255,255,255,0.38)",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:14 }}>Get Started Today</p>
          <h2 style={{ fontFamily:DISPLAY,fontSize:mobile?"1.4rem":"1.9rem",fontWeight:700,color:"#fff",lineHeight:1.2,margin:"0 0 12px",letterSpacing:"-0.015em" }}>
            Ready to take control of your health?
          </h2>
          <p style={{ fontFamily:BODY,fontSize:"0.88rem",color:"rgba(255,255,255,0.5)",margin:"0 0 32px",lineHeight:1.75 }}>
            Sign in to access your complete health profile in seconds.
          </p>
          <div style={{ display:"flex",flexDirection:mobile?"column":"row",gap:14,justifyContent:"center",alignItems:"center" }}>
            <button onClick={()=>router.push("/login?portal=patient")} style={{ fontFamily:BODY,padding:"11px 28px",borderRadius:12,border:"none",background:"#fff",color:BLUE,fontSize:"0.84rem",fontWeight:700,cursor:"pointer",transition:"all 0.22s",display:"flex",alignItems:"center",gap:8,boxShadow:"0 4px 20px rgba(0,0,0,0.28)",whiteSpace:"nowrap" }}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 8px 32px rgba(0,0,0,0.4)";}}
              onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="0 4px 24px rgba(0,0,0,0.3)";}}
            ><Activity size={17}/> Patient Portal</button>
            <button onClick={()=>router.push("/login?portal=hr")} style={{ fontFamily:BODY,padding:"11px 28px",borderRadius:12,border:"1.5px solid rgba(255,255,255,0.22)",background:"rgba(255,255,255,0.07)",color:"#fff",fontSize:"0.84rem",fontWeight:700,cursor:"pointer",transition:"all 0.22s",display:"flex",alignItems:"center",gap:8,whiteSpace:"nowrap" }}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.16)";e.currentTarget.style.transform="translateY(-3px)";}}
              onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.07)";e.currentTarget.style.transform="none";}}
            ><ShieldCheck size={17}/> HR Portal</button>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════
          FOOTER
      ════════════════════════════════ */}
      <footer style={{ background:"#020118",padding:mobile?"36px 20px 24px":"48px 64px 32px",borderTop:"1px solid rgba(255,255,255,0.05)",fontFamily:BODY }}>
        <div style={{ maxWidth:1100,margin:"0 auto" }}>
          <div style={{ display:"flex",flexDirection:mobile?"column":"row",gap:32,justifyContent:"space-between",alignItems:mobile?"flex-start":"flex-start",marginBottom:32 }}>
            <div style={{ maxWidth:260 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/nwdi-logo.png" alt="NWDI" style={{ height:28,objectFit:"contain",display:"block",marginBottom:10,opacity:0.85 }}/>
              <p style={{ fontSize:"0.78rem",color:"rgba(255,255,255,0.3)",lineHeight:1.7,margin:0 }}>New World Diagnostics, Inc. — delivering world-class diagnostic services since 2009.</p>
            </div>
            <div style={{ display:"flex",gap:mobile?32:56,flexWrap:"wrap" }}>
              <div>
                <p style={{ fontFamily:DISPLAY,fontSize:"0.7rem",fontWeight:800,color:"rgba(255,255,255,0.35)",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:12 }}>Portal</p>
                {["Patient Sign In","HR Sign In","Register"].map(l=>(
                  <a key={l} href="/login" style={{ display:"block",fontSize:"0.78rem",color:"rgba(255,255,255,0.38)",textDecoration:"none",marginBottom:8,transition:"color 0.18s" }}
                    onMouseEnter={e=>e.currentTarget.style.color="rgba(255,255,255,0.75)"}
                    onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.38)"}
                  >{l}</a>
                ))}
              </div>
              <div>
                <p style={{ fontFamily:DISPLAY,fontSize:"0.7rem",fontWeight:800,color:"rgba(255,255,255,0.35)",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:12 }}>Contact</p>
                <a href="tel:+63" style={{ display:"flex",alignItems:"center",gap:7,fontSize:"0.78rem",color:"rgba(255,255,255,0.38)",textDecoration:"none",marginBottom:9 }}><Phone size={13}/> Call Support</a>
                <a href="mailto:support@nwdi.com" style={{ display:"flex",alignItems:"center",gap:7,fontSize:"0.78rem",color:"rgba(255,255,255,0.38)",textDecoration:"none" }}><Mail size={13}/> support@nwdi.com</a>
              </div>
            </div>
          </div>
          <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:20,display:"flex",flexDirection:mobile?"column":"row",gap:10,justifyContent:"space-between",alignItems:mobile?"flex-start":"center" }}>
            <p style={{ fontSize:"0.66rem",color:"rgba(255,255,255,0.18)",margin:0 }}>© {new Date().getFullYear()} NEW WORLD DIAGNOSTICS, INC. All rights reserved.</p>
            <div style={{ display:"flex",gap:20 }}>
              {["Privacy Policy","Terms of Use","Accessibility"].map(l=>(
                <a key={l} href="#" style={{ fontSize:"0.66rem",color:"rgba(255,255,255,0.22)",textDecoration:"none",transition:"color 0.2s" }}
                  onMouseEnter={e=>e.currentTarget.style.color="rgba(255,255,255,0.6)"}
                  onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.22)"}
                >{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ── Scroll to top button ── */}
      <button
        onClick={()=>window.scrollTo({ top:0, behavior:"smooth" })}
        aria-label="Scroll to top"
        style={{
          position:"fixed", bottom:28, right:24, zIndex:300,
          width:42, height:42, borderRadius:"50%",
          background: NAVY,
          border:`1.5px solid rgba(255,255,255,0.12)`,
          boxShadow:"0 4px 18px rgba(0,0,0,0.25)",
          display:"flex", alignItems:"center", justifyContent:"center",
          cursor:"pointer",
          opacity: scrolled ? 1 : 0,
          pointerEvents: scrolled ? "auto" : "none",
          transform: scrolled ? "translateY(0)" : "translateY(12px)",
          transition:"opacity 0.3s ease, transform 0.3s ease",
        }}
        onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background=BLUE;}}
        onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background=NAVY;}}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 12V4M8 4L4 8M8 4l4 4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
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

/* ─── Feature card as separate component to avoid inline hook violation ─── */
function FeatureCard({ Icon, title, desc, tag }: { Icon: React.ElementType; title: string; desc: string; tag: string }) {
  const [hov, setHov] = useState(false);
  const BLUE = "#1006A0";
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{
      background:hov?"#fff":"rgba(255,255,255,0.98)",borderRadius:20,padding:"28px 26px",
      border:`1px solid ${hov?"#c7d2fe":"#e8edf5"}`,
      boxShadow:hov?"0 12px 40px rgba(16,6,160,0.12)":"0 2px 10px rgba(0,0,0,0.04)",
      transform:hov?"translateY(-4px)":"none",
      transition:"all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
      cursor:"default",fontFamily:"var(--font-outfit,'Outfit',system-ui,sans-serif)",
    }}>
      <div style={{ width:48,height:48,borderRadius:14,marginBottom:18,display:"flex",alignItems:"center",justifyContent:"center",
        background:hov?`linear-gradient(135deg,${BLUE},#1a14c8)`:"linear-gradient(135deg,#eef2ff,#e0e7ff)",
        boxShadow:hov?`0 6px 20px ${BLUE}33`:"none",transition:"all 0.3s" }}>
        <Icon size={20} color={hov?"#fff":BLUE} style={{ transition:"color 0.3s" }}/>
      </div>
      <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:8 }}>
        <p style={{ fontFamily:"var(--font-sans,'Inter',system-ui,sans-serif)",fontWeight:700,fontSize:"0.88rem",color:"#0f172a",margin:0,lineHeight:1.3 }}>{title}</p>
        <span style={{ fontSize:"0.58rem",fontWeight:700,color:BLUE,background:"#eef2ff",borderRadius:5,padding:"2px 7px",letterSpacing:"0.06em",textTransform:"uppercase",whiteSpace:"nowrap" }}>{tag}</span>
      </div>
      <p style={{ fontSize:"0.83rem",color:"#64748b",lineHeight:1.7,margin:0 }}>{desc}</p>
    </div>
  );
}
