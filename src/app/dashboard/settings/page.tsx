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
import { Settings, User, Shield, Zap, Loader2, Check, Globe, Building2, MessageCircle, Info } from "lucide-react";
import { getInitials, formatDate } from "@/lib/utils";
import { useI18n } from "@/components/language-provider";
import { LanguageSelector } from "@/components/language-selector";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const { t } = useI18n();
  const [user, setUser] = useState<any>(null);
  const [warmup, setWarmup] = useState<{ limit: number; tier: string; daysLeft: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ name: "" });
  const [companySaving, setCompanySaving] = useState(false);
  const [companySaved, setCompanySaved] = useState(false);
  const [companyForm, setCompanyForm] = useState({ companyName: "", website: "", productDescription: "", whatsappNumber: "" });
  const [pwForm, setPwForm] = useState({ current: "", new: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwSaved, setPwSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(data => {
        setUser(data.user);
        setWarmup(data.warmup);
        setForm({ name: data.user?.name || "" });
        setCompanyForm({ companyName: data.user?.companyName || "", website: data.user?.website || "", productDescription: data.user?.productDescription || "", whatsappNumber: data.user?.whatsappNumber || "" });
      });
  }, []);

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

  async function saveCompany() {
    setCompanySaving(true);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyName: companyForm.companyName, website: companyForm.website, productDescription: companyForm.productDescription, whatsappNumber: companyForm.whatsappNumber }),
    });
    if (res.ok) {
      setCompanySaved(true);
      setTimeout(() => setCompanySaved(false), 2000);
    }
    setCompanySaving(false);
  }

  async function savePassword() {
    setPwError("");
    if (pwForm.new !== pwForm.confirm) {
      setPwError(t("set_pw_mismatch"));
      return;
    }
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

        {/* Company / product */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="w-4 h-4 text-violet-400" />
              {t("set_company_title")}
            </CardTitle>
            <CardDescription>{t("set_company_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t("set_company_name")}</Label>
              <Input
                value={companyForm.companyName}
                onChange={(e) => setCompanyForm(f => ({ ...f, companyName: e.target.value }))}
                placeholder={t("set_company_name_ph")}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("set_company_website")}</Label>
              <Input
                value={companyForm.website}
                onChange={(e) => setCompanyForm(f => ({ ...f, website: e.target.value }))}
                placeholder={t("set_company_website_ph")}
                type="url"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("set_company_product_desc")}</Label>
              <Textarea
                value={companyForm.productDescription}
                onChange={(e) => setCompanyForm(f => ({ ...f, productDescription: e.target.value }))}
                placeholder={t("set_company_product_desc_ph")}
                rows={3}
                className="resize-none text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                {t("set_whatsapp")}
              </Label>
              <Input
                value={companyForm.whatsappNumber}
                onChange={(e) => setCompanyForm(f => ({ ...f, whatsappNumber: e.target.value }))}
                placeholder={t("set_whatsapp_ph")}
                type="tel"
              />
              <p className="text-xs text-gray-500">{t("set_whatsapp_hint")}</p>
            </div>
            <Button variant="gradient" onClick={saveCompany} disabled={companySaving}>
              {companySaved ? <><Check className="w-4 h-4" />{t("set_saved")}</> : companySaving ? <Loader2 className="w-4 h-4 animate-spin" /> : t("set_save")}
            </Button>
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
