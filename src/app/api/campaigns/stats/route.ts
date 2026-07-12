import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const [agg, hotProspects] = await Promise.all([
    prisma.campaign.aggregate({
      where: { userId: session.user.id },
      _sum: { sentCount: true, openCount: true, replyCount: true },
    }),
    (prisma.prospect as any).count({
      where: { userId: session.user.id, status: "HOT" },
    }),
  ]);

  const totalSent = agg._sum.sentCount ?? 0;
  const totalOpens = agg._sum.openCount ?? 0;
  const totalReplies = agg._sum.replyCount ?? 0;

  return NextResponse.json({
    totalSent,
    openRate: totalSent > 0 ? Math.round((totalOpens / totalSent) * 100) : 0,
    replyRate: totalSent > 0 ? Math.round((totalReplies / totalSent) * 100) : 0,
    hotProspects,
  });
}
