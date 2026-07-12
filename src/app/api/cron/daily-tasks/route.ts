import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { searchGooglePlaces } from "@/lib/google-places";
import { extractEmailsBatch } from "@/lib/email-extractor";
import { generateProspectEmail, detectEmailLanguage } from "@/lib/groq";

function checkCronAuth(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const fromHeader = req.headers.get("x-cron-secret");
  const fromBearer = req.headers.get("authorization")?.replace("Bearer ", "");
  return fromHeader === expected || fromBearer === expected;
}

// ── Task 1: Auto-campaign draft generation ──────────────────────────

const DAILY_MS = 24 * 60 * 60 * 1000;
const WEEKLY_MS = 7 * DAILY_MS;

function isDue(campaign: { frequency: string; lastRunAt: Date | null }): boolean {
  if (!campaign.lastRunAt) return true;
  const elapsed = Date.now() - campaign.lastRunAt.getTime();
  return campaign.frequency === "weekly" ? elapsed >= WEEKLY_MS : elapsed >= DAILY_MS;
}

async function runAutoCampaigns() {
  let totalProspects = 0;
  let totalDrafts = 0;
  let processed = 0;

  try {
    const campaigns = await prisma.autoCampaign.findMany({
      where: { active: true },
      include: { user: { select: { id: true, profileType: true, companyName: true, website: true, productDescription: true, whatsappNumber: true } } },
    });

    const due = campaigns.filter(isDue);
    processed = due.length;

    for (const campaign of due.slice(0, 3)) {
      try {
        const cities = campaign.cities.split(",").map(c => c.trim()).filter(Boolean);
        const runIndex = campaign.lastRunAt
          ? Math.floor((Date.now() - campaign.createdAt.getTime()) / (campaign.frequency === "weekly" ? WEEKLY_MS : DAILY_MS))
          : 0;
        const city = cities[runIndex % cities.length];

        const places = await searchGooglePlaces(
          `${campaign.niche} ${city}`,
          campaign.prospectsPerCycle
        );

        if (places.length === 0) {
          await prisma.autoCampaign.update({ where: { id: campaign.id }, data: { lastRunAt: new Date() } });
          continue;
        }

        const existingNames = await prisma.prospect.findMany({
          where: { userId: campaign.userId, niche: campaign.niche, city },
          select: { name: true },
        });
        const nameSet = new Set(existingNames.map(p => p.name.toLowerCase()));
        const newPlaces = places.filter(p => {
          const name = p.displayName?.text?.toLowerCase();
          return name && !nameSet.has(name);
        });

        if (newPlaces.length === 0) {
          await prisma.autoCampaign.update({ where: { id: campaign.id }, data: { lastRunAt: new Date() } });
          continue;
        }

        const websiteUrls = newPlaces.map(p => p.websiteUri ?? null);
        const emails = await extractEmailsBatch(websiteUrls, 3);

        const savedProspects = await prisma.$transaction(
          newPlaces.map((p, i) =>
            prisma.prospect.create({
              data: {
                name:        p.displayName?.text ?? "Sans nom",
                company:     p.displayName?.text ?? null,
                niche:       campaign.niche,
                city,
                address:     p.formattedAddress ?? null,
                phone:       p.internationalPhoneNumber ?? p.nationalPhoneNumber ?? null,
                website:     p.websiteUri ?? null,
                rating:      p.rating ?? null,
                reviewCount: p.userRatingCount ?? null,
                email:       emails[i] ?? null,
                userId:      campaign.userId,
              },
            })
          )
        );

        totalProspects += savedProspects.length;

        const withEmail = savedProspects.filter(p => p.email);
        const user = campaign.user;
        const profileType = (user.profileType || "b2b") as "b2b" | "creator" | "agency";
        const sender = {
          companyName: user.companyName || undefined,
          website: user.website || undefined,
          productDescription: user.productDescription || undefined,
          whatsappNumber: user.whatsappNumber || undefined,
        };

        const emailResults = await Promise.allSettled(
          withEmail.map(async (prospect) => {
            const targetLang = detectEmailLanguage(prospect.city);
            const generated = await generateProspectEmail(
              {
                name:    prospect.name,
                company: prospect.company || undefined,
                niche:   prospect.niche,
                city:    prospect.city,
                website: prospect.website || undefined,
                email:   prospect.email   || undefined,
              },
              profileType,
              targetLang,
              sender
            );
            return prisma.emailLog.create({
              data: {
                userId: campaign.userId,
                prospectId: prospect.id,
                subject: generated.subject,
                body: generated.body,
                status: "DRAFT",
              },
            });
          })
        );

        totalDrafts += emailResults.filter(r => r.status === "fulfilled").length;

        await prisma.autoCampaign.update({ where: { id: campaign.id }, data: { lastRunAt: new Date() } });
      } catch (err: any) {
        console.error(`[auto-campaign] error for ${campaign.id}:`, err.message);
      }
    }
  } catch (err: any) {
    console.error("[auto-campaign] global error:", err.message);
  }

  return { processed, totalProspects, totalDrafts };
}

