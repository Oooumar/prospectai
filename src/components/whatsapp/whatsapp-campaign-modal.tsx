"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Loader2, ImageIcon, ChevronDown, Wand2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/language-provider";

const PROFILE_LS_KEY = "pa_last_profile_id";

interface Profile { id: string; name: string; companyName: string | null; isDefault: boolean }

interface Props {
  prospectIds: string[];
  onClose: () => void;
}

export function WhatsAppCampaignModal({ prospectIds, onClose }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [promoTitle, setPromoTitle] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");

  useEffect(() => {
    fetch("/api/profiles")
      .then(r => r.json())
      .then(data => {
        const list: Profile[] = data.profiles ?? [];
        setProfiles(list);
        const saved = typeof window !== "undefined" ? localStorage.getItem(PROFILE_LS_KEY) : null;
        const match = list.find(p => p.id === saved);
        const fallback = list.find(p => p.isDefault) ?? list[0];
        setSelectedProfileId(match?.id ?? fallback?.id ?? "");
      });
  }, []);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  }

  async function handleGenerate() {
    if (!promoTitle.trim()) { setError(t("wc_promo_label") + " requis"); return; }
    setError("");
    setGenerating(true);

    try {
      let imageUrl: string | null = null;
      let imageName: string | null = null;

      if (imageFile) {
        setUploading(true);
        const form = new FormData();
        form.append("file", imageFile);
        const res = await fetch("/api/whatsapp/campaigns/upload", { method: "POST", body: form });
        const data = await res.json();
        setUploading(false);
        if (!res.ok) { setError(data.error || "Erreur upload image"); setGenerating(false); return; }
        imageUrl = data.url;
        imageName = data.name;
      }

      const res = await fetch("/api/whatsapp/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospectIds,
          promoTitle: promoTitle.trim(),
          imageUrl,
          imageName,
          profileId: selectedProfileId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erreur"); setGenerating(false); return; }

      router.push(`/dashboard/whatsapp-campaigns/${data.campaignId}`);
      onClose();
    } catch (e: any) {
      setError(e.message);
      setGenerating(false);
    }
  }

  const isLoading = generating || uploading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-gray-950 border border-emerald-500/30 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-emerald-400" />
            {t("wc_modal_title")}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-800 text-gray-500 hover:text-gray-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Profile selector */}
          {profiles.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-400">{t("pr_select_label")}</Label>
              <div className="relative">
                <select
                  value={selectedProfileId}
                  onChange={e => { setSelectedProfileId(e.target.value); localStorage.setItem(PROFILE_LS_KEY, e.target.value); }}
                  className="w-full appearance-none rounded-md border border-gray-700 bg-gray-900 px-3 py-2 pr-8 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}{p.companyName ? ` — ${p.companyName}` : ""}{p.isDefault ? " ★" : ""}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              </div>
            </div>
          )}

          {/* Promo description */}
          <div className="space-y-1.5">
            <Label className="text-sm">{t("wc_promo_label")} *</Label>
            <Textarea
              value={promoTitle}
              onChange={e => setPromoTitle(e.target.value)}
              placeholder={t("wc_promo_ph")}
              rows={3}
              className="resize-none text-sm"
            />
          </div>

          {/* Image upload */}
          <div className="space-y-2">
            <Label className="text-xs text-gray-400">{t("wc_image_label")}</Label>
            {imagePreview ? (
              <div className="flex items-center gap-3">
                <img src={imagePreview} alt="preview" className="w-16 h-16 object-cover rounded-lg border border-gray-700" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-300 truncate">{imageFile?.name}</p>
                  <button
                    onClick={() => { fileRef.current?.click(); }}
                    className="text-xs text-emerald-400 hover:text-emerald-300 mt-1"
                  >
                    {t("wc_image_change")}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full border border-dashed border-gray-700 hover:border-emerald-500/50 rounded-lg px-4 py-3 text-sm text-gray-500 hover:text-gray-300 flex items-center gap-2 transition-colors"
              >
                <ImageIcon className="w-4 h-4" />
                {t("wc_image_pick")}
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <div className="pt-1 flex gap-3">
            <Button
              variant="warm"
              className="flex-1"
              onClick={handleGenerate}
              disabled={isLoading || !promoTitle.trim()}
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />{uploading ? "Upload…" : t("wc_generating")}</>
              ) : (
                <><Wand2 className="w-4 h-4" />{t("wc_generate_btn", { n: prospectIds.length })}</>
              )}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={isLoading}>{t("pr_cancel")}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
