import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendProspectEmail } from "@/lib/resend";
import { z } from "zod";

const schema = z.object({
  prospectId: z.string(),
  campaignId: z.string().optional(),
  subject: z.string().min(1),
  body: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

    const isAdmin = (user as any).role === "admin";

    if (!isAdmin) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todaySent = await prisma.emailLog.count({
        where: {
          userId: session.user.id,
          status: { in: ["SENT"] },
          sentAt: { gte: todayStart },
        },
      });
      if (todaySent >= user.dailyLimit) {
        return NextResponse.json({
          error: `Limite journalière atteinte (${user.dailyLimit} emails/jour)`,
        }, { status: 429 });
      }
    }

    const prospect = await prisma.prospect.findFirst({
      where: { id: parsed.data.prospectId, userId: session.user.id },
    });

    if (!prospect) {
      return NextResponse.json({ error: "Prospect introuvable" }, { status: 404 });
    }

    if (!prospect.email) {
      return NextResponse.json({ error: "Ce prospect n'a pas d'email" }, { status: 400 });
    }

    // Create log first
    const log = await prisma.emailLog.create({
      data: {
        userId: session.user.id,
        prospectId: parsed.data.prospectId,
        campaignId: parsed.data.campaignId,
        subject: parsed.data.subject,
        body: parsed.data.body,
        status: "PENDING",
      },
    });

    const result = await sendProspectEmail({
      to: prospect.email,
      subject: parsed.data.subject,
      body: parsed.data.body,
      fromName: user.name || "ProspectAI",
    });

    // Update log and prospect status
    await Promise.all([
      prisma.emailLog.update({
        where: { id: log.id },
        data: {
          status: result.success ? "SENT" : "FAILED",
          messageId: result.messageId,
          sentAt: result.success ? new Date() : null,
        },
      }),
      result.success && prisma.prospect.update({
        where: { id: prospect.id },
        data: { status: "CONTACTED" },
      }),
      result.success && parsed.data.campaignId && prisma.campaign.update({
        where: { id: parsed.data.campaignId },
        data: { sentCount: { increment: 1 } },
      }),
    ].filter(Boolean));

    return NextResponse.json({
      success: result.success,
      error: result.error,
      logId: log.id,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur d'envoi" }, { status: 500 });
  }
}
