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
    const { prospectId } = await req.json();

    const prospect = await prisma.prospect.findFirst({
      where: { id: prospectId, userId: session.user.id },
    });

    if (!prospect) {
      return NextResponse.json({ error: "Prospect introuvable" }, { status: 404 });
    }

    // Raw SQL query so field fetching is never silently dropped by a stale Prisma client
    type UserRow = { profileType: string | null; companyName: string | null; website: string | null; productDescription: string | null; whatsappNumber: string | null };
    let userRow: UserRow | null = null;
    try {
      const rows = await prisma.$queryRaw<UserRow[]>`
        SELECT "profileType", "companyName", "website", "productDescription", "whatsappNumber"
        FROM "User" WHERE "id" = ${session.user.id}
      `;
      userRow = rows[0] ?? null;
    } catch {
      const rows = await prisma.$queryRaw<Array<{ profileType: string | null; companyName: string | null; website: string | null }>>`
        SELECT "profileType", "companyName", "website" FROM "User" WHERE "id" = ${session.user.id}
      `;
      if (rows[0]) userRow = { ...rows[0], productDescription: null, whatsappNumber: null };
    }

    const profileType = (userRow?.profileType || "b2b") as "b2b" | "creator" | "agency";
    const companyName = userRow?.companyName ?? undefined;
    const website = userRow?.website ?? undefined;
    const productDescription = userRow?.productDescription ?? undefined;
    const whatsappNumber = userRow?.whatsappNumber ?? undefined;

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
