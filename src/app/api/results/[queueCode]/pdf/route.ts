export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cmsPrisma } from "@/lib/prisma-cms";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

// ── Colours ──────────────────────────────────────────────────────
const BLUE    = "#1a3a6b";
const LBLUE   = "#e8eef8";
const DBORDER = "#b8c9e8";
const GRAY    = "#6b7280";
const LGRAY   = "#f3f4f6";
const WHITE   = "#ffffff";
const WARN_BG = "#fef9c3";
const WARN_TXT = "#854d0e";

function formatDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}
function formatDateTime(d: Date | null | undefined): string {
  if (!d) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) +
    "  " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}
function formatCurrency(n: number): string {
  return n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function generateResultPdf(queue: {
  id: string;
  idPatient: string;
  code: string | null;
  dateTime: Date;
  qFullName: string | null;
  qFirstName: string | null;
  qLastName: string | null;
  qGender: string | null;
  qDob: Date | null;
  agePatient: number | null;
  patientType: string | null;
  accessionNo: string | null;
  status: number;
  inputBy: string | null;
  notes: string | null;
  patient: {
    code: string;
    fullName: string | null;
  };
  transactions: {
    id: string;
    codeItemPrice: string | null;
    descriptionItemPrice: string | null;
    amountItemPrice: string | null;
    groupItemMaster: string | null;
    transactionType: string | null;
    nameDoctor: string | null;
    nameCompany: string | null;
    status: number;
  }[];
}): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const PDFDocument = require("pdfkit");
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 0 });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W   = doc.page.width;   // 595
    const PAD = 40;
    const PW  = W - PAD * 2;

    const doctor  = queue.transactions.find((t) => t.nameDoctor)?.nameDoctor ?? null;
    const company = queue.transactions.find((t) => t.nameCompany)?.nameCompany ?? null;
    const total   = queue.transactions.reduce((s, t) => s + Number(t.amountItemPrice ?? 0), 0);
    const statusLabel = queue.status >= 400 ? "RELEASED / COMPLETE" : queue.status >= 300 ? "FOR RELEASE" : "IN PROGRESS";
    const statusColor = queue.status >= 400 ? "#166534" : queue.status >= 300 ? "#1e40af" : "#854d0e";
    const statusBg    = queue.status >= 400 ? "#dcfce7"  : queue.status >= 300 ? "#dbeafe"  : WARN_BG;
    const printDate   = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    // ── Header ────────────────────────────────────────────────────
    doc.rect(0, 0, W, 68).fill(BLUE);
    doc.fill(WHITE).font("Helvetica-Bold").fontSize(19).text("NEW WORLD DIAGNOSTICS, INC.", PAD, 16);
    doc.fill(WHITE).font("Helvetica").fontSize(8.5)
       .text("NWDI Medical Center  |  Tel: (02) 8-123-4567  |  www.nwdi.com.ph", PAD, 42);
    doc.fill(WHITE).font("Helvetica").fontSize(8)
       .text("Laboratory / APE Result Report", PAD, 56);

    // ── Report title bar ─────────────────────────────────────────
    doc.rect(0, 68, W, 24).fill("#dce8f8");
    doc.fill(BLUE).font("Helvetica-Bold").fontSize(10.5)
       .text("ANNUAL PHYSICAL EXAMINATION  —  RESULT REPORT", PAD, 78);

    // ── Patient info box ─────────────────────────────────────────
    const py = 102;
    doc.roundedRect(PAD, py, PW, 82, 5).fill(LBLUE).stroke(DBORDER);

    const gender = queue.qGender === "M" ? "Male" : queue.qGender === "F" ? "Female" : (queue.qGender ?? "—");

    doc.fill(BLUE).font("Helvetica-Bold").fontSize(7).text("PATIENT NAME", PAD+10, py+10);
    doc.fill("#111827").font("Helvetica-Bold").fontSize(13).text(queue.qFullName ?? "—", PAD+10, py+20, { width: 250 });

    const col2 = PAD + 310;
    doc.fill(BLUE).font("Helvetica-Bold").fontSize(7).text("PATIENT CODE", col2, py+10);
    doc.fill("#111827").font("Helvetica").fontSize(10).text(queue.patient.code, col2, py+22);

    doc.fill(BLUE).font("Helvetica-Bold").fontSize(7).text("DATE OF BIRTH", PAD+10, py+48);
    doc.fill("#374151").font("Helvetica").fontSize(9).text(formatDate(queue.qDob), PAD+10, py+58);

    doc.fill(BLUE).font("Helvetica-Bold").fontSize(7).text("AGE", PAD+130, py+48);
    doc.fill("#374151").font("Helvetica").fontSize(9).text(queue.agePatient ? `${queue.agePatient} yrs` : "—", PAD+130, py+58);

    doc.fill(BLUE).font("Helvetica-Bold").fontSize(7).text("GENDER", PAD+200, py+48);
    doc.fill("#374151").font("Helvetica").fontSize(9).text(gender, PAD+200, py+58);

    doc.fill(BLUE).font("Helvetica-Bold").fontSize(7).text("PATIENT TYPE", col2, py+48);
    doc.fill("#374151").font("Helvetica").fontSize(9).text(queue.patientType ?? "—", col2, py+58);

    // ── Visit meta row ────────────────────────────────────────────
    const vy = py + 82 + 6;
    doc.rect(PAD, vy, PW, 22).fill(LGRAY);
    const meta = [
      { label: "VISIT CODE",   value: queue.code ?? "—",              x: PAD+10  },
      { label: "DATE",         value: formatDateTime(queue.dateTime),  x: PAD+175 },
      { label: "ENCODED BY",   value: queue.inputBy ?? "—",           x: PAD+370 },
    ];
    meta.forEach(({ label, value, x }) => {
      doc.fill(GRAY).font("Helvetica-Bold").fontSize(6.5).text(label, x, vy+3);
      doc.fill("#111827").font("Helvetica").fontSize(8.5).text(value, x, vy+11);
    });
    if (queue.notes) {
      doc.fill(GRAY).font("Helvetica-Bold").fontSize(6.5).text("NOTES", PAD+10, vy+3 + 0);
    }

    // ── Services table ────────────────────────────────────────────
    const sy = vy + 22 + 12;
    doc.rect(PAD, sy, PW, 20).fill(BLUE);
    doc.fill(WHITE).font("Helvetica-Bold").fontSize(9).text("SERVICES / PROCEDURES ORDERED", PAD+10, sy+6);

    const thy = sy + 20;
    doc.rect(PAD, thy, PW, 16).fill("#d1ddf0");
    const cols = { code: PAD+10, desc: PAD+80, type: PAD+355, amount: PAD+445 };
    doc.fill(BLUE).font("Helvetica-Bold").fontSize(7.5);
    doc.text("CODE",         cols.code,   thy+5);
    doc.text("DESCRIPTION",  cols.desc,   thy+5);
    doc.text("TYPE",         cols.type,   thy+5);
    doc.text("AMOUNT (PHP)", cols.amount, thy+5);

    let ry = thy + 16;
    queue.transactions.forEach((t, i) => {
      const rowH = 18;
      doc.rect(PAD, ry, PW, rowH).fill(i % 2 === 0 ? WHITE : "#f5f8ff");
      doc.fill("#111827").font("Helvetica").fontSize(8.5);
      doc.text(t.codeItemPrice ?? "—",          cols.code,   ry+5, { width: 65, ellipsis: true });
      doc.text(t.descriptionItemPrice ?? "—",   cols.desc,   ry+5, { width: 265, ellipsis: true });
      doc.text(t.transactionType ?? "—",        cols.type,   ry+5, { width: 80 });
      doc.fill(BLUE).font("Helvetica-Bold")
         .text(formatCurrency(Number(t.amountItemPrice ?? 0)), cols.amount, ry+5, { width: 70, align: "right" });
      ry += rowH;
    });

    // Total row
    doc.rect(PAD, ry, PW, 22).fill(BLUE);
    doc.fill(WHITE).font("Helvetica-Bold").fontSize(9);
    doc.text("TOTAL AMOUNT", PAD+10, ry+7);
    doc.text(`PHP ${formatCurrency(total)}`, cols.amount, ry+7, { width: 70, align: "right" });
    ry += 22;

    // ── Physician ─────────────────────────────────────────────────
    ry += 14;
    doc.moveTo(PAD, ry).lineTo(PAD+PW, ry).lineWidth(0.5).stroke("#d1d5db");
    ry += 10;
    doc.fill(GRAY).font("Helvetica-Bold").fontSize(7).text("ORDERING PHYSICIAN", PAD, ry);
    ry += 11;
    doc.fill("#111827").font("Helvetica-Bold").fontSize(11)
       .text(doctor ? `Dr. ${doctor}` : "—", PAD, ry);
    ry += 15;
    if (company) {
      doc.fill(GRAY).font("Helvetica").fontSize(8.5).text(`Company: ${company}`, PAD, ry);
      ry += 14;
    }

    // ── Status badge ──────────────────────────────────────────────
    ry += 6;
    doc.roundedRect(PAD, ry, 160, 20, 4).fill(statusBg);
    doc.fill(statusColor).font("Helvetica-Bold").fontSize(8.5)
       .text(`● STATUS: ${statusLabel}`, PAD+8, ry+6, { width: 144 });
    ry += 32;

    // ── Notice ───────────────────────────────────────────────────
    doc.roundedRect(PAD, ry, PW, 40, 4).fill(WARN_BG).stroke("#f59e0b");
    doc.fill(WARN_TXT).font("Helvetica-Bold").fontSize(8).text("IMPORTANT NOTICE", PAD+10, ry+7);
    doc.fill(WARN_TXT).font("Helvetica").fontSize(7.5).text(
      "Actual laboratory result values are encoded by the laboratory staff and are available in the official printed report\nissued upon release of results. This document serves as a reference record of services ordered for this visit.",
      PAD+10, ry+18, { width: PW - 20 }
    );

    // ── Footer ───────────────────────────────────────────────────
    const FH = doc.page.height;
    doc.moveTo(0, FH - 50).lineTo(W, FH - 50).lineWidth(0.5).stroke("#d1d5db");
    doc.rect(0, FH - 49, W, 49).fill("#f9fafb");
    doc.fill(GRAY).font("Helvetica").fontSize(7)
       .text(`This document is computer-generated. Date Printed: ${printDate}`, PAD, FH-43)
       .text(`Queue: ${queue.code}  |  Patient Ref: ${queue.patient.code}  |  CONFIDENTIAL — For authorized recipient only.`, PAD, FH-33)
       .text("Results are valid only upon issuance of the official signed laboratory report by the attending physician.", PAD, FH-23);

    doc.end();
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ queueCode: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { queueCode } = await params;

    const queue = await cmsPrisma.cmsQueue.findFirst({
      where: { code: queueCode },
      include: {
        patient: { select: { code: true, fullName: true } },
        transactions: {
          where: { status: { not: 2 } },
          select: {
            id: true,
            codeItemPrice: true,
            descriptionItemPrice: true,
            amountItemPrice: true,
            groupItemMaster: true,
            transactionType: true,
            nameDoctor: true,
            nameCompany: true,
            status: true,
          },
        },
      },
    });

    if (!queue) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 });
    }

    // Verify ownership for patients
    const patientCode = session.user.patientCode;
    if (patientCode) {
      const cmsPatient = await cmsPrisma.cmsPatient.findUnique({
        where: { code: patientCode },
        select: { id: true },
      });
      if (!cmsPatient || queue.idPatient !== cmsPatient.id) {
        return NextResponse.json({ error: "Result not found" }, { status: 404 });
      }
    }

    // Prefer a stored CMS-generated PDF if available
    const localDir = process.env.CMS_PDF_LOCAL_DIR;
    let storedBuffer: Buffer | null = null;
    if (localDir) {
      const apeDir = path.join(localDir, "APE", queueCode);
      if (fs.existsSync(apeDir) && fs.statSync(apeDir).isDirectory()) {
        const files = fs.readdirSync(apeDir).filter((f) => f.endsWith(".pdf"));
        const merged = files.find((f) => f.toLowerCase().includes("merged") || f.toLowerCase().includes("combined"));
        const chosen = merged ?? files[0];
        if (chosen) storedBuffer = fs.readFileSync(path.join(apeDir, chosen));
      }
      if (!storedBuffer) {
        const flat = path.join(localDir, `${queueCode}.pdf`);
        if (fs.existsSync(flat)) storedBuffer = fs.readFileSync(flat);
      }
    }

    const pdfBuffer = storedBuffer ?? await generateResultPdf({
      ...queue,
      id: queue.id.toString(),
      idPatient: queue.idPatient.toString(),
      transactions: queue.transactions.map((t) => ({
        ...t,
        id: t.id.toString(),
        amountItemPrice: t.amountItemPrice?.toString() ?? null,
      })),
    });

    // Audit log
    try {
      await prisma.portalResultAccessLog.create({
        data: {
          portalUserId: session.user.id,
          queueCode,
          accessType:  "LAB_PDF",
          filePath:    storedBuffer ? "stored" : "generated",
          ipAddress:   req.headers.get("x-forwarded-for")?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "unknown",
        },
      });
    } catch (logError) {
      console.error("[AUDIT_LOG]", logError);
    }

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="result-${queueCode}.pdf"`,
        "Content-Length":      String(pdfBuffer.length),
        "Cache-Control":       "private, no-store",
      },
    });
  } catch (error) {
    console.error("[GET_PDF]", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
