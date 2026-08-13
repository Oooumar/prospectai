import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prismaAdmin } from "@/lib/prisma-admin";
import { notifyPaymentReceived } from "@/lib/commander-notify";

// Dedicated Stripe webhook for /commander payment sessions (Europe/Amérique, 100%
// online). Kept separate from /api/webhooks/stripe (SaaS subscriptions), with its
// own signing secret (STRIPE_WEBHOOK_SECRET_COMMANDER).
//
// Note: Stripe still delivers checkout.session.completed to BOTH endpoints, since
// each is independently subscribed to that event type for the whole account — it
// doesn't route by metadata. The metadata.type guard below is what keeps this
// handler from acting on subscription checkouts; symmetrically, the subscription
// webhook already ignores any event with no metadata.userId, so a deposit/full
// payment session never gets mistaken for a subscription there either.
export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  const secret = process.env.STRIPE_WEBHOOK_SECRET_COMMANDER;
  if (!secret) return NextResponse.json({ error: "Webhook non configuré" }, { status: 500 });

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const { orderId, type } = session.metadata ?? {};

    if (type === "service_order_payment" && orderId && session.payment_status === "paid") {
      const order = await (prismaAdmin.serviceOrder as any).findUnique({ where: { id: orderId } });

      if (order && order.paymentStatus !== "PAID") {
        const updated = await (prismaAdmin.serviceOrder as any).update({
          where: { id: orderId },
          data: { paymentStatus: "PAID", paymentProvider: "stripe", paymentRef: session.id },
        });
        await notifyPaymentReceived(updated, "stripe");
      }
    }
  }

  return NextResponse.json({ received: true });
}
