import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { cmsPrisma } from "@/lib/prisma-cms";
import { prisma } from "@/lib/prisma";
import { EMPLOYEE_TRANSACTION_WHERE } from "@/lib/hr-employee-filter";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  if (role !== "HR" && role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = req.nextUrl;
  const rawPage     = parseInt(searchParams.get("page")     ?? "1",  10);
  const rawPageSize = parseInt(searchParams.get("pageSize") ?? searchParams.get("limit") ?? "20", 10);
  const page        = isNaN(rawPage)     || rawPage     < 1 ? 1  : rawPage;
  const pageSize    = isNaN(rawPageSize) || rawPageSize < 1 ? 20 : Math.min(100, rawPageSize);
  const search   = searchParams.get("search")?.trim() ?? "";
  const gender   = searchParams.get("gender") ?? "";
  const active   = searchParams.get("active") ?? "";

  // Base clause: employees only — patients with corporate transactions OR manually added (EMP- code)
  const andClauses: object[] = [
    {
      OR: [
        {
          queues: {
            some: {
              transactions: { some: EMPLOYEE_TRANSACTION_WHERE },
            },
          },
        },
        { code: { startsWith: "EMP-" } },
      ],
    },
  ];

  if (search) {
    andClauses.push({
      OR: [
        { fullName:   { contains: search, mode: "insensitive" } },
        { firstName:  { contains: search, mode: "insensitive" } },
        { lastName:   { contains: search, mode: "insensitive" } },
        { middleName: { contains: search, mode: "insensitive" } },
        { code:       { contains: search, mode: "insensitive" } },
        { email:      { contains: search, mode: "insensitive" } },
        { mobile:     { contains: search, mode: "insensitive" } },
      ],
    });
  }

  if (gender) andClauses.push({ gender: { equals: gender, mode: "insensitive" } });
  if (active !== "") andClauses.push({ isActive: active === "1" ? 1 : 0 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { AND: andClauses };

  const [total, patients] = await Promise.all([
    cmsPrisma.cmsPatient.count({ where }),
    cmsPrisma.cmsPatient.findMany({
      where,
      skip:    (page - 1) * pageSize,
      take:    pageSize,
      orderBy: { lastVisit: "desc" },
      select: {
        id:          true,
        code:        true,
        fullName:    true,
        firstName:   true,
        lastName:    true,
        middleName:  true,
        gender:      true,
        dob:         true,
        email:       true,
        mobile:      true,
        contactNo:   true,
        fullAddress: true,
        isActive:    true,
        lastVisit:   true,
        pictureLink: true,
        queues: {
          select: {
            transactions: {
              where:  EMPLOYEE_TRANSACTION_WHERE,
              select: { nameCompany: true },
              take:   1,
            },
          },
          take: 3,
          orderBy: { date: "desc" },
        },
      },
    }),
  ]);

  // Fetch portal-side departments for the loaded patients (manual overrides)
  const codes = patients.map((p) => p.code).filter((c): c is string => !!c);
  const portalDeptMap = new Map<string, string>();
  if (codes.length > 0) {
    const depts = await prisma.portalEmployeeDepartment.findMany({
      where: { patientCode: { in: codes } },
      select: { patientCode: true, department: true },
    });
    for (const d of depts) portalDeptMap.set(d.patientCode, d.department);
  }

  // Fetch CMS corporate_employees.department for loaded patients
  const patientIds = patients.map((p) => p.id);
  const cmsDeptMap = new Map<string, string>();
  if (patientIds.length > 0) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const corpEmpModel = (cmsPrisma as any).corporateEmployee;
      if (corpEmpModel?.findMany) {
        const corpEmps = await corpEmpModel.findMany({
          where: { patientId: { in: patientIds }, department: { not: null } },
          select: { patientId: true, department: true },
          orderBy: { id: "desc" },
        });
        for (const ce of corpEmps as { patientId: bigint | null; department: string | null }[]) {
          if (ce.patientId && ce.department && !cmsDeptMap.has(ce.patientId.toString())) {
            cmsDeptMap.set(ce.patientId.toString(), ce.department);
          }
        }
      }
    } catch (err) {
      console.warn("[HR_EMPLOYEES] corporate_employees lookup skipped:", err);
    }
  }

  const data = patients.map((p) => {
    // Priority: portal-saved override → CMS corporate_employees.department → first non-DEFAULT company from queues
    let company: string | null = p.code ? (portalDeptMap.get(p.code) ?? null) : null;
    if (!company) company = cmsDeptMap.get(p.id.toString()) ?? null;
    if (!company) {
      for (const q of p.queues) {
        const c = q.transactions[0]?.nameCompany ?? null;
        if (c && !c.toUpperCase().includes("DEFAULT")) { company = c; break; }
      }
    }
    const { queues: _q, ...rest } = p;
    return { ...rest, id: Number(p.id), company };
  });

  return NextResponse.json({
    data,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}

// ── POST: add a new employee ─────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const role = (session.user as { role?: string }).role;
    if (role !== "HR" && role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { firstName, lastName, dob, department, gender, mobile, isActive } = body as {
      firstName: string;
      lastName: string;
      dob: string;
      department?: string;
      gender?: string;
      mobile?: string;
      isActive?: number;
    };

    if (!firstName?.trim() || !lastName?.trim() || !dob) {
      return NextResponse.json({ error: "First name, last name, and date of birth are required" }, { status: 400 });
    }

    // Generate next ID — find max existing ID and increment
    const maxResult = await cmsPrisma.cmsPatient.aggregate({ _max: { id: true } });
    const maxId = maxResult._max.id;
    const nextId = maxId ? maxId + BigInt(1) : BigInt(1);

    // Generate a patient code like EMP-YYYYMMDD-XXXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const code = `EMP-${dateStr}-${String(nextId).padStart(5, "0")}`;

    const fullName = `${lastName.trim()}, ${firstName.trim()}`;

    const patient = await cmsPrisma.cmsPatient.create({
      data: {
        id: nextId,
        code,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        fullName,
        gender: gender?.trim() || null,
        dob: new Date(dob),
        mobile: mobile?.trim() || null,
        isActive: isActive ?? 1,
        uploaddatetime: new Date(),
      },
    });

    // Write to CMS corporate_employees so department shows in the same
    // column as existing employees (dept lookup uses this table).
    if (department?.trim()) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const corpEmpModel = (cmsPrisma as any).corporateEmployee;
        if (corpEmpModel?.create) {
          await corpEmpModel.create({
            data: {
              lastName: lastName.trim(),
              firstName: firstName.trim(),
              gender: gender?.trim() || null,
              dob: new Date(dob),
              department: department.trim(),
              patientId: patient.id,
              status: "REGISTERED",
            },
          });
        }
      } catch (err) {
        console.warn("[POST_EMPLOYEE] corporate_employees write skipped:", err);
      }

      // Also keep a portal-side copy as fallback/override
      if (patient.code) {
        await prisma.portalEmployeeDepartment.upsert({
          where: { patientCode: patient.code },
          update: { department: department.trim() },
          create: { patientCode: patient.code, department: department.trim() },
        });
      }
    }

    return NextResponse.json({
      data: {
        id: Number(patient.id),
        code: patient.code,
        fullName: patient.fullName,
        department: department || null,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("[POST_EMPLOYEE]", error);
    return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
  }
}

// ── PATCH: update an employee's department ───────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const role = (session.user as { role?: string }).role;
    if (role !== "HR" && role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { code, department } = body as { code: string; department: string };

    if (!code?.trim()) {
      return NextResponse.json({ error: "Employee code is required" }, { status: 400 });
    }

    const patient = await cmsPrisma.cmsPatient.findFirst({
      where: { code: code.trim() },
      select: { id: true, code: true, firstName: true, lastName: true, gender: true, dob: true },
    });
    if (!patient) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

    const deptValue = department?.trim() ?? "";

    // Portal-side override (always set, even to empty to clear)
    if (patient.code) {
      if (deptValue) {
        await prisma.portalEmployeeDepartment.upsert({
          where: { patientCode: patient.code },
          update: { department: deptValue },
          create: { patientCode: patient.code, department: deptValue },
        });
      } else {
        await prisma.portalEmployeeDepartment.deleteMany({ where: { patientCode: patient.code } });
      }
    }

    // CMS corporate_employees write
    if (deptValue) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const model = (cmsPrisma as any).corporateEmployee;
        if (model?.findFirst && model?.create && model?.update) {
          const existing = await model.findFirst({ where: { patientId: patient.id } });
          if (existing) {
            await model.update({ where: { id: existing.id }, data: { department: deptValue } });
          } else {
            await model.create({
              data: {
                lastName: patient.lastName ?? "",
                firstName: patient.firstName ?? "",
                gender: patient.gender ?? null,
                dob: patient.dob ?? null,
                department: deptValue,
                patientId: patient.id,
                status: "REGISTERED",
              },
            });
          }
        }
      } catch (err) {
        console.warn("[PATCH_EMPLOYEE] corporate_employees write skipped:", err);
      }
    }

    return NextResponse.json({ data: { code: patient.code, department: deptValue || null } });
  } catch (error) {
    console.error("[PATCH_EMPLOYEE]", error);
    return NextResponse.json({ error: "Failed to update employee" }, { status: 500 });
  }
}
