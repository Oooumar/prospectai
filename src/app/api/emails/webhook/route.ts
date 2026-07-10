import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";

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
      const isFirstOpen = log.status !== "OPENED";

      const [prospect, campaign] = await Promise.all([
        prisma.prospect.findUnique({
          where: { id: log.prospectId },
          select: { name: true, company: true },
        }),
        log.campaignId
          ? prisma.campaign.findUnique({ where: { id: log.campaignId }, select: { name: true } })
          : Promise.resolve(null),
        prisma.emailLog.update({
          where: { id: log.id },
          data: { status: "OPENED", openedAt: new Date() },
        }),
        prisma.prospect.update({
          where: { id: log.prospectId },
          data: { status: "OPENED" },
        }),
        log.campaignId
          ? prisma.campaign.update({ where: { id: log.campaignId }, data: { openCount: { increment: 1 } } })
          : Promise.resolve(null),
      ]);

      // Notify only on first open to avoid duplicates
      if (isFirstOpen) {
        const notifEmail = process.env.NOTIFICATION_EMAIL ?? "azizssro72@gmail.com";
        const prospectLabel = prospect?.company
          ? `${prospect.name} (${prospect.company})`
          : (prospect?.name ?? "Prospect inconnu");
        const campaignLabel = campaign?.name ?? "hors campagne";
        const openedAt = new Date().toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });

        resend.emails.send({
          from: `ProspectAI <${process.env.RESEND_FROM_EMAIL ?? "contact@prospectai.company"}>`,
          to: notifEmail,
          subject: `👀 ${prospectLabel} a ouvert votre email`,
          html: `
            <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:28px 20px;background:#fff;color:#111">
              <div style="background:linear-gradient(135deg,#7B61FF,#C77DFF);border-radius:12px;padding:16px 20px;margin-bottom:20px">
                <p style="margin:0;font-size:28px">👀</p>
                <h2 style="margin:6px 0 0;color:#fff;font-size:18px;font-weight:700">Email ouvert !</h2>
              </div>
              <table style="width:100%;font-size:14px;border-collapse:collapse">
                <tr><td style="color:#6b7280;padding:7px 0;width:110px;vertical-align:top">Prospect</td><td style="font-weight:600;padding:7px 0">${prospectLabel}</td></tr>
                <tr><td style="color:#6b7280;padding:7px 0;border-top:1px solid #f3f4f6">Campagne</td><td style="padding:7px 0;border-top:1px solid #f3f4f6">${campaignLabel}</td></tr>
                <tr><td style="color:#6b7280;padding:7px 0;border-top:1px solid #f3f4f6">Objet</td><td style="padding:7px 0;border-top:1px solid #f3f4f6;color:#4b5563">${log.subject}</td></tr>
                <tr><td style="color:#6b7280;padding:7px 0;border-top:1px solid #f3f4f6">Heure</td><td style="padding:7px 0;border-top:1px solid #f3f4f6;color:#4b5563">${openedAt}</td></tr>
              </table>
            </div>
          `,
        }).catch(() => {});
      }
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
