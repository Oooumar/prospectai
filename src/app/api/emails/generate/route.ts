import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateProspectEmail, detectEmailLanguage } from "@/lib/groq";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { prospectId, profileId } = await req.json();

    const prospect = await prisma.prospect.findFirst({
      where: { id: prospectId, userId: session.user.id },
    });

    if (!prospect) {
      return NextResponse.json({ error: "Prospect introuvable" }, { status: 404 });
    }

    type UserRow = { profileType: string | null; companyName: string | null; website: string | null; productDescription: string | null; whatsappNumber: string | null };
    type ProfileRow = { companyName: string | null; website: string | null; productDescription: string | null; whatsappNumber: string | null };

    let companyName: string | undefined;
    let website: string | undefined;
    let productDescription: string | undefined;
    let whatsappNumber: string | undefined;
    let profileType: "b2b" | "creator" | "agency" = "b2b";

    if (profileId) {
      // Use the selected product profile
      const pRows = await prisma.$queryRaw<ProfileRow[]>`
        SELECT "companyName","website","productDescription","whatsappNumber"
        FROM "ProductProfile" WHERE "id" = ${profileId} AND "userId" = ${session.user.id}
      `;
      const p = pRows[0];
      if (p) {
        companyName = p.companyName ?? undefined;
        website = p.website ?? undefined;
        productDescription = p.productDescription ?? undefined;
        whatsappNumber = p.whatsappNumber ?? undefined;
      }
    }

    // Always fetch profileType from User; fall back to User fields if no profileId/profile found
    let userRow: UserRow | null = null;
    try {
      const rows = await prisma.$queryRaw<UserRow[]>`
        SELECT "profileType","companyName","website","productDescription","whatsappNumber"
        FROM "User" WHERE "id" = ${session.user.id}
      `;
      userRow = rows[0] ?? null;
    } catch {
      const rows = await prisma.$queryRaw<Array<{ profileType: string | null; companyName: string | null; website: string | null }>>`
        SELECT "profileType","companyName","website" FROM "User" WHERE "id" = ${session.user.id}
      `;
      if (rows[0]) userRow = { ...rows[0], productDescription: null, whatsappNumber: null };
    }

    profileType = (userRow?.profileType || "b2b") as "b2b" | "creator" | "agency";
    if (!profileId) {
      companyName = userRow?.companyName ?? undefined;
      website = userRow?.website ?? undefined;
      productDescription = userRow?.productDescription ?? undefined;
      whatsappNumber = userRow?.whatsappNumber ?? undefined;
    }

    const targetLanguage = detectEmailLanguage(prospect.city);

    const email = await generateProspectEmail(
      {
        name: prospect.name,
        company: prospect.company || undefined,
        niche: prospect.niche,
        city: prospect.city,
      },
      profileType,
      targetLanguage,
      {
        companyName: companyName || undefined,
        website: website || undefined,
        productDescription: productDescription || undefined,
        whatsappNumber: whatsappNumber || undefined,
      }
    );

    return NextResponse.json(email);
  } catch (err: any) {
    console.error("[generate] unhandled error:", err);
    return NextResponse.json({ error: "Erreur lors de la génération IA" }, { status: 500 });
  }
}
