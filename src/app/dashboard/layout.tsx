import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/dashboard/sidebar";
import { SidebarProvider } from "@/components/dashboard/sidebar-context";
import { MobileOverlay } from "@/components/dashboard/mobile-overlay";
import { TrialBanner } from "@/components/dashboard/trial-banner";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id as string },
    select: { subscriptionStatus: true, role: true, trialEndsAt: true, paymentMethod: true },
  });

  const isAdmin    = dbUser?.role === "admin";
  const isActive   = dbUser?.subscriptionStatus === "active";
  const now        = new Date();
  const trialValid = dbUser?.subscriptionStatus === "trialing"
    && dbUser.trialEndsAt != null
    && dbUser.trialEndsAt > now;

  if (!isAdmin && !isActive && !trialValid) {
    redirect("/pending-payment");
  }

  // Safety net: any dashboard page loaded directly (bookmark, old tab,
  // abandoned onboarding) sends a profile-less user back to /onboarding,
  // which gates on the same condition — see src/app/onboarding/layout.tsx.
  // Existing users who already have a profile are never affected.
  if (!isAdmin) {
    const rows = await prisma.$queryRaw<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM "ProductProfile" WHERE "userId" = ${session.user.id as string}
    `;
    if ((rows[0]?.n ?? 0) === 0) {
      redirect("/onboarding");
    }
  }

  // Days left in trial (null when active or admin)
  const daysLeft = trialValid && dbUser?.trialEndsAt
    ? Math.ceil((dbUser.trialEndsAt.getTime() - now.getTime()) / 86_400_000)
    : null;

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-gray-950 overflow-hidden">
        <MobileOverlay />
        <Sidebar />
        <main className="flex-1 ml-0 md:ml-64 overflow-y-auto">
          {daysLeft !== null && <TrialBanner daysLeft={daysLeft} isStripe={dbUser?.paymentMethod === "stripe"} />}
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
