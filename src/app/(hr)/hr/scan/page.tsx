"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "next-themes";
import { QrCode, X, CheckCircle, Clock, Receipt, RefreshCw, FlaskConical, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

type PaymentItem = {
  id: number;
  description: string;
  amount: number;
  group: string | null;
};

type ScanResult = {
  queueCode: string;
  patientName: string;
  patientCode: string;
  date: string;
  totalAmount: number;
  paymentType: string;
  status: "paid" | "pending";
  items: PaymentItem[];
};

// ---------- Modal ----------
function ResultModal({ result, onClose }: { result: ScanResult; onClose: () => void }) {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  const bg        = dark ? "#18181b" : "#ffffff";
  const bgAlt     = dark ? "#27272a" : "#f9fafb";
  const border    = dark ? "#3f3f46" : "#e5e7eb";
  const text      = dark ? "#f4f4f5" : "#111827";
  const textMuted = dark ? "#a1a1aa" : "#6b7280";
  const rowDiv    = dark ? "#3f3f46" : "#f3f4f6";

  const paid = result.status === "paid";

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: bg, border: `1px solid ${border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Status banner */}
        <div className={cn(
          "flex items-center gap-3 px-5 py-4",
          paid ? "bg-green-500" : "bg-amber-400"
        )}>
          {paid
            ? <CheckCircle className="h-6 w-6 text-white shrink-0" />
            : <Clock className="h-6 w-6 text-white shrink-0" />
          }
          <div className="flex-1">
            <p className="text-white font-bold text-base">{paid ? "PAYMENT CONFIRMED" : "PAYMENT PENDING"}</p>
            <p className="text-white/80 text-xs">{result.queueCode}</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Patient info */}
        <div className="px-5 py-4 space-y-1" style={{ borderBottom: `1px solid ${border}`, backgroundColor: bgAlt }}>
          <p className="text-sm font-semibold" style={{ color: text }}>{result.patientName}</p>
          <p className="text-xs" style={{ color: textMuted }}>{result.patientCode}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs" style={{ color: textMuted }}>
            <span>{result.date ? new Date(result.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}</span>
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={result.paymentType.startsWith("HMO")
                ? { backgroundColor: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }
                : { backgroundColor: dark ? "#3f3f46" : "#f3f4f6", color: textMuted, border: `1px solid ${border}` }}
            >
              {result.paymentType}
            </span>
          </div>
        </div>

        {/* Line items */}
        <div className="overflow-y-auto max-h-60" style={{ backgroundColor: bg }}>
          {result.items.length === 0 ? (
            <p className="px-5 py-6 text-center text-xs" style={{ color: textMuted }}>No line items.</p>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0" style={{ backgroundColor: bg, borderBottom: `1px solid ${border}` }}>
                <tr>
                  <th className="text-left px-5 py-2.5 font-semibold" style={{ color: textMuted }}>Service</th>
                  <th className="text-left px-3 py-2.5 font-semibold hidden sm:table-cell" style={{ color: textMuted }}>Group</th>
                  <th className="text-right px-5 py-2.5 font-semibold" style={{ color: textMuted }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((item, i) => (
                  <tr key={item.id} style={{ borderTop: i > 0 ? `1px solid ${rowDiv}` : undefined }}>
                    <td className="px-5 py-2.5" style={{ color: text }}>{item.description}</td>
                    <td className="px-3 py-2.5 hidden sm:table-cell" style={{ color: textMuted }}>{item.group ?? "—"}</td>
                    <td className="px-5 py-2.5 text-right font-medium" style={{ color: text }}>
                      ₱{item.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Total */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderTop: `1px solid ${border}`, backgroundColor: bgAlt }}>
          <span className="text-sm font-semibold" style={{ color: text }}>Total Amount</span>
          <span className="text-xl font-bold" style={{ color: paid ? "#15803d" : "#a16207" }}>
            ₱{result.totalAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ---------- Scanner ----------
export default function HrScanPage() {
  const scannerRef   = useRef<InstanceType<typeof import("html5-qrcode").Html5Qrcode> | null>(null);
  const uploadRef    = useRef<HTMLInputElement>(null);
  const [scanning, setScanning]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [result, setResult]       = useState<ScanResult | null>(null);
  const [lastCode, setLastCode]   = useState<string | null>(null);

  async function startScanner() {
    setError(null);
    const { Html5Qrcode } = await import("html5-qrcode");
    const qr = new Html5Qrcode("qr-reader");
    scannerRef.current = qr;

    try {
      await qr.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          if (decodedText === lastCode) return;
          setLastCode(decodedText);
          await stopScanner();
          await lookupPayment(decodedText);
        },
        () => {}
      );
      setScanning(true);
    } catch {
      setError("Camera access denied or not available.");
    }
  }

  async function stopScanner() {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  }

  async function lookupPayment(raw: string) {
    setLoading(true);
    setError(null);
    try {
      // QR may be JSON or plain queue code
      let queueCode = raw.trim();
      try {
        const parsed = JSON.parse(raw);
        if (parsed.queueCode) queueCode = parsed.queueCode;
      } catch {}

      const res = await fetch(`/api/hr/payments/scan?queueCode=${encodeURIComponent(queueCode)}`);
      if (!res.ok) throw new Error("Payment record not found for this QR code.");
      const data = await res.json();
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to look up payment.");
    } finally {
      setLoading(false);
    }
  }

  async function scanFromFile(file: File) {
    setError(null);
    setLoading(true);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const qr = new Html5Qrcode("qr-reader-file");
      const result = await qr.scanFileV2(file, false);
      await lookupPayment(result.decodedText);
    } catch {
      setError("No QR code found in the uploaded image.");
      setLoading(false);
    }
  }

  useEffect(() => {
    return () => { stopScanner(); };
  }, []);

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      {result && <ResultModal result={result} onClose={() => { setResult(null); setLastCode(null); }} />}

      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <QrCode className="h-5 w-5 text-violet-500" /> QR Payment Scanner
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Scan a patient&apos;s payment QR to view their payment details and status.
        </p>
      </div>

      {/* Scanner box */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="relative bg-black aspect-square max-h-80 flex items-center justify-center">
          <div id="qr-reader" className="w-full h-full" />
          {!scanning && !loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70">
              <QrCode className="h-12 w-12 text-white/40" />
              <p className="text-white/60 text-sm">Camera off</p>
            </div>
          )}
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70">
              <FlaskConical className="h-10 w-10 text-violet-400 animate-pulse" />
              <p className="text-white/70 text-sm">Looking up payment…</p>
            </div>
          )}
          {/* Corner guides */}
          {scanning && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-56 h-56">
                <span className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-violet-400 rounded-tl-lg" />
                <span className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-violet-400 rounded-tr-lg" />
                <span className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-violet-400 rounded-bl-lg" />
                <span className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-violet-400 rounded-br-lg" />
                {/* Scan line */}
                <span className="absolute left-1 right-1 h-0.5 bg-violet-400/70 top-1/2 animate-pulse" />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 space-y-3">
          {error && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive flex items-center gap-2">
              <X className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          {/* Hidden file input for QR upload */}
          <input
            ref={uploadRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) { scanFromFile(file); e.target.value = ""; }
            }}
          />
          {/* Hidden element required by html5-qrcode file scanner */}
          <div id="qr-reader-file" className="hidden" />

          <div className="flex gap-2">
            {!scanning ? (
              <button
                onClick={startScanner}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                <QrCode className="h-4 w-4" /> Start Camera
              </button>
            ) : (
              <button
                onClick={stopScanner}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-sm font-medium transition-colors border border-border"
              >
                <X className="h-4 w-4" /> Stop Scanner
              </button>
            )}
            <button
              onClick={() => uploadRef.current?.click()}
              disabled={loading || scanning}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-sm font-medium transition-colors border border-border disabled:opacity-50"
              title="Upload QR image"
            >
              <Upload className="h-4 w-4" />
            </button>
            {(error || lastCode) && (
              <button
                onClick={() => { setError(null); setLastCode(null); startScanner(); }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-sm font-medium transition-colors border border-border"
                title="Scan again"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Manual input fallback */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Or enter queue code manually…"
              className="flex-1 h-9 rounded-xl border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.currentTarget.value.trim()) {
                  lookupPayment(e.currentTarget.value.trim());
                  e.currentTarget.value = "";
                }
              }}
            />
            <button
              className="px-3 h-9 rounded-xl bg-muted border border-border text-muted-foreground hover:bg-muted/80 transition-colors"
              onClick={(e) => {
                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                if (input.value.trim()) { lookupPayment(input.value.trim()); input.value = ""; }
              }}
            >
              <Receipt className="h-4 w-4" />
            </button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Use camera, upload a QR image <Upload className="inline h-3 w-3" />, or type the queue code manually.
          </p>
        </div>
      </div>
    </div>
  );
}
