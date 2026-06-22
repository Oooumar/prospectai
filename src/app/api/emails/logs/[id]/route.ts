import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const log = await prisma.emailLog.findFirst({
    where: { id: params.id, userId: session.user.id },
  });

  if (!log) return NextResponse.json({ error: "Email introuvable" }, { status: 404 });
  if (log.status === "REPLIED") return NextResponse.json({ ok: true });

  await Promise.all([
    prisma.emailLog.update({
      where: { id: params.id },
      data: { status: "REPLIED", repliedAt: new Date() },
    }),
    prisma.prospect.update({
      where: { id: log.prospectId },
      data: { status: "REPLIED" },
    }),
    log.campaignId
      ? prisma.campaign.update({
          where: { id: log.campaignId },
          data: { replyCount: { increment: 1 } },
        })
      : Promise.resolve(),
  ]);

  return NextResponse.json({ ok: true });
}
