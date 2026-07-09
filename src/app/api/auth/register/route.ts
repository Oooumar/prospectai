import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

function buildWelcomeEmailHtml(salutation: string): string {
  return `<!DOCTYPE html>
<html>
<body style="background:#0d0d10;color:#e5e7eb;font-family:sans-serif;padding:40px 20px;max-width:600px;margin:0 auto">
  <div style="text-align:center;margin-bottom:32px">
    <div style="display:inline-flex;align-items:center;gap:8px">
      <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#7c3aed,#4f46e5);display:inline-block"></div>
      <span style="font-size:20px;font-weight:700;color:#fff">ProspectAI</span>
    </div>
  </div>
  <div style="background:#111827;border:1px solid #1f2937;border-radius:16px;padding:32px">
    <h1 style="font-size:22px;font-weight:700;color:#fff;margin:0 0 16px">Bienvenue sur ProspectAI !</h1>
    <p style="color:#d1d5db;margin:0 0 16px">${salutation}</p>
    <p style="color:#d1d5db;margin:0 0 16px">Votre essai gratuit de <strong style="color:#fff">14 jours</strong> commence maintenant.</p>
    <p style="color:#d1d5db;margin:0 0 24px">En 5 minutes, vous pouvez trouver vos premiers prospects et générer un message IA personnalisé.</p>
    <div style="background:#1f2937;border-radius:12px;padding:20px;margin-bottom:24px">
      <p style="margin:0 0 12px;color:#a78bfa;font-weight:600">Voici comment démarrer :</p>
      <p style="margin:0 0 8px;color:#d1d5db">1. Allez dans <strong style="color:#fff">Prospects → Scraper des prospects</strong></p>
      <p style="margin:0 0 8px;color:#d1d5db">2. Choisissez une niche (ex: restaurant) et une ville</p>
      <p style="margin:0;color:#d1d5db">3. Sélectionnez un prospect et cliquez <strong style="color:#fff">Email IA</strong></p>
    </div>
    <p style="color:#9ca3af;margin:0 0 24px">C'est tout. L'IA fait le reste.</p>
    <div style="text-align:center;margin-bottom:24px">
      <a href="https://prospectai.company/onboarding" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600">Démarrer maintenant →</a>
    </div>
    <p style="color:#9ca3af;margin:0">À bientôt,<br/><strong style="color:#fff">Aziz — ProspectAI</strong></p>
  </div>
  <p style="text-align:center;color:#4b5563;font-size:12px;margin-top:24px">ProspectAI · prospection automatisée B2B</p>
</body>
</html>`;
}

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  profileType: z.enum(["b2b", "creator", "agency"]).default("b2b"),
  plan: z.enum(["starter", "creator", "pro", "agency"]).default("starter"),
  paymentMethod: z.enum(["stripe", "paypal"]).default("stripe"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    const { name, email, password, profileType, plan, paymentMethod } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    let user: any;
    try {
      user = await (prisma.user as any).create({
        data: {
          name,
          email,
          password: hashed,
          profileType,
          plan,
          paymentMethod,
          trialEndsAt,
          subscriptionStatus: "trialing",
          trialReminderSent: false,
        },
      });
    } catch {
      // Fallback: create without subscription columns if they don't exist yet
      user = await prisma.user.create({
        data: { name, email, password: hashed },
      });
    }

    // Email 1 — welcome email (non-blocking: errors don't affect registration)
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const fromEmail = process.env.RESEND_FROM_EMAIL ?? "contact@prospectai.company";
        const replyTo   = process.env.RESEND_REPLY_TO   ?? fromEmail;
        const firstName = name.split(" ")[0] ?? "";
        const salutation = firstName ? `Bonjour ${firstName},` : "Bonjour,";

        await resend.emails.send({
          from:    fromEmail,
          to:      email,
          replyTo,
          subject: "Bienvenue sur ProspectAI 🎯 — voici comment démarrer",
          html:    buildWelcomeEmailHtml(salutation),
        });

        await (prisma.user as any).update({
          where: { id: user.id },
          data:  { onboardingEmail1Sent: true },
        });
      } catch (err: any) {
        console.error("[onboarding-email-1]", err?.message);
      }
    }

    return NextResponse.json({ success: true, userId: user.id, email: user.email, plan, paymentMethod }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
