"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { TopBar } from "@/components/dashboard/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, Loader2, Copy, Check, ExternalLink, Download,
  MessageCircle, Info, ImageIcon, Phone,
} from "lucide-react";
import { useI18n } from "@/components/language-provider";

interface Message {
  id: string;
  prospectId: string | null;
  prospectName: string;
  prospectPhone: string;
  message: string;
  sent: boolean;
  sentAt: string | null;
}

interface Campaign {
  id: string;
  title: string;
  imageUrl: string | null;
  imageName: string | null;
  createdAt: string;
}

function cleanPhone(raw: string) { return raw.replace(/[^0-9]/g, ""); }

function MessageCard({ msg, imageUrl, onUpdate }: {
  msg: Message;
  imageUrl: string | null;
  onUpdate: (id: string, upd: Partial<Message>) => void;
}) {
  const { t } = useI18n();
  const [text, setText] = useState(msg.message);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [markingSent, setMarkingSent] = useState(false);

  async function saveText(val: string) {
    if (val === msg.message) return;
    setSaving(true);
    await fetch(`/api/whatsapp/campaigns/messages/${msg.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: val }),
    });
    onUpdate(msg.id, { message: val });
    setSaving(false);
  }

  async function markSent() {
    setMarkingSent(true);
    await fetch(`/api/whatsapp/campaigns/messages/${msg.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sent: true }),
    });
    onUpdate(msg.id, { sent: true });
    setMarkingSent(false);
  }

  async function copyText() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const waUrl = `https://wa.me/${cleanPhone(msg.prospectPhone)}?text=${encodeURIComponent(text)}`;

  return (
    <Card className={`border-gray-800 ${msg.sent ? "opacity-60" : ""}`}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">{msg.prospectName}</p>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
              <Phone className="w-3 h-3" />{msg.prospectPhone}
            </div>
          </div>
          {msg.sent && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium">
              {t("wc_sent_badge")}
            </span>
          )}
        </div>

        {/* Message textarea */}
        <Textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onBlur={e => saveText(e.target.value)}
          rows={4}
          className="resize-none text-sm"
          disabled={msg.sent}
        />
        {saving && <p className="text-xs text-gray-500">{t("pr_saving")}</p>}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={copyText}
            className="border-gray-700 text-xs h-8"
            disabled={msg.sent}
          >
            {copied ? <><Check className="w-3 h-3 text-emerald-400" />{t("wc_copied")}</> : <><Copy className="w-3 h-3" />{t("wc_copy_text")}</>}
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-xs h-8"
            onClick={() => window.open(waUrl, "_blank", "noopener,noreferrer")}
          >
            <ExternalLink className="w-3 h-3" />{t("wc_open_wa")}
          </Button>

          {imageUrl && (
            <Button
              size="sm"
              variant="outline"
              className="border-violet-500/30 text-violet-400 hover:bg-violet-500/10 text-xs h-8"
              onClick={() => window.open(imageUrl, "_blank", "noopener,noreferrer")}
            >
              <Download className="w-3 h-3" />{t("wc_download_img")}
            </Button>
          )}

          {!msg.sent && (
            <Button
              size="sm"
              variant="outline"
              className="border-gray-700 text-gray-400 hover:text-emerald-400 text-xs h-8 ml-auto"
              onClick={markSent}
              disabled={markingSent}
            >
              {markingSent ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              {t("wc_mark_sent")}
            </Button>
          )}
        </div>

        {imageUrl && (
          <div className="flex items-start gap-1.5">
            <Info className="w-3 h-3 text-violet-400/70 shrink-0 mt-0.5" />
            <p className="text-xs text-gray-500">{t("wc_img_attach_hint")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t } = useI18n();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/whatsapp/campaigns/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error);
        else { setCampaign(data.campaign); setMessages(data.messages ?? []); }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  function updateMessage(msgId: string, upd: Partial<Message>) {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, ...upd } : m));
  }

  const pendingCount = messages.filter(m => !m.sent).length;

  return (
    <>
      <TopBar
        title={campaign?.title ?? t("wc_page_title")}
        description={`${t("wc_pending")} : ${pendingCount}/${messages.length}`}
      />
      <div className="p-4 sm:p-6 space-y-4 max-w-2xl">
        <Link href="/dashboard/whatsapp-campaigns">
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white -ml-2">
            <ArrowLeft className="w-4 h-4" />{t("wc_back")}
          </Button>
        </Link>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
        ) : (
          <>
            {/* Campaign header */}
            {campaign?.imageUrl && (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-violet-500/20 bg-violet-500/5">
                <img src={campaign.imageUrl} alt={campaign.imageName ?? ""} className="w-16 h-16 object-cover rounded-lg shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">{campaign.imageName}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-1 border-violet-500/30 text-violet-400 text-xs h-7"
                    onClick={() => window.open(campaign.imageUrl!, "_blank", "noopener,noreferrer")}
                  >
                    <Download className="w-3 h-3" />{t("wc_download_img")}
                  </Button>
                </div>
              </div>
            )}

            {/* Manual note */}
            <div className="flex items-start gap-2 rounded-lg border border-gray-700/50 bg-gray-800/30 px-3 py-2.5">
              <Info className="w-3.5 h-3.5 text-gray-500 shrink-0 mt-0.5" />
              <p className="text-xs text-gray-500">{t("wc_manual_note")}</p>
            </div>

            {/* Messages */}
            <div className="space-y-3">
              {messages.map(m => (
                <MessageCard
                  key={m.id}
                  msg={m}
                  imageUrl={campaign?.imageUrl ?? null}
                  onUpdate={updateMessage}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
