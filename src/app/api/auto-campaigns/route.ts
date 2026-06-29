import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const campaigns = await prisma.autoCampaign.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ campaigns });
  } catch {
    return NextResponse.json({ campaigns: [] });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { niche, cities, frequency, prospectsPerCycle } = await req.json();

  if (!niche || !cities) {
    return NextResponse.json({ error: "Niche et villes requises" }, { status: 400 });
  }

  try {
    const campaign = await prisma.autoCampaign.create({
      data: {
        userId: session.user.id,
        niche: niche.trim(),
        cities: cities.trim(),
        frequency: frequency === "weekly" ? "weekly" : "daily",
        prospectsPerCycle: Math.min(Math.max(parseInt(prospectsPerCycle) || 5, 1), 20),
      },
    });
    return NextResponse.json({ campaign }, { status: 201 });
  } catch (err: any) {
    console.error("[auto-campaigns] create error:", err.message);
    return NextResponse.json({ error: "Table AutoCampaign introuvable — exécutez la migration SQL" }, { status: 500 });
  }
}
