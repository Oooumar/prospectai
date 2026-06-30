"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { TopBar } from "@/components/dashboard/topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Settings, User, Shield, Zap, Loader2, Check, Globe, Building2, MessageCircle, Info, Plus, Pencil, Trash2, Star, X } from "lucide-react";
import { getInitials, formatDate } from "@/lib/utils";
import { useI18n } from "@/components/language-provider";
import { LanguageSelector } from "@/components/language-selector";

interface ProductProfile {
  id: string;
  name: string;
  companyName: string | null;
  website: string | null;
  productDescription: string | null;
  whatsappNumber: string | null;
  isDefault: boolean;
}

interface ProfileForm {
  name: string;
  companyName: string;
  website: string;
  productDescription: string;
  whatsappNumber: string;
}

const emptyForm: ProfileForm = { name: "", companyName: "", website: "", productDescription: "", whatsappNumber: "" };

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const { t } = useI18n();
  const [user, setUser] = useState<any>(null);
  const [warmup, setWarmup] = useState<{ limit: number; tier: string; daysLeft: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ name: "" });
  const [pwForm, setPwForm] = useState({ current: "", new: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwSaved, setPwSaved] = useState(false);

  // Profiles state
  const [profiles, setProfiles] = useState<ProductProfile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ProfileForm>(emptyForm);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newForm, setNewForm] = useState<ProfileForm>(emptyForm);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(data => {
        setUser(data.user);
        setWarmup(data.warmup);
        setForm({ name: data.user?.name || "" });
      });
    loadProfiles();
  }, []);

  async function loadProfiles() {
    setProfilesLoading(true);
    try {
      const res = await fetch("/api/profiles");
      const data = await res.json();
      setProfiles(data.profiles ?? []);
    } finally {
      setProfilesLoading(false);
    }
  }

  function flash(text: string, ok = true) {
    setProfileMsg({ text, ok });
    setTimeout(() => setProfileMsg(null), 2500);
  }

  async function saveProfile() {
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name }),
    });
    if (res.ok) {
      setSaved(true);
      await update({ name: form.name });
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  async function savePassword() {
    setPwError("");
    if (pwForm.new !== pwForm.confirm) { setPwError(t("set_pw_mismatch")); return; }
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.new }),
    });
    const data = await res.json();
    if (res.ok) {
      setPwSaved(true);
      setPwForm({ current: "", new: "", confirm: "" });
      setTimeout(() => setPwSaved(false), 2000);
    } else {
      setPwError(data.error === "Mot de passe actuel incorrect" ? t("set_pw_wrong") : data.error || "Erreur");
    }
    setSaving(false);
  }

  async function createProfile() {
    if (!newForm.name.trim()) return;
    setProfileSaving(true);
    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newForm),
      });
      if (res.ok) {
        setNewForm(emptyForm);
        setShowNewForm(false);
        flash(t("pr_created"));
        await loadProfiles();
      } else {
        const d = await res.json();
        flash(d.error || "Erreur", false);
      }
    } finally {
      setProfileSaving(false);
    }
  }

  function startEdit(p: ProductProfile) {
    setEditingId(p.id);
    setEditForm({ name: p.name, companyName: p.companyName ?? "", website: p.website ?? "", productDescription: p.productDescription ?? "", whatsappNumber: p.whatsappNumber ?? "" });
    setDeleteConfirmId(null);
  }

  async function saveEdit() {
    if (!editingId || !editForm.name.trim()) return;
    setProfileSaving(true);
    try {
      const res = await fetch(`/api/profiles/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setEditingId(null);
        flash(t("pr_saved"));
        await loadProfiles();
      } else {
        const d = await res.json();
        flash(d.error || "Erreur", false);
      }
    } finally {
      setProfileSaving(false);
    }
  }

  async function setDefault(id: string) {
    await fetch(`/api/profiles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ setDefault: true }),
    });
    await loadProfiles();
  }

  async function deleteProfile(id: string) {
    await fetch(`/api/profiles/${id}`, { method: "DELETE" });
    setDeleteConfirmId(null);
    setEditingId(null);
    flash("Profil supprimé", true);
    await loadProfiles();
  }

  function ProfileFormFields({ f, set }: { f: ProfileForm; set: (upd: Partial<ProfileForm>) => void }) {
    return (
      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-xs">{t("pr_name_label")} *</Label>
          <Input value={f.name} onChange={e => set({ name: e.target.value })} placeholder={t("pr_name_ph")} className="h-8 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">{t("set_company_name")}</Label>
            <Input value={f.companyName} onChange={e => set({ companyName: e.target.value })} placeholder={t("set_company_name_ph")} className="h-8 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t("set_company_website")}</Label>
            <Input value={f.website} onChange={e => set({ website: e.target.value })} placeholder={t("set_company_website_ph")} type="url" className="h-8 text-sm" />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t("set_company_product_desc")}</Label>
          <Textarea value={f.productDescription} onChange={e => set({ productDescription: e.target.value })} placeholder={t("set_company_product_desc_ph")} rows={2} className="resize-none text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1.5">
            <MessageCircle className="w-3 h-3 text-emerald-400" />
            {t("set_whatsapp")}
          </Label>
          <Input value={f.whatsappNumber} onChange={e => set({ whatsappNumber: e.target.value })} placeholder={t("set_whatsapp_ph")} type="tel" className="h-8 text-sm" />
        </div>
      </div>
    );
  }

  return (
    <>
      <TopBar title={t("set_title")} description={t("set_desc")} />

      <div className="p-6 space-y-6 max-w-2xl">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="w-4 h-4 text-violet-400" />
              {t("set_profile_title")}
            </CardTitle>
            <CardDescription>{t("set_profile_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xl font-bold text-white shadow-lg">
                {form.name ? getInitials(form.name) : "U"}
              </div>
              <div>
                <p className="font-semibold text-white">{form.name || "Utilisateur"}</p>
                <p className="text-sm text-gray-400">{user?.email}</p>
                {user?.createdAt && (
                  <p className="text-xs text-gray-600">{t("set_member", { date: formatDate(user.createdAt) })}</p>
                )}
              </div>
              <Badge variant="default" className="ml-auto">PRO</Badge>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>{t("set_name")}</Label>
                <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("set_email")}</Label>
                <Input value={user?.email || ""} disabled className="opacity-60" />
              </div>
            </div>

            <Button variant="gradient" onClick={saveProfile} disabled={saving}>
              {saved ? <><Check className="w-4 h-4" />{t("set_saved")}</> : saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t("set_save")}
            </Button>
          </CardContent>
        </Card>

        {/* Language */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="w-4 h-4 text-blue-400" />
              {t("set_lang_title")}
            </CardTitle>
            <CardDescription>{t("set_lang_desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <LanguageSelector />
          </CardContent>
        </Card>

        {/* Product Profiles */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="w-4 h-4 text-violet-400" />
                  {t("pr_section_title")}
                </CardTitle>
                <CardDescription className="mt-1">{t("pr_section_desc")}</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 h-8 text-xs gap-1"
                onClick={() => { setShowNewForm(v => !v); setEditingId(null); setDeleteConfirmId(null); }}
              >
                {showNewForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                {showNewForm ? t("pr_cancel") : t("pr_add")}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {profileMsg && (
              <div className={`rounded-lg px-3 py-2 text-sm ${profileMsg.ok ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
                {profileMsg.text}
              </div>
            )}

            {showNewForm && (
              <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-4 space-y-3">
                <p className="text-xs font-medium text-violet-300">{t("pr_add")}</p>
                <ProfileFormFields f={newForm} set={u => setNewForm(f => ({ ...f, ...u }))} />
                <div className="flex gap-2">
                  <Button size="sm" variant="gradient" onClick={createProfile} disabled={profileSaving || !newForm.name.trim()}>
                    {profileSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    {profileSaving ? t("pr_saving") : t("pr_add")}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShowNewForm(false); setNewForm(emptyForm); }}>{t("pr_cancel")}</Button>
                </div>
              </div>
            )}

            {profilesLoading ? (
              <div className="flex items-center gap-2 py-4 text-gray-500 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Chargement…
              </div>
            ) : profiles.length === 0 ? (
              <p className="text-sm text-gray-500 py-2">{t("pr_no_profiles")}</p>
            ) : (
              <div className="space-y-2">
                {profiles.map(p => (
                  <div key={p.id} className="rounded-lg border border-gray-700/60 bg-gray-800/30">
                    {editingId === p.id ? (
                      <div className="p-4 space-y-3">
                        <ProfileFormFields f={editForm} set={u => setEditForm(f => ({ ...f, ...u }))} />
                        <div className="flex gap-2">
                          <Button size="sm" variant="gradient" onClick={saveEdit} disabled={profileSaving || !editForm.name.trim()}>
                            {profileSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            {profileSaving ? t("pr_saving") : t("set_save")}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>{t("pr_cancel")}</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-white truncate">{p.name}</span>
                            {p.isDefault && (
                              <Badge className="text-[10px] px-1.5 py-0 h-4 bg-violet-500/20 text-violet-300 border-violet-500/30">
                                {t("pr_default_badge")}
                              </Badge>
                            )}
                          </div>
                          {p.companyName && <p className="text-xs text-gray-400 truncate">{p.companyName}{p.website ? ` · ${p.website}` : ""}</p>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {!p.isDefault && (
                            <button
                              onClick={() => setDefault(p.id)}
                              title={t("pr_set_default")}
                              className="p-1.5 rounded hover:bg-gray-700/60 text-gray-500 hover:text-amber-400 transition-colors"
                            >
                              <Star className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => startEdit(p)}
                            className="p-1.5 rounded hover:bg-gray-700/60 text-gray-500 hover:text-gray-200 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {deleteConfirmId === p.id ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => deleteProfile(p.id)} className="p-1.5 rounded hover:bg-red-500/20 text-red-400 transition-colors">
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setDeleteConfirmId(null)} className="p-1.5 rounded hover:bg-gray-700/60 text-gray-500 transition-colors">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(p.id)}
                              className="p-1.5 rounded hover:bg-gray-700/60 text-gray-500 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sending limits — warmup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="w-4 h-4 text-amber-400" />
              {t("set_limits_title")}
            </CardTitle>
            <CardDescription>{t("set_warmup_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {warmup && (
              <>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white">{warmup.limit}</p>
                    <p className="text-xs text-gray-400">{t("set_limit_label")}</p>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {[
                      { tier: "1", label: "5/j", range: "J1–14" },
                      { tier: "2", label: "15/j", range: "J15–28" },
                      { tier: "3", label: "30/j", range: "J29+" },
                    ].map(s => (
                      <div key={s.tier} className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${s.tier === warmup.tier ? "bg-emerald-400" : s.tier < warmup.tier ? "bg-gray-600" : "bg-gray-800"}`} />
                        <span className={`text-xs ${s.tier === warmup.tier ? "text-emerald-400 font-medium" : "text-gray-500"}`}>
                          {s.range} — {s.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                {warmup.daysLeft > 0 && (
                  <p className="text-xs text-amber-400">
                    {t("set_warmup_next", { days: warmup.daysLeft })}
                  </p>
                )}
              </>
            )}
            <div className="flex items-start gap-2 bg-gray-800/50 rounded-lg px-3 py-2.5">
              <Info className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
              <p className="text-xs text-gray-400">{t("set_warmup_hint")}</p>
            </div>
          </CardContent>
        </Card>

        {/* Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="w-4 h-4 text-emerald-400" />
              {t("set_security_title")}
            </CardTitle>
            <CardDescription>{t("set_security_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t("set_current_pw")}</Label>
              <Input type="password" value={pwForm.current} onChange={(e) => setPwForm(f => ({ ...f, current: e.target.value }))} placeholder="••••••••" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("set_new_pw")}</Label>
              <Input type="password" value={pwForm.new} onChange={(e) => setPwForm(f => ({ ...f, new: e.target.value }))} placeholder="••••••••" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("set_confirm_pw")}</Label>
              <Input type="password" value={pwForm.confirm} onChange={(e) => setPwForm(f => ({ ...f, confirm: e.target.value }))} placeholder="••••••••" />
            </div>
            {pwError && <p className="text-xs text-red-400">{pwError}</p>}
            <Button variant="outline" onClick={savePassword} disabled={saving || !pwForm.current || !pwForm.new}>
              {pwSaved ? <><Check className="w-4 h-4" />{t("set_saved_pw")}</> : t("set_save_pw")}
            </Button>
          </CardContent>
        </Card>

        {/* Config */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings className="w-4 h-4 text-gray-400" />
              {t("set_config_title")}
            </CardTitle>
            <CardDescription>{t("set_config_desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { key: "GROQ_API_KEY", desc: "Génération d'emails IA (Llama 3 via Groq)" },
                { key: "RESEND_API_KEY", desc: "Envoi des emails" },
                { key: "DATABASE_URL", desc: "Base de données PostgreSQL" },
                { key: "NEXTAUTH_SECRET", desc: "Sécurité des sessions" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-2 border-b border-gray-800/60 last:border-0">
                  <div>
                    <code className="text-xs text-violet-300 bg-violet-500/10 px-1.5 py-0.5 rounded">{item.key}</code>
                    <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">{t("set_config_required")}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
