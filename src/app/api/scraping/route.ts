import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  niche: z.string().min(2),
  city: z.string().min(2),
  limit: z.number().min(1).max(60).default(20),
});

interface PlaceResult {
  displayName?: { text: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
}

async function searchGooglePlaces(query: string, limit: number): Promise<PlaceResult[]> {
  const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
  if (!API_KEY) throw new Error("GOOGLE_MAPS_API_KEY non configuré");

  const FIELD_MASK = [
    "places.displayName",
    "places.formattedAddress",
    "places.nationalPhoneNumber",
    "places.websiteUri",
    "places.rating",
    "places.userRatingCount",
    "nextPageToken",
  ].join(",");

  const results: PlaceResult[] = [];
  let pageToken: string | undefined;

  while (results.length < limit) {
    const pageSize = Math.min(limit - results.length, 20);

    const body: Record<string, unknown> = {
      textQuery: query,
      maxResultCount: pageSize,
      languageCode: "fr",
    };
    if (pageToken) body.pageToken = pageToken;

    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": API_KEY,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      const msg = data?.error?.message ?? `Google Places error ${res.status}`;
      throw new Error(msg);
    }

    if (Array.isArray(data.places)) results.push(...data.places);

    // Stop if no more pages or enough results
    if (!data.nextPageToken || results.length >= limit) break;
    pageToken = data.nextPageToken;

    // Small delay between paginated requests to respect rate limits
    await new Promise((r) => setTimeout(r, 200));
  }

  return results.slice(0, limit);
}

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
    const query = `${niche} ${city}`;

    const places = await searchGooglePlaces(query, limit);

    if (places.length === 0) {
      return NextResponse.json({ prospects: [], count: 0 });
    }

    const userId = session.user.id as string;

    const saved = await prisma.$transaction(
      places.map((p) =>
        prisma.prospect.create({
          data: {
            name:        p.displayName?.text ?? "Sans nom",
            company:     p.displayName?.text ?? null,
            niche,
            city,
            address:     p.formattedAddress  ?? null,
            phone:       p.nationalPhoneNumber ?? null,
            website:     p.websiteUri         ?? null,
            rating:      p.rating             ?? null,
            reviewCount: p.userRatingCount    ?? null,
            email:       null, // Google Places ne fournit pas les emails
            userId,
          },
        })
      )
    );

    return NextResponse.json({ prospects: saved, count: saved.length });
  } catch (err: any) {
    console.error("Scraping error:", err.message);
    return NextResponse.json(
      { error: err.message ?? "Erreur lors du scraping" },
      { status: 500 }
    );
  }
}
