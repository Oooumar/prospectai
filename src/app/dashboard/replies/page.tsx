"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/dashboard/topbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2, MessageSquareReply, Sparkles, AlertTriangle,
  Check, Archive, Send, Clock
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { useI18n } from "@/components/language-provider";

interface InboundEmail {
  id: string;
  fromEmail: string;
  fromName?: string;
  subject: string;
  body: string;
  sentiment: "interested" | "not_interested" | "simple_question" | "needs_human" | "unknown";
  aiAnalysis?: string;
  draftResponse?: string;
  status: "pending" | "sent" | "archived";
  sentAt?: string;
  createdAt: string;
  prospect?: { name: string; niche: string; city: string } | null;
}

const sentimentConfig = {
  interested:      { label: "rep_s_interested",      variant: "success"     as const, color: "text-emerald-400" },
  not_interested:  { label: "rep_s_not_interested",  variant: "destructive" as const, color: "text-red-400"     },
  simple_question: { label: "rep_s_simple_question", variant: "default"     as const, color: "text-blue-400"    },
  needs_human:     { label: "rep_s_needs_human",     variant: "warning"     as const, color: "text-amber-400"   },
  unknown:         { label: "rep_s_needs_human",     variant: "secondary"   as const, color: "text-gray-400"    },
};

export default function RepliesPage() {
  const { t } = useI18n();
  const [inbound, setInbound] = useState<InboundEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState<Record<string, "sent" | "archived">>({});

  useEffect(() => {
    fetch("/api/inbound")
      .then(r => r.json())
      .then(d => { setInbound(d.inboundEmails || []); setLoading(false); });
  }, []);

  const setDraft = (id: string, value: string) =>
    setDrafts(prev => ({ ...prev, [id]: value }));

  async function handleAction(email: InboundEmail, action: "approve" | "archive") {
    setSubmitting(prev => ({ ...prev, [email.id]: true }));
    const res = await fetch(`/api/inbound/${email.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        draftResponse: drafts[email.id] ?? email.draftResponse,
      }),
    });
    setSubmitting(prev => ({ ...prev, [email.id]: false }));
    if (res.ok) {
      setDone(prev => ({ ...prev, [email.id]: action === "approve" ? "sent" : "archived" }));
    }
  }

  const pending = inbound.filter(e => e.status === "pending" && !done[e.id]);
  const processed = inbound.filter(e => e.status !== "pending" || done[e.id]);

  return (
    <>
      <TopBar title={t("rep_title")} description={t("rep_desc")} />

      <div className="p-6 space-y-4 max-w-3xl">
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
          </div>
        ) : inbound.length === 0 ? (
          <div className="text-center py-24 text-gray-500">
            <MessageSquareReply className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-medium text-gray-400">{t("rep_no")}</p>
            <p className="text-sm mt-1">{t("rep_no_desc")}</p>
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <div className="space-y-4">
                {pending.map(email => (
                  <EmailCard
                    key={email.id}
                    email={email}
                    draftValue={drafts[email.id] ?? email.draftResponse ?? ""}
                    onDraftChange={(v) => setDraft(email.id, v)}
                    onApprove={() => handleAction(email, "approve")}
                    onArchive={() => handleAction(email, "archive")}
                    submitting={!!submitting[email.id]}
                    t={t}
                  />
                ))}
              </div>
            )}

            {processed.length > 0 && (
              <div className="space-y-3 opacity-60">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider px-1">Traités</p>
                {processed.map(email => {
                  const finalStatus = done[email.id] ?? email.status;
                  return (
                    <Card key={email.id} className="border-gray-800/40">
                      <CardContent className="p-4 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-300 truncate">{email.subject}</p>
                          <p className="text-xs text-gray-500">{email.fromName || email.fromEmail} · {formatDateTime(email.createdAt)}</p>
                        </div>
                        <Badge variant={finalStatus === "sent" ? "success" : "secondary"} className="shrink-0">
                          {finalStatus === "sent" ? t("rep_sent_status") : t("rep_archived")}
                        </Badge>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

function EmailCard({
  email, draftValue, onDraftChange, onApprove, onArchive, submitting, t,
}: {
  email: InboundEmail;
  draftValue: string;
  onDraftChange: (v: string) => void;
  onApprove: () => void;
  onArchive: () => void;
  submitting: boolean;
  t: (k: any) => string;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = sentimentConfig[email.sentiment] ?? sentimentConfig.unknown;
  const needsHuman = email.sentiment === "needs_human" || email.sentiment === "unknown";

  return (
    <Card className="border-gray-700/60">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge variant={cfg.variant as any}>{t(cfg.label)}</Badge>
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                {formatDateTime(email.createdAt)}
              </span>
              {email.prospect && (
                <span className="text-xs text-gray-600">
                  {email.prospect.name} · {email.prospect.niche}
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-white truncate">{email.subject}</p>
            <p className="text-xs text-gray-400">
              {email.fromName ? `${email.fromName} ` : ""}<span className="text-gray-500">&lt;{email.fromEmail}&gt;</span>
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {/* Prospect message */}
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs font-medium text-gray-500 mb-2">{t("rep_message")}</p>
          <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
            {expanded || email.body.length <= 300
              ? email.body
              : email.body.substring(0, 300) + "…"}
          </p>
          {email.body.length > 300 && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="text-xs text-violet-400 hover:text-violet-300 mt-1"
            >
              {expanded ? "Réduire" : "Lire la suite"}
            </button>
          )}
        </div>

        {/* AI analysis */}
        {email.aiAnalysis && (
          <div className="flex gap-2">
            <Sparkles className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-gray-500 mb-0.5">{t("rep_ai_analysis")}</p>
              <p className="text-sm text-gray-400">{email.aiAnalysis}</p>
            </div>
          </div>
        )}

        {/* Human warning */}
        {needsHuman && (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-xs text-amber-300">{t("rep_human_warning")}</p>
          </div>
        )}

        {/* Draft response */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-violet-400" />
            {t("rep_draft")}
          </p>
          <Textarea
            value={draftValue}
            onChange={e => onDraftChange(e.target.value)}
            rows={5}
            className="text-sm resize-none bg-gray-900 border-gray-700"
            placeholder="Rédigez ou modifiez votre réponse…"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="gradient"
            size="sm"
            onClick={onApprove}
            disabled={submitting || !draftValue.trim()}
            className="gap-2"
          >
            {submitting ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" />{t("rep_approving")}</>
            ) : (
              <><Send className="w-3.5 h-3.5" />{t("rep_approve")}</>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onArchive}
            disabled={submitting}
            className="gap-2"
          >
            <Archive className="w-3.5 h-3.5" />
            {t("rep_archive")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
