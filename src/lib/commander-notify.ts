import { resend } from "@/lib/resend";
import { getPaymentRate, type Zone } from "@/lib/commander-constants";

interface OrderForNotify {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  typePrecis: string;
  marche: string;
  devise: string;
  prixEstime: number;
  montantAcompte: number | null;
}

const TYPE_LABELS: Record<string, string> = {
  vitrine:     "Site vitrine",
  pro_seo:     "Site Pro + SEO",
  boutique:    "Boutique en ligne",
  webapp:      "Web App / PWA",
  native:      "App mobile native",
  menu_qr:     "Menu QR Code",
  menu_tablet: "Menu tablette clients",
  menu_staff:  "App tablette serveurs",
};

function fmtPrice(amount: number, devise: string): string {
  if (devise === "FCFA") return `${Math.round(amount).toLocaleString("fr-FR")} FCFA`;
  if (devise === "USD")  return `$${amount.toLocaleString("en-US")}`;
  return `${amount.toLocaleString("fr-FR")} €`;
}

// Sends the "payment received" confirmation to both the client and the admin,
// once a Stripe or CinetPay webhook has confirmed a payment. Message wording
// depends on the zone: Africa is a 30% deposit (balance due on delivery),
// Europe/Amérique is paid in full (nothing left to collect).
export async function notifyPaymentReceived(order: OrderForNotify, provider: "stripe" | "cinetpay") {
  const fromEmail     = process.env.RESEND_FROM_EMAIL || "contact@prospectai.company";
  const montant        = order.montantAcompte ?? order.prixEstime;
  const serviceLabel   = TYPE_LABELS[order.typePrecis] ?? order.typePrecis;
  const isFullPayment  = getPaymentRate(order.marche as Zone) === 1.0;

  const headline = isFullPayment ? "Paiement reçu en totalité" : "Acompte de 30% reçu";
  const balanceLine = isFullPayment
    ? "Rien à payer à la livraison — votre commande est réglée intégralement."
    : `Solde à régler à la livraison : <strong>${fmtPrice(order.prixEstime - montant, order.devise)}</strong>.`;

  // Client confirmation
  await resend.emails.send({
    from: `ProspectAI <${fromEmail}>`,
    to: order.email,
    subject: `✅ ${headline} — ${serviceLabel}`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:32px 20px;background:#fff;color:#111">
        <div style="background:linear-gradient(135deg,#7B61FF,#C77DFF);border-radius:12px;padding:20px 24px;margin-bottom:24px">
          <p style="margin:0;font-size:28px">✅</p>
          <h1 style="margin:6px 0 0;color:#fff;font-size:18px">${headline} !</h1>
        </div>
        <p style="font-size:14px;line-height:1.6">Bonjour ${order.nom},</p>
        <p style="font-size:14px;line-height:1.6">Nous avons bien reçu votre paiement de <strong>${fmtPrice(montant, order.devise)}</strong> pour votre commande <strong>${serviceLabel}</strong>.</p>
        <p style="font-size:14px;line-height:1.6">${balanceLine}</p>
        <p style="font-size:14px;line-height:1.6">Nous démarrons la préparation de votre projet et revenons vers vous rapidement.</p>
        <p style="font-size:12px;color:#9ca3af;margin-top:24px">Commande #${order.id.slice(-6)} — ProspectAI</p>
      </div>
    `,
  }).catch(() => {});

  // Admin notification
  const notifEmail = process.env.NOTIFICATION_EMAIL || "azizssro72@gmail.com";
  const waNum = order.telephone.replace(/[^0-9]/g, "");

  await resend.emails.send({
    from: `ProspectAI Commandes <${fromEmail}>`,
    to: notifEmail,
    subject: `💰 ${isFullPayment ? "Paiement total" : "Acompte 30%"} reçu (${provider}) — ${serviceLabel} — ${order.nom}`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:24px 20px;background:#fff;color:#111">
        <h2 style="margin:0 0 12px;font-size:18px">💰 Paiement reçu</h2>
        <table style="width:100%;font-size:14px;border-collapse:collapse">
          <tr><td style="padding:6px 0;color:#6b7280;width:120px">Client</td><td style="padding:6px 0;font-weight:600">${order.nom}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Service</td><td style="padding:6px 0">${serviceLabel}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Montant</td><td style="padding:6px 0;font-weight:600;color:#7B61FF">${fmtPrice(montant, order.devise)} ${isFullPayment ? "(100%)" : "(acompte 30%)"}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Provider</td><td style="padding:6px 0">${provider}</td></tr>
        </table>
        <p style="margin-top:16px"><a href="https://wa.me/${waNum}" style="color:#25D366">💬 Contacter sur WhatsApp</a></p>
      </div>
    `,
  }).catch(() => {});
}
