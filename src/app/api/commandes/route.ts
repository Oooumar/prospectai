import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { prismaAdmin } from "@/lib/prisma-admin";

// Auth guard: même pattern que toutes les routes API protégées du projet.
// prismaAdmin (rôle neondb_owner) est requis car authenticator n'a que INSERT
// sur ServiceOrder (pas SELECT ni UPDATE).
//
// ServiceOrder n'a PAS de userId : ce sont les leads/commandes du funnel
// public /commander (site web ProspectAI/ZalakoDigital), pas une ressource
// par compte SaaS. Cette route est donc réservée aux admins — voir
// api/admin/users/route.ts pour le même pattern de vérification de rôle.
// (CVE interne : cette vérification manquait, exposant les commandes de
// TOUS les clients à N'IMPORTE QUEL compte connecté — corrigé le 2026-08-17.)

const VALID_STATUTS = ["nouvelle", "en cours", "terminée", "annulée"] as const;

async function requireAdmin(session: { user?: { id?: string | null } } | null) {
  if (!session?.user?.id) return { ok: false as const, status: 401, error: "Non autorisé" };
  const caller = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (caller?.role !== "admin") return { ok: false as const, status: 403, error: "Accès refusé" };
  return { ok: true as const };
}

export async function GET() {
  try {
    const session = await auth();
    const check = await requireAdmin(session);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

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
    const check = await requireAdmin(session);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

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
