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
    const page        = isNaN(rawPage)     || rawPage     < 1 ? 1  : rawPage;
    const pageSize    = isNaN(rawPageSize) || rawPageSize < 1 ? 10 : Math.min(100, rawPageSize);
    const type        = searchParams.get("type") ?? "";

    const cmsPatient = await cmsPrisma.cmsPatient.findUnique({
      where: { code: patientCode },
      select: { id: true },
    });

    if (!cmsPatient) {
      return NextResponse.json({ data: { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 } });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      idPatient: cmsPatient.id,
      // Exclude cancelled queues (status 650+) and pure in-progress (< 100)
      status: { gte: 100, lt: 650 },
      // Must have at least one non-cancelled transaction
      transactions: { some: { status: { not: 2 } } },
    };

    // Type filter — match against transaction groups/descriptions
    if (type && type !== "all") {
      where.transactions = {
        some: {
          status: { not: 2 },
          OR: [
            { descriptionItemPrice: { contains: type, mode: "insensitive" } },
            { groupItemMaster:      { contains: type, mode: "insensitive" } },
          ],
        },
      };
    }

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
          accessionNo: true,
          qFullName: true,
          status: true,
          transactions: {
            where: { status: { not: 2 } },
            select: {
              id: true,
              descriptionItemPrice: true,
              groupItemMaster: true,
              transactionType: true,
              nameDoctor: true,
              status: true,
            },
          },
        },
      }),
    ]);

    const data = queues.map((q) => {
      const allText = [
        ...q.transactions.map((t) => t.groupItemMaster ?? ""),
        ...q.transactions.map((t) => t.descriptionItemPrice ?? ""),
      ].map((s) => s.toLowerCase());

      const resultType =
        allText.some((g) =>
          g.includes("lab") || g.includes("chem") || g.includes("hema") ||
          g.includes("micro") || g.includes("cbc") || g.includes("urin") ||
          g.includes("glucose") || g.includes("blood") || g.includes("fbs") ||
          g.includes("lipid") || g.includes("thyroid") || g.includes("hepat") ||
          g.includes("culture") || g.includes("serol")
        )
          ? "lab"
          : allText.some((g) =>
            g.includes("xray") || g.includes("x-ray") || g.includes("imaging") ||
            g.includes("ultrasound") || g.includes("ct") || g.includes("mri") ||
            g.includes("ecg") || g.includes("echo") || g.includes("abpm") ||
            g.includes("radiolog")
          )
          ? "imaging"
          : allText.some((g) => g.includes("path") || g.includes("histo") || g.includes("cyto"))
          ? "pathology"
          : "other";

      const doctor = q.transactions.find((t) => t.nameDoctor)?.nameDoctor ?? undefined;

      const serviceNames = q.transactions
        .map((t) => t.descriptionItemPrice)
        .filter(Boolean)
        .slice(0, 3);
      const description =
        serviceNames.length > 0
          ? serviceNames.join(", ") + (q.transactions.length > 3 ? ` +${q.transactions.length - 3} more` : "")
          : q.qFullName ?? "Visit";

      return {
        id:          Number(q.id),
        transNo:     q.accessionNo ?? q.code ?? "",
        queueCode:   q.code ?? "",
        date:        q.dateTime.toISOString(),
        type:        resultType as "lab" | "imaging" | "pathology" | "other",
        description,
        hasPdf:      true, // PDF visit summary is always available
        status:      (q.status >= 500 ? "released" : "pending") as "released" | "pending",
        releasedAt:  undefined,
        requestedBy: doctor,
      };
    });

    return NextResponse.json({
      data: { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error("[GET_RESULTS]", error);
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 });
  }
}
