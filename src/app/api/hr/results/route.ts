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
  const page   = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
  const limit  = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "25")));
  const search = searchParams.get("search")?.trim() ?? "";

  // Filter: employee transactions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    ...EMPLOYEE_TRANSACTION_WHERE,
  };

  if (search) {
    where.OR = [
      { descriptionItemPrice: { contains: search, mode: "insensitive" } },
      { codeItemPrice:        { contains: search, mode: "insensitive" } },
      { groupItemMaster:      { contains: search, mode: "insensitive" } },
    ];
  }

  const [total, transactions] = await Promise.all([
    cmsPrisma.cmsTransaction.count({ where }),
    cmsPrisma.cmsTransaction.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { date: "desc" },
      select: {
        id: true,
        idQueue: true,
        codeItemPrice: true,
        descriptionItemPrice: true,
        groupItemMaster: true,
        transactionType: true,
        amountItemPrice: true,
        nameDoctor: true,
        nameCompany: true,
        status: true,
        date: true,
      },
    }),
  ]);

  const queueIds = [...new Set(transactions.map((t) => t.idQueue).filter(Boolean))];
  const queues = queueIds.length
    ? await cmsPrisma.cmsQueue.findMany({
        where: { id: { in: queueIds as bigint[] } },
        select: { id: true, code: true, qFullName: true, dateTime: true, idPatient: true },
      })
    : [];

  const patientIds = [...new Set(queues.map((q) => q.idPatient).filter(Boolean))];
  const patients = patientIds.length
    ? await cmsPrisma.cmsPatient.findMany({
        where: { id: { in: patientIds as bigint[] } },
        select: { id: true, code: true, fullName: true },
      })
    : [];

  const queueMap   = new Map(queues.map((q) => [q.id.toString(), q]));
  const patientMap = new Map(patients.map((p) => [p.id.toString(), p]));

  const data = transactions.map((t) => {
    const queue   = t.idQueue ? queueMap.get(t.idQueue.toString()) : null;
    const patient = queue?.idPatient ? patientMap.get(queue.idPatient.toString()) : null;
    return {
      id:           Number(t.id),
      queueCode:    queue?.code ?? "—",
      patientCode:  patient?.code ?? "—",
      patientName:  patient?.fullName ?? queue?.qFullName ?? "—",
      date:         queue?.dateTime?.toISOString() ?? t.date?.toISOString() ?? null,
      itemCode:     t.codeItemPrice ?? "",
      description:  t.descriptionItemPrice ?? "",
      group:        t.groupItemMaster ?? "",
      type:         t.transactionType ?? "",
      amount:       Number(t.amountItemPrice ?? 0),
      doctor:       t.nameDoctor ?? null,
      company:      t.nameCompany ?? null,
      status:       t.status === 1 ? "released" : "pending",
    };
  });

  return NextResponse.json({
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
