"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, MessageCircle, Wand2, Loader2, Copy, Check, ExternalLink, Info, ChevronDown } from "lucide-react";
import type { Prospect } from "@/types";
import { useI18n } from "@/components/language-provider";
import { normalizePhoneForWA } from "@/lib/phone";

const PROFILE_LS_KEY = "pa_last_profile_id";

interface Profile {
  id: string;
  name: string;
  companyName: string | null;
  isDefault: boolean;
}

interface WhatsAppComposerProps {
  prospect: Prospect;
  onClose: () => void;
  onSent?: () => void;
}

export function WhatsAppComposer({ prospect, onClose, onSent }: WhatsAppComposerProps) {
  const { t } = useI18n();
  const [message, setMessage] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");

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
      })
      .catch(() => {});
  }, []);

  function handleProfileChange(id: string) {
    setSelectedProfileId(id);
    if (typeof window !== "undefined") localStorage.setItem(PROFILE_LS_KEY, id);
  }

  async function generate() {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/whatsapp/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectId: prospect.id, profileId: selectedProfileId || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || "");
      } else {
        setError(data.error || "Erreur de génération");
      }
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setGenerating(false);
    }
  }

  async function copyMessage() {
    if (!message) return;
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const whatsappUrl = prospect.phone
    ? `https://wa.me/${normalizePhoneForWA(prospect.phone, prospect.city)}${message ? `?text=${encodeURIComponent(message)}` : ""}`
    : null;

  return (
    <Card className="border-emerald-500/30 bg-emerald-500/5">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            {t("wa_title", { name: prospect.name })}
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {profiles.length > 0 && (
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-400">{t("pr_select_label")}</Label>
            <div className="relative">
              <select
                value={selectedProfileId}
                onChange={(e) => handleProfileChange(e.target.value)}
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

        <Button
          variant="outline"
          onClick={generate}
          disabled={generating}
          className="w-full border-emerald-500/30 hover:border-emerald-400/60"
        >
          {generating ? (
            <><Loader2 className="w-4 h-4 animate-spin" />{t("wa_generating")}</>
          ) : (
            <><Wand2 className="w-4 h-4 text-emerald-400" />{t("wa_generate")}</>
          )}
        </Button>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        {message && (
          <>
            <div className="space-y-1.5">
              <p className="text-xs text-gray-500">{t("wa_edit_hint")}</p>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="resize-none text-sm"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={copyMessage}
                className="flex-1 border-emerald-500/30 hover:border-emerald-400/60"
              >
                {copied ? (
                  <><Check className="w-4 h-4 text-emerald-400" />{t("wa_copied")}</>
                ) : (
                  <><Copy className="w-4 h-4" />{t("wa_copy")}</>
                )}
              </Button>

              {whatsappUrl && (
                <Button
                  variant="warm"
                  className="flex-1"
                  onClick={() => {
                    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
                    fetch(`/api/prospects/${prospect.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ status: "CONTACTED" }),
                    }).catch(() => {});
                    onSent?.();
                  }}
                >
                  <ExternalLink className="w-4 h-4" />
                  {t("wa_open")}
                </Button>
              )}
            </div>
          </>
        )}

        <div className="flex items-start gap-2 rounded-lg border border-gray-700/50 bg-gray-800/30 px-3 py-2.5">
          <Info className="w-3.5 h-3.5 text-gray-500 shrink-0 mt-0.5" />
          <p className="text-xs text-gray-500">{t("wa_manual_note")}</p>
        </div>
      </CardContent>
    </Card>
  );
}
