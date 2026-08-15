import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

// Creates a Stripe Customer Portal session and returns its URL. Reused by
// every "Ajouter ma carte bancaire" entry point (settings, trial banner,
// the /pending-payment blocking screen) — one source of truth.
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId) {
      return NextResponse.json({ error: "Aucun compte de facturation Stripe associé à ce compte" }, { status: 400 });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.NEXTAUTH_URL}/dashboard`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err: any) {
    console.error("[billing/portal]", err.message);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
