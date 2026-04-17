"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { MessageSquarePlus, X, Camera, Upload, Loader2, CheckCircle, TriangleAlert } from "lucide-react";

type UatSeverity = "Bug" | "Suggestion" | "Question" | "Blocker";

const SEVERITY_OPTIONS: { value: UatSeverity; label: string; color: string }[] = [
  { value: "Blocker",    label: "Blocker",    color: "#E00500" },
  { value: "Bug",        label: "Bug",        color: "#F97316" },
  { value: "Suggestion", label: "Suggestion", color: "#3B82F6" },
  { value: "Question",   label: "Question",   color: "#8B5CF6" },
];

const MODULE_MAP: Record<string, string> = {
  dashboard:       "Dashboard",
  employees:       "Employees",
  compliance:      "PE Compliance",
  wellness:        "Wellness Trends",
  reports:         "Reports & Exports",
  scheduling:      "Bulk Scheduling",
  audit:           "Audit Trail",
  "uat-feedback":  "UAT Feedback",
  settings:        "Account Settings",
};

function getModuleFromPath(pathname: string) {
  const seg = pathname.split("/").filter(Boolean);
  // /hr/employees/CODE → seg[1] = "employees"
  const key = seg[1] ?? seg[0] ?? "unknown";
  return MODULE_MAP[key] ?? key;
}

