"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TopBar } from "@/components/dashboard/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Loader2, ImageIcon, ChevronRight, Target } from "lucide-react";
import { useI18n } from "@/components/language-provider";

interface Campaign {
  id: string;
  title: string;
  imageUrl: string | null;
  createdAt: string;
  messageCount: number;
}

export default function WhatsAppCampaignsPage() {
  const { t } = useI18n();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/whatsapp/campaigns")
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setCampaigns(data.campaigns ?? []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <TopBar title={t("wc_page_title")} description={t("wc_page_desc")} />
      <div className="p-4 sm:p-6 space-y-4 max-w-2xl">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="font-medium">{t("wc_empty")}</p>
            <p className="text-sm mt-1">{t("wc_empty_desc")}</p>
            <Link href="/dashboard/prospects">
              <Button variant="warm" className="mt-4">
                <Target className="w-4 h-4" />
                {t("sb_prospects")}
              </Button>
            </Link>
          </div>
        ) : (
          campaigns.map(c => (
            <Link key={c.id} href={`/dashboard/whatsapp-campaigns/${c.id}`}>
              <Card className="border-gray-800 hover:border-emerald-500/30 transition-colors cursor-pointer group">
                <CardContent className="flex items-center gap-4 p-4">
                  {c.imageUrl ? (
                    <img src={c.imageUrl} alt="" className="w-12 h-12 object-cover rounded-lg shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                      <MessageCircle className="w-5 h-5 text-emerald-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{c.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {t("wc_messages_count", { n: c.messageCount })} · {t("wc_date_label")} {new Date(c.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-emerald-400 transition-colors shrink-0" />
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </>
  );
}
