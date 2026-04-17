"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { Shield, Clock, AlertTriangle, FlaskConical, Download, Loader2 } from "lucide-react";
import Image from "next/image";

type SharedResult = {
  queueCode: string;
  resultLabel: string | null;
  recipient: string | null;
  expiresAt: string;
  viewCount: number;
  queue: {
    code: string | null;
    accessionNo: string | null;
    date: string;
    patientName: string | null;
    patientType: string | null;
    agePatient: number | null;
    gender: string | null;
    doctor: string | null;
    parameters: { name: string; value: string; group?: string }[];
  };
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
}
function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function SharedResultPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [result, setResult] = useState<SharedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch(`/api/shared/${token}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) setError(json.error);
        else setResult(json.data);
      })
      .catch(() => setError("Failed to load result"))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleDownload() {
    if (!result) return;
    setDownloading(true);
    try {
      const res = await fetch(`/api/results/${result.queueCode}/pdf`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `result-${result.queueCode}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silent
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm text-gray-500">Loading shared result…</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isRevoked  = error.toLowerCase().includes("revoked");
    const isExpired  = error.toLowerCase().includes("expired");
    const isNotFound = error.toLowerCase().includes("not found");

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full rounded-2xl bg-white border border-gray-200 shadow-sm p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 border border-red-200 mx-auto mb-4">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-1">
            {isRevoked ? "Link Revoked" : isExpired ? "Link Expired" : isNotFound ? "Not Found" : "Error"}
          </h1>
          <p className="text-sm text-gray-500 mb-4">
            {isRevoked
              ? "The owner has revoked access to this result."
              : isExpired
              ? "This share link has expired. Please request a new link from the patient."
              : "This link is invalid or the result could not be found."}
          </p>
          <p className="text-xs text-gray-400">
            For questions, contact the patient directly.
          </p>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const q = result.queue;
  // Group parameters by group name
  const grouped: Record<string, typeof q.parameters> = {};
  for (const p of q.parameters) {
    const g = p.group ?? "Services";
    if (!grouped[g]) grouped[g] = [];
    grouped[g].push(p);
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Header card */}
        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
          {/* Brand bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100"
            style={{ background: "#1006A0" }}
          >
            <div className="flex items-center gap-3">
              <Image src="/nwdi-logo.png" alt="NWDI" width={80} height={24} className="object-contain brightness-0 invert" />
              <span className="text-xs text-white/60 font-medium">Patient Portal</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/70 text-xs">
              <Shield className="h-3 w-3" />
              Secure Share
            </div>
          </div>

          <div className="px-5 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FlaskConical className="h-4 w-4 text-indigo-600" />
                  <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Lab Result</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900 leading-tight">
                  {result.resultLabel ?? q.code ?? "Visit Result"}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">{formatDateTime(q.date)}</p>
              </div>
              {result.recipient && (
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-400">Shared with</p>
                  <p className="text-sm font-semibold text-gray-700">{result.recipient}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Patient info */}
        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-5">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Patient Information</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Name</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">{q.patientName ?? "—"}</p>
            </div>
            {(q.agePatient || q.gender) && (
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Age / Sex</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                  {[q.agePatient ? `${q.agePatient} yrs` : null, q.gender].filter(Boolean).join(" / ") || "—"}
                </p>
              </div>
            )}
            {q.patientType && (
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Type</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{q.patientType}</p>
              </div>
            )}
            {q.doctor && (
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Physician</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{q.doctor}</p>
              </div>
            )}
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Accession No.</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">{q.accessionNo ?? q.code ?? "—"}</p>
            </div>
          </div>
        </div>

        {/* Services / Parameters */}
        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Services</h2>
          </div>
          {Object.entries(grouped).map(([groupName, items]) => (
            <div key={groupName}>
              {Object.keys(grouped).length > 1 && (
                <div className="px-5 py-2 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{groupName}</p>
                </div>
              )}
              {items.map((p, i) => (
                <div key={i} className={`flex items-center justify-between px-5 py-3 border-b border-gray-50 ${i % 2 === 0 ? "" : "bg-gray-50/50"}`}>
                  <p className="text-sm text-gray-900">{p.name}</p>
                  <p className="text-sm font-semibold text-gray-700 font-data">{p.value}</p>
                </div>
              ))}
            </div>
          ))}
          {q.parameters.length === 0 && (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-gray-400">No services on record</p>
            </div>
          )}
        </div>

        {/* Download button */}
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="w-full flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-opacity hover:opacity-90"
          style={{ background: "#1006A0" }}
        >
          {downloading
            ? <><Loader2 className="h-4 w-4 animate-spin" />Generating PDF…</>
            : <><Download className="h-4 w-4" />Download as PDF</>
          }
        </button>

        {/* Security footer */}
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 flex items-start gap-3">
          <Clock className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
          <div className="text-xs text-gray-400 space-y-0.5">
            <p>This link expires on <span className="font-medium text-gray-600">{formatDate(result.expiresAt)}</span></p>
            <p>Viewed {result.viewCount} time{result.viewCount !== 1 ? "s" : ""} · Access is logged for security</p>
          </div>
        </div>
      </div>
    </div>
  );
}
