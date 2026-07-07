import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateWhatsAppMessage } from "@/lib/groq";
import { getPlanLimits, isUnlimited } from "@/lib/plan-limits";
import { checkAiGenToday, logAiGen } from "@/lib/email-limits";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { prospectId, profileId } = await req.json();
    if (!prospectId) {
      return NextResponse.json({ error: "prospectId requis" }, { status: 400 });
    }

    // Plan + AI gen quota check
    type UserLimitRow = { plan: string; role: string };
    const limitRows = await prisma.$queryRaw<UserLimitRow[]>`
      SELECT "plan", "role" FROM "User" WHERE "id" = ${session.user.id}
    `;
    const u = limitRows[0];
    const isAdmin = u?.role === "admin";
    const limits = getPlanLimits(u?.plan ?? "starter");

    if (!isAdmin && !isUnlimited(limits.aiGenPerDay)) {
      const todayCount = await checkAiGenToday(session.user.id);
      if (todayCount >= limits.aiGenPerDay) {
        return NextResponse.json({
          error: `Limite de génération IA atteinte (${limits.aiGenPerDay}/jour) — passez au plan supérieur.`,
          limitReached: true,
        }, { status: 429 });
      }
    }

    const prospect = await prisma.prospect.findFirst({
      where: { id: prospectId, userId: session.user.id },
    });
    if (!prospect) {
      return NextResponse.json({ error: "Prospect introuvable" }, { status: 404 });
    }
    if (!prospect.phone) {
      return NextResponse.json({ error: "Ce prospect n'a pas de numéro de téléphone" }, { status: 400 });
    }

    type ProfileRow = { companyName: string | null; website: string | null; productDescription: string | null; whatsappNumber: string | null };

    let sender: { companyName?: string; productDescription?: string; website?: string; whatsappNumber?: string } = {};

    if (profileId) {
      const pRows = await prisma.$queryRaw<ProfileRow[]>`
        SELECT "companyName","website","productDescription","whatsappNumber"
        FROM "ProductProfile" WHERE "id" = ${profileId} AND "userId" = ${session.user.id}
      `;
      const p = pRows[0];
      if (p) {
        sender = { companyName: p.companyName ?? undefined, website: p.website ?? undefined, productDescription: p.productDescription ?? undefined, whatsappNumber: p.whatsappNumber ?? undefined };
      }
    } else {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { companyName: true, productDescription: true, website: true, whatsappNumber: true },
      });
      sender = { companyName: user?.companyName ?? undefined, productDescription: user?.productDescription ?? undefined, website: user?.website ?? undefined, whatsappNumber: user?.whatsappNumber ?? undefined };
    }

    const result = await generateWhatsAppMessage(
      { name: prospect.name, niche: prospect.niche, city: prospect.city, website: prospect.website || undefined, email: prospect.email || undefined },
      sender
    );

    // Log AI gen (fire-and-forget)
    void logAiGen(session.user.id, "whatsapp");

    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/whatsapp/generate]", err);
    return NextResponse.json({ error: "Erreur lors de la génération" }, { status: 500 });
  }
}
