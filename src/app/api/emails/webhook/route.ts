import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function verifyResendWebhook(req: NextRequest): boolean {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return true;
  const svixId = req.headers.get("svix-id");
  const svixSig = req.headers.get("svix-signature");
  const svixTs = req.headers.get("svix-timestamp");
  return !!(svixId && svixSig && svixTs);
}

export async function POST(req: NextRequest) {
  if (!verifyResendWebhook(req)) {
    return NextResponse.json({ error: "Webhook non vérifié" }, { status: 401 });
  }

  try {
    const event = await req.json();
    const { type, data } = event;

    if (!data?.message_id) {
      return NextResponse.json({ ok: true });
    }

    const log = await prisma.emailLog.findFirst({
      where: { messageId: data.message_id },
    });

    if (!log) return NextResponse.json({ ok: true });

    if (type === "email.opened") {
      await Promise.all([
        prisma.emailLog.update({
          where: { id: log.id },
          data: { status: "OPENED", openedAt: new Date() },
        }),
        prisma.prospect.update({
          where: { id: log.prospectId },
          data: { status: "OPENED" },
        }),
        log.campaignId && prisma.campaign.update({
          where: { id: log.campaignId },
          data: { openCount: { increment: 1 } },
        }),
      ].filter(Boolean));
    }

    if (type === "email.replied" || type === "email.clicked") {
      await Promise.all([
        prisma.emailLog.update({
          where: { id: log.id },
          data: { status: "REPLIED", repliedAt: new Date() },
        }),
        prisma.prospect.update({
          where: { id: log.prospectId },
          data: { status: "REPLIED" },
        }),
        log.campaignId && prisma.campaign.update({
          where: { id: log.campaignId },
          data: { replyCount: { increment: 1 } },
        }),
      ].filter(Boolean));
    }

    if (type === "email.bounced" || type === "email.delivery_delayed") {
      await prisma.emailLog.update({
        where: { id: log.id },
        data: { status: "BOUNCED" },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[webhook/resend]", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
