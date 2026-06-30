import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateWhatsAppMessage } from "@/lib/groq";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { prospectId, profileId } = await req.json();
    if (!prospectId) {
      return NextResponse.json({ error: "prospectId requis" }, { status: 400 });
    }

    const prospect = await prisma.prospect.findFirst({
      where: { id: prospectId, userId: session.user.id },
    });
    if (!prospect) {
      return NextResponse.json({ error: "Prospect introuvable" }, { status: 404 });
    }
    if (!prospect.phone) {
      return NextResponse.json({ error: "Ce prospect n'a pas de numéro de téléphone" }, { status: 400 });
    }

    type ProfileRow = { companyName: string | null; website: string | null; productDescription: string | null; whatsappNumber: string | null };

    let sender: { companyName?: string; productDescription?: string; website?: string } = {};

    if (profileId) {
      const pRows = await prisma.$queryRaw<ProfileRow[]>`
        SELECT "companyName","website","productDescription","whatsappNumber"
        FROM "ProductProfile" WHERE "id" = ${profileId} AND "userId" = ${session.user.id}
      `;
      const p = pRows[0];
      if (p) {
        sender = { companyName: p.companyName ?? undefined, website: p.website ?? undefined, productDescription: p.productDescription ?? undefined, whatsappNumber: p.whatsappNumber ?? undefined };
      }
    } else {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { companyName: true, productDescription: true, website: true, whatsappNumber: true },
      });
      sender = { companyName: user?.companyName ?? undefined, productDescription: user?.productDescription ?? undefined, website: user?.website ?? undefined, whatsappNumber: user?.whatsappNumber ?? undefined };
    }

    const result = await generateWhatsAppMessage(
      { name: prospect.name, niche: prospect.niche, city: prospect.city },
      sender
    );

    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/whatsapp/generate]", err);
    return NextResponse.json({ error: "Erreur lors de la génération" }, { status: 500 });
  }
}
