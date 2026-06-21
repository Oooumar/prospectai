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
        select: { profileType: true } as any,
      }),
    ]);

    if (!prospect) {
      return NextResponse.json({ error: "Prospect introuvable" }, { status: 404 });
    }

    const profileType = ((user as any)?.profileType || "b2b") as "b2b" | "creator" | "agency";

    const targetLanguage = detectEmailLanguage(prospect.city);

    const email = await generateProspectEmail(
      {
        name: prospect.name,
        company: prospect.company || undefined,
        niche: prospect.niche,
        city: prospect.city,
      },
      profileType,
      targetLanguage
    );

    return NextResponse.json(email);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: "Erreur lors de la génération IA" }, { status: 500 });
  }
}
