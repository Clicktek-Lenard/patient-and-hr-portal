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
  const page   = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit  = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "25")));
  const search = searchParams.get("search")?.trim() ?? "";
  const status = searchParams.get("status") ?? "";

  // Base filter: employee visits only (has at least one corporate transaction)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    transactions: { some: EMPLOYEE_TRANSACTION_WHERE },
  };

  if (search) {
    where.OR = [
      { qFullName:  { contains: search, mode: "insensitive" } },
      { qFirstName: { contains: search, mode: "insensitive" } },
      { qLastName:  { contains: search, mode: "insensitive" } },
      { code:       { contains: search, mode: "insensitive" } },
    ];
  }
  if (status !== "") where.status = parseInt(status);

  const [total, visits] = await Promise.all([
    cmsPrisma.cmsQueue.count({ where }),
    cmsPrisma.cmsQueue.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { dateTime: "desc" },
      select: {
        id: true,
        code: true,
        qFullName: true,
        qGender: true,
        agePatient: true,
        status: true,
        patientType: true,
        date: true,
        dateTime: true,
        idPatient: true,
      },
    }),
  ]);

  const patientIds = [...new Set(visits.map((v) => v.idPatient).filter(Boolean))];
  const patients = patientIds.length
    ? await cmsPrisma.cmsPatient.findMany({
        where: { id: { in: patientIds as bigint[] } },
        select: { id: true, code: true },
      })
    : [];
  const patientMap = new Map(patients.map((p) => [p.id.toString(), p]));

  const data = visits.map((v) => {
    const patient = v.idPatient ? patientMap.get(v.idPatient.toString()) : null;
    return {
      id:          Number(v.id),
      code:        v.code,
      qFullName:   v.qFullName,
      qGender:     v.qGender,
      agePatient:  v.agePatient,
      status:      v.status,
      patientType: v.patientType,
      date:        v.date,
      dateTime:    v.dateTime,
      idPatient:   Number(v.idPatient),
      patientCode: patient?.code ?? null,
    };
  });

  return NextResponse.json({
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
