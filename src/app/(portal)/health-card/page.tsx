"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, Download, Share2, RotateCcw, User } from "lucide-react";
import { toast } from "sonner";
import type { UserProfile } from "@/types";

const BLUE = "#1006A0";
const NAVY = "#050330";
const RED  = "#E00500";

async function fetchProfile(): Promise<UserProfile> {
  const res = await fetch("/api/profile");
  if (!res.ok) throw new Error("Failed");
  return (await res.json()).data;
}

/* ── Minimal QR placeholder ── */
function QrCode({ size = 96 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
      <rect width="128" height="128" fill="white" rx="6" />
      <rect x="8"  y="8"  width="40" height="40" rx="4" fill={NAVY} />
      <rect x="14" y="14" width="28" height="28" rx="2" fill="white" />
      <rect x="20" y="20" width="16" height="16" fill={NAVY} />
      <rect x="80" y="8"  width="40" height="40" rx="4" fill={NAVY} />
      <rect x="86" y="14" width="28" height="28" rx="2" fill="white" />
      <rect x="92" y="20" width="16" height="16" fill={NAVY} />
      <rect x="8"  y="80" width="40" height="40" rx="4" fill={NAVY} />
      <rect x="14" y="86" width="28" height="28" rx="2" fill="white" />
      <rect x="20" y="92" width="16" height="16" fill={NAVY} />
      {[56,68,56,68,56,56,68,80,92,104,56,80,104,56,68,80,104,56,92,56,68,92,104].map((x, i) => {
        const ys = [8,8,20,32,44,56,56,56,56,56,68,68,68,80,80,80,80,92,92,104,104,104,104];
        return <rect key={i} x={x} y={ys[i]} width="8" height="8" fill={NAVY} />;
      })}
    </svg>
  );
}

/* ── Avatar ── */
function Avatar({ initials }: { initials: string }) {
  return (
    <div style={{
      width: 64, height: 64, borderRadius: 12, flexShrink: 0,
      background: "rgba(224,5,0,0.75)",
      border: "2px solid rgba(255,255,255,0.25)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "1.3rem", fontWeight: 800, color: "#fff",
      boxShadow: "0 4px 14px rgba(224,5,0,0.3)",
      backdropFilter: "blur(4px)",
    }}>
      {initials || <User style={{ width: 26, height: 26, color: "rgba(255,255,255,0.7)" }} />}
    </div>
  );
}

/* ── Chip ── */
function Chip() {
  return (
    <svg width="34" height="26" viewBox="0 0 40 32" fill="none">
      <rect x="8" y="4" width="24" height="24" rx="3" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.35)" strokeWidth="1"/>
      <rect x="13" y="9" width="14" height="14" rx="1.5" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.75"/>
      {[11,16,21].map(y=><g key={y}>
        <line x1="4" y1={y} x2="8" y2={y} stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="32" y1={y} x2="36" y2={y} stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round"/>
      </g>)}
      {[13,20,27].map(x=><g key={x}>
        <line x1={x} y1="4" x2={x} y2="0" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1={x} y1="28" x2={x} y2="32" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round"/>
      </g>)}
    </svg>
  );
}

