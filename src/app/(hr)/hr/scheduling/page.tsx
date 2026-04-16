"use client";

import { useState, useRef } from "react";
import { CalendarClock, Upload, FileSpreadsheet, X, Check, Loader2, CalendarDays, Users, MapPin } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const BRANCHES = [
  "Main Branch",
  "Makati Branch",
  "Pasig Branch",
  "Quezon City Branch",
  "Mandaluyong Branch",
];

type ScheduledGroup = { date: string; branch: string; count: number; packageType: string; status: string };

// Sample upcoming scheduled PEs — in production this would come from an API
const SAMPLE_SCHEDULED: ScheduledGroup[] = [
  { date: "2026-04-15", branch: "Makati Branch",         count: 12, packageType: "Annual PE", status: "confirmed" },
  { date: "2026-04-22", branch: "Pasig Branch",          count:  8, packageType: "Annual PE", status: "confirmed" },
  { date: "2026-05-05", branch: "Quezon City Branch",    count: 20, packageType: "Annual PE", status: "confirmed" },
];

export default function BulkSchedulingPage() {
  const [file, setFile]         = useState<File | null>(null);
  const [branch, setBranch]     = useState(BRANCHES[0]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo]     = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith(".xlsx") || f.name.endsWith(".xls") || f.name.endsWith(".csv"))) {
      setFile(f);
    } else {
      toast.error("Only .xlsx, .xls, or .csv files are accepted");
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  }

  async function handleSubmit() {
    if (!file || !dateFrom || !dateTo) {
      toast.error("Please upload a file and select a date range");
      return;
    }
    setSubmitting(true);
    try {
      // Simulate processing
      await new Promise((r) => setTimeout(r, 1500));
      toast.success(`Bulk PE scheduling request submitted for ${file.name}`);
      setFile(null);
      setDateFrom("");
      setDateTo("");
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      toast.error("Failed to submit scheduling request");
    } finally {
      setSubmitting(false);
    }
  }

  function downloadTemplate() {
    const csv = "Employee ID,Employee Name,Email,Mobile\nEMP-001,Juan Dela Cruz,juan@example.com,09171234567\nEMP-002,Maria Santos,maria@example.com,09181234567";
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "pe-scheduling-template.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Bulk PE Scheduling</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Upload an employee list to schedule Annual Physical Exams in bulk</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload form */}
        <div className="space-y-5">
          <div className="rounded-2xl bg-card border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Upload Employee List</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Accepted formats: .xlsx, .xls, .csv</p>
            </div>
            <div className="p-5 space-y-5">
              {/* Drag & Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={cn(
                  "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-10 px-4 cursor-pointer transition-colors",
                  isDragging ? "border-violet-500 bg-violet-500/5" : "border-border hover:border-violet-400 hover:bg-muted/30"
                )}
              >
                <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />
                {file ? (
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-300/40">
                      <FileSpreadsheet className="h-5 w-5 text-violet-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setFile(null); if (fileRef.current) fileRef.current.value = ""; }}
                      className="ml-2 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground/40 mb-3" />
                    <p className="text-sm font-medium text-foreground">Drop your file here</p>
                    <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
                  </>
                )}
              </div>

              <button
                onClick={downloadTemplate}
                className="w-full h-9 rounded-xl border border-border bg-card text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" /> Download Template (.csv)
              </button>

              {/* Branch selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Preferred NWD Branch</label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-background text-sm px-3 text-foreground"
                >
                  {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              {/* Date range */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">From</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full h-10 rounded-xl border border-border bg-background text-sm px-3 text-foreground"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">To</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    min={dateFrom}
                    className="w-full h-10 rounded-xl border border-border bg-background text-sm px-3 text-foreground"
                  />
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!file || !dateFrom || !dateTo || submitting}
                className="w-full h-11 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity"
                style={{ background: "var(--gradient-hero)" }}
              >
                {submitting
                  ? <><Loader2 className="h-4 w-4 animate-spin" />Processing…</>
                  : <><CalendarClock className="h-4 w-4" />Book Bulk Appointments</>
                }
              </button>
            </div>
          </div>

          {/* Required columns */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs font-semibold text-foreground mb-2">Required Columns</p>
            <div className="grid grid-cols-2 gap-1.5">
              {["Employee ID", "Employee Name", "Email", "Mobile"].map((col) => (
                <div key={col} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Check className="h-3 w-3 text-green-500 shrink-0" /> {col}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming scheduled PEs */}
        <div>
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-widest mb-4">Upcoming Scheduled PEs</h2>
          {SAMPLE_SCHEDULED.length === 0 ? (
            <div className="rounded-2xl bg-card border border-border p-8 text-center">
              <CalendarDays className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No upcoming bulk PEs scheduled</p>
            </div>
          ) : (
            <div className="space-y-3">
              {SAMPLE_SCHEDULED.map((s, i) => (
                <div key={i} className="rounded-2xl bg-card border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{s.packageType}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarDays className="h-3 w-3" />
                          {new Date(s.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" /> {s.branch}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" /> {s.count} employees
                        </span>
                      </div>
                    </div>
                    <span className="shrink-0 text-[10px] font-semibold text-green-600 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-full px-2 py-0.5">
                      Confirmed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
