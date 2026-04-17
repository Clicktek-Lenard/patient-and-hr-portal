export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cmsPrisma } from "@/lib/prisma-cms";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

// ── Colours (matching screenshot: purple/indigo theme) ───────────
const PURPLE  = "#3730a3"; // indigo-800 — header bg
const PURPLE2 = "#4338ca"; // indigo-700 — section header
const LTPURP  = "#ede9fe"; // header right panel bg
const GRAY    = "#6b7280";
const DGRAY   = "#374151";
const LGRAY   = "#f9fafb";
const BGRAY   = "#f3f4f6";
const WHITE   = "#ffffff";
const BORDER  = "#e5e7eb";
const BLACK   = "#111827";

function formatDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}
function formatDateTime(d: Date | null | undefined): string {
  if (!d) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) +
    "  " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
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
    code: string | null;
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
    doc.on("end",  () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W   = doc.page.width;   // 595.28
    const H   = doc.page.height;  // 841.89
    const PAD = 36;
    const PW  = W - PAD * 2;

    const doctor  = queue.transactions.find((t) => t.nameDoctor)?.nameDoctor  ?? null;
    const ageSex  = [queue.agePatient ? `${queue.agePatient}` : null, queue.qGender].filter(Boolean).join(" / ") || "—";
    const printDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    // ── Header split: left = clinic name, right = report title ───
    const HDR_H = 72;
    doc.rect(0, 0, W * 0.55, HDR_H).fill(WHITE);
    doc.rect(W * 0.55, 0, W * 0.45, HDR_H).fill(LTPURP);

    // Left — clinic name
    doc.fill(PURPLE).font("Helvetica-Bold").fontSize(15)
       .text("Baesa", PAD, 14, { width: W * 0.5 });
    doc.fill(DGRAY).font("Helvetica").fontSize(7.5)
       .text("Units 4 & 5 Olympia Commercial Plaza, 131 Quirino Highway Baesa, Quezon City", PAD, 32, { width: W * 0.5 });
    doc.fill(DGRAY).font("Helvetica").fontSize(7.5)
       .text("TIN: 007-896-694-00001", PAD, 42, { width: W * 0.5 });

    // Right — report type + accession
    const rx = W * 0.55 + 14;
    doc.fill(PURPLE).font("Helvetica-Bold").fontSize(14)
       .text("LABORATORY RESULT", rx, 10, { width: W * 0.42 });
    doc.fill(DGRAY).font("Helvetica").fontSize(8)
       .text(`Accession No: ${queue.accessionNo ?? queue.code ?? "—"}`, rx, 34);
    doc.fill(DGRAY).font("Helvetica").fontSize(8)
       .text(`Date: ${formatDateTime(queue.dateTime)}`, rx, 46);

    // ── Divider ───────────────────────────────────────────────────
    doc.moveTo(0, HDR_H).lineTo(W, HDR_H).lineWidth(1.5).stroke(PURPLE);

    // ── Patient info grid ─────────────────────────────────────────
    let y = HDR_H + 10;
    const CELL_H = 36;

    // Row 1: Patient Name | DOB | Age/Sex
    const c1w = PW * 0.45;
    const c2w = PW * 0.30;
    const c3w = PW * 0.25;
    const c1x = PAD, c2x = PAD + c1w + 6, c3x = PAD + c1w + c2w + 12;

    const drawInfoCell = (label: string, value: string, x: number, cy: number, w: number) => {
      doc.roundedRect(x, cy, w, CELL_H, 3).fill(BGRAY).stroke(BORDER);
      doc.fill(GRAY).font("Helvetica").fontSize(6.5).text(label, x+7, cy+5, { width: w-14 });
      doc.fill(BLACK).font("Helvetica-Bold").fontSize(9.5).text(value, x+7, cy+15, { width: w-14, ellipsis: true });
    };

    drawInfoCell("PATIENT NAME", queue.qFullName ?? "—", c1x, y, c1w);
    drawInfoCell("DATE OF BIRTH", formatDate(queue.qDob), c2x, y, c2w);
    drawInfoCell("AGE / SEX", ageSex, c3x, y, c3w);

    y += CELL_H + 6;

    // Row 2: Referring Physician | Patient Type | Queue No
    drawInfoCell("REFERRING PHYSICIAN", doctor ?? "—", c1x, y, c1w);
    drawInfoCell("PATIENT TYPE", queue.patientType ?? "OUT-PATIENT", c2x, y, c2w);
    drawInfoCell("QUEUE NO.", queue.code ?? "—", c3x, y, c3w);

    y += CELL_H + 14;

    // ── APE section header ────────────────────────────────────────
    doc.rect(PAD, y, PW, 20).fill(PURPLE2);
    doc.fill(WHITE).font("Helvetica-Bold").fontSize(9)
       .text("APE", PAD+10, y+6);
    y += 20;

    // ── Table header ──────────────────────────────────────────────
    const TH_H = 18;
    doc.rect(PAD, y, PW, TH_H).fill(BGRAY).stroke(BORDER);
    const tc = {
      test:   PAD + 6,
      result: PAD + PW * 0.52,
      unit:   PAD + PW * 0.65,
      range:  PAD + PW * 0.78,
      flag:   PAD + PW * 0.93,
    };
    doc.fill(DGRAY).font("Helvetica-Bold").fontSize(8);
    doc.text("Test / Analyte", tc.test,   y+5, { width: PW * 0.50 });
    doc.text("Result",         tc.result, y+5, { width: PW * 0.12, align: "center" });
    doc.text("Unit",           tc.unit,   y+5, { width: PW * 0.12, align: "center" });
    doc.text("Normal Range",   tc.range,  y+5, { width: PW * 0.14, align: "center" });
    doc.text("Flag",           tc.flag,   y+5, { width: PW * 0.06, align: "center" });
    y += TH_H;

    // ── Table rows (one per transaction) ─────────────────────────
    queue.transactions.forEach((t, i) => {
      const ROW_H = 18;
      doc.rect(PAD, y, PW, ROW_H).fill(i % 2 === 0 ? WHITE : LGRAY).stroke(BORDER);
      doc.fill(BLACK).font("Helvetica").fontSize(8.5)
         .text(t.descriptionItemPrice ?? t.codeItemPrice ?? "—", tc.test, y+5, { width: PW * 0.50, ellipsis: true });
      // Result and range shown as "—" since actual values come from LIS
      doc.fill(DGRAY).font("Helvetica").fontSize(8.5)
         .text("—", tc.result, y+5, { width: PW * 0.12, align: "center" })
         .text("—", tc.unit,   y+5, { width: PW * 0.12, align: "center" })
         .text("—", tc.range,  y+5, { width: PW * 0.14, align: "center" })
         .text("",  tc.flag,   y+5, { width: PW * 0.06, align: "center" });
      y += ROW_H;
    });

    // ── Legend row ────────────────────────────────────────────────
    y += 8;
    doc.fill(PURPLE).font("Helvetica").fontSize(7).text(
      "H = Above Normal  ·  L = Below Normal  ·  C = Critical Value — Please contact physician immediately",
      PAD, y, { width: PW, align: "center" }
    );
    y += 16;

    // ── Signature block ───────────────────────────────────────────
    const sigY = Math.max(y + 30, H - 110);
    const sigW = PW * 0.45;

    doc.moveTo(PAD, sigY + 20).lineTo(PAD + sigW, sigY + 20).lineWidth(0.5).stroke("#9ca3af");
    doc.fill(GRAY).font("Helvetica").fontSize(8)
       .text("Medical Technologist", PAD, sigY + 24, { width: sigW, align: "center" });

    const sig2x = PAD + PW - sigW;
    doc.moveTo(sig2x, sigY + 20).lineTo(sig2x + sigW, sigY + 20).lineWidth(0.5).stroke("#9ca3af");
    doc.fill(GRAY).font("Helvetica").fontSize(8)
       .text("Pathologist / Laboratory Director", sig2x, sigY + 24, { width: sigW, align: "center" });

    // ── Footer ───────────────────────────────────────────────────
    doc.moveTo(0, H - 28).lineTo(W, H - 28).lineWidth(0.5).stroke(BORDER);
    doc.fill(GRAY).font("Helvetica").fontSize(6.5)
       .text(
         `Computer-generated document  ·  Date Printed: ${printDate}  ·  Queue: ${queue.code}  ·  CONFIDENTIAL`,
         PAD, H - 20, { width: PW, align: "center" }
       );

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
