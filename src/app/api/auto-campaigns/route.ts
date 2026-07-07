import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlanLimits, isUnlimited, PLAN_DISPLAY, NEXT_PLAN } from "@/lib/plan-limits";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const campaigns = await prisma.autoCampaign.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ campaigns });
  } catch (err: any) {
    console.error("[auto-campaigns] GET error:", err.message);
    return NextResponse.json({ campaigns: [] });
  }
}

export async function POST(req: NextRequest) {
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

  if (!isAdmin && limits.autoCampaigns === 0) {
    const required = NEXT_PLAN[u?.plan ?? "starter"] ?? "pro";
    return NextResponse.json({
      error: `Campagnes automatiques disponibles à partir du plan ${PLAN_DISPLAY[required] ?? "PRO"}.`,
      blockedByPlan: true,
      requiredPlan: required,
    }, { status: 403 });
  }

  if (!isAdmin && !isUnlimited(limits.autoCampaigns)) {
    const existing = await prisma.autoCampaign.count({ where: { userId: session.user.id } });
    if (existing >= limits.autoCampaigns) {
      return NextResponse.json({
        error: `Limite de campagnes automatiques atteinte (${limits.autoCampaigns} max) — passez au plan supérieur.`,
        limitReached: true,
      }, { status: 429 });
    }
  }

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
    console.error("[auto-campaigns] POST error:", err.message);
    let msg = "Erreur interne";
    const raw = err.message || "";
    if (raw.includes("permission denied")) {
      msg = "Permission refusée sur la table AutoCampaign — exécutez : GRANT ALL ON \"AutoCampaign\" TO authenticator;";
    } else if (err.code === "P2021" || raw.includes("does not exist")) {
      msg = "Table AutoCampaign introuvable — exécutez la migration SQL dans Neon";
    } else if (raw.length > 0) {
      msg = raw.length > 200 ? raw.substring(0, 200) : raw;
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
