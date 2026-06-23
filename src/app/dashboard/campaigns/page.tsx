"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/dashboard/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import Link from "next/link";
import {
  Megaphone, Plus, Play, Pause, Trash2, Loader2,
  Mail, Target, BarChart2, Sparkles, ArrowRight,
} from "lucide-react";
import type { Campaign } from "@/types";
import { formatDate } from "@/lib/utils";
import { useI18n } from "@/components/language-provider";

const statusColors: Record<string, string> = {
  DRAFT: "secondary", ACTIVE: "success", PAUSED: "warning", COMPLETED: "default",
};

export default function CampaignsPage() {
  const { t } = useI18n();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "", niche: "", city: "", subject: "", template: "", dailyLimit: 20,
  });

  useEffect(() => {
    setForm(f => ({ ...f, template: t("cam_default_template") }));
  }, [t]);

  async function fetchCampaigns() {
    const res = await fetch("/api/campaigns");
    const data = await res.json();
    setCampaigns(data.campaigns || []);
    setLoading(false);
  }

  useEffect(() => { fetchCampaigns(); }, []);

  async function createCampaign() {
    setCreating(true);
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowCreate(false);
      setForm({ name: "", niche: "", city: "", subject: "", template: t("cam_default_template"), dailyLimit: 20 });
      fetchCampaigns();
    }
    setCreating(false);
  }

  async function updateStatus(id: string, status: string) {
    await fetch("/api/campaigns", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    fetchCampaigns();
  }

  async function deleteCampaign(id: string) {
    if (!confirm(t("cam_delete_confirm"))) return;
    await fetch(`/api/campaigns?id=${id}`, { method: "DELETE" });
    fetchCampaigns();
  }

  return (
    <>
      <TopBar title={t("cam_title")} description={t("cam_desc")} />

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/dashboard/drafts"
            className="flex-1 flex items-center gap-3 bg-violet-500/10 border border-violet-500/20 rounded-lg px-4 py-3 hover:bg-violet-500/15 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-violet-300">{t("cam_auto_banner")}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-violet-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Button variant="gradient" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" />{t("cam_new_btn")}
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
          </div>
        ) : campaigns.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-gray-500">
              <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium">{t("cam_no")}</p>
              <p className="text-sm mt-1">{t("cam_no_desc")}</p>
              <Button variant="gradient" className="mt-4" onClick={() => setShowCreate(true)}>
                {t("cam_create_first")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {campaigns.map((c) => (
              <Card key={c.id} className="hover:border-gray-700 transition-colors">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-white truncate">{c.name}</h3>
                        <Badge variant={statusColors[c.status] as any}>
                          {t(`cam_st_${c.status}` as any) || c.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Target className="w-3.5 h-3.5" /> {c.niche} · {c.city}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" /> {t("cam_per_day", { n: c.dailyLimit })}
                        </span>
                        <span className="text-gray-600">{formatDate(c.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {[
                        { label: t("cam_col_sent"), value: c.sentCount, icon: Mail },
                        { label: t("cam_col_opened"), value: c.openCount, icon: BarChart2 },
                        { label: t("cam_col_replies"), value: c.replyCount, icon: Megaphone },
                      ].map((s) => (
                        <div key={s.label} className="text-center">
                          <p className="text-xl font-bold text-white">{s.value}</p>
                          <p className="text-xs text-gray-500">{s.label}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      {c.status === "ACTIVE" ? (
                        <Button variant="outline" size="sm" onClick={() => updateStatus(c.id, "PAUSED")}>
                          <Pause className="w-3.5 h-3.5" />{t("cam_pause")}
                        </Button>
                      ) : c.status !== "COMPLETED" ? (
                        <Button variant="gradient" size="sm" onClick={() => updateStatus(c.id, "ACTIVE")}>
                          <Play className="w-3.5 h-3.5" />{t("cam_launch")}
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:text-red-400 hover:bg-red-500/10"
                        onClick={() => deleteCampaign(c.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("cam_form_title")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label>{t("cam_form_name")}</Label>
                <Input placeholder={t("cam_form_name_ph")} value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("cam_form_niche")}</Label>
                <Input placeholder={t("cam_form_niche_ph")} value={form.niche} onChange={(e) => setForm(f => ({ ...f, niche: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("cam_form_city")}</Label>
                <Input placeholder={t("cam_form_city_ph")} value={form.city} onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>{t("cam_form_subject")}</Label>
                <Input placeholder={t("cam_form_subject_ph")} value={form.subject} onChange={(e) => setForm(f => ({ ...f, subject: e.target.value }))} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>{t("cam_form_template")}</Label>
                <Textarea rows={8} value={form.template} onChange={(e) => setForm(f => ({ ...f, template: e.target.value }))} />
                <p className="text-xs text-gray-500">{t("cam_form_template_hint")}</p>
              </div>
              <div className="space-y-1.5">
                <Label>{t("cam_form_limit")}</Label>
                <Input type="number" min={1} max={500} value={form.dailyLimit} onChange={(e) => setForm(f => ({ ...f, dailyLimit: parseInt(e.target.value) || 20 }))} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>{t("cam_form_cancel")}</Button>
            <Button variant="gradient" onClick={createCampaign} disabled={creating || !form.name || !form.niche || !form.city}>
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {creating ? t("cam_form_creating") : t("cam_form_create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
