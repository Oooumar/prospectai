import { prisma } from "@/lib/prisma";
import { getPlanLimits, isUnlimited } from "@/lib/plan-limits";

const GLOBAL_DAILY_LIMIT = 300;

export function todayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getEmailDailyLimit(plan: string, isAdmin: boolean): number {
  if (isAdmin) return GLOBAL_DAILY_LIMIT;
  return getPlanLimits(plan).emailsPerDay;
}

export async function checkSendLimits(
  userId: string,
  plan: string,
  isAdmin: boolean,
): Promise<{ allowed: boolean; error?: string }> {
  if (isAdmin) return { allowed: true };

  const start = todayStart();
  const dailyLimit = getPlanLimits(plan).emailsPerDay;

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

  if (userSent >= dailyLimit) {
    return {
      allowed: false,
      error: `Limite de votre plan atteinte (${dailyLimit} emails/jour) — passez au plan supérieur.`,
    };
  }

  return { allowed: true };
}

export async function checkAiGenToday(userId: string): Promise<number> {
  try {
    const start = todayStart();
    const rows = await prisma.$queryRaw<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM "AiUsageLog"
      WHERE "userId" = ${userId} AND "createdAt" >= ${start}
    `;
    return rows[0]?.n ?? 0;
  } catch {
    return 0;
  }
}

export async function logAiGen(userId: string, type: string): Promise<void> {
  try {
    const id = `ai_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await prisma.$executeRaw`
      INSERT INTO "AiUsageLog" ("id", "userId", "type", "createdAt")
      VALUES (${id}, ${userId}, ${type}, NOW())
    `;
  } catch {
    // silently ignore if table doesn't exist yet
  }
}

// kept for backward compatibility — not used after migration to plan-based limits
export { isUnlimited };
