import { NextRequest, NextResponse } from "next/server";
import { createPayPalSubscription, PAYPAL_PLAN_IDS } from "@/lib/paypal";

export async function POST(req: NextRequest) {
  try {
    const { userId, plan } = await req.json();

    const planId = PAYPAL_PLAN_IDS[plan];
    if (!planId || planId === "undefined") {
      return NextResponse.json({ error: "PAYPAL_PLAN_ID non configuré" }, { status: 503 });
    }

    const { id, approvalUrl } = await createPayPalSubscription(planId, userId);
    return NextResponse.json({ subscriptionId: id, approvalUrl });
  } catch (err: any) {
    console.error("PayPal create:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
