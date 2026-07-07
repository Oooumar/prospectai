import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractEmailsBatch } from "@/lib/email-extractor";
import { searchGooglePlaces } from "@/lib/google-places";
import { z } from "zod";
import { getPlanLimits, isUnlimited } from "@/lib/plan-limits";
import { todayStart } from "@/lib/email-limits";

const schema = z.object({
  niche: z.string().min(2),
  city: z.string().min(2),
  limit: z.number().min(1).max(100).default(20),
  noWebsiteOnly: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    const { niche, city, limit: requestedLimit, noWebsiteOnly } = parsed.data;
    const userId = session.user.id as string;

    // Plan limits
    type UserPlanRow = { plan: string; role: string };
    const planRows = await prisma.$queryRaw<UserPlanRow[]>`
      SELECT "plan", "role" FROM "User" WHERE "id" = ${userId}
    `;
    const u = planRows[0];
    const isAdmin = u?.role === "admin";
    const limits = getPlanLimits(u?.plan ?? "starter");

    let effectiveLimit = requestedLimit;

    if (!isAdmin) {
      // Clamp per-search limit to plan cap
      effectiveLimit = Math.min(requestedLimit, limits.scrapingPerSearch);

      // Check storage cap
      if (!isUnlimited(limits.maxProspects)) {
        const total = await prisma.prospect.count({ where: { userId } });
        if (total >= limits.maxProspects) {
          return NextResponse.json({
            error: `Limite de stockage atteinte (${limits.maxProspects} prospects max) — passez au plan supérieur.`,
            limitReached: true,
          }, { status: 429 });
        }
        // Don't exceed storage cap
        effectiveLimit = Math.min(effectiveLimit, limits.maxProspects - total);
      }

      // Check daily scraping quota
      if (!isUnlimited(limits.scrapingPerDay)) {
        const todayCount = await prisma.prospect.count({
          where: { userId, createdAt: { gte: todayStart() } },
        });
        if (todayCount >= limits.scrapingPerDay) {
          return NextResponse.json({
            error: `Quota journalier de scraping atteint (${limits.scrapingPerDay} prospects/jour) — passez au plan supérieur.`,
            limitReached: true,
          }, { status: 429 });
        }
        // Don't exceed daily cap
        effectiveLimit = Math.min(effectiveLimit, limits.scrapingPerDay - todayCount);
      }
    }

    if (effectiveLimit <= 0) {
      return NextResponse.json({ prospects: [], count: 0 });
    }

    let places = await searchGooglePlaces(
      `${niche} ${city}`,
      noWebsiteOnly ? Math.min(effectiveLimit * 3, 60) : effectiveLimit
    );

    if (noWebsiteOnly) {
      places = places.filter(p => !p.websiteUri);
    }

    // Respect effectiveLimit after filtering
    places = places.slice(0, effectiveLimit);

    if (places.length === 0) {
      return NextResponse.json({ prospects: [], count: 0 });
    }

    const websiteUrls = places.map((p) => p.websiteUri ?? null);
    const emails = noWebsiteOnly ? places.map(() => null) : await extractEmailsBatch(websiteUrls, 5);

    const saved = await prisma.$transaction(
      places.map((p, i) =>
        prisma.prospect.create({
          data: {
            name:        p.displayName?.text  ?? "Sans nom",
            company:     p.displayName?.text  ?? null,
            niche,
            city,
            address:     p.formattedAddress   ?? null,
            phone:       p.internationalPhoneNumber ?? p.nationalPhoneNumber ?? null,
            website:     p.websiteUri         ?? null,
            rating:      p.rating             ?? null,
            reviewCount: p.userRatingCount    ?? null,
            email:       emails[i]            ?? null,
            userId,
          },
        })
      )
    );

    return NextResponse.json({ prospects: saved, count: saved.length });
  } catch (err: any) {
    console.error("[scraping] error:", err.message);
    return NextResponse.json({ error: err.message ?? "Erreur lors du scraping" }, { status: 500 });
  }
}