// ── Task 2: Active email campaign sending ───────────────────────────

async function runEmailCampaigns() {
  let processed = 0;
  let totalSent = 0;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? "contact@prospectai.company";
    const replyTo   = process.env.RESEND_REPLY_TO   ?? fromEmail;

    const campaigns = await prisma.campaign.findMany({
      where: { status: "ACTIVE" },
    });

    processed = campaigns.length;

    for (const campaign of campaigns) {
      try {
        // Count emails already sent/pending TODAY for this campaign
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const sentToday = await prisma.emailLog.count({
          where: {
            campaignId: campaign.id,
            status: { in: ["SENT", "PENDING"] },
            createdAt: { gte: todayStart },
          },
        });

        const quota = campaign.dailyLimit - sentToday;
        if (quota <= 0) continue;

        // Prospects already emailed in this campaign (any day)
        const alreadyEmailed = await prisma.emailLog.findMany({
          where: { campaignId: campaign.id },
          select: { prospectId: true },
        });
        const excludeIds = alreadyEmailed.map(e => e.prospectId);

        // Trim trailing spaces — Google Maps scraping sometimes adds them
        const niche = campaign.niche.trim();
        const city  = campaign.city.trim();

        const prospects = await prisma.prospect.findMany({
          where: {
            userId:  campaign.userId,
            niche:   { equals: niche, mode: "insensitive" },
            city:    { equals: city,  mode: "insensitive" },
            email:   { not: null },
            status:  { notIn: ["UNSUBSCRIBED"] },
            ...(excludeIds.length > 0 && { id: { notIn: excludeIds } }),
          },
          take: quota,
        });

        if (prospects.length === 0) continue;

        let sent = 0;

        for (const prospect of prospects) {
          let logId: string | null = null;
          try {
            const vars = (s: string) => s
              .replace(/\{\{name\}\}/gi,    prospect.name)
              .replace(/\{\{company\}\}/gi, prospect.company ?? prospect.name)
              .replace(/\{\{niche\}\}/gi,   prospect.niche)
              .replace(/\{\{city\}\}/gi,    prospect.city);

            const subject = vars(campaign.subject);
            const body    = vars(campaign.template);

            const log = await prisma.emailLog.create({
              data: {
                userId:     campaign.userId,
                prospectId: prospect.id,
                campaignId: campaign.id,
                subject,
                body,
                status:     "PENDING",
              },
            });
            logId = log.id;

            const result = await resend.emails.send({
              from:    fromEmail,
              to:      prospect.email!,
              replyTo,
              subject,
              text:    body,
            });

            await prisma.emailLog.update({
              where: { id: log.id },
              data: { status: "SENT", messageId: result.data?.id ?? null },
            });

            await prisma.prospect.update({
              where: { id: prospect.id },
              data: { status: "CONTACTED" },
            });

            sent++;
          } catch (err: any) {
            console.error(`[email-campaign] send failed prospect ${prospect.id}:`, err.message);
            if (logId) {
              await prisma.emailLog.update({ where: { id: logId }, data: { status: "FAILED" } }).catch(() => {});
            }
          }
        }

        totalSent += sent;

        if (sent > 0) {
          await prisma.campaign.update({
            where: { id: campaign.id },
            data: { sentCount: { increment: sent } },
          });
        }
      } catch (err: any) {
        console.error(`[email-campaign] campaign ${campaign.id} error:`, err.message);
      }
    }
  } catch (err: any) {
    console.error("[email-campaign] global error:", err.message);
  }

  return { processed, totalSent };
}

// ── Task 3: Trial expiry reminders ──────────────────────────────────

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter — 9€/mois",
  creator: "Creator — 19€/mois",
  pro:     "Pro — 49€/mois",
  agency:  "Agency — 99€/mois",
};

