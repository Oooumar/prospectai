"use client";

import { useEffect, useState, useCallback } from "react";
import { TopBar } from "@/components/dashboard/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, Target, Trash2, Mail, Loader2,
  Globe, Ban, Phone, Star, MapPin, Building2, MessageCircle, X, Smartphone, PhoneCall, MailCheck,
} from "lucide-react";
import { detectPhoneType } from "@/lib/phone";
import { ScrapingModule } from "@/components/scraping/scraping-module";
import { EmailComposer } from "@/components/emails/email-composer";
import { WhatsAppComposer } from "@/components/whatsapp/whatsapp-composer";
import { WhatsAppCampaignModal } from "@/components/whatsapp/whatsapp-campaign-modal";
import { EmailBulkDraftModal } from "@/components/emails/email-bulk-draft-modal";
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

const STATUS_CLS: Record<string, string> = {
  NEW:             "bg-gray-500/15 text-gray-400 border-gray-500/30",
  CONTACTED:       "bg-blue-500/15 text-blue-400 border-blue-500/30",
  OPENED:          "bg-violet-500/15 text-violet-400 border-violet-500/30",
  REPLIED:         "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  CONVERTED:       "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  UNSUBSCRIBED:    "bg-red-500/15 text-red-400 border-red-500/30",
  HOT:             "bg-red-500/20 text-red-400 border-red-500/40",
  TO_FOLLOW_UP:    "bg-amber-400/15 text-amber-400 border-amber-400/30",
  CLIENT:          "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  NOT_INTERESTED:  "bg-gray-600/15 text-gray-500 border-gray-600/30",
  LOW_PRIORITY:    "bg-sky-500/15 text-sky-400 border-sky-500/30",
};
const STATUS_EMOJI: Record<string, string> = {
  HOT: "🔥", TO_FOLLOW_UP: "🟡", CLIENT: "✅", NOT_INTERESTED: "❌", LOW_PRIORITY: "❄️",
};
const MANUAL_STATUSES = ["HOT", "CLIENT", "NOT_INTERESTED", "LOW_PRIORITY"] as const;
const AUTO_STATUSES = new Set(["NEW", "CONTACTED", "OPENED", "REPLIED", "TO_FOLLOW_UP", "CONVERTED", "UNSUBSCRIBED"]);

