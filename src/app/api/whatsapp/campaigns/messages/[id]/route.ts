import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    // Verify ownership via campaign join
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT m."id" FROM "WhatsAppCampaignMessage" m
      JOIN "WhatsAppCampaign" c ON c."id" = m."campaignId"
      WHERE m."id" = ${id} AND c."userId" = ${session.user.id}
    `;
    if (!rows[0]) return NextResponse.json({ error: "Message introuvable" }, { status: 404 });

    if (body.sent === true) {
      await prisma.$executeRaw`
        UPDATE "WhatsAppCampaignMessage" SET "sent" = true, "sentAt" = NOW() WHERE "id" = ${id}
      `;
    } else if (body.message !== undefined) {
      await prisma.$executeRaw`
        UPDATE "WhatsAppCampaignMessage" SET "message" = ${body.message} WHERE "id" = ${id}
      `;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[campaigns/messages] PATCH:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
