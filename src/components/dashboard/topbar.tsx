"use client";

import { useSession } from "next-auth/react";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getInitials } from "@/lib/utils";
import { useI18n } from "@/components/language-provider";
import { LanguageSelector } from "@/components/language-selector";

interface TopBarProps {
  title: string;
  description?: string;
}

export function TopBar({ title, description }: TopBarProps) {
  const { data: session } = useSession();
  const { t } = useI18n();

  return (
    <header className="h-16 border-b border-gray-800/60 px-6 flex items-center justify-between bg-gray-950/80 backdrop-blur-sm sticky top-0 z-30">
      <div>
        <h1 className="text-lg font-semibold text-white">{title}</h1>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <Input placeholder={t("tb_search")} className="pl-8 h-8 w-52 text-xs bg-gray-900/60" />
        </div>

        <LanguageSelector />

        <button className="relative w-8 h-8 rounded-lg border border-gray-700 bg-gray-800/60 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-violet-500" />
        </button>

        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow">
          {session?.user?.name ? getInitials(session.user.name) : "U"}
        </div>
      </div>
    </header>
  );
}
