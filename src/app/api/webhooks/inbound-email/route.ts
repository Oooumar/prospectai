import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzeEmailReply, detectEmailLanguage } from "@/lib/groq";
import { sendProspectEmail } from "@/lib/resend";

export async function POST(req: NextRequest) {
  // Verify webhook secret when configured
  const secret = process.env.INBOUND_WEBHOOK_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const event = await req.json();

    // Resend wraps inbound events as { type, data } — support both flat and nested
    const data = event.data ?? event;
    const fromRaw: string = data.from ?? "";
    const toRaw: string = Array.isArray(data.to) ? (data.to[0] ?? "") : (data.to ?? "");
    const subject: string = data.subject ?? "(no subject)";
    const body: string = data.text ?? data.body ?? "";
    const rawMessageId: string | undefined = data.headers?.["message-id"] ?? data.email_id;

    if (!fromRaw || !body) {
      return NextResponse.json({ ok: true });
    }

    // Deduplicate by Resend message-id
    if (rawMessageId) {
      const existing = await prisma.inboundEmail.findFirst({ where: { messageId: rawMessageId } });
      if (existing) return NextResponse.json({ ok: true });
    }

    // Parse from address: "Name <email@example.com>" or plain "email@example.com"
    const fromEmailMatch = fromRaw.match(/<([^>]+)>/) ?? fromRaw.match(/([^\s<>]+@[^\s<>]+)/);
    const fromEmail = fromEmailMatch?.[1] ?? fromRaw;
    const fromNameMatch = fromRaw.match(/^(.+?)\s*</);
    const fromName = fromNameMatch?.[1]?.trim() || undefined;

    // Extract emailLogId from reply+{logId}@domain encoding in the To header
    const logIdMatch = toRaw.match(/reply\+([^@]+)@/);
    const emailLogId = logIdMatch?.[1] ?? undefined;

    let userId: string | null = null;
    let prospectId: string | null = null;
    let originalLog: Awaited<ReturnType<typeof prisma.emailLog.findUnique>> & {
      prospect?: { name: string; niche: string; city: string } | null;
    } | null = null;

    if (emailLogId) {
      const log = await prisma.emailLog.findUnique({
        where: { id: emailLogId },
        include: { prospect: true },
      });
      if (log) {
        originalLog = log as any;
        userId = log.userId;
        prospectId = log.prospectId;

        // Update outbound email and prospect status to REPLIED
        await Promise.all([
          prisma.emailLog.update({
            where: { id: emailLogId },
            data: { status: "REPLIED", repliedAt: new Date() },
          }),
          prisma.prospect.update({
            where: { id: log.prospectId },
            data: { status: "REPLIED" },
          }),
        ]);
      }
    }

    // Fallback: match by prospect email address
    if (!userId && fromEmail) {
      const log = await prisma.emailLog.findFirst({
        where: { prospect: { email: fromEmail } },
        orderBy: { createdAt: "desc" },
        include: { prospect: true },
      });
      if (log) {
        originalLog = log as any;
        userId = log.userId;
        prospectId = log.prospectId;
      }
    }

    if (!userId) {
      console.error("[inbound] No user found for email from:", fromEmail);
      return NextResponse.json({ ok: true });
    }

    // Fetch user profile for AI context
    const userRows = await prisma.$queryRaw<Array<{
      name: string | null;
      companyName: string | null;
      productDescription: string | null;
      language: string | null;
    }>>`SELECT "name", "companyName", "productDescription", "language" FROM "User" WHERE "id" = ${userId}`;
    const userProfile = userRows[0];

    const prospect = (originalLog as any)?.prospect;
    const lang = detectEmailLanguage(prospect?.city ?? "");

    // Run AI analysis — async but inline (Groq is fast enough for webhook timeouts)
    const analysis = await analyzeEmailReply({
      replyText: body,
      originalSubject: originalLog?.subject ?? subject,
      originalBody: originalLog?.body ?? "",
      prospect: {
        name: prospect?.name ?? fromEmail,
        niche: prospect?.niche ?? "unknown",
        city: prospect?.city ?? "unknown",
      },
      sender: {
        companyName: userProfile?.companyName ?? undefined,
        productDescription: userProfile?.productDescription ?? undefined,
      },
      lang,
    });

    // Persist the inbound email with AI analysis
    await prisma.inboundEmail.create({
      data: {
        messageId: rawMessageId ?? undefined,
        emailLogId: emailLogId ?? undefined,
        userId,
        prospectId: prospectId ?? undefined,
        fromEmail,
        fromName: fromName ?? undefined,
        subject,
        body,
        sentiment: analysis.sentiment,
        aiAnalysis: analysis.analysis,
        draftResponse: analysis.draftResponse,
        status: "pending",
      },
    });

    // Forward a copy to personal email if configured
    const forwardTo = process.env.INBOUND_FORWARD_TO;
    if (forwardTo) {
      await sendProspectEmail({
        to: forwardTo,
        subject: `[Réponse] ${subject}`,
        body: `De : ${fromRaw}\n\n${body}`,
        fromName: "ProspectAI Inbound",
      }).catch(() => {}); // Non-blocking
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[inbound] Error:", err);
    // Always return 200 to prevent Resend from retrying endlessly
    return NextResponse.json({ ok: true });
  }
}
