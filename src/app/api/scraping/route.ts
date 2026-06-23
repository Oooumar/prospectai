import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractEmailsBatch } from "@/lib/email-extractor";
import { searchGooglePlaces } from "@/lib/google-places";
import { z } from "zod";

const schema = z.object({
  niche: z.string().min(2),
  city: z.string().min(2),
  limit: z.number().min(1).max(60).default(20),
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

    const { niche, city, limit } = parsed.data;
    const places = await searchGooglePlaces(`${niche} ${city}`, limit);

    if (places.length === 0) {
      return NextResponse.json({ prospects: [], count: 0 });
    }

    const websiteUrls = places.map((p) => p.websiteUri ?? null);
    const emails = await extractEmailsBatch(websiteUrls, 5);

    const userId = session.user.id as string;

    const saved = await prisma.$transaction(
      places.map((p, i) =>
        prisma.prospect.create({
          data: {
            name:        p.displayName?.text  ?? "Sans nom",
            company:     p.displayName?.text  ?? null,
            niche,
            city,
            address:     p.formattedAddress   ?? null,
            phone:       p.nationalPhoneNumber ?? null,
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
