import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  userId: z.string(),
  action: z.enum(["activate", "deactivate"]),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const caller = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (caller?.role !== "admin") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  const { userId, action } = parsed.data;

  // Prevent the admin from accidentally deactivating themselves
  if (userId === session.user.id && action === "deactivate") {
    return NextResponse.json({ error: "Impossible de désactiver son propre compte" }, { status: 400 });
  }

  const newStatus = action === "activate" ? "active" : "pending";

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { subscriptionStatus: newStatus },
    select: { id: true, email: true, subscriptionStatus: true },
  });

  return NextResponse.json({ success: true, user: updated });
}
