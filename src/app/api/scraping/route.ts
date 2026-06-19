import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  niche: z.string().min(2),
  city: z.string().min(2),
  limit: z.number().min(1).max(100).default(20),
});

// Simulates scraping — replace with real Google Places / SerpAPI integration
function generateMockProspects(niche: string, city: string, count: number) {
  const firstNames = ["Jean", "Pierre", "Marie", "Sophie", "Thomas", "Laura", "Michel", "Claire", "Antoine", "Julie"];
  const lastNames = ["Martin", "Dupont", "Durand", "Bernard", "Moreau", "Simon", "Laurent", "Lefebvre", "Michel", "Garcia"];
  const domains = ["gmail.com", "outlook.fr", "yahoo.fr", "hotmail.fr"];

  return Array.from({ length: count }, (_, i) => {
    const first = firstNames[Math.floor(Math.random() * firstNames.length)];
    const last = lastNames[Math.floor(Math.random() * lastNames.length)];
    const company = `${niche.charAt(0).toUpperCase() + niche.slice(1)} ${last}`;
    const email = `contact@${last.toLowerCase()}-${niche.toLowerCase().replace(/\s+/g, "")}.fr`;

    return {
      name: company,
      email: Math.random() > 0.2 ? email : undefined,
      phone: Math.random() > 0.3 ? `0${Math.floor(Math.random() * 9) + 1} ${Array.from({length:4},()=>String(Math.floor(Math.random()*100)).padStart(2,'0')).join(' ')}` : undefined,
      company,
      website: Math.random() > 0.4 ? `https://www.${last.toLowerCase()}-${niche.toLowerCase().replace(/\s+/g,"")}.fr` : undefined,
      niche,
      city,
      address: `${Math.floor(Math.random() * 200) + 1} rue de la Paix, ${city}`,
      rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
      reviewCount: Math.floor(Math.random() * 200) + 5,
    };
  });
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

    const prospects = generateMockProspects(niche, city, limit);

    // Save to DB
    const userId = session.user.id as string;

    const saved = await prisma.$transaction(
      prospects.map((p) =>
        prisma.prospect.create({
          data: {
            name: p.name,
            company: p.company,
            niche: p.niche,
            city: p.city,
            address: p.address,
            rating: p.rating,
            reviewCount: p.reviewCount,
            email: p.email || null,
            phone: p.phone || null,
            website: p.website || null,
            userId,
          },
        })
      )
    );

    return NextResponse.json({ prospects: saved, count: saved.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur lors du scraping" }, { status: 500 });
  }
}
