import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  const db = prisma as any;

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as any;
      const { userId } = session.metadata ?? {};
      if (!userId) break;
      await db.user.update({
        where: { id: userId },
        data: {
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription,
          subscriptionStatus: "trialing",
        },
      });
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as any;
      const statusMap: Record<string, string> = {
        trialing: "trialing",
        active: "active",
        canceled: "cancelled",
        past_due: "past_due",
        unpaid: "past_due",
      };
      const users = await db.user.findMany({ where: { stripeSubscriptionId: sub.id } });
      if (users.length) {
        await db.user.update({
          where: { id: users[0].id },
          data: { subscriptionStatus: statusMap[sub.status] ?? sub.status },
        });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as any;
      const users = await db.user.findMany({ where: { stripeSubscriptionId: sub.id } });
      if (users.length) {
        await db.user.update({
          where: { id: users[0].id },
          data: { subscriptionStatus: "cancelled" },
        });
      }
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as any;
      if (invoice.subscription && invoice.billing_reason !== "subscription_create") {
        const users = await db.user.findMany({ where: { stripeSubscriptionId: invoice.subscription } });
        if (users.length) {
          await db.user.update({
            where: { id: users[0].id },
            data: { subscriptionStatus: "active" },
          });
        }
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as any;
      if (invoice.subscription) {
        const users = await db.user.findMany({ where: { stripeSubscriptionId: invoice.subscription } });
        if (users.length) {
          await db.user.update({
            where: { id: users[0].id },
            data: { subscriptionStatus: "past_due" },
          });
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
