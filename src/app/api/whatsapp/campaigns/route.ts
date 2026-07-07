import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateWhatsAppMessage } from "@/lib/groq";
import { getPlanLimits, isUnlimited, PLAN_DISPLAY, NEXT_PLAN } from "@/lib/plan-limits";

type CampaignRow = {
  id: string; userId: string; title: string;
  imageUrl: string | null; imageName: string | null; createdAt: Date;
};
type MsgCountRow = { campaignId: string; n: number };

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const campaigns = await prisma.$queryRaw<CampaignRow[]>`
      SELECT "id","userId","title","imageUrl","imageName","createdAt"
      FROM "WhatsAppCampaign" WHERE "userId" = ${session.user.id}
      ORDER BY "createdAt" DESC
    `;

    const counts = campaigns.length
      ? await prisma.$queryRaw<MsgCountRow[]>`
          SELECT "campaignId", COUNT(*)::int AS n
          FROM "WhatsAppCampaignMessage"
          WHERE "campaignId" = ANY(${campaigns.map(c => c.id)})
          GROUP BY "campaignId"
        `
      : [];

    const countMap = Object.fromEntries(counts.map(r => [r.campaignId, r.n]));
    return NextResponse.json({ campaigns: campaigns.map(c => ({ ...c, messageCount: countMap[c.id] ?? 0 })) });
  } catch (err: any) {
    console.error("[campaigns] GET:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    // Plan check
    type UserPlanRow = { plan: string; role: string };
    const planRows = await prisma.$queryRaw<UserPlanRow[]>`
      SELECT "plan", "role" FROM "User" WHERE "id" = ${session.user.id}
    `;
    const u = planRows[0];
    const isAdmin = u?.role === "admin";
    const limits = getPlanLimits(u?.plan ?? "starter");

    if (!isAdmin && limits.waCampaigns === 0) {
      const required = NEXT_PLAN[u?.plan ?? "starter"] ?? "pro";
      return NextResponse.json({
        error: `Campagnes WhatsApp disponibles à partir du plan ${PLAN_DISPLAY[required] ?? "PRO"}.`,
        blockedByPlan: true,
        requiredPlan: required,
      }, { status: 403 });
    }

    if (!isAdmin && !isUnlimited(limits.waCampaigns)) {
      const existing = await prisma.$queryRaw<{ n: number }[]>`
        SELECT COUNT(*)::int AS n FROM "WhatsAppCampaign" WHERE "userId" = ${session.user.id}
      `;
      if ((existing[0]?.n ?? 0) >= limits.waCampaigns) {
        return NextResponse.json({
          error: `Limite de campagnes WhatsApp atteinte (${limits.waCampaigns} max) — passez au plan supérieur.`,
          limitReached: true,
        }, { status: 429 });
      }
    }

    const { prospectIds, promoTitle, imageUrl, imageName, profileId } = await req.json();

    if (!promoTitle?.trim()) return NextResponse.json({ error: "La description de la promotion est requise" }, { status: 400 });
    if (!Array.isArray(prospectIds) || prospectIds.length === 0) return NextResponse.json({ error: "Aucun prospect sélectionné" }, { status: 400 });

    type ProspectRow = { id: string; name: string; phone: string | null; niche: string; city: string };
    const prospects = await prisma.$queryRaw<ProspectRow[]>`
      SELECT "id","name","phone","niche","city"
      FROM "Prospect"
      WHERE "id" = ANY(${prospectIds}) AND "userId" = ${session.user.id} AND "phone" IS NOT NULL
    `;

    if (prospects.length === 0) return NextResponse.json({ error: "Aucun prospect valide (avec téléphone) trouvé" }, { status: 400 });

    type ProfileRow = { companyName: string | null; website: string | null; productDescription: string | null; whatsappNumber: string | null };
    let sender: ProfileRow = { companyName: null, website: null, productDescription: null, whatsappNumber: null };
    if (profileId) {
      const rows = await prisma.$queryRaw<ProfileRow[]>`
        SELECT "companyName","website","productDescription","whatsappNumber"
        FROM "ProductProfile" WHERE "id" = ${profileId} AND "userId" = ${session.user.id}
      `;
      if (rows[0]) sender = rows[0];
    } else {
      const rows = await prisma.$queryRaw<ProfileRow[]>`
        SELECT "companyName","website","productDescription","whatsappNumber" FROM "User" WHERE "id" = ${session.user.id}
      `;
      if (rows[0]) sender = rows[0];
    }

    const campaignId = `wac_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await prisma.$executeRaw`
      INSERT INTO "WhatsAppCampaign" ("id","userId","title","imageUrl","imageName","createdAt")
      VALUES (${campaignId}, ${session.user.id}, ${promoTitle.trim()},
        ${imageUrl || null}, ${imageName || null}, NOW())
    `;

    const results = await Promise.allSettled(
      prospects.map(async (p) => {
        const { message } = await generateWhatsAppMessage(
          { name: p.name, niche: p.niche, city: p.city },
          { companyName: sender.companyName ?? undefined, website: sender.website ?? undefined, productDescription: sender.productDescription ?? undefined, whatsappNumber: sender.whatsappNumber ?? undefined },
          promoTitle.trim()
        );
        return { prospect: p, message };
      })
    );

    for (const result of results) {
      if (result.status !== "fulfilled") continue;
      const { prospect: p, message } = result.value;
      const msgId = `wam_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await prisma.$executeRaw`
        INSERT INTO "WhatsAppCampaignMessage"
          ("id","campaignId","prospectId","prospectName","prospectPhone","message","sent","createdAt")
        VALUES (${msgId}, ${campaignId}, ${p.id}, ${p.name}, ${p.phone!}, ${message}, false, NOW())
      `;
    }

    return NextResponse.json({ campaignId }, { status: 201 });
  } catch (err: any) {
    console.error("[campaigns] POST:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
