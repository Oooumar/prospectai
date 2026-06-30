import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    return NextResponse.json({ profiles: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { name, companyName, website, productDescription, whatsappNumber } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Le nom du profil est requis" }, { status: 400 });

    const existing = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM "ProductProfile" WHERE "userId" = ${session.user.id}
    `;
    const isFirst = Number(existing[0]?.count ?? 0) === 0;

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
    return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 });
  }
}
