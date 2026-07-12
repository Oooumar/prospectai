import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { count } = await prisma.prospect.deleteMany({
      where: { userId: session.user.id },
    });

    return NextResponse.json({ deleted: count });
  } catch (err: any) {
    console.error("[prospects/all] DELETE:", err.message);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
