import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { cmsPrisma } from "@/lib/prisma-cms";
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

  const data = patients.map((p) => {
    // Pick the first non-null company from recent queues
    let company: string | null = null;
    for (const q of p.queues) {
      const c = q.transactions[0]?.nameCompany ?? null;
      if (c) { company = c; break; }
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
    const { firstName, lastName, dob, department, gender } = body as {
      firstName: string;
      lastName: string;
      dob: string;
      department?: string;
      gender?: string;
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
        isActive: 1,
      },
    });

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
