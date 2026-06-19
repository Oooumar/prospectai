import { NextRequest, NextResponse } from "next/server";
import { stripe, PLAN_META } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const { userId, plan, email } = await req.json();

    const meta = PLAN_META[plan];
    if (!meta) return NextResponse.json({ error: "Plan invalide" }, { status: 400 });

    if (!meta.priceId || meta.priceId === "undefined") {
      return NextResponse.json({ error: "STRIPE_PRICE_ID non configuré" }, { status: 503 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [{ price: meta.priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 14,
        metadata: { userId, plan },
      },
      metadata: { userId, plan },
      success_url: `${process.env.NEXTAUTH_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/checkout/cancel`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe checkout:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
