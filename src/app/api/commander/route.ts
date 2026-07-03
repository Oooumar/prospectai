import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";

const VALID_TYPES = ["vitrine", "pro_seo", "boutique", "webapp", "native"] as const;
const VALID_OPTIONS = ["reservation", "mobile_money", "espace_client", "seo_avance", "chat_whatsapp"] as const;
const VALID_CATEGORIES = ["site", "app"] as const;

type ValidType = typeof VALID_TYPES[number];
type ValidCategory = typeof VALID_CATEGORIES[number];

const TYPE_LABELS: Record<ValidType, string> = {
  vitrine:  "Site vitrine",
  pro_seo:  "Site Pro + SEO",
  boutique: "Boutique en ligne",
  webapp:   "Web App / PWA",
  native:   "App mobile native",
};

const OPTION_LABELS: Record<string, string> = {
  reservation:    "Réservation en ligne",
  mobile_money:   "Paiement Mobile Money",
  espace_client:  "Espace client / Connexion",
  seo_avance:     "SEO avancé",
  chat_whatsapp:  "Chat / WhatsApp",
};

function formatFCFA(n: number) {
  return n.toLocaleString("fr-FR") + " FCFA";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nom, entreprise, email, telephone, besoin, categorie, typePrecis, options, prixEstime } = body;

    // Server-side validation
    if (!nom || typeof nom !== "string" || nom.trim().length < 2)
      return NextResponse.json({ error: "Nom invalide" }, { status: 400 });
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    if (!telephone || typeof telephone !== "string" || telephone.trim().length < 6)
      return NextResponse.json({ error: "Téléphone invalide" }, { status: 400 });
    if (!besoin || typeof besoin !== "string" || besoin.trim().length < 10)
      return NextResponse.json({ error: "Décrivez votre besoin (min. 10 caractères)" }, { status: 400 });
    if (!VALID_CATEGORIES.includes(categorie))
      return NextResponse.json({ error: "Catégorie invalide" }, { status: 400 });
    if (!VALID_TYPES.includes(typePrecis))
      return NextResponse.json({ error: "Type de service invalide" }, { status: 400 });
    if (!Array.isArray(options) || options.some((o: string) => !VALID_OPTIONS.includes(o as any)))
      return NextResponse.json({ error: "Options invalides" }, { status: 400 });
    if (typeof prixEstime !== "number" || prixEstime < 0)
      return NextResponse.json({ error: "Prix estimé invalide" }, { status: 400 });

    const order = await prisma.serviceOrder.create({
      data: {
        nom:        nom.trim(),
        entreprise: entreprise?.trim() || null,
        email:      email.trim().toLowerCase(),
        telephone:  telephone.trim(),
        besoin:     besoin.trim(),
        categorie:  categorie as ValidCategory,
        typePrecis: typePrecis as ValidType,
        options,
        prixEstime,
        statut:     "nouvelle",
      },
    });

    // Notify owner
    const notifEmail = process.env.NOTIFICATION_EMAIL || "azizssro72@gmail.com";
    const optionsList = options.length > 0
      ? options.map((o: string) => `• ${OPTION_LABELS[o] ?? o}`).join("\n")
      : "Aucune option";

    await resend.emails.send({
      from: `ProspectAI Commandes <${process.env.RESEND_FROM_EMAIL || "contact@prospectai.company"}>`,
      to: notifEmail,
      subject: `🆕 Nouvelle commande — ${TYPE_LABELS[typePrecis as ValidType]} — ${nom.trim()}`,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:32px 20px;background:#fff;color:#111">
          <div style="background:linear-gradient(135deg,#7B61FF,#C77DFF);border-radius:12px;padding:20px 24px;margin-bottom:24px">
            <h1 style="margin:0;color:#fff;font-size:20px">🆕 Nouvelle commande</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:14px">${new Date().toLocaleString("fr-FR")}</p>
          </div>

          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr><td style="padding:8px 0;color:#6b7280;width:140px">Nom</td><td style="padding:8px 0;font-weight:600">${nom.trim()}</td></tr>
            ${entreprise ? `<tr><td style="padding:8px 0;color:#6b7280">Entreprise</td><td style="padding:8px 0">${entreprise.trim()}</td></tr>` : ""}
            <tr><td style="padding:8px 0;color:#6b7280">Email</td><td style="padding:8px 0"><a href="mailto:${email}" style="color:#7B61FF">${email}</a></td></tr>
            <tr><td style="padding:8px 0;color:#6b7280">Téléphone</td><td style="padding:8px 0"><a href="https://wa.me/${telephone.replace(/[^0-9]/g,"")}" style="color:#25D366">${telephone}</a></td></tr>
            <tr><td style="padding:8px 0;color:#6b7280">Catégorie</td><td style="padding:8px 0">${categorie === "site" ? "Site Web" : "Application"}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280">Type</td><td style="padding:8px 0;font-weight:600">${TYPE_LABELS[typePrecis as ValidType]}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280">Prix estimé</td><td style="padding:8px 0;font-weight:600;color:#7B61FF">${formatFCFA(prixEstime)} (≈ ${Math.round(prixEstime / 655.957).toLocaleString("fr-FR")} €)</td></tr>
          </table>

          <div style="margin:20px 0;padding:16px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb">
            <p style="margin:0 0 6px;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:.05em">Options choisies</p>
            <p style="margin:0;white-space:pre-line;font-size:14px">${optionsList}</p>
          </div>

          <div style="margin:20px 0;padding:16px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb">
            <p style="margin:0 0 6px;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:.05em">Description du besoin</p>
            <p style="margin:0;font-size:14px;line-height:1.6">${besoin.trim().replace(/\n/g, "<br>")}</p>
          </div>

          <p style="text-align:center;margin-top:24px">
            <a href="https://wa.me/${telephone.replace(/[^0-9]/g,"")}" style="display:inline-block;background:#25D366;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">💬 Répondre sur WhatsApp</a>
          </p>

          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
          <p style="font-size:11px;color:#9ca3af;text-align:center">Commande #${order.id} — ProspectAI</p>
        </div>
      `,
    }).catch(() => {}); // Ne bloque pas si l'email échoue

    return NextResponse.json({ success: true, id: order.id });
  } catch (err: any) {
    console.error("[commander] POST:", err.message);
    return NextResponse.json({ error: "Erreur interne. Veuillez réessayer." }, { status: 500 });
  }
}
