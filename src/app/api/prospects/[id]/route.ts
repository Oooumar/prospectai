import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  status: z.enum(["NEW","CONTACTED","OPENED","REPLIED","CONVERTED","UNSUBSCRIBED"]).optional(),
  notes: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

    const prospect = await prisma.prospect.updateMany({
      where: { id, userId: session.user.id },
      data: parsed.data,
    });

    return NextResponse.json({ prospect });
  } catch (err: any) {
    console.error("[prospects/id] PATCH:", err.message);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
