import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendProspectEmail } from "@/lib/resend";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { action, draftResponse } = await req.json();

    const inbound = await prisma.inboundEmail.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!inbound) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
    if (inbound.status !== "pending") return NextResponse.json({ error: "Déjà traité" }, { status: 409 });

    if (action === "archive") {
      await prisma.inboundEmail.update({
        where: { id },
        data: { status: "archived" },
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "approve") {
      const responseText = (draftResponse ?? inbound.draftResponse ?? "").trim();
      if (!responseText) {
        return NextResponse.json({ error: "Le brouillon est vide" }, { status: 400 });
      }

      const result = await sendProspectEmail({
        to: inbound.fromEmail,
        subject: inbound.subject.startsWith("Re:") ? inbound.subject : `Re: ${inbound.subject}`,
        body: responseText,
        fromName: session.user.name || "ProspectAI",
        replyTo: process.env.RESEND_REPLY_TO,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error || "Erreur d'envoi" }, { status: 500 });
      }

      await prisma.inboundEmail.update({
        where: { id },
        data: { status: "sent", sentAt: new Date(), draftResponse: responseText },
      });

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (err: any) {
    console.error("[inbound/id]", err.message);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
