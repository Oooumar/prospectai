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

    const [prospect, user] = await Promise.all([
      prisma.prospect.findFirst({
        where: { id: prospectId, userId: session.user.id },
      }),
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { profileType: true, companyName: true, website: true, productDescription: true } as any,
      }),
    ]);

    if (!prospect) {
      return NextResponse.json({ error: "Prospect introuvable" }, { status: 404 });
    }

    const profileType = ((user as any)?.profileType || "b2b") as "b2b" | "creator" | "agency";
    const companyName = (user as any)?.companyName as string | null | undefined;
    const website = (user as any)?.website as string | null | undefined;
    const productDescription = (user as any)?.productDescription as string | null | undefined;

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
      }
    );

    return NextResponse.json(email);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: "Erreur lors de la génération IA" }, { status: 500 });
  }
}
