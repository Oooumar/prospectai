// Plan keys match the real, live taxonomy used everywhere else (Stripe
// PLAN_META in src/lib/stripe.ts, auth/register's zod schema, signup form):
// starter (9€) / creator (19€) / pro (49€) / agency (99€).
//
// Previously these keys were "decouverte/starter/pro/business" — an older
// FCFA-based 4-tier naming that no longer matched what users actually sign
// up with. getPlanLimits() silently fell back to the lowest tier for any
// unrecognized key, so every "creator" and "agency" account was capped at
// starter-tier limits everywhere (emails/day, prospects, scraping,
// campaigns...), not just in display. Renamed keys below, values carried
// over 1:1 in the same ascending order (decouverte->starter, starter->
// creator, pro->pro, business->agency) — no limit values were invented.
export type Plan = "starter" | "creator" | "pro" | "agency";

export interface PlanLimits {
  maxProspects: number;       // -1 = illimité
  scrapingPerSearch: number;
  scrapingPerDay: number;     // -1 = illimité
  aiGenPerDay: number;        // email + WA combinés; -1 = illimité
  emailsPerDay: number;
  emailCampaigns: number;     // 0 = bloqué; -1 = illimité
  waCampaigns: number;        // 0 = bloqué; -1 = illimité
  autoCampaigns: number;      // 0 = bloqué; -1 = illimité
  maxProfiles: number;        // -1 = illimité
  imageUpload: boolean;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  starter: {
    maxProspects: 100,
    scrapingPerSearch: 20,
    scrapingPerDay: 50,
    aiGenPerDay: 20,
    emailsPerDay: 5,
    emailCampaigns: 0,
    waCampaigns: 0,
    autoCampaigns: 0,
    maxProfiles: 1,
    imageUpload: false,
  },
  creator: {
    maxProspects: 500,
    scrapingPerSearch: 40,
    scrapingPerDay: 200,
    aiGenPerDay: 100,
    emailsPerDay: 15,
    emailCampaigns: 1,
    waCampaigns: 0,
    autoCampaigns: 0,
    maxProfiles: 2,
    imageUpload: true,
  },
  pro: {
    maxProspects: 2000,
    scrapingPerSearch: 60,
    scrapingPerDay: 600,
    aiGenPerDay: 400,
    emailsPerDay: 30,
    emailCampaigns: 5,
    waCampaigns: -1,
    autoCampaigns: 1,
    maxProfiles: 5,
    imageUpload: true,
  },
  agency: {
    maxProspects: -1,
    scrapingPerSearch: 100,
    scrapingPerDay: -1,
    aiGenPerDay: -1,
    emailsPerDay: 50,
    emailCampaigns: -1,
    waCampaigns: -1,
    autoCampaigns: 3,
    maxProfiles: -1,
    imageUpload: true,
  },
};

export const PLAN_DISPLAY: Record<string, string> = {
  starter: "STARTER",
  creator: "CREATOR",
  pro: "PRO",
  agency: "AGENCY",
};

// Real Stripe prices (see PLAN_META in src/lib/stripe.ts — kept in sync
// manually since that file instantiates the Stripe SDK and must stay
// server-only, so it can't be imported from here into client components).
export const PLAN_PRICE: Record<string, string> = {
  starter: "9€/mois",
  creator: "19€/mois",
  pro: "49€/mois",
  agency: "99€/mois",
};

export const NEXT_PLAN: Partial<Record<string, Plan>> = {
  starter: "creator",
  creator: "pro",
  pro: "agency",
};

export function getPlanLimits(plan: string): PlanLimits {
  const key = plan?.toLowerCase() as Plan;
  return PLAN_LIMITS[key] ?? PLAN_LIMITS.starter;
}

export function isUnlimited(value: number): boolean {
  return value === -1;
}
