"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { TopBar } from "@/components/dashboard/topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Settings, User, Shield, Zap, Loader2, Check, Globe } from "lucide-react";
import { getInitials, formatDate } from "@/lib/utils";
import { useI18n } from "@/components/language-provider";
import { LanguageSelector } from "@/components/language-selector";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const { t } = useI18n();
  const [user, setUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ name: "", dailyLimit: 50 });
  const [pwForm, setPwForm] = useState({ current: "", new: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwSaved, setPwSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(data => {
        setUser(data.user);
        setForm({ name: data.user?.name || "", dailyLimit: data.user?.dailyLimit || 50 });
      });
  }, []);

  async function saveProfile() {
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, dailyLimit: form.dailyLimit }),
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

        {/* Sending limits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="w-4 h-4 text-amber-400" />
              {t("set_limits_title")}
            </CardTitle>
            <CardDescription>{t("set_limits_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t("set_limit_label")}</Label>
              <div className="flex gap-3">
                <Input
                  type="number"
                  min={1}
                  max={1000}
                  value={form.dailyLimit}
                  onChange={(e) => setForm(f => ({ ...f, dailyLimit: parseInt(e.target.value) || 50 }))}
                  className="max-w-[140px]"
                />
                <Button variant="outline" onClick={saveProfile} disabled={saving}>
                  {t("set_update")}
                </Button>
              </div>
              <p className="text-xs text-gray-500">{t("set_limit_hint")}</p>
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
