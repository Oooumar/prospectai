import { prisma } from "@/lib/prisma";

const GLOBAL_DAILY_LIMIT = 300;

export function getWarmupLimit(createdAt: Date): number {
  const days = Math.floor((Date.now() - createdAt.getTime()) / (24 * 60 * 60 * 1000));
  if (days < 14) return 5;
  if (days < 28) return 15;
  return 30;
}

export function getWarmupTier(createdAt: Date): { limit: number; tier: string; daysLeft: number } {
  const days = Math.floor((Date.now() - createdAt.getTime()) / (24 * 60 * 60 * 1000));
  if (days < 14) return { limit: 5, tier: "1", daysLeft: 14 - days };
  if (days < 28) return { limit: 15, tier: "2", daysLeft: 28 - days };
  return { limit: 30, tier: "3", daysLeft: 0 };
}

function todayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function checkSendLimits(userId: string, createdAt: Date, isAdmin: boolean): Promise<{ allowed: boolean; error?: string }> {
  if (isAdmin) return { allowed: true };

  const start = todayStart();

  const [userSent, globalSent] = await Promise.all([
    prisma.emailLog.count({
      where: { userId, status: { in: ["SENT", "PENDING"] }, sentAt: { gte: start } },
    }),
    prisma.emailLog.count({
      where: { status: { in: ["SENT", "PENDING"] }, sentAt: { gte: start } },
    }),
  ]);

  if (globalSent >= GLOBAL_DAILY_LIMIT) {
    return {
      allowed: false,
      error: `Limite globale du domaine atteinte (${GLOBAL_DAILY_LIMIT}/jour). Réessayez demain.`,
    };
  }

  const warmupLimit = getWarmupLimit(createdAt);
  if (userSent >= warmupLimit) {
    return {
      allowed: false,
      error: `Limite journalière atteinte (${warmupLimit} emails/jour). Cette limite augmente automatiquement avec l'ancienneté de votre compte.`,
    };
  }

  return { allowed: true };
}
