import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { searchGooglePlaces } from "@/lib/google-places";
import { extractEmailsBatch } from "@/lib/email-extractor";
import { generateProspectEmail, detectEmailLanguage } from "@/lib/groq";

const DAILY_MS = 24 * 60 * 60 * 1000;
const WEEKLY_MS = 7 * DAILY_MS;

function isDue(campaign: { frequency: string; lastRunAt: Date | null }): boolean {
  if (!campaign.lastRunAt) return true;
  const elapsed = Date.now() - campaign.lastRunAt.getTime();
  return campaign.frequency === "weekly" ? elapsed >= WEEKLY_MS : elapsed >= DAILY_MS;
}

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

  const campaigns = await prisma.autoCampaign.findMany({
    where: { active: true },
    include: { user: { select: { id: true, profileType: true, companyName: true, website: true, productDescription: true, whatsappNumber: true } } },
  });

  const due = campaigns.filter(isDue);
  if (due.length === 0) {
    return NextResponse.json({ processed: 0, message: "Aucune campagne à traiter" });
  }

  let totalProspects = 0;
  let totalDrafts = 0;

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
        await prisma.autoCampaign.update({
          where: { id: campaign.id },
          data: { lastRunAt: new Date() },
        });
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
        await prisma.autoCampaign.update({
          where: { id: campaign.id },
          data: { lastRunAt: new Date() },
        });
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
              phone:       p.nationalPhoneNumber ?? null,
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
            { name: prospect.name, company: prospect.company || undefined, niche: prospect.niche, city: prospect.city },
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

      await prisma.autoCampaign.update({
        where: { id: campaign.id },
        data: { lastRunAt: new Date() },
      });
    } catch (err: any) {
      console.error(`[auto-campaign] error for ${campaign.id}:`, err.message);
    }
  }

  return NextResponse.json({ processed: due.length, totalProspects, totalDrafts });
}
