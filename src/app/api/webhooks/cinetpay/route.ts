import { NextRequest, NextResponse } from "next/server";
import { prismaAdmin } from "@/lib/prisma-admin";
import { checkCinetPayPayment } from "@/lib/cinetpay";
import { notifyPaymentReceived } from "@/lib/commander-notify";

// CinetPay notify_url — called after every status change on a transaction.
// The payload is NEVER trusted directly (anyone can POST to this URL); it only
// tells us *which* transaction_id to re-check. We then confirm server-to-server
// via checkCinetPayPayment() (/v2/payment/check) before touching paymentStatus —
// this is CinetPay's own recommended flow, explicitly to prevent a man-in-the-
// middle from forging a fake "paid" notification.
//
// Body shape isn't guaranteed (form-encoded in most integrations, some send
// JSON) — parsed defensively below rather than assumed.
export async function POST(req: NextRequest) {
  const raw = await req.text();

  let transactionId: string | undefined;
  try {
    const json = JSON.parse(raw);
    transactionId = json.cpm_trans_id || json.transaction_id;
  } catch {
    const params = new URLSearchParams(raw);
    transactionId = params.get("cpm_trans_id") || params.get("transaction_id") || undefined;
  }

  if (!transactionId) return NextResponse.json({ ok: true });

  const order = await (prismaAdmin.serviceOrder as any).findFirst({
    where: { paymentRef: transactionId, paymentProvider: "cinetpay" },
  });
  if (!order) return NextResponse.json({ ok: true });
  if (order.paymentStatus === "PAID") return NextResponse.json({ ok: true }); // idempotent, already processed

  const result = await checkCinetPayPayment(transactionId);

  if (result.status === "ACCEPTED") {
    const updated = await (prismaAdmin.serviceOrder as any).update({
      where: { id: order.id },
      data: { paymentStatus: "PAID" },
    });
    await notifyPaymentReceived(updated, "cinetpay");
  } else if (result.status === "REFUSED") {
    await (prismaAdmin.serviceOrder as any).update({
      where: { id: order.id },
      data: { paymentStatus: "FAILED" },
    });
  }
  // PENDING / OTHER → no-op, wait for the next notify call

  return NextResponse.json({ ok: true });
}
