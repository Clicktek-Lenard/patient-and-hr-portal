import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
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

  // Base clause: employees only — patients with at least one corporate transaction
  const andClauses: object[] = [
    {
      queues: {
        some: {
          transactions: { some: EMPLOYEE_TRANSACTION_WHERE },
        },
      },
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
      },
    }),
  ]);

  const data = patients.map((p) => ({ ...p, id: Number(p.id) }));

  return NextResponse.json({
    data,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}