export function UatFeedbackButton() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const [uatActive, setUatActive] = useState(false);
  const [open, setOpen]           = useState(false);
  const [severity, setSeverity]   = useState<UatSeverity>("Bug");
  const [description, setDesc]    = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]       = useState(false);
  const [screenshotLoading, setScreenshotLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Check UAT active status on mount + whenever settings are saved
  useEffect(() => {
    function checkUat() {
      fetch("/api/uat/settings")
        .then((r) => r.json())
        .then((d) => {
          if (!d.isActive) { setUatActive(false); return; }
          const now   = new Date();
          const from  = d.activeFrom  ? new Date(d.activeFrom)  : null;
          const until = d.activeUntil ? new Date(d.activeUntil) : null;
          const inWindow = (!from || now >= from) && (!until || now <= until);
          setUatActive(inWindow);
        })
        .catch(() => setUatActive(false));
    }

    checkUat();
    window.addEventListener("uat-settings-changed", checkUat);
    return () => window.removeEventListener("uat-settings-changed", checkUat);
  }, []);

  const captureScreenshot = useCallback(async () => {
    setScreenshotLoading(true);
    try {
      // Dynamically import html2canvas to keep bundle small
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: false,
        scale: 0.8,
        logging: false,
      });
      const dataUrl = canvas.toDataURL("image/png");
      setScreenshot(dataUrl);
    } catch {
      // Fallback: prompt file upload
      fileRef.current?.click();
    } finally {
      setScreenshotLoading(false);
    }
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setScreenshot(ev.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  async function uploadScreenshot(dataUrl: string): Promise<string | null> {
    try {
      const res = await fetch("/api/uat/upload", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ dataUrl }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.path as string;
    } catch {
      return null;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;

    setSubmitting(true);
    try {
      let screenshotPath: string | null = null;
      if (screenshot) {
        screenshotPath = await uploadScreenshot(screenshot);
      }

      const res = await fetch("/api/uat/feedback", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module:    getModuleFromPath(pathname),
          pageUrl:   window.location.href,
          pageTitle: document.title,
          severity,
          description: description.trim(),
          screenshotPath,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          setOpen(false);
          setSuccess(false);
          setDesc("");
          setScreenshot(null);
          setSeverity("Bug");
        }, 1800);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function openModal() {
    setOpen(true);
    setSuccess(false);
  }

  if (!uatActive || !session?.user) return null;

  return (
    <>
      {/* UAT active banner — fixed top */}
      <div style={{
        position:       "fixed",
        top:             0,
        left:            0,
        right:           0,
        zIndex:          9998,
        background:     "linear-gradient(90deg, #B45309 0%, #D97706 50%, #B45309 100%)",
        borderBottom:   "2px solid #92400E",
        padding:        "5px 16px",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        gap:             8,
        pointerEvents:  "none",
      }}>
        <TriangleAlert style={{ width: 13, height: 13, color: "#FEF3C7", flexShrink: 0 }} />
        <span style={{
          fontSize:      "0.72rem",
          fontWeight:     700,
          color:         "#FEF3C7",
          letterSpacing: "0.04em",
        }}>
          UAT Mode Active — Your feedback is being recorded
        </span>
        <span style={{
          fontSize:      "0.62rem",
          fontWeight:     700,
          color:         "#D97706",
          background:    "#FEF3C7",
          borderRadius:   8,
          padding:       "1px 7px",
          letterSpacing: "0.06em",
          marginLeft:     4,
        }}>
          UAT
        </span>
      </div>
      {/* Push everything down so the fixed banner doesn't cover the header */}
      <style>{`body { padding-top: 28px !important; }`}</style>

      {/* Floating button */}
      <button
        onClick={openModal}
        title="Submit UAT Feedback"
        style={{
          position:      "fixed",
          bottom:         24,
          right:          24,
          zIndex:         9999,
          height:         40,
          paddingLeft:    14,
          paddingRight:   10,
          borderRadius:   20,
          background:    "#0D9488",
          border:        "none",
          cursor:        "pointer",
          display:       "flex",
          alignItems:    "center",
          gap:            8,
          boxShadow:     "0 4px 20px rgba(13,148,136,0.45)",
          transition:    "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform  = "scale(1.04)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow  = "0 6px 28px rgba(13,148,136,0.6)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform  = "scale(1)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow  = "0 4px 20px rgba(13,148,136,0.45)";
        }}
      >
        <MessageSquarePlus style={{ width: 16, height: 16, color: "white", flexShrink: 0 }} />
        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "white", letterSpacing: "0.01em" }}>
          Feedback
        </span>
        <span style={{
          fontSize:     "0.6rem",
          fontWeight:    800,
          color:        "#0D9488",
          background:   "white",
          borderRadius:  10,
          padding:      "1px 6px",
          letterSpacing: "0.06em",
          lineHeight:    1.6,
        }}>
          UAT
        </span>
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          style={{
            position:  "fixed",
            inset:     0,
            zIndex:    10000,
            background:"rgba(0,0,0,0.55)",
            backdropFilter: "blur(4px)",
            display:   "flex",
            alignItems:"center",
            justifyContent:"center",
            padding:   16,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div style={{
            background: "hsl(var(--card))",
            border:     "1.5px solid hsl(var(--border))",
            borderRadius: 16,
            width:      "100%",
            maxWidth:   480,
            boxShadow:  "0 16px 48px rgba(0,0,0,0.25)",
            overflow:   "hidden",
          }}>
            {/* Header */}
            <div style={{
              background:   "#0D9488",
              padding:      "14px 20px",
              display:      "flex",
              alignItems:   "center",
              justifyContent:"space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <MessageSquarePlus style={{ width: 18, height: 18, color: "white" }} />
                <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "white" }}>
                  UAT Feedback
                </span>
                <span style={{
                  fontSize: "0.65rem", fontWeight: 700, color: "#0D9488",
                  background: "white", borderRadius: 10, padding: "1px 8px",
                  letterSpacing: "0.04em",
                }}>
                  {getModuleFromPath(pathname)}
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.8)", padding: 4, borderRadius: 6 }}
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            {success ? (
              <div style={{ padding: "40px 20px", textAlign: "center" }}>
                <CheckCircle style={{ width: 48, height: 48, color: "#0D9488", margin: "0 auto 12px" }} />
                <p style={{ fontWeight: 700, fontSize: "1rem", color: "hsl(var(--foreground))" }}>
                  Feedback submitted!
                </p>
                <p style={{ fontSize: "0.82rem", color: "hsl(var(--muted-foreground))", marginTop: 4 }}>
                  Thank you for helping us improve the system.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ padding: "20px" }}>
                {/* Auto-filled context */}
                <div style={{
                  background: "hsl(var(--muted))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  padding: "10px 14px",
                  marginBottom: 16,
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "6px 16px",
                }}>
                  {[
                    ["User",   `${session.user.firstName ?? ""} ${session.user.lastName ?? ""}`.trim() || session.user.email],
                    ["Role",   session.user.role ?? "PATIENT"],
                    ["Module", getModuleFromPath(pathname)],
                    ["Page",   document.title || pathname],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        {k}
                      </span>
                      <p style={{ fontSize: "0.78rem", color: "hsl(var(--foreground))", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {v}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Severity */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "hsl(var(--foreground))", display: "block", marginBottom: 6 }}>
                    Severity <span style={{ color: "#E00500" }}>*</span>
                  </label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {SEVERITY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSeverity(opt.value)}
                        style={{
                          flex: 1,
                          padding: "6px 4px",
                          borderRadius: 8,
                          border: `1.5px solid ${severity === opt.value ? opt.color : "hsl(var(--border))"}`,
                          background: severity === opt.value ? `${opt.color}18` : "transparent",
                          color: severity === opt.value ? opt.color : "hsl(var(--muted-foreground))",
                          fontSize: "0.72rem",
                          fontWeight: severity === opt.value ? 700 : 500,
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "hsl(var(--foreground))", display: "block", marginBottom: 6 }}>
                    Description <span style={{ color: "#E00500" }}>*</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Describe the issue or suggestion in detail..."
                    required
                    rows={4}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1.5px solid hsl(var(--border))",
                      background: "hsl(var(--background))",
                      color: "hsl(var(--foreground))",
                      fontSize: "0.82rem",
                      resize: "vertical",
                      outline: "none",
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Screenshot */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "hsl(var(--foreground))", display: "block", marginBottom: 6 }}>
                    Screenshot <span style={{ fontSize: "0.7rem", fontWeight: 400, color: "hsl(var(--muted-foreground))" }}>(optional)</span>
                  </label>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button
                      type="button"
                      onClick={captureScreenshot}
                      disabled={screenshotLoading}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "7px 12px", borderRadius: 8,
                        border: "1.5px solid hsl(var(--border))",
                        background: "hsl(var(--muted))",
                        color: "hsl(var(--foreground))",
                        fontSize: "0.78rem", fontWeight: 600,
                        cursor: screenshotLoading ? "not-allowed" : "pointer",
                        opacity: screenshotLoading ? 0.7 : 1,
                      }}
                    >
                      {screenshotLoading
                        ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />
                        : <Camera style={{ width: 14, height: 14 }} />
                      }
                      Capture
                    </button>
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "7px 12px", borderRadius: 8,
                        border: "1.5px solid hsl(var(--border))",
                        background: "hsl(var(--muted))",
                        color: "hsl(var(--foreground))",
                        fontSize: "0.78rem", fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      <Upload style={{ width: 14, height: 14 }} />
                      Upload
                    </button>
                    {screenshot && (
                      <button
                        type="button"
                        onClick={() => setScreenshot(null)}
                        style={{ background: "transparent", border: "none", cursor: "pointer", color: "#E00500", fontSize: "0.75rem", fontWeight: 600 }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileUpload} />
                  {screenshot && (
                    <div style={{ marginTop: 8, borderRadius: 8, overflow: "hidden", border: "1px solid hsl(var(--border))", maxHeight: 120 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={screenshot} alt="screenshot preview" style={{ width: "100%", objectFit: "cover" }} />
                    </div>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting || !description.trim()}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: 10,
                    border: "none",
                    background: submitting || !description.trim() ? "hsl(var(--muted))" : "#0D9488",
                    color: submitting || !description.trim() ? "hsl(var(--muted-foreground))" : "white",
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    cursor: submitting || !description.trim() ? "not-allowed" : "pointer",
                    transition: "background 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {submitting && <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />}
                  {submitting ? "Submitting..." : "Submit Feedback"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
