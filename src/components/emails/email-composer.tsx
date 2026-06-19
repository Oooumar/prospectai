"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Wand2, Send, X, Loader2, Check, RefreshCw } from "lucide-react";
import type { Prospect } from "@/types";

interface EmailComposerProps {
  prospect: Prospect;
  campaignId?: string;
  onClose: () => void;
  onSent?: () => void;
}

export function EmailComposer({ prospect, campaignId, onClose, onSent }: EmailComposerProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function generateEmail() {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/emails/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectId: prospect.id }),
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
        body: JSON.stringify({
          prospectId: prospect.id,
          campaignId,
          subject,
          body,
        }),
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
            Email IA pour{" "}
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
            <p className="text-white font-semibold">Email envoyé avec succès !</p>
            <p className="text-sm text-gray-400">Le prospect a été marqué comme &ldquo;Contacté&rdquo;</p>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={generateEmail}
                disabled={generating}
                className="flex-1 border-indigo-500/30 hover:border-indigo-400/60"
              >
                {generating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Génération IA…</>
                ) : (
                  <><Wand2 className="w-4 h-4 text-indigo-400" />Générer avec l&apos;IA</>
                )}
              </Button>
              {(subject || body) && (
                <Button variant="ghost" size="icon" onClick={generateEmail} disabled={generating}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Objet</Label>
              <Input
                placeholder="Objet de l'email…"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Corps de l&apos;email</Label>
              <Textarea
                placeholder="Rédigez ou générez votre email ici…"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={8}
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="gradient"
                onClick={sendEmail}
                disabled={!subject || !body || sending || !prospect.email}
                className="flex-1"
              >
                {sending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Envoi…</>
                ) : (
                  <><Send className="w-4 h-4" />Envoyer l&apos;email</>
                )}
              </Button>
              <Button variant="outline" onClick={onClose}>Annuler</Button>
            </div>

            {!prospect.email && (
              <p className="text-xs text-amber-400 text-center">
                Ce prospect n&apos;a pas d&apos;email — vous pouvez en ajouter un manuellement
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
