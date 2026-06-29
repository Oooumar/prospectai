import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const draft = await prisma.emailLog.findFirst({
      where: { id, userId: session.user.id, status: "DRAFT" },
    });
    if (!draft) return NextResponse.json({ error: "Brouillon introuvable" }, { status: 404 });

    const { subject, body } = await req.json();
    const data: Record<string, string> = {};
    if (subject) data.subject = subject;
    if (body) data.body = body;

    const updated = await prisma.emailLog.update({ where: { id }, data });
    return NextResponse.json({ draft: updated });
  } catch (err: any) {
    console.error("[drafts/id] PATCH:", err.message);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const draft = await prisma.emailLog.findFirst({
      where: { id, userId: session.user.id, status: "DRAFT" },
    });
    if (!draft) return NextResponse.json({ error: "Brouillon introuvable" }, { status: 404 });

    await prisma.emailLog.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[drafts/id] DELETE:", err.message);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
