import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cmsPrisma } from "@/lib/prisma-cms";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  if (role !== "HR" && role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = req.nextUrl;
  const page   = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
  const limit  = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "25")));
  const search = searchParams.get("search")?.trim() ?? "";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const queueWhere: any = search ? {
    OR: [
      { code:      { contains: search, mode: "insensitive" } },
      { qFullName: { contains: search, mode: "insensitive" } },
    ],
  } : {};

  const [total, queues] = await Promise.all([
    cmsPrisma.cmsQueue.count({ where: queueWhere }),
    cmsPrisma.cmsQueue.findMany({
      where: queueWhere,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { dateTime: "desc" },
      select: {
        id: true,
        code: true,
        qFullName: true,
        dateTime: true,
        status: true,
        idPatient: true,
        transactions: {
          where: { status: { not: 2 } },
          select: {
            id: true,
            descriptionItemPrice: true,
            amountItemPrice: true,
            nameCompany: true,
            transactionType: true,
            groupItemMaster: true,
          },
        },
      },
    }),
  ]);

  // Fetch patients separately to avoid required-relation null errors
  const patientIds = [...new Set(queues.map((q) => q.idPatient).filter(Boolean))];
  const patients = patientIds.length
    ? await cmsPrisma.cmsPatient.findMany({
        where: { id: { in: patientIds as bigint[] } },
        select: { id: true, code: true, fullName: true },
      })
    : [];
  const patientMap = new Map(patients.map((p) => [p.id.toString(), p]));

  const data = queues.map((q) => {
    const patient     = q.idPatient ? patientMap.get(q.idPatient.toString()) : null;
    const totalAmount = q.transactions.reduce((s, t) => s + Number(t.amountItemPrice ?? 0), 0);
    const company     = q.transactions.find((t) => t.nameCompany)?.nameCompany?.trim() ?? null;
    return {
      id:          Number(q.id),
      queueCode:   q.code ?? "",
      patientCode: patient?.code ?? "—",
      patientName: patient?.fullName ?? q.qFullName ?? "—",
      date:        q.dateTime.toISOString(),
      totalAmount,
      paymentType: company && !company.toLowerCase().includes("default") ? `HMO - ${company}` : "CASH",
      status:      q.status >= 400 ? "paid" : "pending",
      items:       q.transactions.map((t) => ({
        id:          Number(t.id),
        description: t.descriptionItemPrice ?? "—",
        amount:      Number(t.amountItemPrice ?? 0),
        type:        t.transactionType ?? null,
        group:       t.groupItemMaster ?? null,
        company:     t.nameCompany?.trim() ?? null,
      })),
    };
  });

  return NextResponse.json({
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
