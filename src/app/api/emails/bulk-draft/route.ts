import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateProspectEmail, detectEmailLanguage } from "@/lib/groq";
import { getPlanLimits, isUnlimited } from "@/lib/plan-limits";
import { checkAiGenToday, logAiGen } from "@/lib/email-limits";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const userId = session.user.id;

  try {
    const { prospectIds, profileId } = await req.json();

    if (!Array.isArray(prospectIds) || prospectIds.length === 0)
      return NextResponse.json({ error: "Aucun prospect sélectionné" }, { status: 400 });
    if (prospectIds.length > 50)
      return NextResponse.json({ error: "Maximum 50 prospects par campagne" }, { status: 400 });

    // ── Plan & quota check ──────────────────────────────────────────
    type UserRow = {
      plan: string; role: string; profileType: string | null;
      companyName: string | null; website: string | null;
      productDescription: string | null; whatsappNumber: string | null;
    };
    const rows = await prisma.$queryRaw<UserRow[]>`
      SELECT "plan","role","profileType","companyName","website","productDescription","whatsappNumber"
      FROM "User" WHERE "id" = ${userId}
    `;
    const u = rows[0];
    const isAdmin = u?.role === "admin";
    const limits  = getPlanLimits(u?.plan ?? "starter");

    let todayCount = 0;
    if (!isAdmin && !isUnlimited(limits.aiGenPerDay)) {
      todayCount = await checkAiGenToday(userId);
      if (todayCount >= limits.aiGenPerDay) {
        return NextResponse.json({
          error: `Limite de génération IA atteinte (${limits.aiGenPerDay}/jour) — passez au plan supérieur.`,
          limitReached: true,
        }, { status: 429 });
      }
    }

    // ── Fetch prospects with email belonging to this user ───────────
    const prospects = await prisma.prospect.findMany({
      where: { id: { in: prospectIds }, userId: userId, email: { not: null } },
    });

    const skippedNoEmail = prospectIds.length - prospects.length;

    if (prospects.length === 0)
      return NextResponse.json({ error: "Aucun prospect sélectionné n'a d'email", created: 0, skipped: skippedNoEmail });

    // Cap at remaining AI quota for the day
    const quota = (!isAdmin && !isUnlimited(limits.aiGenPerDay))
      ? limits.aiGenPerDay - todayCount
      : prospects.length;
    const toProcess = prospects.slice(0, quota);
    const cappedByQuota = prospects.length - toProcess.length;

    // ── Resolve sender profile ──────────────────────────────────────
    let companyName        = u?.companyName        ?? undefined;
    let website            = u?.website            ?? undefined;
    let productDescription = u?.productDescription ?? undefined;
    let whatsappNumber     = u?.whatsappNumber     ?? undefined;
    const profileType      = (u?.profileType || "b2b") as "b2b" | "creator" | "agency";

    if (profileId) {
      type ProfileRow = { companyName: string | null; website: string | null; productDescription: string | null; whatsappNumber: string | null };
      const pRows = await prisma.$queryRaw<ProfileRow[]>`
        SELECT "companyName","website","productDescription","whatsappNumber"
        FROM "ProductProfile" WHERE "id" = ${profileId} AND "userId" = ${userId}
      `;
      const p = pRows[0];
      if (p) {
        companyName        = p.companyName        ?? companyName;
        website            = p.website            ?? website;
        productDescription = p.productDescription ?? productDescription;
        whatsappNumber     = p.whatsappNumber     ?? whatsappNumber;
      }
    }

    const sender = {
      companyName:        companyName        || undefined,
      website:            website            || undefined,
      productDescription: productDescription || undefined,
      whatsappNumber:     whatsappNumber     || undefined,
    };

    // ── Generate drafts ─────────────────────────────────────────────
    const results = await Promise.allSettled(
      toProcess.map(async (prospect) => {
        const lang = detectEmailLanguage(prospect.city);
        const generated = await generateProspectEmail(
          {
            name:    prospect.name,
            company: prospect.company  || undefined,
            niche:   prospect.niche,
            city:    prospect.city,
            website: prospect.website  || undefined,
            email:   prospect.email    || undefined,
          },
          profileType,
          lang,
          sender
        );
        return prisma.emailLog.create({
          data: {
            userId:     userId,
            prospectId: prospect.id,
            subject:    generated.subject,
            body:       generated.body,
            status:     "DRAFT",
          },
        });
      })
    );

    const created = results.filter(r => r.status === "fulfilled").length;

    // Log AI usage (fire-and-forget)
    for (let i = 0; i < created; i++) void logAiGen(userId, "email");

    return NextResponse.json({
      created,
      skipped: skippedNoEmail + cappedByQuota,
      total: prospectIds.length,
    });
  } catch (err: any) {
    console.error("[bulk-draft] error:", err);
    return NextResponse.json({ error: "Erreur lors de la génération" }, { status: 500 });
  }
}
