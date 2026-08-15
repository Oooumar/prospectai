"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/components/language-provider";

interface GateForm {
  name: string;
  companyName: string;
  website: string;
  productDescription: string;
  whatsappNumber: string;
}

const emptyForm: GateForm = { name: "", companyName: "", website: "", productDescription: "", whatsappNumber: "" };

// Mandatory gate shown by onboarding/layout.tsx to any user with zero
// ProductProfile rows — reuses the ProductProfile model and the same field
// labels as the settings-page profile form, via POST /api/profiles.
export function OnboardingProfileGate() {
  const { t } = useI18n();
  const router = useRouter();
  const [form, setForm] = useState<GateForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const canContinue = form.name.trim().length > 0 && form.productDescription.trim().length > 0;

  function set(upd: Partial<GateForm>) {
    setForm(f => ({ ...f, ...upd }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canContinue || saving) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        // Re-runs onboarding/layout.tsx server-side; it now finds a profile
        // and renders the real onboarding checklist instead of this gate.
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data.error || t("onb_gate_error"));
    } catch {
      setError(t("onb_gate_error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/25 mb-4">
            <Sparkles className="w-6 h-6 text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{t("onb_gate_title")}</h1>
          <p className="text-gray-400 text-sm leading-relaxed max-w-md mx-auto">{t("onb_gate_subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">{t("pr_name_label")} *</Label>
            <Input
              value={form.name}
              onChange={e => set({ name: e.target.value })}
              placeholder={t("pr_name_ph")}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">{t("set_company_product_desc")} *</Label>
            <Textarea
              rows={3}
              value={form.productDescription}
              onChange={e => set({ productDescription: e.target.value })}
              placeholder={t("set_company_product_desc_ph")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">{t("set_company_name")}</Label>
              <Input value={form.companyName} onChange={e => set({ companyName: e.target.value })} placeholder={t("set_company_name_ph")} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("set_company_website")}</Label>
              <Input value={form.website} onChange={e => set({ website: e.target.value })} placeholder={t("set_company_website_ph")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">{t("set_whatsapp")}</Label>
            <Input value={form.whatsappNumber} onChange={e => set({ whatsappNumber: e.target.value })} placeholder={t("set_whatsapp_ph")} type="tel" />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <Button type="submit" variant="gradient" className="w-full" disabled={!canContinue || saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {saving ? t("onb_gate_saving") : t("onb_gate_continue")}
          </Button>
        </form>
      </div>
    </div>
  );
}
