import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createPayPalSubscription, PAYPAL_PLAN_IDS } from "@/lib/paypal";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const user = session.user as any;
    const plan = user.plan || "starter";

    const planId = PAYPAL_PLAN_IDS[plan];
    if (!planId || planId === "undefined") {
      return NextResponse.json({ error: "PAYPAL_PLAN_ID non configuré" }, { status: 503 });
    }

    const { id, approvalUrl } = await createPayPalSubscription(planId, session.user.id);
    return NextResponse.json({ subscriptionId: id, approvalUrl });
  } catch (err: any) {
    console.error("[checkout/paypal]", err.message);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