export default function ProspectsPage() {
  const { t } = useI18n();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [noWebsite, setNoWebsite] = useState(false);
  const [mobileOnly, setMobileOnly] = useState(false);
  const [withEmail, setWithEmail] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [whatsappProspect, setWhatsappProspect] = useState<Prospect | null>(null);
  const [showScraping, setShowScraping] = useState(false);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showEmailCampaignModal, setShowEmailCampaignModal] = useState(false);
  const [openStatusId, setOpenStatusId] = useState<string | null>(null);

  const fetchProspects = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), search });
    if (noWebsite) params.set("noWebsite", "true");
    if (withEmail) params.set("withEmail", "true");
    const res = await fetch(`/api/prospects?${params}`);
    const data = await res.json();
    setProspects(data.prospects || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, search, noWebsite, withEmail]);

  useEffect(() => { fetchProspects(); }, [fetchProspects]);

  async function deleteProspect(id: string) {
    if (!confirm(t("pp_delete_confirm"))) return;
    await fetch(`/api/prospects?id=${id}`, { method: "DELETE" });
    setSelectedIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    fetchProspects();
  }

  async function updateProspectStatus(id: string, status: string) {
    setOpenStatusId(null);
    setProspects(prev => prev.map(p => p.id === id ? { ...p, status: status as any } : p));
    await fetch(`/api/prospects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  function toggleSelect(id: string, hasPhone: boolean) {
    if (!hasPhone) return;
    setSelectedIds(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  }

  function selectAllWithPhone() {
    const withPhone = prospects.filter(p => p.phone).map(p => p.id);
    if (withPhone.every(id => selectedIds.has(id))) {
      setSelectedIds(prev => { const s = new Set(prev); withPhone.forEach(id => s.delete(id)); return s; });
    } else {
      setSelectedIds(prev => new Set([...prev, ...withPhone]));
    }
  }

  const displayedProspects = mobileOnly
    ? prospects.filter(p => p.phone && detectPhoneType(p.phone, p.city) === "mobile")
    : prospects;

  const prospectsWithPhone = displayedProspects.filter(p => p.phone);
  const allCurrentSelected = prospectsWithPhone.length > 0 && prospectsWithPhone.every(p => selectedIds.has(p.id));

  return (
    <>
      <TopBar title={t("pp_title")} description={t("pp_desc", { n: total })} />

      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
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
            className={`flex items-center justify-center gap-1.5 text-xs border rounded-lg px-3 py-2 transition-colors shrink-0 w-full sm:w-auto ${
              noWebsite
                ? "bg-orange-500/15 border-orange-500/40 text-orange-300"
                : "border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300"
            }`}
          >
            <Ban className="w-3.5 h-3.5" />
            {t("pp_no_website")}
          </button>
          <button
            onClick={() => setMobileOnly(v => !v)}
            className={`flex items-center justify-center gap-1.5 text-xs border rounded-lg px-3 py-2 transition-colors shrink-0 w-full sm:w-auto ${
              mobileOnly
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                : "border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            {t("pp_mobile_filter")}
          </button>
          <button
            onClick={() => { setWithEmail(v => !v); setPage(1); }}
            className={`flex items-center justify-center gap-1.5 text-xs border rounded-lg px-3 py-2 transition-colors shrink-0 w-full sm:w-auto ${
              withEmail
                ? "bg-blue-500/15 border-blue-500/40 text-blue-300"
                : "border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300"
            }`}
          >
            <MailCheck className="w-3.5 h-3.5" />
            {t("pp_email_filter")}
          </button>
          <Button variant="warm" className="w-full sm:w-auto" onClick={() => setShowScraping(true)}>
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
              {prospectsWithPhone.length > 0 && (
                <button
                  onClick={selectAllWithPhone}
                  className="text-xs text-gray-500 hover:text-emerald-400 transition-colors ml-2"
                >
                  {allCurrentSelected ? "✓" : "○"} {t("wc_selected", { n: prospectsWithPhone.length })}
                </button>
              )}
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
                      <th className="w-10 px-4 py-3" />
                      <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium uppercase tracking-wider">{t("pp_col_prospect")}</th>
                      <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium uppercase tracking-wider hidden md:table-cell">{t("pp_col_contact")}</th>
                      <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium uppercase tracking-wider hidden lg:table-cell">{t("pp_col_location")}</th>
                      <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium uppercase tracking-wider">{t("pp_col_status")}</th>
                      <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium uppercase tracking-wider hidden sm:table-cell">{t("pp_col_score")}</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {displayedProspects.map((p) => {
                      const isSelected = selectedIds.has(p.id);
                      const phoneType = p.phone ? detectPhoneType(p.phone, p.city) : "unknown";
                      return (
                        <tr
                          key={p.id}
                          className={`hover:bg-gray-900/40 transition-colors ${isSelected ? "bg-emerald-500/5" : ""}`}
                        >
                          <td className="px-4 py-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(p.id, !!p.phone)}
                              disabled={!p.phone}
                              title={p.phone ? undefined : t("wc_no_phone_hint")}
                              className={`w-4 h-4 rounded border-gray-600 bg-gray-800 accent-emerald-500 ${p.phone ? "cursor-pointer" : "cursor-not-allowed opacity-25"}`}
                            />
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                                <Building2 className="w-4 h-4 text-violet-400" />
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="text-sm font-medium text-gray-200">{p.name}</p>
                                  {p.website ? (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">
                                      <Globe className="w-2.5 h-2.5" />{t("pp_website")}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400 border border-orange-500/30">
                                      <Ban className="w-2.5 h-2.5" />{t("pp_no_website_badge")}
                                    </span>
                                  )}
                                  {p.email && (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                      <MailCheck className="w-2.5 h-2.5" />{t("pp_email_badge")}
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
                          <td className="px-4 py-4 hidden md:table-cell">
                            <div className="space-y-1">
                              {p.email && (
                                <div className="flex items-center gap-1.5 text-xs text-gray-300">
                                  <Mail className="w-3 h-3 text-gray-500" />{p.email}
                                </div>
                              )}
                              {p.phone && (
                                <div className="flex items-center gap-1.5 text-xs text-gray-400 flex-wrap">
                                  <div className="flex items-center gap-1">
                                    <Phone className="w-3 h-3 text-gray-500" />{p.phone}
                                  </div>
                                  {phoneType === "mobile" && (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                      <Smartphone className="w-2.5 h-2.5" />{t("pp_mobile_badge")}
                                    </span>
                                  )}
                                  {phoneType === "landline" && (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-gray-500/10 text-gray-400 border border-gray-500/30">
                                      <PhoneCall className="w-2.5 h-2.5" />{t("pp_landline_badge")}
                                    </span>
                                  )}
                                </div>
                              )}
                              {p.website && (
                                <a href={p.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-violet-400 hover:underline">
                                  <Globe className="w-3 h-3" />{t("pp_website")}
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 hidden lg:table-cell">
                            <div className="flex items-center gap-1.5 text-sm text-gray-400">
                              <MapPin className="w-3 h-3 text-gray-500" />{p.city}
                            </div>
                            {p.address && <p className="text-xs text-gray-600 mt-0.5">{p.address}</p>}
                          </td>
                          <td className="px-4 py-4 relative">
                            <button
                              onClick={() => setOpenStatusId(openStatusId === p.id ? null : p.id)}
                              className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border font-medium transition-opacity hover:opacity-80 ${STATUS_CLS[p.status] ?? STATUS_CLS.NEW}`}
                            >
                              {STATUS_EMOJI[p.status] ?? null}
                              {t(`pst_${p.status}` as any) || p.status}
                              {!AUTO_STATUSES.has(p.status) || true ? <span className="opacity-40 ml-0.5">▾</span> : null}
                            </button>
                            {openStatusId === p.id && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setOpenStatusId(null)} />
                                <div className="absolute z-50 top-full mt-1 left-0 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-1 min-w-[170px]">
                                  {MANUAL_STATUSES.map(s => (
                                    <button
                                      key={s}
                                      onClick={() => updateProspectStatus(p.id, s)}
                                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-gray-800 transition-colors text-left ${(p.status as string) === s ? "bg-gray-800 font-medium" : "text-gray-300"}`}
                                    >
                                      <span>{STATUS_EMOJI[s]}</span>
                                      <span>{t(`pst_${s}` as any)}</span>
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                          </td>
                          <td className="px-4 py-4 hidden sm:table-cell">
                            {(() => {
                              const score = prospectScore(p);
                              let badgeCls = "bg-red-500/15 text-red-400 border-red-500/30";
                              let badgeLabel = t("ps_score_low");
                              if (score >= 80) {
                                badgeCls = "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
                                badgeLabel = t("ps_score_excellent");
                              } else if (score >= 50) {
                                badgeCls = "bg-orange-500/15 text-orange-400 border-orange-500/30";
                                badgeLabel = t("ps_score_good");
                              }
                              return (
                                <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border font-medium ${badgeCls}`}>
                                  <span className="font-bold tabular-nums">{score}</span>
                                  <span className="opacity-80">{badgeLabel}</span>
                                </span>
                              );
                            })()}
                          </td>
                          <td className="px-4 py-4">
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
                      );
                    })}
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

      {/* Sticky action bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 pointer-events-none px-4">
          <div className="pointer-events-auto bg-gray-900 border border-emerald-500/40 rounded-2xl shadow-2xl shadow-emerald-500/10 px-5 py-3 flex items-center gap-4">
            <span className="text-sm text-gray-300 font-medium">
              {t("wc_selected", { n: selectedIds.size })}
            </span>
            <Button
              size="sm"
              onClick={() => setShowEmailCampaignModal(true)}
            >
              <Mail className="w-4 h-4" />
              Campagne Email
            </Button>
            <Button
              variant="warm"
              size="sm"
              onClick={() => setShowCampaignModal(true)}
            >
              <MessageCircle className="w-4 h-4" />
              {t("wc_campaign_wa")}
            </Button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="p-1.5 rounded hover:bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {showCampaignModal && (
        <WhatsAppCampaignModal
          prospectIds={Array.from(selectedIds)}
          onClose={() => { setShowCampaignModal(false); setSelectedIds(new Set()); }}
        />
      )}

      {showEmailCampaignModal && (
        <EmailBulkDraftModal
          prospectIds={Array.from(selectedIds)}
          onClose={() => { setShowEmailCampaignModal(false); setSelectedIds(new Set()); }}
        />
      )}
    </>
  );
}
