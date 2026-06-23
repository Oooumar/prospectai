import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const existing = await prisma.autoCampaign.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (typeof body.active === "boolean") data.active = body.active;
  if (body.niche) data.niche = body.niche;
  if (body.cities) data.cities = body.cities;
  if (body.frequency) data.frequency = body.frequency;
  if (body.prospectsPerCycle) data.prospectsPerCycle = Math.min(Math.max(parseInt(body.prospectsPerCycle), 1), 20);

  const updated = await prisma.autoCampaign.update({ where: { id }, data });
  return NextResponse.json({ campaign: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const existing = await prisma.autoCampaign.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });

  await prisma.autoCampaign.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
