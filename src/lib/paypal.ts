const PAYPAL_API = process.env.NODE_ENV === "production"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

export const PAYPAL_PLAN_IDS: Record<string, string> = {
  starter: process.env.PAYPAL_STARTER_PLAN_ID!,
  creator: process.env.PAYPAL_CREATOR_PLAN_ID!,
  pro:     process.env.PAYPAL_PRO_PLAN_ID!,
  agency:  process.env.PAYPAL_AGENCY_PLAN_ID!,
};

export async function getToken(): Promise<string> {
  const creds = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await res.json();
  if (!data.access_token) throw new Error("PayPal auth failed");
  return data.access_token;
}

export async function createPayPalSubscription(
  planId: string,
  userId: string
): Promise<{ id: string; approvalUrl: string }> {
  const token = await getToken();
  const base = process.env.NEXTAUTH_URL;

  const res = await fetch(`${PAYPAL_API}/v1/billing/subscriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      plan_id: planId,
      custom_id: userId,
      application_context: {
        return_url: `${base}/checkout/success?method=paypal`,
        cancel_url: `${base}/checkout/cancel`,
        shipping_preference: "NO_SHIPPING",
        user_action: "SUBSCRIBE_NOW",
      },
    }),
  });

  const data = await res.json();
  if (!data.id) throw new Error(`PayPal subscription error: ${JSON.stringify(data)}`);

  const approvalUrl = data.links?.find((l: any) => l.rel === "approve")?.href;
  return { id: data.id, approvalUrl };
}

// Real cryptographic verification of an inbound PayPal webhook, via PayPal's
// own verify-webhook-signature endpoint (server-to-server — PayPal itself
// confirms whether the transmission signature is genuine; we never verify it
// locally). Fails CLOSED: any missing config, network error, or non-SUCCESS
// verdict returns false, never a default "trust it" pass-through.
export async function verifyPayPalWebhookSignature(params: {
  authAlgo: string;
  certUrl: string;
  transmissionId: string;
  transmissionSig: string;
  transmissionTime: string;
  webhookEvent: unknown;
}): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    console.error("[paypal] PAYPAL_WEBHOOK_ID non configuré — webhook refusé");
    return false;
  }

  try {
    const token = await getToken();
    const res = await fetch(`${PAYPAL_API}/v1/notifications/verify-webhook-signature`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auth_algo: params.authAlgo,
        cert_url: params.certUrl,
        transmission_id: params.transmissionId,
        transmission_sig: params.transmissionSig,
        transmission_time: params.transmissionTime,
        webhook_id: webhookId,
        webhook_event: params.webhookEvent,
      }),
    });

    const data = await res.json();
    return data.verification_status === "SUCCESS";
  } catch (err: any) {
    console.error("[paypal] webhook verification failed:", err.message);
    return false;
  }
}
