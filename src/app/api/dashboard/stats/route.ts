import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Relative % change, current vs previous period. previous === 0 is treated
// as "no baseline" rather than a divide-by-zero — reported as a distinct
// "new" case instead of a misleading +∞% or a silently wrong 0%.
function pctChange(current: number, previous: number): { value: number | null; label: string } {
  if (previous === 0) {
    if (current === 0) return { value: 0, label: "0%" };
    return { value: null, label: "Nouveau" };
  }
  const pct = Math.round(((current - previous) / previous) * 1000) / 10;
  return { value: pct, label: `${pct > 0 ? "+" : ""}${pct}%` };
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const userId = session.user.id;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const now         = new Date();
    const weekAgo      = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo  = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [
      totalProspects, emailsSent, emailsOpened, emailsReplied,
      activeCampaigns, todaySent, recentEmails,
      prospectsThisWeek, prospectsLastWeek,
      sentThisWeek, sentLastWeek,
      openedThisWeek, openedLastWeek,
      repliedThisWeek, repliedLastWeek,
    ] = await Promise.all([
      prisma.prospect.count({ where: { userId } }),
      prisma.emailLog.count({ where: { userId, status: "SENT" } }),
      prisma.emailLog.count({ where: { userId, status: "OPENED" } }),
      prisma.emailLog.count({ where: { userId, status: "REPLIED" } }),
      prisma.campaign.count({ where: { userId, status: "ACTIVE" } }),
      prisma.emailLog.count({ where: { userId, status: "SENT", sentAt: { gte: todayStart } } }),
      prisma.emailLog.findMany({
        where: { userId, status: { not: "DRAFT" } },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { prospect: { select: { name: true, niche: true, city: true } } },
      }),
      // ── Week-over-week comparison base data ──────────────────────────
      prisma.prospect.count({ where: { userId, createdAt: { gte: weekAgo } } }),
      prisma.prospect.count({ where: { userId, createdAt: { gte: twoWeeksAgo, lt: weekAgo } } }),
      // "sent" counted by sentAt alone (not status) so emails that later moved
      // to OPENED/REPLIED still count as sent in the week they were sent
      prisma.emailLog.count({ where: { userId, sentAt: { gte: weekAgo } } }),
      prisma.emailLog.count({ where: { userId, sentAt: { gte: twoWeeksAgo, lt: weekAgo } } }),
      // openedAt/repliedAt are independent timestamps (not overwritten by
      // later status transitions), so these capture "ever opened/replied"
      // among emails sent in that window — regardless of current status
      prisma.emailLog.count({ where: { userId, sentAt: { gte: weekAgo }, openedAt: { not: null } } }),
      prisma.emailLog.count({ where: { userId, sentAt: { gte: twoWeeksAgo, lt: weekAgo }, openedAt: { not: null } } }),
      prisma.emailLog.count({ where: { userId, sentAt: { gte: weekAgo }, repliedAt: { not: null } } }),
      prisma.emailLog.count({ where: { userId, sentAt: { gte: twoWeeksAgo, lt: weekAgo }, repliedAt: { not: null } } }),
    ]);

    const openRate  = emailsSent > 0 ? Math.round((emailsOpened  / emailsSent) * 100 * 10) / 10 : 0;
    const replyRate = emailsSent > 0 ? Math.round((emailsReplied / emailsSent) * 100 * 10) / 10 : 0;

    const openRateThisWeek  = sentThisWeek > 0 ? (openedThisWeek  / sentThisWeek) * 100 : 0;
    const openRateLastWeek  = sentLastWeek > 0 ? (openedLastWeek  / sentLastWeek) * 100 : 0;
    const replyRateThisWeek = sentThisWeek > 0 ? (repliedThisWeek / sentThisWeek) * 100 : 0;
    const replyRateLastWeek = sentLastWeek > 0 ? (repliedLastWeek / sentLastWeek) * 100 : 0;

    const changes = {
      totalProspects: pctChange(prospectsThisWeek, prospectsLastWeek),
      emailsSent:     pctChange(sentThisWeek, sentLastWeek),
      openRate:       pctChange(openRateThisWeek, openRateLastWeek),
      replyRate:      pctChange(replyRateThisWeek, replyRateLastWeek),
    };

    const last7Days = await Promise.all(
      Array.from({ length: 7 }, async (_, i) => {
        const day = new Date();
        day.setDate(day.getDate() - i);
        day.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);

        const count = await prisma.emailLog.count({
          where: { userId, sentAt: { gte: day, lte: dayEnd } },
        });

        return {
          date: day.toLocaleDateString("fr-FR", { weekday: "short" }),
          emails: count,
        };
      })
    );

    return NextResponse.json({
      stats: { totalProspects, emailsSent, openRate, replyRate, activeCampaigns, todaySent },
      changes,
      recentEmails,
      chartData: last7Days.reverse(),
    });
  } catch (err: any) {
    console.error("[dashboard/stats]", err.message);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
