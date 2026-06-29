import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

const resend = new Resend(process.env.RESEND_API_KEY);

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter — 9€/mois",
  creator: "Creator — 19€/mois",
  pro:     "Pro — 49€/mois",
  agency:  "Agency — 99€/mois",
};

function checkCronAuth(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const fromHeader = req.headers.get("x-cron-secret");
  const fromBearer = req.headers.get("authorization")?.replace("Bearer ", "");
  return fromHeader === expected || fromBearer === expected;
}

export async function GET(req: NextRequest) {
  if (!checkCronAuth(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const now = new Date();
  // window: trial ends in [47h, 49h] from now (catches "2 days before")
  const from = new Date(now.getTime() + 47 * 60 * 60 * 1000);
  const to   = new Date(now.getTime() + 49 * 60 * 60 * 1000);

  const db = prisma as any;

  const users = await db.user.findMany({
    where: {
      trialEndsAt: { gte: from, lte: to },
      subscriptionStatus: "trialing",
      trialReminderSent: false,
    },
  });

  const results = await Promise.allSettled(
    users.map(async (user: any) => {
      const planLabel = PLAN_LABELS[user.plan] ?? user.plan;
      const endDate = new Date(user.trialEndsAt).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: user.email,
        subject: "⏰ Votre essai ProspectAI se termine dans 2 jours",
        html: `
<!DOCTYPE html>
<html>
<body style="background:#0d0d10;color:#e5e7eb;font-family:sans-serif;padding:40px 20px;max-width:600px;margin:0 auto">
  <div style="text-align:center;margin-bottom:32px">
    <div style="display:inline-flex;align-items:center;gap:8px">
      <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#7c3aed,#4f46e5);display:inline-block"></div>
      <span style="font-size:20px;font-weight:700;color:#fff">ProspectAI</span>
    </div>
  </div>

  <div style="background:#111827;border:1px solid #1f2937;border-radius:16px;padding:32px">
    <h1 style="font-size:22px;font-weight:700;color:#fff;margin:0 0 8px">
      Votre essai gratuit se termine bientôt
    </h1>
    <p style="color:#9ca3af;margin:0 0 24px">
      Bonjour ${user.name ?? ""},
    </p>

    <div style="background:#1f2937;border-radius:12px;padding:20px;margin-bottom:24px">
      <p style="margin:0;color:#d1d5db">
        Votre essai gratuit de <strong style="color:#fff">14 jours</strong> se termine le
        <strong style="color:#a78bfa"> ${endDate}</strong>.
      </p>
      <p style="margin:12px 0 0;color:#d1d5db">
        À cette date, votre abonnement <strong style="color:#fff">${planLabel}</strong> sera
        automatiquement activé selon la méthode de paiement enregistrée.
      </p>
    </div>

    <p style="color:#9ca3af;margin:0 0 24px">
      Pour annuler ou modifier votre abonnement avant la fin de l'essai, rendez-vous dans vos paramètres.
    </p>

    <div style="text-align:center">
      <a href="${process.env.NEXTAUTH_URL}/dashboard/settings"
         style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600">
        Gérer mon abonnement
      </a>
    </div>
  </div>

  <p style="text-align:center;color:#4b5563;font-size:12px;margin-top:24px">
    ProspectAI · prospection automatisée B2B
  </p>
</body>
</html>`,
      });

      await db.user.update({
        where: { id: user.id },
        data: { trialReminderSent: true },
      });
    })
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  return NextResponse.json({ checked: users.length, sent });
}
