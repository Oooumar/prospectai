import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe, PLAN_META } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { plan } = await req.json();

    const meta = PLAN_META[plan];
    if (!meta) return NextResponse.json({ error: "Plan invalide" }, { status: 400 });

    if (!meta.priceId || meta.priceId === "undefined") {
      return NextResponse.json({ error: "STRIPE_PRICE_ID non configuré" }, { status: 503 });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: session.user.email!,
      line_items: [{ price: meta.priceId, quantity: 1 }],
      // No card required to start the trial — Checkout only collects a
      // payment method if something is due today (it isn't, during a trial).
      payment_method_collection: "if_required",
      subscription_data: {
        trial_period_days: 14,
        // Explicit, not left to Stripe's default: if the trial ends with no
        // payment method on file, PAUSE the subscription rather than cancel
        // it. This keeps the Stripe customer/subscription (and our User row
        // + all their data) intact — access is gated by subscriptionStatus
        // in dashboard/layout.tsx, and resumes automatically once a card is
        // added via the Customer Portal (see /api/billing/portal).
        trial_settings: {
          end_behavior: { missing_payment_method: "pause" },
        },
        metadata: { userId: session.user.id, plan },
      },
      metadata: { userId: session.user.id, plan },
      success_url: `${process.env.NEXTAUTH_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/checkout/cancel`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err: any) {
    console.error("[checkout/stripe]", err.message);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
