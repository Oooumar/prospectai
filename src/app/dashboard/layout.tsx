import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { SidebarProvider } from "@/components/dashboard/sidebar-context";
import { MobileOverlay } from "@/components/dashboard/mobile-overlay";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-gray-950 overflow-hidden">
        <MobileOverlay />
        <Sidebar />
        <main className="flex-1 ml-0 md:ml-64 overflow-y-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
