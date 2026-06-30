import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    // Check ownership
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT "id" FROM "ProductProfile" WHERE "id" = ${id} AND "userId" = ${session.user.id}
    `;
    if (!rows[0]) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

    if (body.setDefault === true) {
      await prisma.$executeRaw`
        UPDATE "ProductProfile" SET "isDefault" = false WHERE "userId" = ${session.user.id}
      `;
      await prisma.$executeRaw`
        UPDATE "ProductProfile" SET "isDefault" = true, "updatedAt" = NOW() WHERE "id" = ${id}
      `;
    } else {
      const { name, companyName, website, productDescription, whatsappNumber } = body;
      if (name !== undefined && !name?.trim()) {
        return NextResponse.json({ error: "Le nom du profil est requis" }, { status: 400 });
      }
      await prisma.$executeRaw`
        UPDATE "ProductProfile"
        SET "name" = COALESCE(${name?.trim() ?? null}, "name"),
            "companyName" = ${companyName ?? null},
            "website" = ${website ?? null},
            "productDescription" = ${productDescription ?? null},
            "whatsappNumber" = ${whatsappNumber ?? null},
            "updatedAt" = NOW()
        WHERE "id" = ${id}
      `;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[profiles] PATCH:", err.message);
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { id } = await params;

    const rows = await prisma.$queryRaw<{ id: string; isDefault: boolean }[]>`
      SELECT "id","isDefault" FROM "ProductProfile" WHERE "id" = ${id} AND "userId" = ${session.user.id}
    `;
    if (!rows[0]) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

    await prisma.$executeRaw`DELETE FROM "ProductProfile" WHERE "id" = ${id}`;

    // If deleted profile was default, set the first remaining as default
    if (rows[0].isDefault) {
      await prisma.$executeRaw`
        UPDATE "ProductProfile" SET "isDefault" = true, "updatedAt" = NOW()
        WHERE "id" = (SELECT "id" FROM "ProductProfile" WHERE "userId" = ${session.user.id} ORDER BY "createdAt" ASC LIMIT 1)
      `;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[profiles] DELETE:", err.message);
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
  }
}
