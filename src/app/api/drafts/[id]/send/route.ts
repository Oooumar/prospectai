import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendProspectEmail } from "@/lib/resend";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const draft = await prisma.emailLog.findFirst({
      where: { id, userId: session.user.id, status: "DRAFT" },
      include: { prospect: true },
    });
    if (!draft) return NextResponse.json({ error: "Brouillon introuvable" }, { status: 404 });

    if (!draft.prospect.email) {
      return NextResponse.json({ error: "Ce prospect n'a pas d'email" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

    const inboundDomain = process.env.RESEND_INBOUND_DOMAIN;
    const replyTo = inboundDomain
      ? `reply+${draft.id}@${inboundDomain}`
      : process.env.RESEND_REPLY_TO;

    const result = await sendProspectEmail({
      to: draft.prospect.email,
      subject: draft.subject,
      body: draft.body,
      fromName: user.name || "ProspectAI",
      replyTo: replyTo || undefined,
    });

    await Promise.all([
      prisma.emailLog.update({
        where: { id },
        data: {
          status: result.success ? "SENT" : "FAILED",
          messageId: result.messageId,
          sentAt: result.success ? new Date() : null,
        },
      }),
      result.success && prisma.prospect.update({
        where: { id: draft.prospectId },
        data: { status: "CONTACTED" },
      }),
    ].filter(Boolean));

    return NextResponse.json({ success: result.success, error: result.error });
  } catch (err: any) {
    console.error("[drafts/id/send]", err.message);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
