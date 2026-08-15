"use client";

import { TopBar } from "@/components/dashboard/topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Search, Sparkles, MessageCircle, Repeat, Users, Building2, BarChart3, CheckCircle2,
} from "lucide-react";
import { useI18n } from "@/components/language-provider";

export default function GuidePage() {
  const { t } = useI18n();

  const sections = [
    {
      icon: Search, color: "text-violet-400", bg: "bg-violet-500/10",
      title: t("gd_s1_title"), intro: t("gd_s1_intro"),
      bullets: [t("gd_s1_b1"), t("gd_s1_b2"), t("gd_s1_b3")],
    },
    {
      icon: Sparkles, color: "text-indigo-400", bg: "bg-indigo-500/10",
      title: t("gd_s2_title"), intro: t("gd_s2_intro"),
      bullets: [t("gd_s2_b1"), t("gd_s2_b2"), t("gd_s2_b3")],
    },
    {
      icon: MessageCircle, color: "text-emerald-400", bg: "bg-emerald-500/10",
      title: t("gd_s3_title"), intro: t("gd_s3_intro"),
      bullets: [t("gd_s3_b1"), t("gd_s3_b2"), t("gd_s3_b3"), t("gd_s3_b4")],
    },
    {
      icon: Repeat, color: "text-amber-400", bg: "bg-amber-500/10",
      title: t("gd_s4_title"), intro: t("gd_s4_intro"),
      bullets: [t("gd_s4_b1"), t("gd_s4_b2"), t("gd_s4_b3")],
    },
    {
      icon: Users, color: "text-cyan-400", bg: "bg-cyan-500/10",
      title: t("gd_s5_title"), intro: t("gd_s5_intro"),
      bullets: [t("gd_s5_b1"), t("gd_s5_b2"), t("gd_s5_b3")],
    },
    {
      icon: Building2, color: "text-pink-400", bg: "bg-pink-500/10",
      title: t("gd_s6_title"), intro: t("gd_s6_intro"),
      bullets: [t("gd_s6_b1"), t("gd_s6_b2"), t("gd_s6_b3")],
    },
    {
      icon: BarChart3, color: "text-blue-400", bg: "bg-blue-500/10",
      title: t("gd_s7_title"), intro: t("gd_s7_intro"),
      bullets: [t("gd_s7_b1"), t("gd_s7_b2"), t("gd_s7_b3")],
    },
  ];

  return (
    <>
      <TopBar title={t("gd_title")} description={t("gd_subtitle")} />

      <div className="p-4 sm:p-6 space-y-5 max-w-3xl">
        {sections.map((s, i) => (
          <Card key={s.title} className="overflow-hidden">
            <CardHeader className="flex flex-row items-start gap-4 space-y-0">
              <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-600">{String(i + 1).padStart(2, "0")}</span>
                  <CardTitle className="text-base">{s.title}</CardTitle>
                </div>
                <CardDescription className="mt-1">{s.intro}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2.5">
                {s.bullets.map((b, bi) => (
                  <li key={bi} className="flex items-start gap-2.5 text-sm text-gray-300 leading-relaxed">
                    <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${s.color}`} />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
