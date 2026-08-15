import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OnboardingProfileGate } from "@/components/onboarding/profile-gate";

export const metadata: Metadata = {
  title: "Guide de démarrage — ProspectAI",
  robots: { index: false },
};

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  // Mandatory gate: no ProductProfile yet → block the checklist below with
  // the profile-creation form. Raw query — same pattern as /api/profiles,
  // which uses $queryRaw for this table rather than the typed accessor.
  const rows = await prisma.$queryRaw<{ n: number }[]>`
    SELECT COUNT(*)::int AS n FROM "ProductProfile" WHERE "userId" = ${session.user.id as string}
  `;
  const profileCount = rows[0]?.n ?? 0;

  if (profileCount === 0) {
    return <OnboardingProfileGate />;
  }

  return <>{children}</>;
}
