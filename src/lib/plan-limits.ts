export type Plan = "decouverte" | "starter" | "pro" | "business";

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
  decouverte: {
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
  starter: {
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
  business: {
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
  decouverte: "DÉCOUVERTE",
  starter: "STARTER",
  pro: "PRO",
  business: "BUSINESS",
};

export const PLAN_PRICE: Record<string, string> = {
  decouverte: "10 000 FCFA/mois",
  starter: "20 000 FCFA/mois",
  pro: "35 000 FCFA/mois",
  business: "60 000 FCFA/mois",
};

export const NEXT_PLAN: Partial<Record<string, Plan>> = {
  decouverte: "starter",
  starter: "pro",
  pro: "business",
};

export function getPlanLimits(plan: string): PlanLimits {
  const key = plan?.toLowerCase() as Plan;
  return PLAN_LIMITS[key] ?? PLAN_LIMITS.starter;
}

export function isUnlimited(value: number): boolean {
  return value === -1;
}
