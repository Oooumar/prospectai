import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractEmailsBatch } from "@/lib/email-extractor";
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

const FIELD_MASK = [
  "places.displayName",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.rating",
  "places.userRatingCount",
  "nextPageToken",
].join(",");

async function searchGooglePlaces(query: string, limit: number): Promise<PlaceResult[]> {
  const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

  console.log("[scraping] query:", query, "limit:", limit);
  console.log("[scraping] API key present:", !!API_KEY);

  if (!API_KEY) throw new Error("GOOGLE_MAPS_API_KEY manquant dans les variables d'environnement");

  const results: PlaceResult[] = [];
  let pageToken: string | undefined;
  let page = 0;

  while (results.length < limit) {
    page++;
    const pageSize = Math.min(limit - results.length, 20);
    console.log(`[scraping] page ${page}, requesting ${pageSize} results, total so far: ${results.length}`);

    const body: Record<string, unknown> = {
      textQuery: query,
      maxResultCount: pageSize,
      languageCode: "fr",
    };
    if (pageToken) body.pageToken = pageToken;

    // 8-second timeout per request
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    let res: Response;
    try {
      res = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": API_KEY,
          "X-Goog-FieldMask": FIELD_MASK,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (fetchErr: any) {
      clearTimeout(timer);
      throw new Error(`Timeout ou réseau : ${fetchErr.message}`);
    }
    clearTimeout(timer);

    const data = await res.json();
    console.log(`[scraping] page ${page} status:`, res.status, "places:", data.places?.length ?? 0);

    if (!res.ok) {
      const msg = data?.error?.message ?? `Google Places HTTP ${res.status}`;
      console.error("[scraping] API error:", JSON.stringify(data.error ?? data));
      throw new Error(msg);
    }

    if (Array.isArray(data.places)) results.push(...data.places);
    if (!data.nextPageToken || results.length >= limit) break;

    pageToken = data.nextPageToken;
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log("[scraping] total fetched:", results.length);
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
    const places = await searchGooglePlaces(`${niche} ${city}`, limit);

    if (places.length === 0) {
      return NextResponse.json({ prospects: [], count: 0 });
    }

    // Extract emails from websites in parallel (5 concurrent, 1.5s between batches)
    const websiteUrls = places.map((p) => p.websiteUri ?? null);
    console.log(
      "[scraping] extracting emails from",
      websiteUrls.filter(Boolean).length,
      "websites"
    );
    const emails = await extractEmailsBatch(websiteUrls, 5);
    console.log("[scraping] emails found:", emails.filter(Boolean).length);

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

    console.log("[scraping] saved to DB:", saved.length);
    return NextResponse.json({ prospects: saved, count: saved.length });
  } catch (err: any) {
    console.error("[scraping] error:", err.message);
    return NextResponse.json({ error: err.message ?? "Erreur lors du scraping" }, { status: 500 });
  }
}
