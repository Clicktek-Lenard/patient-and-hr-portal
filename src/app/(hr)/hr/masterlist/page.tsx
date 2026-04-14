"use client";

import { useState, useRef } from "react";
import {
  Upload, FileSpreadsheet, CheckCircle2,
  AlertCircle, X, Download, Loader2, Eye, ChevronLeft, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ImportResult = {
  message: string;
  results: {
    inserted: number;
    updated: number;
    skipped: number;
    errors: string[];
  };
};

type PreviewRow = {
  employeeId: string;
  lastName: string;
  firstName: string;
  suffix: string;
  middleName: string;
  dob: string;
  gender: string;
  contact: string;
  packages: Record<string, string>;
};

const REQUIRED_COLS = [
  { col: "Employee Id",    note: "Optional — company employee ID" },
  { col: "*Last Name",     note: "Required" },
  { col: "*First Name",    note: "Required" },
  { col: "Suffix",         note: "Optional (Jr., Sr., II, III, IV)" },
  { col: "Middle Name",    note: "Optional" },
  { col: "*Date of Birth", note: "Required — MM/DD/YYYY format" },
  { col: "*Gender",        note: "Required — Male or Female" },
  { col: "Contact Number", note: "Optional — mobile/phone" },
  { col: "APE Package",    note: "Optional — Yes / No per package column" },
];

export default function MasterlistPage() {
  const fileRef              = useRef<HTMLInputElement>(null);
  const [file, setFile]      = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<ImportResult | null>(null);
  const [preview, setPreview]   = useState<PreviewRow[]>([]);
  const [previewPage, setPreviewPage] = useState(1);
  const PREVIEW_SIZE = 10;

  function handleFileChange(f: File | null) {
    if (!f) return;
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext ?? "")) {
      toast.error("Only .xlsx, .xls, or .csv files are accepted.");
      return;
    }
    setFile(f);
    setResult(null);
    setPreview([]);
    parsePreview(f);
  }

  async function parsePreview(f: File) {
    try {
      const XLSX = await import("xlsx");
      const buf  = await f.arrayBuffer();
      const wb   = XLSX.read(buf, { type: "array" });
      // Use "Patient Info" sheet if exists, else first sheet
      const sheetName = wb.SheetNames.includes("Patient Info") ? "Patient Info" : wb.SheetNames[0];
      const ws   = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[][];

      // Find header row (row with "Last Name" or "First Name")
      let headerIdx = 0;
      for (let i = 0; i < Math.min(rows.length, 5); i++) {
        const row = rows[i] as string[];
        if (row.some((c) => typeof c === "string" && (c.includes("Last Name") || c.includes("First Name")))) {
          headerIdx = i;
          break;
        }
      }
      const headers = rows[headerIdx] as string[];

      // Find column indices
      const idx = (keyword: string) =>
        headers.findIndex((h) => typeof h === "string" && h.toLowerCase().includes(keyword.toLowerCase()));

      const idxEmpId   = idx("Employee Id");
      const idxLast    = idx("Last Name");
      const idxFirst   = idx("First Name");
      const idxSuffix  = idx("Suffix");
      const idxMiddle  = idx("Middle Name");
      const idxDob     = idx("Date of Birth");
      const idxGender  = idx("Gender");
      const idxContact = idx("Contact");

      // APE package columns (all after contact)
      const pkgCols: { label: string; idx: number }[] = [];
      headers.forEach((h, i) => {
        if (typeof h === "string" && h.toLowerCase().includes("ape")) {
          pkgCols.push({ label: h.split("\n")[0].trim().substring(0, 30), idx: i });
        }
      });

      const parsed: PreviewRow[] = [];
      for (let r = headerIdx + 1; r < rows.length; r++) {
        const row = rows[r] as (string | number | null)[];
        if (!row || row.every((c) => c == null || c === "")) continue;

        // Parse DOB (Excel serial or string)
        let dob = "";
        const rawDob = row[idxDob];
        if (typeof rawDob === "number") {
          const { utils } = await import("xlsx");
          dob = utils.SSF.format("MM/DD/YYYY", rawDob);
        } else if (rawDob) {
          dob = String(rawDob);
        }

        const packages: Record<string, string> = {};
        pkgCols.forEach((p) => {
          packages[p.label] = String(row[p.idx] ?? "").trim() || "—";
        });

        parsed.push({
          employeeId: String(row[idxEmpId] ?? "").trim(),
          lastName:   String(row[idxLast]  ?? "").trim(),
          firstName:  String(row[idxFirst] ?? "").trim(),
          suffix:     String(row[idxSuffix]  ?? "").trim(),
          middleName: String(row[idxMiddle]  ?? "").trim(),
          dob,
          gender:     String(row[idxGender]  ?? "").trim(),
          contact:    String(row[idxContact] ?? "").trim(),
          packages,
        });
      }
      setPreview(parsed);
      setPreviewPage(1);
      toast.success(`Preview loaded — ${parsed.length} records found`);
    } catch {
      toast.error("Could not parse file for preview.");
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFileChange(e.dataTransfer.files[0] ?? null);
  }

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res  = await fetch("/api/hr/masterlist", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Upload failed"); return; }
      setResult(data);
      toast.success(data.message);
    } catch {
      toast.error("An error occurred during upload.");
    } finally {
      setLoading(false);
    }
  }

  async function downloadTemplate() {
    const XLSX = await import("xlsx");
    const wb   = XLSX.utils.book_new();

    // --- Patient Info sheet ---
    const patientData = [
      ["All mark as (*) are required field, and mark as (blue) are field format"],
      [
        "Employee Id", "*Last Name", "*First Name", "Suffix", "Middle Name",
        "*Date of Birth\n(04/19/1978)\n(MM/DD/YYYY)",
        "*Gender\n(Male or Female)",
        "Contact Number\n(mobile/phone)",
        "APE Package I (Chest X-ray (PA View))",
        "APE Package I (HBsAG (Machine))",
      ],
      [null, "De la Cruz", "Juan", "Jr.", "Palaris", "04/19/1978", "Male", "09171234567", "Yes", "Yes"],
      [null, "Santos", "Maria", "", "Reyes", "06/22/1985", "Female", "09281234567", "Yes", "No"],
    ];
    const wsPatient = XLSX.utils.aoa_to_sheet(patientData);
    wsPatient["!cols"] = [
      { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 8 }, { wch: 18 },
      { wch: 20 }, { wch: 16 }, { wch: 20 }, { wch: 35 }, { wch: 25 },
    ];
    XLSX.utils.book_append_sheet(wb, wsPatient, "Patient Info");

    // --- Company Info sheet ---
    const companyData = [
      ["*Company Code", ""],
      ["Company Name", ""],
    ];
    const wsCompany = XLSX.utils.aoa_to_sheet(companyData);
    wsCompany["!cols"] = [{ wch: 16 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsCompany, "Company Info");

    // --- Sheet1 (dropdowns reference) ---
    const sheet1Data = [
      ["Sr.", "Male", "Yes"],
      ["Jr.", "Female", "No"],
      ["II"],
      ["III"],
      ["IV"],
    ];
    const wsSheet1 = XLSX.utils.aoa_to_sheet(sheet1Data);
    XLSX.utils.book_append_sheet(wb, wsSheet1, "Sheet1");

    XLSX.writeFile(wb, "Masterlist_Template.xlsx");
  }

  const totalPreviewPages = Math.ceil(preview.length / PREVIEW_SIZE);
  const previewSlice = preview.slice((previewPage - 1) * PREVIEW_SIZE, previewPage * PREVIEW_SIZE);
  const pkgKeys = preview.length > 0 ? Object.keys(preview[0].packages) : [];

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Masterlist Upload</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Upload the client masterlist Excel file to import or update employee records in bulk.
        </p>
      </div>

      {/* Template download */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Download Template</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Matches the client format — Patient Info, Company Info, and Sheet1 tabs.
          </p>
        </div>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 rounded-lg border border-violet-400/25 bg-violet-500/10 px-3 py-2 text-sm font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-500/20 transition-colors"
        >
          <Download className="h-4 w-4" /> Template
        </button>
      </div>

      {/* Required columns */}
      <div className="rounded-xl border border-border bg-card px-5 py-4 space-y-3">
        <p className="text-sm font-semibold text-foreground">Column Format</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {REQUIRED_COLS.map((c) => (
            <div key={c.col} className="rounded-lg bg-muted/40 px-3 py-2">
              <p className="text-xs font-semibold text-foreground">{c.col}</p>
              <p className="text-[10px] text-muted-foreground">{c.note}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Date of Birth must be in <strong>MM/DD/YYYY</strong> format. Gender must be <strong>Male</strong> or <strong>Female</strong>. APE package columns accept <strong>Yes</strong> or <strong>No</strong>.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 cursor-pointer transition-colors",
          dragging
            ? "border-violet-400 bg-violet-500/5"
            : file
            ? "border-success bg-success-bg"
            : "border-border bg-card hover:border-violet-400/50 hover:bg-muted/30"
        )}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <>
            <FileSpreadsheet className="h-10 w-10 text-success" />
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); setPreview([]); }}
              className="absolute top-3 right-3 rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <Upload className="h-10 w-10 text-muted-foreground/40" />
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">Drop file here or click to browse</p>
              <p className="text-xs text-muted-foreground">.xlsx, .xls, or .csv — max 10MB</p>
            </div>
          </>
        )}
      </div>

      {/* Preview table */}
      {preview.length > 0 && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border bg-muted/30">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">Preview</p>
            <span className="ml-auto text-xs text-muted-foreground">{preview.length} records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap">#</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap">Emp ID</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap">Last Name</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap">First Name</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap">Suffix</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap">Middle Name</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap">DOB</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap">Gender</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap">Contact</th>
                  {pkgKeys.map((k) => (
                    <th key={k} className="text-left px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap max-w-32 truncate" title={k}>
                      {k.length > 20 ? k.substring(0, 20) + "…" : k}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {previewSlice.map((row, i) => (
                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2 text-muted-foreground">{(previewPage - 1) * PREVIEW_SIZE + i + 1}</td>
                    <td className="px-3 py-2 text-muted-foreground font-mono">{row.employeeId || "—"}</td>
                    <td className="px-3 py-2 text-foreground font-medium">{row.lastName || "—"}</td>
                    <td className="px-3 py-2 text-foreground">{row.firstName || "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.suffix || "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.middleName || "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{row.dob || "—"}</td>
                    <td className="px-3 py-2">
                      <span className={cn(
                        "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                        row.gender.toLowerCase() === "male"
                          ? "text-info bg-info-bg border-info-border"
                          : row.gender.toLowerCase() === "female"
                          ? "text-violet-600 bg-violet-500/10 border-violet-400/30"
                          : "text-muted-foreground bg-muted border-border"
                      )}>
                        {row.gender || "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{row.contact || "—"}</td>
                    {pkgKeys.map((k) => (
                      <td key={k} className="px-3 py-2">
                        {row.packages[k] === "Yes"
                          ? <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold text-success bg-success-bg border border-success-border">Yes</span>
                          : row.packages[k] === "No"
                          ? <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold text-muted-foreground bg-muted border border-border">No</span>
                          : <span className="text-muted-foreground">—</span>
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPreviewPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
              <p className="text-xs text-muted-foreground">
                Page {previewPage} of {totalPreviewPages} · {preview.length} records
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPreviewPage((p) => p - 1)}
                  disabled={previewPage === 1}
                  className="h-7 w-7 flex items-center justify-center rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setPreviewPage((p) => p + 1)}
                  disabled={previewPage >= totalPreviewPages}
                  className="h-7 w-7 flex items-center justify-center rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload button */}
      {file && (
        <button
          onClick={handleUpload}
          disabled={loading}
          className="w-full h-11 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {loading
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
            : <><Upload className="h-4 w-4" /> Import Masterlist</>
          }
        </button>
      )}

      {/* Result */}
      {result && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-muted/30">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <p className="text-sm font-semibold text-foreground">{result.message}</p>
          </div>
          <div className="grid grid-cols-3 divide-x divide-border">
            {[
              { label: "Inserted", value: result.results.inserted, color: "text-success" },
              { label: "Updated",  value: result.results.updated,  color: "text-info" },
              { label: "Skipped",  value: result.results.skipped,  color: "text-warning" },
            ].map((s) => (
              <div key={s.label} className="px-5 py-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          {result.results.errors.length > 0 && (
            <div className="border-t border-border px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="h-4 w-4 text-warning" />
                <p className="text-sm font-semibold text-foreground">
                  {result.results.errors.length} row{result.results.errors.length > 1 ? "s" : ""} with issues
                </p>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
                {result.results.errors.map((err, i) => (
                  <p key={i} className="text-xs text-muted-foreground font-mono bg-muted/50 rounded px-3 py-1.5">
                    {err}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