async function runTrialReminders() {
  let checked = 0;
  let sent = 0;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const now = new Date();
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

    checked = users.length;

    const results = await Promise.allSettled(
      users.map(async (user: any) => {
        const planLabel = PLAN_LABELS[user.plan] ?? user.plan;
        const endDate = new Date(user.trialEndsAt).toLocaleDateString("fr-FR", {
          day: "numeric", month: "long", year: "numeric",
        });

        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL!,
          to: user.email,
          subject: "⏰ Votre essai ProspectAI se termine dans 2 jours",
          html: `<!DOCTYPE html>
<html>
<body style="background:#0d0d10;color:#e5e7eb;font-family:sans-serif;padding:40px 20px;max-width:600px;margin:0 auto">
  <div style="text-align:center;margin-bottom:32px">
    <div style="display:inline-flex;align-items:center;gap:8px">
      <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#7c3aed,#4f46e5);display:inline-block"></div>
      <span style="font-size:20px;font-weight:700;color:#fff">ProspectAI</span>
    </div>
  </div>
  <div style="background:#111827;border:1px solid #1f2937;border-radius:16px;padding:32px">
    <h1 style="font-size:22px;font-weight:700;color:#fff;margin:0 0 8px">Votre essai gratuit se termine bientôt</h1>
    <p style="color:#9ca3af;margin:0 0 24px">Bonjour ${user.name ?? ""},</p>
    <div style="background:#1f2937;border-radius:12px;padding:20px;margin-bottom:24px">
      <p style="margin:0;color:#d1d5db">Votre essai gratuit de <strong style="color:#fff">14 jours</strong> se termine le <strong style="color:#a78bfa">${endDate}</strong>.</p>
      <p style="margin:12px 0 0;color:#d1d5db">À cette date, votre abonnement <strong style="color:#fff">${planLabel}</strong> sera automatiquement activé selon la méthode de paiement enregistrée.</p>
    </div>
    <p style="color:#9ca3af;margin:0 0 24px">Pour annuler ou modifier votre abonnement avant la fin de l'essai, rendez-vous dans vos paramètres.</p>
    <div style="text-align:center">
      <a href="${process.env.NEXTAUTH_URL}/dashboard/settings" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600">Gérer mon abonnement</a>
    </div>
  </div>
  <p style="text-align:center;color:#4b5563;font-size:12px;margin-top:24px">ProspectAI · prospection automatisée B2B</p>
</body>
</html>`,
        });

        await db.user.update({
          where: { id: user.id },
          data: { trialReminderSent: true },
        });
      })
    );

    sent = results.filter((r) => r.status === "fulfilled").length;
  } catch (err: any) {
    console.error("[trial-reminder] error:", err.message);
  }

  return { checked, sent };
}

// ── Task 4: Onboarding email J+7 ────────────────────────────────────

function buildEmail2Html(salutation: string): string {
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
    <h1 style="font-size:22px;font-weight:700;color:#fff;margin:0 0 16px">Vous êtes à mi-parcours</h1>
    <p style="color:#d1d5db;margin:0 0 16px">${salutation}</p>
    <p style="color:#d1d5db;margin:0 0 16px">Votre essai ProspectAI est à mi-parcours.</p>
    <p style="color:#d1d5db;margin:0 0 24px">Si vous n'avez pas encore lancé votre première campagne email ou WhatsApp, c'est le moment !</p>
    <div style="background:#1f2937;border-left:3px solid #7c3aed;border-radius:8px;padding:20px;margin-bottom:24px">
      <p style="margin:0;color:#d1d5db">Les utilisateurs qui lancent une campagne dans leur première semaine trouvent en moyenne <strong style="color:#a78bfa">3× plus de prospects</strong>.</p>
    </div>
    <div style="text-align:center;margin-bottom:24px">
      <a href="https://prospectai.company/dashboard/campaigns" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600">Lancer ma première campagne →</a>
    </div>
    <p style="color:#9ca3af;margin:0">Des questions ? Répondez directement à cet email.<br/><br/><strong style="color:#fff">Aziz — ProspectAI</strong></p>
  </div>
  <p style="text-align:center;color:#4b5563;font-size:12px;margin-top:24px">ProspectAI · prospection automatisée B2B</p>
</body>
</html>`;
}

async function runOnboardingEmail2() {
  let checked = 0;
  let sent = 0;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? "contact@prospectai.company";
    const replyTo   = process.env.RESEND_REPLY_TO   ?? fromEmail;
    const db = prisma as any;
    const now = new Date();
    // Window: trialEndsAt in ~7 days (±1 h to survive cron drift)
    const from = new Date(now.getTime() + (7 * 24 - 1) * 3_600_000);
    const to   = new Date(now.getTime() + (7 * 24 + 1) * 3_600_000);

    const users = await db.user.findMany({
      where: {
        subscriptionStatus:   "trialing",
        onboardingEmail2Sent: false,
        trialEndsAt:          { gte: from, lte: to },
      },
    });

    checked = users.length;

    const results = await Promise.allSettled(
      users.map(async (user: any) => {
        const firstName  = user.name?.split(" ")[0] ?? "";
        const salutation = firstName ? `Bonjour ${firstName},` : "Bonjour,";

        await resend.emails.send({
          from:    fromEmail,
          to:      user.email,
          replyTo,
          subject: "Il vous reste 7 jours — avez-vous essayé les campagnes ?",
          html:    buildEmail2Html(salutation),
        });

        await db.user.update({
          where: { id: user.id },
          data:  { onboardingEmail2Sent: true },
        });
      })
    );

    sent = results.filter((r) => r.status === "fulfilled").length;
  } catch (err: any) {
    console.error("[onboarding-email-2]", err?.message);
  }

  return { checked, sent };
}

// ── Task 5: Onboarding email J+13 ───────────────────────────────────

function buildEmail3Html(salutation: string): string {
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
    <h1 style="font-size:22px;font-weight:700;color:#fff;margin:0 0 16px">Votre essai se termine demain ⏰</h1>
    <p style="color:#d1d5db;margin:0 0 16px">${salutation}</p>
    <p style="color:#d1d5db;margin:0 0 24px">Votre essai gratuit ProspectAI se termine demain.</p>
    <p style="color:#d1d5db;margin:0 0 16px">Pour continuer à trouver des clients automatiquement, choisissez votre plan :</p>
    <div style="background:#1f2937;border-radius:12px;padding:20px;margin-bottom:24px">
      <p style="margin:0 0 10px;color:#d1d5db">→ <strong style="color:#fff">Découverte</strong> : 10 000 FCFA/mois</p>
      <p style="margin:0 0 10px;color:#d1d5db">→ <strong style="color:#fff">Starter</strong> : 20 000 FCFA/mois</p>
      <p style="margin:0;color:#d1d5db">→ <strong style="color:#fff">Pro</strong> : 35 000 FCFA/mois <span style="background:#7c3aed;color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600">le plus populaire</span></p>
    </div>
    <div style="text-align:center;margin-bottom:24px">
      <a href="https://prospectai.company/pending-payment" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600">Activer mon abonnement →</a>
    </div>
    <p style="color:#9ca3af;margin:0 0 12px">Ou contactez-nous sur <a href="https://wa.me/4915566701184" style="color:#a78bfa;text-decoration:none">WhatsApp</a> si vous avez des questions.</p>
    <p style="color:#9ca3af;margin:0">Merci de nous faire confiance,<br/><strong style="color:#fff">Aziz — ProspectAI</strong></p>
  </div>
  <p style="text-align:center;color:#4b5563;font-size:12px;margin-top:24px">ProspectAI · prospection automatisée B2B</p>
</body>
</html>`;
}

