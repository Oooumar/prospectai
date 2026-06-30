"use client";

import { useEffect, useState, useCallback } from "react";
import { TopBar } from "@/components/dashboard/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search, Target, Trash2, Mail, Loader2,
  Globe, Ban, Phone, Star, MapPin, Building2,
} from "lucide-react";
import { ScrapingModule } from "@/components/scraping/scraping-module";
import { EmailComposer } from "@/components/emails/email-composer";
import { WhatsAppComposer } from "@/components/whatsapp/whatsapp-composer";
import { MessageCircle } from "lucide-react";
import type { Prospect } from "@/types";
import { useI18n } from "@/components/language-provider";

function prospectScore(p: Prospect): number {
  let s = 0;
  if (p.email) s += 40;
  if (p.website) s += 20;
  if ((p.rating ?? 0) >= 4.0) s += 20;
  if ((p.reviewCount ?? 0) > 50) s += 20;
  return s;
}

const statusBadge: Record<string, string> = {
  NEW: "secondary", CONTACTED: "default", OPENED: "default",
  REPLIED: "success", CONVERTED: "success", UNSUBSCRIBED: "destructive",
};

export default function ProspectsPage() {
  const { t } = useI18n();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [noWebsite, setNoWebsite] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [whatsappProspect, setWhatsappProspect] = useState<Prospect | null>(null);
  const [showScraping, setShowScraping] = useState(false);

  const fetchProspects = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), search });
    if (noWebsite) params.set("noWebsite", "true");
    const res = await fetch(`/api/prospects?${params}`);
    const data = await res.json();
    setProspects(data.prospects || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, search, noWebsite]);

  useEffect(() => { fetchProspects(); }, [fetchProspects]);

  async function deleteProspect(id: string) {
    if (!confirm(t("pp_delete_confirm"))) return;
    await fetch(`/api/prospects?id=${id}`, { method: "DELETE" });
    fetchProspects();
  }

  return (
    <>
      <TopBar title={t("pp_title")} description={t("pp_desc", { n: total })} />

      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder={t("pp_search_ph")}
              className="pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <button
            onClick={() => { setNoWebsite(v => !v); setPage(1); }}
            className={`flex items-center gap-1.5 text-xs border rounded-lg px-3 py-2 transition-colors shrink-0 ${
              noWebsite
                ? "bg-orange-500/15 border-orange-500/40 text-orange-300"
                : "border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300"
            }`}
          >
            <Ban className="w-3.5 h-3.5" />
            {t("pp_no_website")}
          </button>
          <Button variant="warm" onClick={() => setShowScraping(true)}>
            <Target className="w-4 h-4" />
            {t("pp_scrape_btn")}
          </Button>
        </div>

        {showScraping && (
          <ScrapingModule
            onClose={() => setShowScraping(false)}
            onSuccess={() => { setShowScraping(false); fetchProspects(); }}
          />
        )}

        {selectedProspect && (
          <EmailComposer
            prospect={selectedProspect}
            onClose={() => setSelectedProspect(null)}
          />
        )}

        {whatsappProspect && (
          <WhatsAppComposer
            prospect={whatsappProspect}
            onClose={() => setWhatsappProspect(null)}
          />
        )}

        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="w-4 h-4 text-violet-400" />
              {t("pp_list_title")}
              <span className="ml-auto text-sm font-normal text-gray-400">{t("pp_total", { n: total })}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
              </div>
            ) : prospects.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Target className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="font-medium">{t("pp_no")}</p>
                <p className="text-sm mt-1">{t("pp_no_desc")}</p>
                <Button variant="warm" className="mt-4" onClick={() => setShowScraping(true)}>
                  {t("pp_scrape_now")}
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium uppercase tracking-wider">{t("pp_col_prospect")}</th>
                      <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium uppercase tracking-wider hidden md:table-cell">{t("pp_col_contact")}</th>
                      <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium uppercase tracking-wider hidden lg:table-cell">{t("pp_col_location")}</th>
                      <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium uppercase tracking-wider">{t("pp_col_status")}</th>
                      <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium uppercase tracking-wider hidden sm:table-cell">{t("pp_col_score")}</th>
                      <th className="px-6 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {prospects.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-900/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                              <Building2 className="w-4 h-4 text-violet-400" />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-medium text-gray-200">{p.name}</p>
                                {!p.website && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400 border border-orange-500/30">
                                    <Ban className="w-2.5 h-2.5" />{t("pp_no_website_badge")}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 capitalize">{p.niche}</p>
                              {p.rating && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                  <span className="text-xs text-gray-400">{p.rating} ({p.reviewCount})</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <div className="space-y-1">
                            {p.email && (
                              <div className="flex items-center gap-1.5 text-xs text-gray-300">
                                <Mail className="w-3 h-3 text-gray-500" />{p.email}
                              </div>
                            )}
                            {p.phone && (
                              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                <Phone className="w-3 h-3 text-gray-500" />{p.phone}
                              </div>
                            )}
                            {p.website && (
                              <a href={p.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-violet-400 hover:underline">
                                <Globe className="w-3 h-3" />{t("pp_website")}
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden lg:table-cell">
                          <div className="flex items-center gap-1.5 text-sm text-gray-400">
                            <MapPin className="w-3 h-3 text-gray-500" />{p.city}
                          </div>
                          {p.address && <p className="text-xs text-gray-600 mt-0.5">{p.address}</p>}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={statusBadge[p.status] as any || "secondary"}>
                            {t(`pst_${p.status}` as any) || p.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 hidden sm:table-cell">
                          {(() => {
                            const score = prospectScore(p);
                            const [bg, text, border, label] =
                              score >= 80
                                ? ["bg-emerald-500/15", "text-emerald-400", "border-emerald-500/30", t("ps_score_excellent")]
                                : score >= 50
                                ? ["bg-orange-500/15", "text-orange-400", "border-orange-500/30", t("ps_score_good")]
                                : ["bg-red-500/15", "text-red-400", "border-red-500/30", t("ps_score_low")];
                            return (
                              <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border font-medium ${bg} ${text} ${border}`}>
                                <span className="font-bold tabular-nums">{score}</span>
                                <span className="opacity-80">{label}</span>
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 justify-end">
                            {p.phone && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs border-emerald-500/30 text-emerald-400 hover:border-emerald-400/60 hover:bg-emerald-500/10"
                                onClick={() => { setWhatsappProspect(p); setSelectedProspect(null); }}
                              >
                                <MessageCircle className="w-3 h-3" />{t("wa_btn")}
                              </Button>
                            )}
                            {p.email && (
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setSelectedProspect(p); setWhatsappProspect(null); }}>
                                <Mail className="w-3 h-3" />{t("pp_email_ai")}
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 hover:text-red-400 hover:bg-red-500/10"
                              onClick={() => deleteProspect(p.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {total > 20 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              {t("pp_page", { n: page })} · {t("pp_total_label", { n: total })}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>{t("pp_prev")}</Button>
              <Button variant="outline" size="sm" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>{t("pp_next")}</Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
