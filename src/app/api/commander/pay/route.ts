import { NextRequest, NextResponse } from "next/server";
import { prismaAdmin } from "@/lib/prisma-admin";
import { stripe } from "@/lib/stripe";
import { initCinetPayPayment } from "@/lib/cinetpay";
import { VALID_ZONES, ZONE_DEVISE, getPaymentRate, toXOF, type Zone } from "@/lib/commander-constants";

const STRIPE_CURRENCY: Partial<Record<Zone, string>> = {
  europe:   "eur",
  amerique: "usd",
};

// Creates a payment session for an existing ServiceOrder and returns the URL to
// redirect the client to.
//  - europe/amerique → Stripe, 100% of prixEstime, paid in full online.
//  - africa-fr/africa-en → CinetPay Mobile Money, 30% deposit only —
//    the remaining 70% stays manual, collected on delivery.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, zone } = body;

    if (!orderId || typeof orderId !== "string")
      return NextResponse.json({ error: "orderId manquant" }, { status: 400 });
    if (!VALID_ZONES.includes(zone))
      return NextResponse.json({ error: "Zone invalide" }, { status: 400 });
    if (!process.env.DATABASE_URL_ADMIN)
      return NextResponse.json({ error: "Configuration serveur manquante" }, { status: 500 });
    if (!process.env.NEXTAUTH_URL)
      return NextResponse.json({ error: "Configuration serveur manquante (NEXTAUTH_URL)" }, { status: 500 });

    const order = await prismaAdmin.serviceOrder.findUnique({ where: { id: orderId } });
    if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    if ((order as any).paymentStatus === "PAID")
      return NextResponse.json({ error: "Cette commande est déjà payée" }, { status: 409 });

    const z             = zone as Zone;
    const devise        = ZONE_DEVISE[z];
    // 30% for Africa (CinetPay deposit), 100% for Europe/Amérique (Stripe, paid in full)
    const montantAcompte = Math.round(order.prixEstime * getPaymentRate(z));
    const baseUrl        = process.env.NEXTAUTH_URL;
    const successUrl     = `${baseUrl}/commander/success?orderId=${order.id}`;
    const cancelUrl       = `${baseUrl}/commander/cancel?orderId=${order.id}`;

    let url: string;
    let paymentRef: string;
    let provider: "stripe" | "cinetpay";

    if (z === "europe" || z === "amerique") {
      provider = "stripe";
      const currency = STRIPE_CURRENCY[z]!;

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [{
          price_data: {
            currency,
            product_data: { name: `Paiement — commande #${order.id.slice(-6)}` },
            unit_amount: Math.round(montantAcompte * 100),
          },
          quantity: 1,
        }],
        customer_email: order.email,
        metadata: { orderId: order.id, type: "service_order_payment" },
        success_url: `${successUrl}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl,
      });

      if (!session.url)
        return NextResponse.json({ error: "Échec création session Stripe" }, { status: 502 });
      url = session.url;
      paymentRef = session.id;

    } else {
      provider = "cinetpay";
      const transactionId = `cmd_${order.id}_${Date.now()}`;
      const amountXOF = toXOF(montantAcompte, devise);

      const result = await initCinetPayPayment({
        transactionId,
        amountXOF,
        description: `Acompte 30% — commande #${order.id.slice(-6)}`,
        customerName: order.nom,
        customerEmail: order.email,
        customerPhone: order.telephone,
        notifyUrl: `${baseUrl}/api/webhooks/cinetpay`,
        returnUrl: successUrl,
      });

      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });
      url = result.paymentUrl;
      paymentRef = transactionId;
    }

    await (prismaAdmin.serviceOrder as any).update({
      where: { id: order.id },
      data: { paymentProvider: provider, paymentRef, montantAcompte },
    });

    return NextResponse.json({ url });
  } catch (err: any) {
    console.error("[commander/pay] POST:", err.message);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

// Polled by /commander/success and /commander/cancel to display live payment status.
// Public (no auth — orderId is an unguessable cuid) but deliberately returns only
// non-sensitive fields: never email/telephone/besoin/entreprise.
export async function GET(req: NextRequest) {
  try {
    const orderId = new URL(req.url).searchParams.get("orderId");
    if (!orderId) return NextResponse.json({ error: "orderId manquant" }, { status: 400 });
    if (!process.env.DATABASE_URL_ADMIN)
      return NextResponse.json({ error: "Configuration serveur manquante" }, { status: 500 });

    const order = await prismaAdmin.serviceOrder.findUnique({
      where: { id: orderId },
      select: {
        id: true, nom: true, typePrecis: true, marche: true, devise: true,
        prixEstime: true, montantAcompte: true, paymentStatus: true, paymentProvider: true,
      } as any,
    });
    if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });

    return NextResponse.json({ order });
  } catch (err: any) {
    console.error("[commander/pay] GET:", err.message);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
