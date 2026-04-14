import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

// Maps both old and new client format headers to internal keys
const HEADER_MAP: Record<string, string> = {
  // New client format (Masterlist_rev1.2)
  "employee id":          "employeeId",
  "*last name":           "lastName",
  "last name":            "lastName",
  "lastname":             "lastName",
  "*first name":          "firstName",
  "first name":           "firstName",
  "firstname":            "firstName",
  "suffix":               "suffix",
  "middle name":          "middleName",
  "middlename":           "middleName",
  "*date of birth":       "dob",
  "date of birth":        "dob",
  "*gender":              "gender",
  "gender":               "gender",
  "contact number":       "contact",
  "contact":              "contact",
  // Old format fallbacks
  "patient id":           "patientCode",
  "patient code":         "patientCode",
  "code":                 "patientCode",
  "email":                "email",
  "mobile":               "mobile",
  "mobile no":            "mobile",
  "dob":                  "dob",
  "birthdate":            "dob",
};

function normalizeHeader(h: string): string {
  const lower = h.toLowerCase().trim().replace(/\s*\n[\s\S]*/g, "").trim(); // strip multi-line formatting
  return HEADER_MAP[lower] ?? lower;
}

function parseDob(raw: unknown): Date | undefined {
  if (raw == null || raw === "") return undefined;
  // Excel serial number
  if (typeof raw === "number") {
    const date = XLSX.SSF.parse_date_code(raw);
    if (date) return new Date(Date.UTC(date.y, date.m - 1, date.d));
  }
  // String date
  const s = String(raw).trim();
  if (!s) return undefined;
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) return parsed;
  return undefined;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const role = (session.user as { role?: string }).role;
    if (role !== "HR" && role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const formData = await req.formData();
    const file     = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    // 10 MB limit
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum size is 10 MB." }, { status: 413 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["xlsx", "xls", "csv"].includes(ext)) {
      return NextResponse.json({ error: "File must be .xlsx, .xls, or .csv" }, { status: 400 });
    }

    const buffer   = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "buffer" });

    // Prefer "Patient Info" sheet, fall back to first sheet
    const sheetName = workbook.SheetNames.includes("Patient Info")
      ? "Patient Info"
      : workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Read as array-of-arrays so we can find the real header row
    const rawAoa = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });

    // Find header row (contains "Last Name" or "First Name")
    let headerIdx = 0;
    for (let i = 0; i < Math.min(rawAoa.length, 6); i++) {
      const row = rawAoa[i] as unknown[];
      if (row.some((c) => typeof c === "string" && (c.includes("Last Name") || c.includes("First Name")))) {
        headerIdx = i;
        break;
      }
    }

    const headers = (rawAoa[headerIdx] as unknown[]).map((h) =>
      typeof h === "string" ? normalizeHeader(h) : String(h ?? "")
    );

    // Detect APE package column indices (columns that contain "ape" in original header)
    const originalHeaders = rawAoa[headerIdx] as unknown[];
    const apeIndices: number[] = [];
    originalHeaders.forEach((h, i) => {
      if (typeof h === "string" && h.toLowerCase().includes("ape")) {
        apeIndices.push(i);
      }
    });

    const dataRows = rawAoa.slice(headerIdx + 1);

    if (dataRows.length === 0) {
      return NextResponse.json({ error: "File has no data rows after header" }, { status: 400 });
    }

    const results = { inserted: 0, updated: 0, skipped: 0, errors: [] as string[] };

    for (let i = 0; i < dataRows.length; i++) {
      const rowArr = dataRows[i] as unknown[];
      const rowNum = headerIdx + i + 2; // 1-indexed, +1 for header

      // Skip blank rows
      if (!rowArr || rowArr.every((c) => c == null || c === "")) continue;

      // Map row values to named fields
      const row: Record<string, unknown> = {};
      headers.forEach((key, idx) => { row[key] = rowArr[idx]; });

      const lastName  = String(row["lastName"]  ?? "").trim();
      const firstName = String(row["firstName"] ?? "").trim();
      const gender    = String(row["gender"]    ?? "").trim();
      const contact    = String(row["contact"]    ?? "").trim();
      const employeeId = String(row["employeeId"] ?? "").trim();

      // Legacy fields (if present)
      const patientCode = String(row["patientCode"] ?? "").trim();
      const email       = String(row["email"]       ?? "").trim();
      const mobile      = String(row["mobile"]      ?? contact).trim();

      if (!lastName || !firstName) {
        results.errors.push(`Row ${rowNum}: Missing required fields (Last Name, First Name)`);
        results.skipped++;
        continue;
      }

      const dob = parseDob(row["dob"]);
      if (!dob) {
        results.errors.push(`Row ${rowNum}: Invalid or missing Date of Birth`);
        results.skipped++;
        continue;
      }

      // Build a patient code: use explicit patientCode, or employeeId, or skip if none
      const resolvedCode = patientCode || employeeId || null;

      try {
        if (resolvedCode) {
          // Try to match by patient code
          const existing = await prisma.portalUser.findFirst({
            where: { patientCode: resolvedCode },
          });

          if (existing) {
            await prisma.portalUser.update({
              where: { id: existing.id },
              data: {
                firstName: firstName || existing.firstName,
                lastName:  lastName  || existing.lastName,

                ...(dob ? { dob } : {}),
                ...(gender && (gender.toLowerCase() === "male" || gender.toLowerCase() === "female")
                  ? { gender: gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase() }
                  : {}),
                ...(mobile && mobile !== existing.mobile ? { mobile } : {}),
                ...(email  && email  !== existing.email  ? { email  } : {}),
              },
            });
            results.updated++;
          } else {
            // New patient — requires email or mobile for portal account
            if (!email && !mobile) {
              results.errors.push(`Row ${rowNum}: New patient "${resolvedCode}" requires at least email or mobile for portal access`);
              results.skipped++;
              continue;
            }

            if (email) {
              const emailExists = await prisma.portalUser.findUnique({ where: { email } });
              if (emailExists) {
                results.errors.push(`Row ${rowNum}: Email "${email}" already in use`);
                results.skipped++;
                continue;
              }
            }
            if (mobile) {
              const mobileExists = await prisma.portalUser.findUnique({ where: { mobile } });
              if (mobileExists) {
                results.errors.push(`Row ${rowNum}: Mobile "${mobile}" already in use`);
                results.skipped++;
                continue;
              }
            }

            await prisma.portalUser.create({
              data: {
                patientCode: resolvedCode,
                firstName,
                lastName,
                email:    email  || `${resolvedCode}@nwdi.local`,
                mobile:   mobile || resolvedCode,
                dob,
                password: resolvedCode,
                role:     "PATIENT",
                isVerified: true,
                isActive:   true,
                ...(gender && (gender.toLowerCase() === "male" || gender.toLowerCase() === "female")
                  ? { gender: gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase() }
                  : {}),
              },
            });
            results.inserted++;
          }
        } else {
          // No code — try to match by name + DOB
          const existing = await prisma.portalUser.findFirst({
            where: {
              firstName: { equals: firstName, mode: "insensitive" },
              lastName:  { equals: lastName,  mode: "insensitive" },
              dob,
            },
          });

          if (existing) {
            await prisma.portalUser.update({
              where: { id: existing.id },
              data: {
                ...(dob    ? { dob }    : {}),
                ...(mobile && mobile !== existing.mobile ? { mobile } : {}),
                ...(email  && email  !== existing.email  ? { email  } : {}),
                ...(gender && (gender.toLowerCase() === "male" || gender.toLowerCase() === "female")
                  ? { gender: gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase() }
                  : {}),
              },
            });
            results.updated++;
          } else {
            results.errors.push(
              `Row ${rowNum}: No Employee ID found for "${firstName} ${lastName}" — skipping (cannot create new patient without ID)`
            );
            results.skipped++;
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        results.errors.push(`Row ${rowNum}: ${msg}`);
        results.skipped++;
      }
    }

    return NextResponse.json({
      message: `Import complete. ${results.inserted} inserted, ${results.updated} updated, ${results.skipped} skipped.`,
      results,
    });
  } catch (error) {
    console.error("[MASTERLIST_UPLOAD]", error);
    return NextResponse.json({ error: "Failed to process file" }, { status: 500 });
  }
}
