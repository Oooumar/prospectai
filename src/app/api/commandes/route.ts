import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prismaAdmin } from "@/lib/prisma-admin";

// Auth guard: même pattern que toutes les routes API protégées du projet.
// prismaAdmin (rôle neondb_owner) est requis car authenticator n'a que INSERT
// sur ServiceOrder (pas SELECT ni UPDATE).

const VALID_STATUTS = ["nouvelle", "en cours", "terminée", "annulée"] as const;

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    if (!process.env.DATABASE_URL_ADMIN)
      return NextResponse.json({ error: "Configuration serveur manquante" }, { status: 500 });

    const orders = await prismaAdmin.serviceOrder.findMany({
      orderBy: { createdAt: "desc" },
    });

    const nouvelles = orders.filter(o => o.statut === "nouvelle").length;
    const enCours   = orders.filter(o => o.statut === "en cours").length;
    const terminees = orders.filter(o => o.statut === "terminée").length;

    return NextResponse.json({ orders, total: orders.length, nouvelles, enCours, terminees });
  } catch (err: any) {
    console.error("[commandes] GET:", err.message);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    if (!process.env.DATABASE_URL_ADMIN)
      return NextResponse.json({ error: "Configuration serveur manquante" }, { status: 500 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

    const body = await req.json();
    const { statut } = body;

    if (!VALID_STATUTS.includes(statut))
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });

    await prismaAdmin.serviceOrder.update({
      where: { id },
      data: { statut },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[commandes] PATCH:", err.message);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
