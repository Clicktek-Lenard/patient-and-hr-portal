"use client";

import React, { use, useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useAuditLog } from "@/hooks/use-audit-log";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Activity,
  ClipboardList,
  UserCheck,
  UserX,
  Heart,
  Thermometer,
  Scale,
  Ruler,
  Building2,
  Stethoscope,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

type VitalSign = {
  bpSystolic: number | null;
  bpDiastolic: number | null;
  heartRate: number | null;
  temperature: number | null;
  respiratoryRate: number | null;
  weightKg: number | null;
  heightCm: number | null;
  bmi: number | null;
  chiefComplaint: string | null;
  pcpDoctor: string | null;
  createdAt: string | null;
};

type TxItem = {
  id: number;
  codeItemPrice: string | null;
  descriptionItemPrice: string | null;
  amountItemPrice: number | null;
  transactionType: string | null;
  groupItemMaster: string | null;
  nameCompany: string | null;
  nameDoctor: string | null;
  status: number;
};

type Visit = {
  id: number;
  code: string | null;
  date: string | null;
  dateTime: string | null;
  status: number;
  patientType: string | null;
  company: string | null;
  isApe: boolean;
  totalAmount: number;
  transactions: TxItem[];
  vitalSign: VitalSign | null;
};

type Patient = {
  id: number;
  code: string | null;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  middleName: string | null;
  gender: string | null;
  dob: string | null;
  email: string | null;
  mobile: string | null;
  contactNo: string | null;
  fullAddress: string | null;
  isActive: number;
  pictureLink: string | null;
  lastVisit: string | null;
};

type DetailResponse = { patient: Patient; visits: Visit[] };

function resolveVisitStatus(code: number): { label: string; color: string } {
  if ([100, 201].includes(code))
    return { label: "Waiting", color: "text-warning bg-warning-bg border-warning-border" };
  if ([202, 210, 212, 250, 260, 280, 300].includes(code))
    return { label: "In Progress", color: "text-info bg-info-bg border-info-border" };
  if (code === 203)
    return { label: "On Hold", color: "text-muted-foreground bg-muted border-border" };
  if (code === 900)
    return { label: "Exited", color: "text-muted-foreground bg-muted border-border" };
  if (code >= 360)
    return { label: "Complete", color: "text-success bg-success-bg border-success-border" };
  return { label: "Unknown", color: "text-muted-foreground bg-muted border-border" };
}

function getAge(dob: string | null) {
  if (!dob) return null;
  const today = new Date();
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function fmt(d: string | null, opts?: Intl.DateTimeFormatOptions) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-US", opts ?? { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "—";
  }
}

function InfoRow({ label, value, icon: Icon }: { label: string; value: string | null | undefined; icon?: React.ElementType }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
      {Icon && <Icon className="h-4 w-4 text-muted-foreground/50 mt-0.5 shrink-0" />}
      <div className="flex-1 min-w-0 overflow-hidden">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground mt-0.5 break-all">{value || "—"}</p>
      </div>
    </div>
  );
}

