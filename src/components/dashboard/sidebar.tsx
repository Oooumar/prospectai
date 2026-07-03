"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Target, Mail, Megaphone,
  Settings, LogOut, ChevronRight, MessageSquareReply, FileText, MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/language-provider";
import { useSidebar } from "./sidebar-context";

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const { open, close } = useSidebar();
  const [pendingReplies, setPendingReplies] = useState(0);
  const [pendingDrafts, setPendingDrafts] = useState(0);
  const [plan, setPlan] = useState("starter");

  useEffect(() => {
    fetch("/api/inbound?count=true")
      .then(r => r.ok ? r.json() : { count: 0 })
      .then(d => setPendingReplies(d.count ?? 0))
      .catch(() => {});
    fetch("/api/drafts?count=true")
      .then(r => r.ok ? r.json() : { count: 0 })
      .then(d => setPendingDrafts(d.count ?? 0))
      .catch(() => {});
    fetch("/api/user/me")
      .then(r => r.ok ? r.json() : { plan: "starter" })
      .then(d => setPlan(d.plan ?? "starter"))
      .catch(() => {});
  }, []);

  const isPro = plan !== "starter";

  // Close sidebar on navigation (mobile)
  useEffect(() => { close(); }, [pathname]);

  const nav = [
    { href: "/dashboard", label: t("sb_dashboard"), icon: LayoutDashboard },
    { href: "/dashboard/prospects", label: t("sb_prospects"), icon: Target },
    { href: "/dashboard/campaigns", label: t("sb_campaigns"), icon: Megaphone },
    { href: "/dashboard/whatsapp-campaigns", label: t("wc_nav"), icon: MessageCircle },
    { href: "/dashboard/emails", label: t("sb_emails"), icon: Mail },
    { href: "/dashboard/drafts", label: t("sb_drafts"), icon: FileText, badge: pendingDrafts },
    { href: "/dashboard/replies", label: t("sb_replies"), icon: MessageSquareReply, badge: pendingReplies },
    { href: "/dashboard/settings", label: t("sb_settings"), icon: Settings },
  ];

  return (
    <aside
      className={cn(
        "w-64 h-screen bg-gray-950 border-r border-gray-800/60 flex flex-col fixed left-0 top-0 z-40 transition-transform duration-200 ease-in-out",
        // Mobile: hidden by default, slides in when open
        open ? "translate-x-0" : "-translate-x-full",
        // Desktop: always visible
        "md:translate-x-0"
      )}
    >
      {/* Logo */}
      <div className="h-16 px-4 flex items-center gap-3 border-b border-gray-800/60 shrink-0">
        <svg viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg" width="40" height="40" className="shrink-0">
          <defs>
            <linearGradient id="sidebar-logo-g" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7B61FF"/>
              <stop offset="100%" stopColor="#C77DFF"/>
            </linearGradient>
          </defs>
          <rect width="52" height="52" rx="14" fill="url(#sidebar-logo-g)"/>
          <path d="M15 43 L15 13 L30 13 Q44 13 44 23 Q44 33 30 33 L15 33"
                fill="none" stroke="white" strokeWidth="4"
                strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="42" cy="43" r="4" fill="white"/>
        </svg>
        <div className="flex flex-col gap-0.5 leading-none min-w-0">
          <span className="font-bold text-base tracking-tight">
            <span className="text-white">Prospect</span>
            <span style={{ background: "linear-gradient(135deg,#7B61FF,#C77DFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI</span>
          </span>
          <span className="text-[10px] font-medium tracking-widest uppercase" style={{ color: "#9B8CFF" }}>
            Prospection · IA
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
                active
                  ? "bg-violet-500/15 text-violet-300 border border-violet-500/20"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/60"
              )}
            >
              <item.icon className={cn("w-4 h-4 shrink-0", active ? "text-violet-400" : "text-gray-500 group-hover:text-gray-300")} />
              <span className="truncate">{item.label}</span>
              {(item as any).badge > 0 && (
                <span className="ml-auto flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold shrink-0">
                  {(item as any).badge > 9 ? "9+" : (item as any).badge}
                </span>
              )}
              {active && !(item as any).badge && <ChevronRight className="w-3 h-3 ml-auto text-violet-400/60 shrink-0" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-gray-800/60 shrink-0">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-gray-400 hover:text-red-400 hover:bg-red-500/10"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="w-4 h-4" />
          {t("sb_logout")}
        </Button>
      </div>
    </aside>
  );
}
