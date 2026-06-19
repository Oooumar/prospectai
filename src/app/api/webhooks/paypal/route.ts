import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
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
    console.error("PayPal webhook:", err);
    return NextResponse.json({ error: "Erreur webhook" }, { status: 500 });
  }
}
