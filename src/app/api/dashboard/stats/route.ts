import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const userId = session.user.id;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalProspects, emailsSent, emailsOpened, emailsReplied,
      activeCampaigns, todaySent, recentEmails,
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
    ]);

    const openRate = emailsSent > 0 ? Math.round((emailsOpened / emailsSent) * 100 * 10) / 10 : 0;
    const replyRate = emailsSent > 0 ? Math.round((emailsReplied / emailsSent) * 100 * 10) / 10 : 0;

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
      recentEmails,
      chartData: last7Days.reverse(),
    });
  } catch (err: any) {
    console.error("[dashboard/stats]", err.message);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
