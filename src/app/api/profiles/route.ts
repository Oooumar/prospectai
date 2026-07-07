import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlanLimits, isUnlimited } from "@/lib/plan-limits";

type ProfileRow = {
  id: string; userId: string; name: string;
  companyName: string | null; website: string | null;
  productDescription: string | null; whatsappNumber: string | null;
  isDefault: boolean; createdAt: Date; updatedAt: Date;
};

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const profiles = await prisma.$queryRaw<ProfileRow[]>`
      SELECT "id","userId","name","companyName","website","productDescription","whatsappNumber","isDefault","createdAt","updatedAt"
      FROM "ProductProfile" WHERE "userId" = ${session.user.id}
      ORDER BY "isDefault" DESC, "createdAt" ASC
    `;
    return NextResponse.json({ profiles });
  } catch (err: any) {
    console.error("[profiles] GET:", err.message);
    return NextResponse.json({ profiles: [], error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { name, companyName, website, productDescription, whatsappNumber } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Le nom du profil est requis" }, { status: 400 });

    // Plan check: profile count limit
    type UserPlanRow = { plan: string; role: string };
    const planRows = await prisma.$queryRaw<UserPlanRow[]>`
      SELECT "plan", "role" FROM "User" WHERE "id" = ${session.user.id}
    `;
    const u = planRows[0];
    const isAdmin = u?.role === "admin";
    const limits = getPlanLimits(u?.plan ?? "starter");

    const existing = await prisma.$queryRaw<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM "ProductProfile" WHERE "userId" = ${session.user.id}
    `;
    const count = existing[0]?.n ?? 0;
    const isFirst = count === 0;

    if (!isAdmin && !isUnlimited(limits.maxProfiles) && count >= limits.maxProfiles) {
      return NextResponse.json({
        error: `Limite de profils atteinte (${limits.maxProfiles} max) — passez au plan supérieur.`,
        limitReached: true,
      }, { status: 429 });
    }

    const id = `pp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await prisma.$executeRaw`
      INSERT INTO "ProductProfile" ("id","userId","name","companyName","website","productDescription","whatsappNumber","isDefault","createdAt","updatedAt")
      VALUES (${id}, ${session.user.id}, ${name.trim()},
        ${companyName || null}, ${website || null}, ${productDescription || null}, ${whatsappNumber || null},
        ${isFirst}, NOW(), NOW())
    `;

    const rows = await prisma.$queryRaw<ProfileRow[]>`
      SELECT * FROM "ProductProfile" WHERE "id" = ${id}
    `;
    return NextResponse.json({ profile: rows[0] }, { status: 201 });
  } catch (err: any) {
    console.error("[profiles] POST:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
