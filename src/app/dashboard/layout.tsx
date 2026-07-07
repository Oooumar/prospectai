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
    select: { subscriptionStatus: true, role: true, trialEndsAt: true },
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
          {daysLeft !== null && <TrialBanner daysLeft={daysLeft} />}
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
