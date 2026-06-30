"use client";

import { useEffect, useState, useCallback } from "react";
import { TopBar } from "@/components/dashboard/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText, Loader2, Send, Trash2, Pencil, X, Save,
  Plus, Power, PowerOff, MapPin, Clock, Sparkles, Info,
  AlertCircle, CheckCircle2,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { useI18n } from "@/components/language-provider";

interface Draft {
  id: string;
  subject: string;
  body: string;
  createdAt: string;
  prospect: { name: string; email: string | null; niche: string; city: string; company: string | null };
}

interface AutoCamp {
  id: string;
  niche: string;
  cities: string;
  frequency: string;
  prospectsPerCycle: number;
  active: boolean;
  lastRunAt: string | null;
  createdAt: string;
}

type Toast = { type: "error" | "success"; text: string };

export default function DraftsPage() {
  const { t } = useI18n();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [camps, setCamps] = useState<AutoCamp[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [sending, setSending] = useState<Record<string, boolean>>({});
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ niche: "", cities: "", frequency: "daily", prospectsPerCycle: "5" });
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = useCallback((type: Toast["type"], text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 5000);
  }, []);

  async function apiError(res: Response): Promise<string> {
    try {
      const data = await res.json();
      return data.error || `Erreur ${res.status}`;
    } catch {
      return `Erreur ${res.status}`;
    }
  }

  useEffect(() => {
    Promise.all([
      fetch("/api/drafts").then(r => r.ok ? r.json() : { drafts: [] }),
      fetch("/api/auto-campaigns").then(r => r.ok ? r.json() : { campaigns: [] }),
    ]).then(([d, c]) => {
      setDrafts(d.drafts || []);
      setCamps(c.campaigns || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  function startEdit(draft: Draft) {
    setEditing(draft.id);
    setEditSubject(draft.subject);
    setEditBody(draft.body);
  }

  async function saveDraft(id: string) {
    setSaving(p => ({ ...p, [id]: true }));
    const res = await fetch(`/api/drafts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: editSubject, body: editBody }),
    });
    setSaving(p => ({ ...p, [id]: false }));
    if (res.ok) {
      setDrafts(prev => prev.map(d => d.id === id ? { ...d, subject: editSubject, body: editBody } : d));
      setEditing(null);
    } else {
      showToast("error", await apiError(res));
    }
  }

  async function sendDraft(id: string) {
    setSending(p => ({ ...p, [id]: true }));
    const res = await fetch(`/api/drafts/${id}/send`, { method: "POST" });
    setSending(p => ({ ...p, [id]: false }));
    if (res.ok) {
      setDrafts(prev => prev.filter(d => d.id !== id));
      showToast("success", t("dr_sent"));
    } else {
      showToast("error", await apiError(res));
    }
  }

  async function deleteDraft(id: string) {
    if (!confirm(t("dr_delete_confirm"))) return;
    const res = await fetch(`/api/drafts/${id}`, { method: "DELETE" });
    if (res.ok) {
      setDrafts(prev => prev.filter(d => d.id !== id));
    } else {
      showToast("error", await apiError(res));
    }
  }

  async function createAutoCampaign() {
    if (!formData.niche || !formData.cities) return;
    setCreating(true);
    const res = await fetch("/api/auto-campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    setCreating(false);
    if (res.ok) {
      const { campaign } = await res.json();
      setCamps(prev => [campaign, ...prev]);
      setShowForm(false);
      setFormData({ niche: "", cities: "", frequency: "daily", prospectsPerCycle: "5" });
      showToast("success", t("ac_created"));
    } else {
      showToast("error", await apiError(res));
    }
  }

  async function toggleCamp(id: string, active: boolean) {
    const res = await fetch(`/api/auto-campaigns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    if (res.ok) {
      setCamps(prev => prev.map(c => c.id === id ? { ...c, active: !active } : c));
    } else {
      showToast("error", await apiError(res));
    }
  }

  async function deleteCamp(id: string) {
    if (!confirm(t("ac_delete_confirm"))) return;
    const res = await fetch(`/api/auto-campaigns/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCamps(prev => prev.filter(c => c.id !== id));
    } else {
      showToast("error", await apiError(res));
    }
  }

  if (loading) {
    return (
      <>
        <TopBar title={t("dr_title")} description={t("dr_desc")} />
        <div className="flex justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar title={t("dr_title")} description={t("dr_desc")} />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Toast notification */}
        {toast && (
          <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm animate-in fade-in slide-in-from-top-2 ${
            toast.type === "error"
              ? "bg-red-500/15 border border-red-500/30 text-red-300"
              : "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
          }`}>
            {toast.type === "error"
              ? <AlertCircle className="w-4 h-4 shrink-0" />
              : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span className="flex-1">{toast.text}</span>
            <button onClick={() => setToast(null)} className="p-0.5 hover:opacity-70">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Auto-campaigns section */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="w-4 h-4 text-violet-400" />
                {t("ac_title")}
              </CardTitle>
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-1 text-xs text-violet-400 border border-violet-500/40 rounded px-2.5 py-1 hover:bg-violet-500/15 transition-colors"
              >
                {showForm ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                {showForm ? t("dr_cancel") : t("ac_new")}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">{t("ac_desc")}</p>
          </CardHeader>

          <CardContent className="space-y-3">
            {/* Creation form */}
            {showForm && (
              <div className="bg-gray-800/40 rounded-lg p-4 space-y-3 border border-gray-700/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">{t("ac_niche")}</label>
                    <input
                      value={formData.niche}
                      onChange={e => setFormData(p => ({ ...p, niche: e.target.value }))}
                      placeholder={t("ac_niche_ph")}
                      className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">{t("ac_cities")}</label>
                    <input
                      value={formData.cities}
                      onChange={e => setFormData(p => ({ ...p, cities: e.target.value }))}
                      placeholder={t("ac_cities_ph")}
                      className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">{t("ac_freq")}</label>
                    <select
                      value={formData.frequency}
                      onChange={e => setFormData(p => ({ ...p, frequency: e.target.value }))}
                      className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-sm text-white"
                    >
                      <option value="daily">{t("ac_daily")}</option>
                      <option value="weekly">{t("ac_weekly")}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">{t("ac_limit")}</label>
                    <input
                      type="number" min="1" max="20"
                      value={formData.prospectsPerCycle}
                      onChange={e => setFormData(p => ({ ...p, prospectsPerCycle: e.target.value }))}
                      className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-sm text-white"
                    />
                  </div>
                </div>
                <button
                  onClick={createAutoCampaign}
                  disabled={creating || !formData.niche || !formData.cities}
                  className="flex items-center gap-1 text-sm bg-violet-600 hover:bg-violet-500 text-white rounded px-4 py-1.5 disabled:opacity-50 transition-colors"
                >
                  {creating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                  {creating ? t("ac_creating") : t("ac_create")}
                </button>
              </div>
            )}

            {/* Active auto-campaigns list */}
            {camps.length === 0 && !showForm ? (
              <p className="text-sm text-gray-500 py-2">{t("ac_no")}</p>
            ) : (
              camps.map(c => (
                <div key={c.id} className="flex items-center gap-3 bg-gray-800/30 rounded-lg px-4 py-2.5 border border-gray-800/60">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{c.niche}</span>
                      <Badge variant={c.active ? "default" : "secondary"} className="text-[10px]">
                        {c.active ? t("ac_active") : t("ac_paused")}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{c.cities}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{t(c.frequency === "weekly" ? "ac_weekly" : "ac_daily")}</span>
                      <span>{c.prospectsPerCycle} {t("ac_per_cycle")}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleCamp(c.id, c.active)}
                    className="p-1.5 rounded hover:bg-gray-700/50 transition-colors"
                    title={c.active ? t("ac_paused") : t("ac_active")}
                  >
                    {c.active
                      ? <Power className="w-4 h-4 text-emerald-400" />
                      : <PowerOff className="w-4 h-4 text-gray-500" />}
                  </button>
                  <button
                    onClick={() => deleteCamp(c.id)}
                    className="p-1.5 rounded hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-400" />
                  </button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Help banner */}
        <div className="flex items-start gap-2 bg-gray-800/50 rounded-lg px-3 py-2.5">
          <Info className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
          <p className="text-xs text-gray-400">{t("dr_help")}</p>
        </div>

        {/* Drafts list */}
        <div className="space-y-3">
          {drafts.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <FileText className="w-10 h-10 mx-auto mb-3 text-gray-700" />
                <p className="font-medium text-gray-400">{t("dr_no")}</p>
                <p className="text-sm text-gray-500 mt-1">{t("dr_no_desc")}</p>
              </CardContent>
            </Card>
          ) : (
            drafts.map(draft => {
              const isEditing = editing === draft.id;
              const isSending = !!sending[draft.id];
              const isSaving = !!saving[draft.id];

              return (
                <Card key={draft.id} className="border-gray-800/60">
                  <CardContent className="p-4">
                    {/* Prospect info */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm font-medium text-white">{draft.prospect.name}</p>
                        <p className="text-xs text-gray-500">
                          {draft.prospect.niche} · {draft.prospect.city}
                          {draft.prospect.email && <span className="ml-2 text-gray-400">{draft.prospect.email}</span>}
                        </p>
                      </div>
                      <span className="text-xs text-gray-600">{formatDateTime(draft.createdAt)}</span>
                    </div>

                    {isEditing ? (
                      /* Edit mode */
                      <div className="space-y-2">
                        <input
                          value={editSubject}
                          onChange={e => setEditSubject(e.target.value)}
                          className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-sm text-white"
                        />
                        <textarea
                          value={editBody}
                          onChange={e => setEditBody(e.target.value)}
                          rows={8}
                          className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-sm text-white resize-y"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveDraft(draft.id)}
                            disabled={isSaving}
                            className="flex items-center gap-1 text-xs bg-violet-600 hover:bg-violet-500 text-white rounded px-3 py-1 disabled:opacity-50 transition-colors"
                          >
                            {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                            {t("dr_save")}
                          </button>
                          <button
                            onClick={() => setEditing(null)}
                            className="flex items-center gap-1 text-xs text-gray-400 border border-gray-700 rounded px-3 py-1 hover:bg-gray-800 transition-colors"
                          >
                            <X className="w-3 h-3" />{t("dr_cancel")}
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* View mode */
                      <>
                        <div className="bg-gray-800/40 rounded-lg p-3 mb-3">
                          <p className="text-xs text-gray-500 mb-1">{t("dr_subject")}</p>
                          <p className="text-sm text-white">{draft.subject}</p>
                          <p className="text-xs text-gray-500 mt-2 mb-1">{t("dr_body_label")}</p>
                          <p className="text-sm text-gray-300 whitespace-pre-line line-clamp-4">{draft.body}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(draft)}
                            className="flex items-center gap-1 text-xs text-gray-400 border border-gray-700 rounded px-2.5 py-1 hover:bg-gray-800 hover:text-white transition-colors"
                          >
                            <Pencil className="w-3 h-3" />{t("dr_edit")}
                          </button>
                          <button
                            onClick={() => sendDraft(draft.id)}
                            disabled={isSending || !draft.prospect.email}
                            className="flex items-center gap-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded px-2.5 py-1 disabled:opacity-50 transition-colors"
                          >
                            {isSending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                            {isSending ? t("dr_sending") : t("dr_send")}
                          </button>
                          <button
                            onClick={() => deleteDraft(draft.id)}
                            className="flex items-center gap-1 text-xs text-gray-500 border border-gray-700 rounded px-2.5 py-1 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />{t("dr_delete")}
                          </button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
