import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(2),
  niche: z.string().min(2),
  city: z.string().min(2),
  subject: z.string().min(2),
  template: z.string().min(10),
  dailyLimit: z.number().min(1).max(500).default(20),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const campaigns = await prisma.campaign.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ campaigns });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  const campaign = await prisma.campaign.create({
    data: { ...parsed.data, userId: session.user.id },
  });

  return NextResponse.json({ campaign }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id, ...updates } = await req.json();

  const campaign = await prisma.campaign.updateMany({
    where: { id, userId: session.user.id },
    data: updates,
  });

  return NextResponse.json({ campaign });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

  await prisma.campaign.deleteMany({ where: { id, userId: session.user.id } });
  return NextResponse.json({ success: true });
}