export default function HealthCardPage() {
  const { data: session } = useSession();
  const { data: profile, isLoading } = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });
  const [flipped, setFlipped] = useState(false);

  const patientId = profile?.patientCode ?? session?.user?.patientCode ?? "—";
  const firstName = profile?.firstName   ?? session?.user?.firstName   ?? "";
  const lastName  = profile?.lastName    ?? session?.user?.lastName    ?? "";
  const fullName  = firstName && lastName ? `${firstName} ${lastName}` : session?.user?.name ?? "—";
  const initials  = ((firstName[0] ?? "") + (lastName[0] ?? "")).toUpperCase();
  const dob       = profile?.dob
    ? new Date(profile.dob).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })
    : "—";
  const mobile = profile?.mobile ?? "—";

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: "NWD Health Card", text: `Patient: ${fullName}\nID: ${patientId}` }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`Patient: ${fullName}\nID: ${patientId}`);
      toast.success("Copied to clipboard");
    }
  }

  /* card dimensions — credit-card ratio */
  const W = 380, H = 240;

  const cardFront = (
    <div style={{
      position: "absolute", inset: 0,
      backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
      borderRadius: 18, overflow: "hidden",
      background: `linear-gradient(135deg, ${NAVY} 0%, ${BLUE} 70%, #1a14c8 100%)`,
      boxShadow: `0 20px 50px rgba(16,6,160,0.5)`,
    }}>
      {/* top red stripe */}
      <div style={{ height: 5, background: `linear-gradient(90deg,${RED},#ff2e22)` }}/>

      {/* subtle dot grid */}
      <div style={{ position:"absolute", inset:0, pointerEvents:"none",
        backgroundImage:"radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)",
        backgroundSize:"20px 20px" }}/>

      {/* blue glow blob top-right */}
      <div style={{ position:"absolute", top:-50, right:-50, width:200, height:200,
        borderRadius:"50%", background:`${BLUE}60`, pointerEvents:"none", zIndex:0 }}/>
      {/* red decorative blob top-right */}
      <div style={{ position:"absolute", top:-30, right:-30, width:150, height:150,
        borderRadius:"50%", background:`${RED}99`, pointerEvents:"none", zIndex:0 }}/>
      {/* red decorative blob bottom-left */}
      <div style={{ position:"absolute", bottom:-40, left:-30, width:160, height:160,
        borderRadius:"50%", background:`${RED}90`, pointerEvents:"none", zIndex:0 }}/>

      {/* ── Row 1: logo + active badge ── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 18px 0", position:"relative", zIndex:1 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/ico.png" alt="NWDI" style={{ width:26, height:26, borderRadius:6, objectFit:"contain" }}/>
          <p style={{
            fontSize: 10, fontWeight: 800, margin: 0,
            letterSpacing: "0.12em", textTransform: "uppercase",
            background: "linear-gradient(180deg, #e8e8e8 0%, #a0a0a0 40%, #ffffff 55%, #888 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            textShadow: "none",
            filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.6))",
          }}>New World Diagnostics Inc.</p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:5,
          background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.18)",
          borderRadius:20, padding:"3px 10px" }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background:"#4ade80", boxShadow:"0 0 5px #4ade80", flexShrink:0 }}/>
          <span style={{ fontSize:9, fontWeight:700, color:"#fff", letterSpacing:"0.08em" }}>ACTIVE</span>
        </div>
      </div>

      {/* ── Name + DOB (left, pushed down) ── */}
      <div style={{ padding:"28px 18px 0", position:"relative", zIndex:1 }}>
        {isLoading ? (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <div style={{ height:10, width:180, borderRadius:5, background:"rgba(255,255,255,0.1)" }}/>
            <div style={{ height:14, width:220, borderRadius:5, background:"rgba(255,255,255,0.1)" }}/>
            <div style={{ height:10, width:150, borderRadius:5, background:"rgba(255,255,255,0.1)" }}/>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {/* Full name */}
            <div>
              <p style={{ fontSize:7, color:"rgba(255,255,255,0.4)", letterSpacing:"0.14em", textTransform:"uppercase", margin:"0 0 2px" }}>Patient Name</p>
              <p style={{ fontSize: fullName.length > 22 ? 14 : 18, fontWeight:700, color:"rgba(255,255,255,0.82)", margin:0, lineHeight:1.2, textTransform:"uppercase", letterSpacing:"0.05em" }}>{fullName}</p>
            </div>
            {/* Date of Birth */}
            <div>
              <p style={{ fontSize:7, color:"rgba(255,255,255,0.4)", letterSpacing:"0.14em", textTransform:"uppercase", margin:"0 0 2px" }}>Date of Birth</p>
              <p style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.82)", margin:0, textTransform:"uppercase", letterSpacing:"0.05em" }}>{dob}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Valid Thru — absolute bottom-right ── */}
      {!isLoading && (
        <div style={{ position:"absolute", bottom:42, right:18, zIndex:1, textAlign:"right" }}>
          <p style={{ fontSize:7, color:"rgba(255,255,255,0.4)", letterSpacing:"0.14em", textTransform:"uppercase", margin:"0 0 2px" }}>Valid Thru</p>
          <p style={{ fontSize:11, fontWeight:600, color:"#fff", margin:0 }}>{new Date().getFullYear() + 1}</p>
        </div>
      )}

      {/* embossed card number */}
      <div style={{ position:"absolute", bottom:22, left:18, right:18, zIndex:1 }}>
        <p style={{
          margin: 0,
          fontFamily: "monospace",
          fontSize: 17,
          fontWeight: 700,
          letterSpacing: "0.32em",
          background: "linear-gradient(180deg, #e8e8e8 0%, #a0a0a0 40%, #ffffff 55%, #888 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.7))",
        }}>
          {patientId !== "—"
            ? patientId.replace(/(.{4})/g, "$1 ").trim()
            : "•••• •••• •••• ••••"}
        </p>
      </div>

      {/* flip hint */}
      <div style={{ position:"absolute", bottom:7, left:"50%", transform:"translateX(-50%)",
        display:"flex", alignItems:"center", gap:4, color:"rgba(255,255,255,0.2)", fontSize:9 }}>
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
        tap to flip
      </div>
    </div>
  );

  const cardBack = (
    <div style={{
      position:"absolute", inset:0,
      backfaceVisibility:"hidden", WebkitBackfaceVisibility:"hidden",
      transform:"rotateY(180deg)",
      borderRadius:18, overflow:"hidden",
      background:`linear-gradient(135deg, ${NAVY} 0%, #0a0560 50%, ${BLUE} 100%)`,
      boxShadow:`0 20px 50px rgba(16,6,160,0.5)`,
    }}>
      {/* top red stripe */}
      <div style={{ height:5, background:`linear-gradient(90deg,${RED},#ff2e22)` }}/>

      {/* magnetic strip */}
      <div style={{ height:34, background:"rgba(0,0,0,0.45)", margin:"14px 0 0",
        borderTop:`1px solid ${RED}33`, borderBottom:`1px solid ${RED}33` }}/>

      {/* QR + details */}
      <div style={{ display:"flex", gap:14, padding:"14px 18px 0", alignItems:"flex-start" }}>
        {/* QR box */}
        <div style={{ background:"#fff", borderRadius:10, padding:6, flexShrink:0,
          border:"1px solid rgba(255,255,255,0.15)", boxShadow:`0 4px 14px rgba(0,0,0,0.3)` }}>
          <QrCode size={86}/>
        </div>

        {/* fields */}
        <div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column", gap:8 }}>
          {isLoading ? (
            <div style={{ height:90, background:"rgba(255,255,255,0.07)", borderRadius:8 }}/>
          ) : (
            [
              { label:"Patient ID", value:patientId, mono:true },
              { label:"Full Name",  value:fullName },
              { label:"DOB",        value:dob },
              { label:"Mobile",     value:mobile },
            ].map(({ label, value, mono }) => (
              <div key={label}>
                <p style={{ fontSize:8, color:"rgba(255,255,255,0.4)", letterSpacing:"0.12em", textTransform:"uppercase", margin:"0 0 2px" }}>{label}</p>
                <p style={{ fontSize: mono ? 11 : 10, fontWeight:600, color:"#fff", margin:0,
                  fontFamily: mono ? "monospace" : "inherit",
                  whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{value}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* footer */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"10px 18px", borderTop:"1px solid rgba(255,255,255,0.07)", marginTop:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <span style={{ fontSize:9, color:"rgba(255,255,255,0.45)" }}>NWD Verified Patient</span>
        </div>
        <span style={{ fontSize:9, color:`${RED}88`, fontFamily:"monospace", fontWeight:600 }}>
          {new Date().getFullYear()} · nwdi.com.ph
        </span>
      </div>

      {/* flip hint */}
      <div style={{ position:"absolute", bottom:6, left:"50%", transform:"translateX(-50%)",
        display:"flex", alignItems:"center", gap:4, color:"rgba(255,255,255,0.18)", fontSize:9 }}>
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
        tap to flip back
      </div>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
          <div style={{ width:32, height:32, borderRadius:10, background:`${BLUE}15`, border:`1px solid ${BLUE}25`,
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            <CreditCard style={{ width:15, height:15, color:BLUE }}/>
          </div>
          <span style={{ fontSize:"0.68rem", fontWeight:700, color:BLUE, letterSpacing:"0.12em", textTransform:"uppercase" }}>Identity</span>
        </div>
        <h1 style={{ fontSize:"1.4rem", fontWeight:700, color:"hsl(var(--foreground))", margin:0 }}>Digital Health Card</h1>
        <p style={{ fontSize:"0.82rem", color:"hsl(var(--muted-foreground))", marginTop:2 }}>Tap the card to flip it</p>
      </div>

      {/* Card */}
      <div style={{ display:"flex", justifyContent:"center" }}>
        <div
          style={{ width:W, height:H, perspective:1000, cursor:"pointer", userSelect:"none", flexShrink:0, maxWidth:"100%" }}
          onClick={() => setFlipped(f => !f)}
        >
          <div style={{
            position:"relative", width:"100%", height:"100%",
            transformStyle:"preserve-3d",
            transition:"transform 0.65s cubic-bezier(0.4,0.2,0.2,1)",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}>
            {cardFront}
            {cardBack}
          </div>
        </div>
      </div>

      {/* Flip button */}
      <div style={{ display:"flex", justifyContent:"center" }}>
        <button
          onClick={() => setFlipped(f => !f)}
          style={{ display:"flex", alignItems:"center", gap:6, height:34, padding:"0 18px",
            borderRadius:20, border:`1.5px solid ${BLUE}25`, background:`${BLUE}08`,
            fontSize:"0.75rem", fontWeight:600, color:BLUE, cursor:"pointer" }}
        >
          <RotateCcw style={{ width:13, height:13 }}/> {flipped ? "Show Front" : "Show Back"}
        </button>
      </div>

      {/* Info box */}
      <div style={{ borderRadius:14, border:`1px solid ${BLUE}18`, background:`${BLUE}05`, padding:"14px 16px" }}>
        <p style={{ fontSize:"0.78rem", color:"hsl(var(--muted-foreground))", lineHeight:1.7, margin:0 }}>
          Present this digital card at any NWD branch. The QR code on the back contains your Patient ID
          and can be scanned by our staff to quickly retrieve your records.
        </p>
      </div>

      {/* Actions */}
      <div style={{ display:"flex", gap:12 }}>
        <button
          onClick={() => window.print()}
          style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            height:44, borderRadius:12, border:`1.5px solid ${BLUE}20`,
            background:"hsl(var(--card))", fontSize:"0.85rem", fontWeight:600,
            color:"hsl(var(--foreground))", cursor:"pointer" }}
        >
          <Download style={{ width:16, height:16 }}/> Save / Print
        </button>
        <button
          onClick={handleShare}
          style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            height:44, borderRadius:12, border:"none",
            background:`linear-gradient(135deg,${NAVY},${BLUE})`,
            fontSize:"0.85rem", fontWeight:600, color:"#fff", cursor:"pointer",
            boxShadow:`0 4px 16px ${BLUE}44` }}
        >
          <Share2 style={{ width:16, height:16 }}/> Share Card
        </button>
      </div>

    </div>
  );
}
