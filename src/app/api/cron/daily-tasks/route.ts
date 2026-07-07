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

        const prospects = await prisma.prospect.findMany({
          where: {
            userId:  campaign.userId,
            niche:   campaign.niche,
            city:    campaign.city,
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
            const body = campaign.template
              .replace(/\{\{name\}\}/gi,    prospect.name)
              .replace(/\{\{company\}\}/gi, prospect.company ?? prospect.name)
              .replace(/\{\{niche\}\}/gi,   prospect.niche)
              .replace(/\{\{city\}\}/gi,    prospect.city);

            const log = await prisma.emailLog.create({
              data: {
                userId:     campaign.userId,
                prospectId: prospect.id,
                campaignId: campaign.id,
                subject:    campaign.subject,
                body,
                status:     "PENDING",
              },
            });
            logId = log.id;

            const result = await resend.emails.send({
              from:    fromEmail,
              to:      prospect.email!,
              replyTo,
              subject: campaign.subject,
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

// ── Main handler ────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!checkCronAuth(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const [autoCampaigns, emailCampaigns, trials] = await Promise.all([
    runAutoCampaigns(),
    runEmailCampaigns(),
    runTrialReminders(),
  ]);

  return NextResponse.json({ autoCampaigns, emailCampaigns, trials });
}
