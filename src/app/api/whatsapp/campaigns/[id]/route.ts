import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { id } = await params;

    type CampaignRow = { id: string; userId: string; title: string; imageUrl: string | null; imageName: string | null; createdAt: Date };
    const campaigns = await prisma.$queryRaw<CampaignRow[]>`
      SELECT "id","userId","title","imageUrl","imageName","createdAt"
      FROM "WhatsAppCampaign" WHERE "id" = ${id} AND "userId" = ${session.user.id}
    `;
    if (!campaigns[0]) return NextResponse.json({ error: "Campagne introuvable" }, { status: 404 });

    type MsgRow = { id: string; prospectId: string | null; prospectName: string; prospectPhone: string; message: string; sent: boolean; sentAt: Date | null; createdAt: Date };
    const messages = await prisma.$queryRaw<MsgRow[]>`
      SELECT "id","prospectId","prospectName","prospectPhone","message","sent","sentAt","createdAt"
      FROM "WhatsAppCampaignMessage" WHERE "campaignId" = ${id}
      ORDER BY "createdAt" ASC
    `;

    return NextResponse.json({ campaign: campaigns[0], messages });
  } catch (err: any) {
    console.error("[campaigns/id] GET:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
