import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  dailyLimit: z.number().min(1).max(1000).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),
  language: z.enum(["fr", "en", "de", "it", "es"]).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, dailyLimit: true, createdAt: true, image: true },
  });

  return NextResponse.json({ user });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  const { name, dailyLimit, currentPassword, newPassword, language } = parsed.data;
  const updateData: Record<string, any> = {};

  if (name) updateData.name = name;
  if (dailyLimit) updateData.dailyLimit = dailyLimit;
  if (language) updateData.language = language;

  if (currentPassword && newPassword) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user?.password) return NextResponse.json({ error: "Compte OAuth — pas de mot de passe" }, { status: 400 });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return NextResponse.json({ error: "Mot de passe actuel incorrect" }, { status: 400 });

    updateData.password = await bcrypt.hash(newPassword, 12);
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: updateData,
    select: { id: true, name: true, email: true, dailyLimit: true },
  });

  return NextResponse.json({ user });
}
