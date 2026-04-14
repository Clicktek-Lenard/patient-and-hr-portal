"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

type Patient = {
  id: string;
  code: string | null;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  middleName: string | null;
  gender: string | null;
  dob: string;
  email: string | null;
  mobile: string | null;
  contactNo: string | null;
  fullAddress: string | null;
  isActive: number;
  pictureLink: string | null;
  lastVisit: string | null;
};

type Visit = {
  id: string;
  code: string | null;
  date: string;
  dateTime: string;
  status: number;
  patientType: string | null;
  transactions: Array<{
    id: string;
    descriptionItemPrice: string | null;
    amountItemPrice: string | null;
    transactionType: string | null;
    groupItemMaster: string | null;
    status: number;
  }>;
  vitalSign: {
    bpSystolic: number | null;
    bpDiastolic: number | null;
    heartRate: number | null;
    temperature: number | null;
    weightKg: number | null;
    heightCm: number | null;
    bmi: number | null;
    chiefComplaint: string | null;
    pcpDoctor: string | null;
    createdAt: string;
  } | null;
};

type DetailResponse = { patient: Patient; visits: Visit[] };

function resolveVisitStatus(code: number): { label: string; color: string } {
  if ([100, 201].includes(code))                             return { label: "Waiting",     color: "text-warning bg-warning-bg border-warning-border" };
  if ([202, 210, 212, 250, 260, 280, 300].includes(code))   return { label: "In Progress", color: "text-info bg-info-bg border-info-border" };
  if (code === 203)                                          return { label: "On Hold",     color: "text-muted-foreground bg-muted border-border" };
  if (code === 900)                                          return { label: "Exited",      color: "text-muted-foreground bg-muted border-border" };
  if (code >= 360)                                           return { label: "Complete",    color: "text-success bg-success-bg border-success-border" };
  return                                                            { label: "Unknown",     color: "text-muted-foreground bg-muted border-border" };
}

function getAge(dob: string) {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
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

export default function EmployeeDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);

  const { data, isLoading, isError } = useQuery<DetailResponse>({
    queryKey: ["hr-employee", code],
    queryFn: () => fetch(`/api/hr/employees/${code}`).then((r) => {
      if (!r.ok) throw new Error("Not found");
      return r.json();
    }),
  });

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
        <p className="text-muted-foreground">Patient not found</p>
        <Link href="/hr/employees" className="text-violet-500 dark:text-violet-400 text-sm hover:underline mt-2 inline-block">
          ← Back to employees
        </Link>
      </div>
    );
  }

  const { patient, visits } = data;
  const age = getAge(patient.dob);
  const initials = ((patient.firstName?.[0] ?? "") + (patient.lastName?.[0] ?? "")).toUpperCase() || "?";

  // Latest vitals
  const latestVitals = visits.find((v) => v.vitalSign)?.vitalSign;

  return (
    <div className="space-y-5">

      {/* Back */}
      <Link
        href="/hr/employees"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Employees
      </Link>

      {/* Patient hero */}
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
            <div className="flex items-center gap-2 mb-1">
              <span className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                patient.isActive
                  ? "text-emerald-300 bg-emerald-500/20 border-emerald-400/40"
                  : "text-white/60 bg-white/10 border-white/20"
              )}>
                {patient.isActive ? <><UserCheck className="h-2.5 w-2.5" /> Active</> : <><UserX className="h-2.5 w-2.5" /> Inactive</>}
              </span>
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-white leading-tight truncate">{patient.fullName ?? "Unknown"}</h1>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-xs sm:text-sm text-white/75">
              <span className="font-mono">{patient.code}</span>
              {patient.gender && <><span className="text-white/40">·</span><span>{patient.gender}</span></>}
              <span className="text-white/40">·</span><span>{age} yrs old</span>
              <span className="text-white/40 sm:hidden">·</span>
              <span className="sm:hidden">{visits.length} visits</span>
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
            <span className="text-xs text-white/60">Total Visits</span>
            <span className="text-3xl font-bold text-white">{visits.length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Info card */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-card border border-border p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" /> Personal Info
            </h2>
            <InfoRow label="Full Name" value={patient.fullName} />
            <InfoRow label="Date of Birth" value={patient.dob ? new Date(patient.dob).toLocaleDateString() : null} icon={Calendar} />
            <InfoRow label="Gender" value={patient.gender} />
            <InfoRow label="Email" value={patient.email} icon={Mail} />
            <InfoRow label="Mobile" value={patient.mobile} icon={Phone} />
            <InfoRow label="Contact No." value={patient.contactNo} icon={Phone} />
            <InfoRow label="Address" value={patient.fullAddress} icon={MapPin} />
            <InfoRow label="Last Visit" value={patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : null} icon={Calendar} />
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
                    <p className="text-sm font-bold text-foreground">{latestVitals.bpSystolic}/{latestVitals.bpDiastolic} <span className="text-xs font-normal text-muted-foreground">mmHg</span></p>
                  </div>
                )}
                {latestVitals.heartRate && (
                  <div className="rounded-xl bg-muted/50 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Activity className="h-3 w-3 text-violet-500 dark:text-violet-400" />
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Heart Rate</span>
                    </div>
                    <p className="text-sm font-bold text-foreground">{latestVitals.heartRate} <span className="text-xs font-normal text-muted-foreground">bpm</span></p>
                  </div>
                )}
                {latestVitals.temperature && (
                  <div className="rounded-xl bg-muted/50 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Thermometer className="h-3 w-3 text-warning" />
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Temp</span>
                    </div>
                    <p className="text-sm font-bold text-foreground">{latestVitals.temperature} <span className="text-xs font-normal text-muted-foreground">°C</span></p>
                  </div>
                )}
                {latestVitals.weightKg && (
                  <div className="rounded-xl bg-muted/50 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Scale className="h-3 w-3 text-info" />
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Weight</span>
                    </div>
                    <p className="text-sm font-bold text-foreground">{latestVitals.weightKg} <span className="text-xs font-normal text-muted-foreground">kg</span></p>
                  </div>
                )}
                {latestVitals.heightCm && (
                  <div className="rounded-xl bg-muted/50 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Ruler className="h-3 w-3 text-success" />
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Height</span>
                    </div>
                    <p className="text-sm font-bold text-foreground">{latestVitals.heightCm} <span className="text-xs font-normal text-muted-foreground">cm</span></p>
                  </div>
                )}
                {latestVitals.bmi && (
                  <div className="rounded-xl bg-muted/50 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Activity className="h-3 w-3 text-purple" />
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">BMI</span>
                    </div>
                    <p className="text-sm font-bold text-foreground">{latestVitals.bmi}</p>
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

        {/* Visits + results + payments */}
        <div className="lg:col-span-2 space-y-4">

          {/* Visit history */}
          <div className="rounded-2xl bg-card border border-border overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Visit History</h2>
              <span className="ml-auto text-xs text-muted-foreground">{visits.length} visits</span>
            </div>
            <div className="divide-y divide-border max-h-64 overflow-y-auto scrollbar-thin">
              {visits.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-muted-foreground">No visits found</div>
              ) : (
                visits.map((v) => {
                  const statusInfo = resolveVisitStatus(v.status ?? 0);
                  return (
                    <div key={String(v.id)} className="flex items-start sm:items-center gap-3 px-4 sm:px-5 py-3 hover:bg-muted/40 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-sm font-medium text-foreground font-mono">{v.code ?? "—"}</span>
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                          {v.transactions.length > 0 && (
                            <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">{v.transactions.length} items</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {new Date(v.dateTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          {" · "}{v.patientType ?? "General"}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