function VisitRow({ visit }: { visit: Visit }) {
  const [open, setOpen] = useState(false);
  const statusInfo = resolveVisitStatus(visit.status ?? 0);

  return (
    <div className="border-b border-border last:border-0">
      <button
        type="button"
        className="w-full flex items-start sm:items-center gap-3 px-4 sm:px-5 py-3 hover:bg-muted/40 transition-colors text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-medium text-foreground font-mono">{visit.code ?? "—"}</span>
            {visit.isApe && (
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 border border-violet-400/30 px-2 py-0.5 text-[10px] font-semibold text-violet-600 dark:text-violet-400">
                <Stethoscope className="h-2.5 w-2.5" /> APE
              </span>
            )}
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
            {visit.transactions.length > 0 && (
              <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                {visit.transactions.length} items
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {fmt(visit.dateTime)}
            {visit.company && <> · <span className="text-foreground/70">{visit.company}</span></>}
            {visit.totalAmount > 0 && <> · ₱{visit.totalAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</>}
          </p>
        </div>
        <span className="shrink-0 text-muted-foreground">
          {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </span>
      </button>

      {open && (
        <div className="px-4 sm:px-5 pb-4 space-y-3">
          {/* Vitals */}
          {visit.vitalSign && (
            <div className="rounded-xl bg-muted/40 border border-border p-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Vitals</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {visit.vitalSign.bpSystolic && visit.vitalSign.bpDiastolic && (
                  <div>
                    <p className="text-muted-foreground">BP</p>
                    <p className="font-semibold text-foreground">{visit.vitalSign.bpSystolic}/{visit.vitalSign.bpDiastolic} <span className="font-normal text-muted-foreground">mmHg</span></p>
                  </div>
                )}
                {visit.vitalSign.heartRate && (
                  <div>
                    <p className="text-muted-foreground">Heart Rate</p>
                    <p className="font-semibold text-foreground">{visit.vitalSign.heartRate} <span className="font-normal text-muted-foreground">bpm</span></p>
                  </div>
                )}
                {visit.vitalSign.temperature && (
                  <div>
                    <p className="text-muted-foreground">Temp</p>
                    <p className="font-semibold text-foreground">{visit.vitalSign.temperature} <span className="font-normal text-muted-foreground">°C</span></p>
                  </div>
                )}
                {visit.vitalSign.weightKg && (
                  <div>
                    <p className="text-muted-foreground">Weight</p>
                    <p className="font-semibold text-foreground">{visit.vitalSign.weightKg} <span className="font-normal text-muted-foreground">kg</span></p>
                  </div>
                )}
                {visit.vitalSign.heightCm && (
                  <div>
                    <p className="text-muted-foreground">Height</p>
                    <p className="font-semibold text-foreground">{visit.vitalSign.heightCm} <span className="font-normal text-muted-foreground">cm</span></p>
                  </div>
                )}
                {visit.vitalSign.bmi && (
                  <div>
                    <p className="text-muted-foreground">BMI</p>
                    <p className="font-semibold text-foreground">{visit.vitalSign.bmi?.toFixed(1)}</p>
                  </div>
                )}
              </div>
              {visit.vitalSign.chiefComplaint && (
                <p className="mt-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Complaint:</span> {visit.vitalSign.chiefComplaint}
                </p>
              )}
              {visit.vitalSign.pcpDoctor && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  <span className="font-medium text-foreground">Doctor:</span> {visit.vitalSign.pcpDoctor}
                </p>
              )}
            </div>
          )}

          {/* Services */}
          {visit.transactions.length > 0 && (
            <div className="rounded-xl bg-muted/40 border border-border overflow-hidden">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide px-3 py-2 border-b border-border">
                Services
              </p>
              <div className="divide-y divide-border/50">
                {visit.transactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-2 px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{t.descriptionItemPrice ?? "—"}</p>
                      {t.groupItemMaster && (
                        <p className="text-[10px] text-muted-foreground">{t.groupItemMaster}</p>
                      )}
                    </div>
                    {t.amountItemPrice != null && (
                      <span className="text-xs font-semibold text-foreground shrink-0">
                        ₱{t.amountItemPrice.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function EmployeeDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: rawCode } = use(params);
  const code = decodeURIComponent(rawCode);
  const { log: auditLog } = useAuditLog();
  const auditLogged = useRef(false);

  const { data, isLoading, isError, error } = useQuery<DetailResponse>({
    queryKey: ["hr-employee", code],
    queryFn: () =>
      fetch(`/api/hr/employees/${encodeURIComponent(code)}`).then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      }),
    retry: false,
  });

  // Log audit event once when employee data loads
  useEffect(() => {
    if (data?.patient && !auditLogged.current) {
      auditLogged.current = true;
      auditLog("VIEW_EMPLOYEE", `Viewed record of ${data.patient.fullName ?? code}`, code);
    }
  }, [data, code, auditLog]);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-32 rounded-2xl bg-muted" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="h-64 rounded-2xl bg-muted" />
          <div className="lg:col-span-2 h-64 rounded-2xl bg-muted" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-center py-16">
        <User className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground font-medium">Employee not found</p>
        <p className="text-xs text-muted-foreground/60 mt-1">{String(error ?? "")}</p>
        <Link
          href="/hr/employees"
          className="text-violet-500 dark:text-violet-400 text-sm hover:underline mt-3 inline-block"
        >
          ← Back to Employees
        </Link>
      </div>
    );
  }

  const { patient, visits } = data;
  const age = getAge(patient.dob);
  const initials = ((patient.firstName?.[0] ?? "") + (patient.lastName?.[0] ?? "")).toUpperCase() || "?";

  const apeVisits = visits.filter((v) => v.isApe);
  const latestApe = apeVisits[0] ?? null;
  const latestVitals = visits.find((v) => v.vitalSign)?.vitalSign ?? null;

  // Derive company from visits
  const company = visits.find((v) => v.company)?.company ?? null;

  // APE compliance: last APE within 12 months?
  const apeDate = latestApe?.dateTime ? new Date(latestApe.dateTime) : null;
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
  const apeCompliant = apeDate ? apeDate >= twelveMonthsAgo : false;

  return (
    <div className="space-y-5">

      {/* Back */}
      <Link
        href="/hr/employees"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Employees
      </Link>

      {/* Hero */}
      <div
        className="relative overflow-hidden rounded-2xl p-4 sm:p-6 border border-border"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: "radial-gradient(rgba(0,212,255,0.15) 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />
        <div className="relative z-10 flex items-start sm:items-center gap-4">
          <div className="flex h-12 w-12 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 border border-white/20 text-base sm:text-xl font-bold text-white shadow-[0_0_20px_rgba(0,212,255,0.2)]">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                patient.isActive
                  ? "text-emerald-300 bg-emerald-500/20 border-emerald-400/40"
                  : "text-white/60 bg-white/10 border-white/20"
              )}>
                {patient.isActive
                  ? <><UserCheck className="h-2.5 w-2.5" /> Active</>
                  : <><UserX className="h-2.5 w-2.5" /> Inactive</>}
              </span>
              {apeCompliant ? (
                <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold text-emerald-300 bg-emerald-500/20 border-emerald-400/40">
                  <CheckCircle2 className="h-2.5 w-2.5" /> APE Compliant
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold text-amber-300 bg-amber-500/20 border-amber-400/40">
                  <Clock className="h-2.5 w-2.5" /> APE Overdue
                </span>
              )}
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-white leading-tight truncate">
              {patient.fullName ?? "Unknown"}
            </h1>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-xs sm:text-sm text-white/75">
              <span className="font-mono">{patient.code}</span>
              {patient.gender && <><span className="text-white/40">·</span><span>{patient.gender}</span></>}
              {age != null && <><span className="text-white/40">·</span><span>{age} yrs old</span></>}
              {company && <><span className="text-white/40">·</span><span>{company}</span></>}
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
            <span className="text-xs text-white/60">Total Visits</span>
            <span className="text-3xl font-bold text-white">{visits.length}</span>
            <span className="text-[10px] text-white/50">{apeVisits.length} APE</span>
          </div>
        </div>
      </div>

      {/* APE Summary */}
      {latestApe && (
        <div className="rounded-2xl bg-card border border-border p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-violet-500" />
            Annual Physical Exam Summary
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-muted/50 p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Latest APE</p>
              <p className="text-sm font-bold text-foreground mt-1">{fmt(latestApe.dateTime)}</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Status</p>
              <p className={cn("text-sm font-bold mt-1", apeCompliant ? "text-success" : "text-warning")}>
                {apeCompliant ? "Compliant" : "Overdue"}
              </p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total APE Visits</p>
              <p className="text-sm font-bold text-foreground mt-1">{apeVisits.length}</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Queue Code</p>
              <p className="text-sm font-bold text-foreground font-mono mt-1">{latestApe.code ?? "—"}</p>
            </div>
          </div>

          {latestApe.transactions.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Services from Latest APE</p>
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="divide-y divide-border/50">
                  {latestApe.transactions.map((t) => (
                    <div key={t.id} className="flex items-center justify-between gap-2 px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground">{t.descriptionItemPrice ?? "—"}</p>
                        {t.groupItemMaster && (
                          <p className="text-[10px] text-muted-foreground">{t.groupItemMaster}</p>
                        )}
                      </div>
                      {t.amountItemPrice != null && (
                        <span className="text-xs font-semibold text-foreground shrink-0">
                          ₱{t.amountItemPrice.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Info + Vitals */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-card border border-border p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" /> Personal Info
            </h2>
            <InfoRow label="Full Name" value={patient.fullName} />
            <InfoRow label="Date of Birth" value={fmt(patient.dob, { dateStyle: "medium" })} icon={Calendar} />
            <InfoRow label="Gender" value={patient.gender} />
            <InfoRow label="Email" value={patient.email} icon={Mail} />
            <InfoRow label="Mobile" value={patient.mobile} icon={Phone} />
            <InfoRow label="Contact No." value={patient.contactNo} icon={Phone} />
            <InfoRow label="Address" value={patient.fullAddress} icon={MapPin} />
            {company && <InfoRow label="Company" value={company} icon={Building2} />}
            <InfoRow label="Last Visit" value={fmt(patient.lastVisit, { dateStyle: "medium" })} icon={Calendar} />
          </div>

          {/* Latest Vitals */}
          {latestVitals && (
            <div className="rounded-2xl bg-card border border-border p-5">
              <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" /> Latest Vitals
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {latestVitals.bpSystolic && latestVitals.bpDiastolic && (
                  <div className="rounded-xl bg-muted/50 p-3 col-span-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Heart className="h-3 w-3 text-danger" />
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Blood Pressure</span>
                    </div>
                    <p className="text-sm font-bold text-foreground">
                      {latestVitals.bpSystolic}/{latestVitals.bpDiastolic}{" "}
                      <span className="text-xs font-normal text-muted-foreground">mmHg</span>
                    </p>
                  </div>
                )}
                {latestVitals.heartRate && (
                  <div className="rounded-xl bg-muted/50 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Activity className="h-3 w-3 text-violet-500 dark:text-violet-400" />
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Heart Rate</span>
                    </div>
                    <p className="text-sm font-bold text-foreground">
                      {latestVitals.heartRate} <span className="text-xs font-normal text-muted-foreground">bpm</span>
                    </p>
                  </div>
                )}
                {latestVitals.temperature && (
                  <div className="rounded-xl bg-muted/50 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Thermometer className="h-3 w-3 text-warning" />
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Temp</span>
                    </div>
                    <p className="text-sm font-bold text-foreground">
                      {latestVitals.temperature} <span className="text-xs font-normal text-muted-foreground">°C</span>
                    </p>
                  </div>
                )}
                {latestVitals.weightKg && (
                  <div className="rounded-xl bg-muted/50 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Scale className="h-3 w-3 text-info" />
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Weight</span>
                    </div>
                    <p className="text-sm font-bold text-foreground">
                      {latestVitals.weightKg} <span className="text-xs font-normal text-muted-foreground">kg</span>
                    </p>
                  </div>
                )}
                {latestVitals.heightCm && (
                  <div className="rounded-xl bg-muted/50 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Ruler className="h-3 w-3 text-success" />
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Height</span>
                    </div>
                    <p className="text-sm font-bold text-foreground">
                      {latestVitals.heightCm} <span className="text-xs font-normal text-muted-foreground">cm</span>
                    </p>
                  </div>
                )}
                {latestVitals.bmi && (
                  <div className="rounded-xl bg-muted/50 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Activity className="h-3 w-3 text-purple-500" />
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">BMI</span>
                    </div>
                    <p className="text-sm font-bold text-foreground">{latestVitals.bmi?.toFixed(1)}</p>
                  </div>
                )}
              </div>
              {latestVitals.chiefComplaint && (
                <div className="mt-3 rounded-xl bg-muted/50 p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Chief Complaint</p>
                  <p className="text-xs text-foreground">{latestVitals.chiefComplaint}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Visit History */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl bg-card border border-border overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Visit History</h2>
              <span className="ml-auto text-xs text-muted-foreground">{visits.length} visits · {apeVisits.length} APE</span>
            </div>
            <div className="divide-y divide-border max-h-150 overflow-y-auto scrollbar-thin">
              {visits.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-muted-foreground">No visits found</div>
              ) : (
                visits.map((v) => <VisitRow key={v.id} visit={v} />)
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