async function runOnboardingEmail3() {
  let checked = 0;
  let sent = 0;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? "contact@prospectai.company";
    const replyTo   = process.env.RESEND_REPLY_TO   ?? fromEmail;
    const db = prisma as any;
    const now = new Date();
    // Window: trialEndsAt in ~1 day (±1 h to survive cron drift)
    const from = new Date(now.getTime() + 23 * 3_600_000);
    const to   = new Date(now.getTime() + 25 * 3_600_000);

    const users = await db.user.findMany({
      where: {
        subscriptionStatus:   "trialing",
        onboardingEmail3Sent: false,
        trialEndsAt:          { gte: from, lte: to },
      },
    });

    checked = users.length;

    const results = await Promise.allSettled(
      users.map(async (user: any) => {
        const firstName  = user.name?.split(" ")[0] ?? "";
        const salutation = firstName ? `Bonjour ${firstName},` : "Bonjour,";

        await resend.emails.send({
          from:    fromEmail,
          to:      user.email,
          replyTo,
          subject: "Votre essai se termine demain ⏰",
          html:    buildEmail3Html(salutation),
        });

        await db.user.update({
          where: { id: user.id },
          data:  { onboardingEmail3Sent: true },
        });
      })
    );

    sent = results.filter((r) => r.status === "fulfilled").length;
  } catch (err: any) {
    console.error("[onboarding-email-3]", err?.message);
  }

  return { checked, sent };
}

// ── Task 6: Follow-up detection ─────────────────────────────────────

async function runFollowUpDetection() {
  let updated = 0;
  try {
    const threshold = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const result = await (prisma.prospect as any).updateMany({
      where: {
        status: "CONTACTED",
        updatedAt: { lt: threshold },
      },
      data: { status: "TO_FOLLOW_UP" },
    });
    updated = result.count;
  } catch (err: any) {
    console.error("[follow-up-detection]", err.message);
  }
  return { updated };
}

// ── Main handler ────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!checkCronAuth(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const [autoCampaigns, emailCampaigns, trials, onboarding2, onboarding3, followUp] = await Promise.all([
    runAutoCampaigns(),
    runEmailCampaigns(),
    runTrialReminders(),
    runOnboardingEmail2(),
    runOnboardingEmail3(),
    runFollowUpDetection(),
  ]);

  return NextResponse.json({ autoCampaigns, emailCampaigns, trials, onboarding2, onboarding3, followUp });
}
