/**
 * Patient notification triggers.
 *
 * These are invoked from the NextAuth `events.signIn` hook so they only
 * run on actual login — no polling loops, no cron. Failures are swallowed
 * so a notification error never blocks the login flow.
 */
import { prisma } from "@/lib/prisma";
import { cmsPrisma } from "@/lib/prisma-cms";

/**
 * On patient login, detect lab results that have been released since
 * the last time we notified the patient and insert a new notification
 * row per result. Dedupe by encoding the queue code into the title
 * suffix so the same result never produces two notifications.
 */
export async function notifyNewResultsForPatient(
  userId: string,
  patientCode: string | null | undefined,
): Promise<number> {
  if (!patientCode) return 0;

  try {
    // Find the CMS patient by code
    const cmsPatient = await cmsPrisma.cmsPatient.findFirst({
      where: { code: patientCode },
      select: { id: true },
    });
    if (!cmsPatient) return 0;

    // Fetch recent released queues (status >= 500 = released). Limit to
    // last 30 days to avoid spamming new accounts with history.
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);

    const recentReleased = await cmsPrisma.cmsQueue.findMany({
      where: {
        idPatient: cmsPatient.id,
        status:    { gte: 500, lt: 650 },
        dateTime:  { gte: cutoff },
      },
      orderBy: { dateTime: "desc" },
      take: 20,
      select: {
        id:       true,
        code:     true,
        dateTime: true,
        transactions: {
          where:  { status: { not: 2 } },
          select: { descriptionItemPrice: true, groupItemMaster: true },
          take:   3,
        },
      },
    });

    if (recentReleased.length === 0) return 0;

    // Find existing notifications for this user whose message encodes
    // the queue code — used for dedupe.
    const existing = await prisma.portalNotification.findMany({
      where: {
        userId,
        type:  "success",
        title: { startsWith: "Lab Results Available" },
      },
      select: { message: true },
    });
    const seenCodes = new Set(
      existing
        .map((n) => n.message.match(/\[QUEUE:([^\]]+)\]/)?.[1])
        .filter((c): c is string => !!c),
    );

    let created = 0;
    for (const q of recentReleased) {
      if (!q.code || seenCodes.has(q.code)) continue;

      const serviceNames = q.transactions
        .map((t) => t.descriptionItemPrice)
        .filter(Boolean)
        .slice(0, 2)
        .join(", ");
      const dateLabel = q.dateTime.toLocaleDateString("en-PH", {
        month: "long", day: "numeric", year: "numeric",
      });

      await prisma.portalNotification.create({
        data: {
          userId,
          title:   "Lab Results Available",
          message: `Your ${serviceNames || "lab"} results from ${dateLabel} are now available. [QUEUE:${q.code}]`,
          type:    "success",
          isRead:  false,
        },
      });
      created++;
    }

    return created;
  } catch (err) {
    console.warn("[NOTIFY_RESULTS] failed:", err);
    return 0;
  }
}
