import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PAYPAL_REQUIRED_HEADERS = [
  "paypal-transmission-id",
  "paypal-transmission-time",
  "paypal-transmission-sig",
  "paypal-auth-algo",
];

function verifyPayPalOrigin(req: NextRequest): boolean {
  return PAYPAL_REQUIRED_HEADERS.every(h => req.headers.get(h));
}

export async function POST(req: NextRequest) {
  if (!verifyPayPalOrigin(req)) {
    return NextResponse.json({ error: "Missing PayPal headers" }, { status: 401 });
  }

  try {
    const event = await req.json();
    const db = prisma as any;

    switch (event.event_type) {
      case "BILLING.SUBSCRIPTION.ACTIVATED": {
        const sub = event.resource;
        const userId = sub.custom_id;
        if (!userId) break;
        await db.user.update({
          where: { id: userId },
          data: { paypalSubscriptionId: sub.id, subscriptionStatus: "trialing" },
        });
        break;
      }

      case "BILLING.SUBSCRIPTION.RENEWED":
      case "PAYMENT.SALE.COMPLETED": {
        const res = event.resource;
        const subId = res.billing_agreement_id ?? res.id;
        if (!subId) break;
        const users = await db.user.findMany({ where: { paypalSubscriptionId: subId } });
        if (users.length) {
          await db.user.update({
            where: { id: users[0].id },
            data: { subscriptionStatus: "active" },
          });
        }
        break;
      }

      case "BILLING.SUBSCRIPTION.CANCELLED":
      case "BILLING.SUBSCRIPTION.EXPIRED": {
        const sub = event.resource;
        const users = await db.user.findMany({ where: { paypalSubscriptionId: sub.id } });
        if (users.length) {
          await db.user.update({
            where: { id: users[0].id },
            data: { subscriptionStatus: "cancelled" },
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[webhook/paypal]", err);
    return NextResponse.json({ error: "Erreur webhook" }, { status: 500 });
  }
}
