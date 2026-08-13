// CinetPay v2 Checkout API client — deposit payments for Mobile Money zones
// (africa-fr / africa-en). Amounts must already be converted to XOF before
// calling this — CinetPay Mobile Money settles in XOF/XAF/CDF/GNF only, never USD/EUR.
//
// Docs: https://docs.cinetpay.com/api/1.0-en/checkout/initialisation
//       https://docs.cinetpay.com/api/1.0-en/checkout/verification
//
// Security note (per CinetPay docs): the notify_url webhook payload must never
// be trusted directly — it only tells you *that* something happened, not the
// verified outcome. Always confirm via checkCinetPayPayment() (the /payment/check
// endpoint) before marking an order PAID. See src/app/api/webhooks/cinetpay/route.ts.

const CINETPAY_BASE = "https://api-checkout.cinetpay.com/v2";

interface InitParams {
  transactionId: string;
  amountXOF: number;
  description: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notifyUrl: string;
  returnUrl: string;
}

type InitResult = { ok: true; paymentUrl: string } | { ok: false; error: string };

export async function initCinetPayPayment(params: InitParams): Promise<InitResult> {
  const apikey = process.env.CINETPAY_API_KEY;
  const siteId = process.env.CINETPAY_SITE_ID;
  if (!apikey || !siteId) return { ok: false, error: "CinetPay non configuré (clés manquantes)" };

  try {
    const res = await fetch(`${CINETPAY_BASE}/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apikey,
        site_id: siteId,
        transaction_id: params.transactionId,
        amount: params.amountXOF,
        currency: "XOF",
        description: params.description,
        notify_url: params.notifyUrl,
        return_url: params.returnUrl,
        channels: "MOBILE_MONEY",
        customer_name: params.customerName || "Client",
        customer_email: params.customerEmail,
        customer_phone_number: params.customerPhone,
      }),
    });

    const data = await res.json();
    const paymentUrl = data?.data?.payment_url;
    if (paymentUrl) return { ok: true, paymentUrl };

    return {
      ok: false,
      error: data?.message || data?.description || `Échec initialisation CinetPay (code ${data?.code ?? "?"})`,
    };
  } catch (err: any) {
    return { ok: false, error: err.message || "Erreur réseau CinetPay" };
  }
}

type CheckStatus = "ACCEPTED" | "REFUSED" | "PENDING" | "OTHER";

export async function checkCinetPayPayment(transactionId: string): Promise<{ status: CheckStatus; raw: any }> {
  const apikey = process.env.CINETPAY_API_KEY;
  const siteId = process.env.CINETPAY_SITE_ID;
  if (!apikey || !siteId) return { status: "OTHER", raw: null };

  try {
    const res = await fetch(`${CINETPAY_BASE}/payment/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apikey, site_id: siteId, transaction_id: transactionId }),
    });

    const data = await res.json();
    const status = data?.data?.status;
    if (status === "ACCEPTED" || status === "REFUSED" || status === "PENDING") {
      return { status, raw: data };
    }
    return { status: "OTHER", raw: data };
  } catch (err: any) {
    return { status: "OTHER", raw: { error: err.message } };
  }
}
