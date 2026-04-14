"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle, Phone, Mail, MessageCircle, ShieldCheck } from "lucide-react";

const FAQS = [
  { q: "How do I log in to the Patient Portal?", a: "Log in using your Patient ID (e.g. PT-2024-00123) and your Date of Birth. Your Patient ID can be found on your official receipt, hospital card, or result report issued by any NWD branch." },
  { q: "When will my results be available?", a: "Lab results are typically released within 4–8 hours after collection for routine tests. Specialized tests may take 1–3 business days. You will receive an SMS notification once your results are verified and released by our laboratory team." },
  { q: "How far back can I view my medical history?", a: "The portal displays results from the past 3–6 months by default. For older records, please contact your home branch directly with a valid ID and your Patient ID." },
  { q: "Why is my Medical Evaluation result showing 'Access Pending'?", a: "Medical Evaluation results require physician clearance before being released to patients. This is a standard compliance step. If your result has been pending for more than 5 business days, please contact your branch or email support@nwdi.com.ph." },
  { q: "Is my health data secure?", a: "Yes. NEW WORLD DIAGNOSTICS, INC. is compliant with the Philippine Data Privacy Act (RA 10173) and registered with the National Privacy Commission (NPC Registration PIC-007-389-2024). All data is encrypted in transit and at rest using 256-bit encryption." },
  { q: "Can I change my login credentials?", a: "Your Patient ID is fixed and linked to your CMSv2 record. Your Date of Birth serves as your authentication credential and cannot be changed. If you believe your credentials are compromised, please contact your branch immediately." },
  { q: "How do I share my results with a doctor or employer?", a: "Go to 'Share Results' in the sidebar. You can generate a secure, time-limited link (valid for 24 hours, 7 days, or 30 days) that can be opened by anyone without requiring a login. You can revoke the link at any time." },
  { q: "How do I book an appointment?", a: "Navigate to 'Appointments' in the sidebar. Select your preferred NWD branch, choose your test or package, then pick an available date and time slot. You will receive a confirmation with a reference number via SMS." },
  { q: "How do I update my email or mobile number?", a: "Go to 'My Profile' and select the 'Personal Information' tab. You can update your email and mobile number. Your name and date of birth are sourced from your CMSv2 record and cannot be edited in the portal." },
  { q: "What should I do if I experience a technical issue?", a: "Try refreshing the page or clearing your browser cache. If the issue persists, contact our support team at support@nwdi.com.ph or call our hotline at (02) 8-920-1234. Please include your Patient ID and a brief description of the issue." },
];

const NOTIFICATIONS = [
  { trigger: "Results Released",     desc: "Sent via SMS and email when your lab results are verified and available in the portal." },
  { trigger: "Appointment Reminder", desc: "Sent 24 hours before your scheduled appointment with your booking reference." },
  { trigger: "Abnormal Value Alert", desc: "Sent when any result parameter falls outside the normal reference range." },
];

export default function HelpPage() {
  const [open, setOpen] = useState<number | null>(null);

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
            Help &amp; FAQ
          </h1>
        </div>
        <p style={{ fontSize: 13, color: "hsl(var(--muted-foreground))", marginLeft: 16 }}>
          Answers to common questions about the NWD Patient Portal.
        </p>
      </div>

      <div style={{ maxWidth: 780, display: "flex", flexDirection: "column", gap: 20 }}>

        {/* FAQ Accordion */}
        <div style={{
          background: "hsl(var(--card))", borderRadius: 16,
          border: "1px solid hsl(var(--border))",
          overflow: "hidden", boxShadow: "var(--shadow-sm)",
        }}>
          <div style={{ padding: "18px 24px", borderBottom: "1px solid hsl(var(--border))", display: "flex", alignItems: "center", gap: 10 }}>
            <HelpCircle style={{ width: 18, height: 18, color: "hsl(var(--primary))" }} />
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "hsl(var(--foreground))" }}>Frequently Asked Questions</h2>
          </div>
          <div>
            {FAQS.map((faq, i) => (
              <div key={i} style={{ borderBottom: i < FAQS.length - 1 ? "1px solid hsl(var(--border))" : "none" }}>
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  style={{
                    width: "100%", textAlign: "left", padding: "16px 24px",
                    background: open === i ? "hsl(var(--accent))" : "transparent",
                    border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
                    transition: "background 0.15s",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: "hsl(var(--foreground))", lineHeight: 1.5, textAlign: "left" }}>
                    {faq.q}
                  </span>
                  <ChevronDown style={{
                    width: 17, height: 17, color: "hsl(var(--muted-foreground))", flexShrink: 0,
                    transform: open === i ? "rotate(180deg)" : "none",
                    transition: "transform 0.2s",
                  }} />
                </button>
                {open === i && (
                  <div style={{ padding: "0 24px 18px", borderTop: "1px solid hsl(var(--border))" }}>
                    <p style={{ fontSize: 13, color: "hsl(var(--muted-foreground))", lineHeight: 1.7, marginTop: 14 }}>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Notification info */}
        <div style={{
          background: "hsl(var(--card))", borderRadius: 16,
          border: "1px solid hsl(var(--border))",
          padding: "22px 24px", boxShadow: "var(--shadow-sm)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <MessageCircle style={{ width: 18, height: 18, color: "hsl(var(--primary))" }} />
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "hsl(var(--foreground))" }}>Notification Information</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {NOTIFICATIONS.map(({ trigger, desc }) => (
              <div key={trigger} style={{
                display: "flex", gap: 12, padding: "12px 16px",
                background: "hsl(var(--accent))", borderRadius: 10,
                border: "1px solid hsl(var(--border))",
              }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "hsl(var(--primary))", marginTop: 5, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "hsl(var(--primary))", marginBottom: 3 }}>{trigger}</p>
                  <p style={{ fontSize: 13, color: "hsl(var(--muted-foreground))", lineHeight: 1.5 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: "hsl(var(--muted-foreground) / 0.6)", marginTop: 14, fontStyle: "italic" }}>
            Notification delivery depends on your registered contact information. Update your email/mobile in My Profile.
          </p>
        </div>

        {/* Support contact — always dark navy, works in both modes */}
        <div style={{ background: "#08036A", borderRadius: 16, padding: "26px 28px", color: "white" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <ShieldCheck style={{ width: 18, height: 18, color: "#fbbf24" }} />
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "white" }}>Contact Support</h2>
          </div>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", marginBottom: 18, lineHeight: 1.6 }}>
            Our support team is available Monday to Saturday, 8:00 AM – 6:00 PM.
            For urgent medical concerns, please visit your nearest NWD branch.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            <a href="tel:+6328920-1234" style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 12, color: "white", textDecoration: "none" }}>
              <Phone style={{ width: 18, height: 18, color: "#fbbf24", flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Hotline</p>
                <p style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>(02) 8-920-1234</p>
              </div>
            </a>
            <a href="mailto:support@nwdi.com.ph" style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 12, color: "white", textDecoration: "none" }}>
              <Mail style={{ width: 18, height: 18, color: "#fbbf24", flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Email</p>
                <p style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>support@nwdi.com.ph</p>
              </div>
            </a>
          </div>
          <div style={{ marginTop: 14, padding: "11px 14px", background: "rgba(255,255,255,0.07)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)" }}>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>
              For Data Privacy concerns, contact our Data Protection Officer at{" "}
              <a href="mailto:dpo@nwdi.com.ph" style={{ color: "#fbbf24", textDecoration: "none" }}>dpo@nwdi.com.ph</a>
              {" "}· NPC Registration PIC-007-389-2024
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
