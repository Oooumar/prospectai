"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Wand2, Send, X, Loader2, Check, RefreshCw, ChevronDown } from "lucide-react";
import type { Prospect } from "@/types";
import { useI18n } from "@/components/language-provider";

const PROFILE_LS_KEY = "pa_last_profile_id";

interface Profile {
  id: string;
  name: string;
  companyName: string | null;
  isDefault: boolean;
}

interface EmailComposerProps {
  prospect: Prospect;
  campaignId?: string;
  onClose: () => void;
  onSent?: () => void;
}

export function EmailComposer({ prospect, campaignId, onClose, onSent }: EmailComposerProps) {
  const { t } = useI18n();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
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

  async function generateEmail() {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/emails/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectId: prospect.id, profileId: selectedProfileId || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubject(data.subject || "");
        setBody(data.body || "");
      } else {
        setError(data.error || "Erreur de génération");
      }
    } finally {
      setGenerating(false);
    }
  }

  async function sendEmail() {
    if (!subject || !body) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectId: prospect.id, campaignId, subject, body }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSent(true);
        onSent?.();
        setTimeout(onClose, 2000);
      } else {
        setError(data.error || "Erreur d'envoi");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="border-indigo-500/30 bg-indigo-500/5">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wand2 className="w-4 h-4 text-indigo-400" />
            {t("ec_title_prefix")}{" "}
            <span className="text-indigo-300">{prospect.name}</span>
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{prospect.niche}</Badge>
          <Badge variant="secondary">{prospect.city}</Badge>
          {prospect.email && (
            <Badge variant="outline" className="text-xs">{prospect.email}</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {sent ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Check className="w-7 h-7 text-emerald-400" />
            </div>
            <p className="text-white font-semibold">{t("ec_sent_title")}</p>
            <p className="text-sm text-gray-400">{t("ec_sent_desc")}</p>
          </div>
        ) : (
          <>
            {profiles.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">{t("pr_select_label")}</Label>
                <div className="relative">
                  <select
                    value={selectedProfileId}
                    onChange={(e) => handleProfileChange(e.target.value)}
                    className="w-full appearance-none rounded-md border border-gray-700 bg-gray-900 px-3 py-2 pr-8 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
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

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={generateEmail}
                disabled={generating}
                className="flex-1 border-indigo-500/30 hover:border-indigo-400/60"
              >
                {generating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />{t("ec_generating")}</>
                ) : (
                  <><Wand2 className="w-4 h-4 text-indigo-400" />{t("ec_generate")}</>
                )}
              </Button>
              {(subject || body) && (
                <Button variant="ghost" size="icon" onClick={generateEmail} disabled={generating}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>{t("ec_subject")}</Label>
              <Input placeholder={t("ec_subject_ph")} value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>{t("ec_body")}</Label>
              <Textarea placeholder={t("ec_body_ph")} value={body} onChange={(e) => setBody(e.target.value)} rows={8} />
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
            )}

            <div className="flex gap-3">
              <Button
                variant="warm"
                onClick={sendEmail}
                disabled={!subject || !body || sending || !prospect.email}
                className="flex-1"
              >
                {sending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />{t("ec_sending")}</>
                ) : (
                  <><Send className="w-4 h-4" />{t("ec_send")}</>
                )}
              </Button>
              <Button variant="outline" onClick={onClose}>{t("ec_cancel")}</Button>
            </div>

            {!prospect.email && (
              <p className="text-xs text-amber-400 text-center">{t("ec_no_email")}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
