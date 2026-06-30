"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, MessageCircle, Wand2, Loader2, Copy, Check, ExternalLink, Info } from "lucide-react";
import type { Prospect } from "@/types";
import { useI18n } from "@/components/language-provider";

interface WhatsAppComposerProps {
  prospect: Prospect;
  onClose: () => void;
}

function cleanPhone(raw: string): string {
  return raw.replace(/[^0-9]/g, "");
}

export function WhatsAppComposer({ prospect, onClose }: WhatsAppComposerProps) {
  const { t } = useI18n();
  const [message, setMessage] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function generate() {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/whatsapp/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectId: prospect.id }),
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
    ? `https://wa.me/${cleanPhone(prospect.phone)}`
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
                  onClick={() => window.open(whatsappUrl, "_blank", "noopener,noreferrer")}
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
