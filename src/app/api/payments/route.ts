import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cmsPrisma } from "@/lib/prisma-cms";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const patientCode = session.user.patientCode;
    if (!patientCode) {
      return NextResponse.json({ data: { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 } });
    }

    const { searchParams } = new URL(req.url);
    const rawPage     = parseInt(searchParams.get("page")     ?? "1",  10);
    const rawPageSize = parseInt(searchParams.get("pageSize") ?? "10", 10);
    const page        = isNaN(rawPage)     || rawPage     < 1   ? 1  : rawPage;
    const pageSize    = isNaN(rawPageSize) || rawPageSize < 1   ? 10
                      : rawPageSize > 100                        ? 100 : rawPageSize;
    const statusFilter = searchParams.get("status") ?? "";

    const cmsPatient = await cmsPrisma.cmsPatient.findUnique({
      where: { code: patientCode },
      select: { id: true },
    });

    if (!cmsPatient) {
      return NextResponse.json({ data: { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 } });
    }

    // Payments derived from transactions grouped by queue visit
    // Each queue visit = one "payment record" — sum of transaction amounts
    const where = {
      idPatient: cmsPatient.id,
    };

    const [total, queues] = await Promise.all([
      cmsPrisma.cmsQueue.count({ where }),
      cmsPrisma.cmsQueue.findMany({
        where,
        orderBy: { dateTime: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          code: true,
          dateTime: true,
          status: true,
          accessionNo: true,
          transactions: {
            where: { status: { not: 2 } },
            select: { amountItemPrice: true, nameCompany: true, transactionType: true },
          },
        },
      }),
    ]);

    const data = queues.map((q) => {
      const totalAmount = q.transactions.reduce((s, t) => s + Number(t.amountItemPrice ?? 0), 0);
      const company     = q.transactions.find((t) => t.nameCompany)?.nameCompany ?? null;
      // status >= 400 = completed visit (paid)
      const status = q.status >= 600 ? "paid" : q.status >= 400 ? "paid" : "pending";

      return {
        id:            Number(q.id),
        queueCode:     q.code ?? "",
        date:          q.dateTime.toISOString(),
        receiptNo:     q.accessionNo ?? q.code ?? "",
        totalAmount,
        paymentMethod: company ? `HMO - ${company}` : "CASH",
        status,
      };
    });

    const filtered = statusFilter && statusFilter !== "all"
      ? data.filter((p) => p.status === statusFilter)
      : data;

    return NextResponse.json({
      data: { data: filtered, total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error("[GET_PAYMENTS]", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}
