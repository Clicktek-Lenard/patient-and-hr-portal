"use client";

import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2, ArrowRight, ShieldCheck,
  User, Calendar, ArrowLeft, Mail, Lock,
} from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { patientLoginSchema, hrLoginSchema } from "@/lib/validations/auth";
import type { z } from "zod";

type PatientInput = z.infer<typeof patientLoginSchema>;
type HrInput      = z.infer<typeof hrLoginSchema>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-xs text-red-500 flex items-center gap-1.5 mt-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
      {message}
    </p>
  );
}

/* ── Security notice components ── */
function SecurityNotice({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 8,
      background: "#f0fdf4", border: "1px solid #bbf7d0",
      borderRadius: 10, padding: "10px 12px", marginTop: 4,
    }}>
      <span style={{ fontSize: 13, flexShrink: 0 }}>🔒</span>
      <p style={{ fontSize: 11, color: "#15803d", lineHeight: 1.5, margin: 0 }}>{children}</p>
    </div>
  );
}

function RateLimitNotice({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 8,
      background: "#fffbeb", border: "1px solid #fde68a",
      borderRadius: 10, padding: "10px 12px",
    }}>
      <span style={{ fontSize: 13, flexShrink: 0 }}>⚠</span>
      <p style={{ fontSize: 11, color: "#92400e", lineHeight: 1.5, margin: 0 }}>{children}</p>
    </div>
  );
}

function LoginPageInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl  = searchParams.get("callbackUrl");
  const portalParam  = searchParams.get("portal");

  const [tab, setTab]             = useState<"patient" | "hr">("patient");
  const [isLoading, setIsLoading] = useState(false);
  const [showPw, setShowPw]       = useState(false);

  // Lock to the portal specified in the URL
  const lockedPortal = portalParam === "hr" ? "hr" : portalParam === "patient" ? "patient" : null;

  useEffect(() => {
    if (portalParam === "hr") setTab("hr");
    else setTab("patient");
  }, [portalParam]);

  const patientForm = useForm<PatientInput>({
    resolver: zodResolver(patientLoginSchema),
    defaultValues: { patientCode: "", dob: "" },
  });

  const hrForm = useForm<HrInput>({
    resolver: zodResolver(hrLoginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function doSignIn(loginType: "patient" | "hr", identifier: string, dob?: string, password?: string) {
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        loginType,
        identifier,
        dob: dob ?? "",
        pin: password ?? "",
        redirect: false,
      });
      if (result?.error) {
        toast.error(result.error === "CredentialsSignin"
          ? "Invalid credentials. Please check your information and try again."
          : result.error);
        return;
      }
      if (result?.ok) {
        toast.success("Welcome back!");
        const session     = await getSession();
        const role        = (session?.user as { role?: string })?.role;
        const destination = callbackUrl ?? (role === "HR" || role === "ADMIN" ? "/hr/dashboard" : "/dashboard");
        router.push(destination);
        router.refresh();
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const onPatientSubmit = (data: PatientInput) =>
    doSignIn("patient", data.patientCode.trim().toUpperCase(), data.dob);

  const onHrSubmit = (data: HrInput) =>
    doSignIn("hr", data.email.trim().toLowerCase(), undefined, data.password);

  const isHr = tab === "hr";
  const NWD_BLUE = "#1006A0";
  const NWD_RED  = "#E00500";

  return (
    <div style={{ width: "100%" }}>

      {/* Back link */}
      <button
        onClick={() => router.push("/")}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          marginBottom: 32, background: "none", border: "none",
          cursor: "pointer", color: "#6b7280",
          fontSize: 13, fontWeight: 500, padding: 0,
          transition: "color 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = NWD_BLUE)}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}
      >
        <ArrowLeft style={{ width: 15, height: 15 }} />
        Back to home
      </button>

      {/* Card */}
      <div style={{
        background: "white",
        borderRadius: 24,
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05), 0 20px 60px -10px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)",
        overflow: "hidden",
      }}>

        {/* Coloured top bar */}
        <div style={{
          height: 5,
          background: isHr
            ? `linear-gradient(90deg, ${NWD_RED}, #ff4444, #ff6b6b)`
            : `linear-gradient(90deg, ${NWD_BLUE}, #1a14c8, #2d28d4)`,
          transition: "background 0.4s",
        }} />

        <div style={{ padding: "32px 32px 36px" }}>

          {/* Portal badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            background: isHr ? "#fff0f0" : "#eef2ff",
            borderRadius: 20, padding: "5px 12px", marginBottom: 20,
          }}>
            {isHr
              ? <ShieldCheck style={{ width: 13, height: 13, color: NWD_RED }} />
              : <User        style={{ width: 13, height: 13, color: NWD_BLUE }} />
            }
            <span style={{ fontSize: 11, fontWeight: 700, color: isHr ? NWD_RED : NWD_BLUE, letterSpacing: "0.04em" }}>
              {isHr ? "HR Staff Portal" : "Patient Portal"}
            </span>
          </div>

          <h2 style={{ fontSize: 26, fontWeight: 800, color: "#111827", lineHeight: 1.2, marginBottom: 4 }}>
            Welcome back
          </h2>
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 24, lineHeight: 1.5 }}>
            {isHr
              ? "Access is restricted to authorized corporate account contacts."
              : "Sign in to access your health records"}
          </p>

          {/* Tab switcher — only shown when no portal is pre-selected */}
          {!lockedPortal && (
            <div style={{
              display: "flex", gap: 6, padding: 5,
              background: "#f3f4f6", borderRadius: 14, marginBottom: 28,
            }}>
              {(["patient", "hr"] as const).map((t) => {
                const active    = tab === t;
                const tabAccent = t === "hr" ? NWD_RED : NWD_BLUE;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                      gap: 7, borderRadius: 10, padding: "9px 0",
                      fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer",
                      transition: "all 0.2s",
                      background: active ? "white" : "transparent",
                      color: active ? tabAccent : "#9ca3af",
                      boxShadow: active ? "0 1px 4px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)" : "none",
                    }}
                  >
                    {t === "patient"
                      ? <User        style={{ width: 14, height: 14 }} />
                      : <ShieldCheck style={{ width: 14, height: 14 }} />
                    }
                    {t === "patient" ? "Patient" : "HR Staff"}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── PATIENT FORM ── */}
          {tab === "patient" && (
            <form onSubmit={patientForm.handleSubmit(onPatientSubmit)} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <Label htmlFor="patientCode" style={{ fontSize: 12, fontWeight: 600, color: "#374151", letterSpacing: "0.04em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                  Patient ID
                </Label>
                <div style={{ position: "relative" }}>
                  <User style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#9ca3af" }} />
                  <input
                    id="patientCode"
                    placeholder="e.g. PT-2024-00123"
                    autoComplete="username"
                    disabled={isLoading}
                    {...patientForm.register("patientCode")}
                    style={{
                      width: "100%", height: 46, paddingLeft: 42, paddingRight: 14,
                      borderRadius: 12, fontSize: 14, outline: "none",
                      border: patientForm.formState.errors.patientCode
                        ? "1.5px solid #ef4444"
                        : "1.5px solid #e5e7eb",
                      background: "#fafafa", color: "#111827",
                      transition: "all 0.15s", boxSizing: "border-box",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = NWD_BLUE, e.currentTarget.style.boxShadow = "0 0 0 3px rgba(16,6,160,0.1)")}
                    onBlur={(e)  => (e.currentTarget.style.borderColor = patientForm.formState.errors.patientCode ? "#ef4444" : "#e5e7eb", e.currentTarget.style.boxShadow = "none")}
                  />
                </div>
                <FieldError message={patientForm.formState.errors.patientCode?.message} />
              </div>

              <div>
                <Label htmlFor="patient-dob" style={{ fontSize: 12, fontWeight: 600, color: "#374151", letterSpacing: "0.04em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                  Date of Birth
                </Label>
                <div style={{ position: "relative" }}>
                  <Calendar style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#9ca3af", zIndex: 1 }} />
                  <input
                    id="patient-dob"
                    type="date"
                    disabled={isLoading}
                    {...patientForm.register("dob")}
                    style={{
                      width: "100%", height: 46, paddingLeft: 42, paddingRight: 14,
                      borderRadius: 12, fontSize: 14, outline: "none",
                      border: patientForm.formState.errors.dob
                        ? "1.5px solid #ef4444"
                        : "1.5px solid #e5e7eb",
                      background: "#fafafa", color: "#111827",
                      transition: "all 0.15s", boxSizing: "border-box",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = NWD_BLUE, e.currentTarget.style.boxShadow = "0 0 0 3px rgba(16,6,160,0.1)")}
                    onBlur={(e)  => (e.currentTarget.style.borderColor = patientForm.formState.errors.dob ? "#ef4444" : "#e5e7eb", e.currentTarget.style.boxShadow = "none")}
                  />
                </div>
                <FieldError message={patientForm.formState.errors.dob?.message} />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: "100%", height: 48, borderRadius: 14, border: "none",
                  background: `linear-gradient(135deg, ${NWD_BLUE}, #1a14c8)`,
                  color: "white", fontSize: 14, fontWeight: 700,
                  cursor: isLoading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  opacity: isLoading ? 0.7 : 1,
                  boxShadow: "0 4px 14px rgba(16,6,160,0.35)",
                  transition: "all 0.2s",
                  marginTop: 4,
                }}
                onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.boxShadow = "0 6px 20px rgba(16,6,160,0.45)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 4px 14px rgba(16,6,160,0.35)"; }}
              >
                {isLoading
                  ? <><Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />Signing in…</>
                  : <>Sign In <ArrowRight style={{ width: 15, height: 15 }} /></>
                }
              </button>

              <p style={{ textAlign: "center", fontSize: 11, color: "#9ca3af", marginTop: -4 }}>
                Your Patient ID is on your hospital card or visit receipt
              </p>

              {/* Security notices */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <SecurityNotice>
                  Secured with HTTPS encryption · Session auto-expires after 15 minutes
                </SecurityNotice>
                <RateLimitNotice>
                  5 failed attempts will temporarily lock this account for 30 minutes
                </RateLimitNotice>
              </div>
            </form>
          )}

          {/* ── HR FORM ── */}
          {tab === "hr" && (
            <form onSubmit={hrForm.handleSubmit(onHrSubmit)} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <Label htmlFor="hr-email" style={{ fontSize: 12, fontWeight: 600, color: "#374151", letterSpacing: "0.04em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                  Corporate Email
                </Label>
                <div style={{ position: "relative" }}>
                  <Mail style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#9ca3af" }} />
                  <input
                    id="hr-email"
                    type="email"
                    placeholder="you@nwdi.com.ph"
                    autoComplete="email"
                    disabled={isLoading}
                    {...hrForm.register("email")}
                    style={{
                      width: "100%", height: 46, paddingLeft: 42, paddingRight: 14,
                      borderRadius: 12, fontSize: 14, outline: "none",
                      border: hrForm.formState.errors.email ? "1.5px solid #ef4444" : "1.5px solid #e5e7eb",
                      background: "#fafafa", color: "#111827",
                      transition: "all 0.15s", boxSizing: "border-box",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = NWD_RED, e.currentTarget.style.boxShadow = "0 0 0 3px rgba(224,5,0,0.1)")}
                    onBlur={(e)  => (e.currentTarget.style.borderColor = hrForm.formState.errors.email ? "#ef4444" : "#e5e7eb", e.currentTarget.style.boxShadow = "none")}
                  />
                </div>
                <FieldError message={hrForm.formState.errors.email?.message} />
              </div>

              <div>
                <Label htmlFor="hr-password" style={{ fontSize: 12, fontWeight: 600, color: "#374151", letterSpacing: "0.04em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                  Password
                </Label>
                <div style={{ position: "relative" }}>
                  <Lock style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#9ca3af", zIndex: 1 }} />
                  <input
                    id="hr-password"
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={isLoading}
                    {...hrForm.register("password")}
                    style={{
                      width: "100%", height: 46, paddingLeft: 42, paddingRight: 44,
                      borderRadius: 12, fontSize: 14, outline: "none",
                      border: hrForm.formState.errors.password ? "1.5px solid #ef4444" : "1.5px solid #e5e7eb",
                      background: "#fafafa", color: "#111827",
                      transition: "all 0.15s", boxSizing: "border-box",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = NWD_RED, e.currentTarget.style.boxShadow = "0 0 0 3px rgba(224,5,0,0.1)")}
                    onBlur={(e)  => (e.currentTarget.style.borderColor = hrForm.formState.errors.password ? "#ef4444" : "#e5e7eb", e.currentTarget.style.boxShadow = "none")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    style={{
                      position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer",
                      color: "#9ca3af", padding: 2, lineHeight: 1,
                    }}
                    tabIndex={-1}
                  >
                    {showPw
                      ? <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
                <FieldError message={hrForm.formState.errors.password?.message} />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: "100%", height: 48, borderRadius: 14, border: "none",
                  background: `linear-gradient(135deg, ${NWD_RED}, #c20400)`,
                  color: "white", fontSize: 14, fontWeight: 700,
                  cursor: isLoading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  opacity: isLoading ? 0.7 : 1,
                  boxShadow: "0 4px 14px rgba(224,5,0,0.35)",
                  transition: "all 0.2s",
                  marginTop: 4,
                }}
                onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.boxShadow = "0 6px 20px rgba(224,5,0,0.45)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 4px 14px rgba(224,5,0,0.35)"; }}
              >
                {isLoading
                  ? <><Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />Signing in…</>
                  : <><ShieldCheck style={{ width: 15, height: 15 }} />HR Sign In</>
                }
              </button>

              <p style={{ textAlign: "center", fontSize: 11, color: "#9ca3af", marginTop: -4 }}>
                HR credentials are issued by your system administrator
              </p>

              {/* Security notices */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <SecurityNotice>
                  OTP verification required on first login · Session expires after 15 minutes
                </SecurityNotice>
                <RateLimitNotice>
                  Unauthorized access is logged and monitored per RA 10173
                </RateLimitNotice>
              </div>
            </form>
          )}
        </div>

        {/* Card footer */}
        <div style={{
          padding: "14px 32px",
          background: "#f9fafb",
          borderTop: "1px solid #f3f4f6",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          <ShieldCheck style={{ width: 12, height: 12, color: "#9ca3af" }} />
          <span style={{ fontSize: 11, color: "#9ca3af" }}>256-bit encrypted · HIPAA compliant · DOH accredited</span>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  );
}
