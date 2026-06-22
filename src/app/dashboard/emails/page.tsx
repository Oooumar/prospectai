"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/dashboard/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Mail, Loader2, Eye, MessageSquare, Send, AlertCircle,
  CheckCircle2, Info,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { useI18n } from "@/components/language-provider";

interface EmailLog {
  id: string;
  subject: string;
  status: string;
  sentAt?: string;
  openedAt?: string;
  repliedAt?: string;
  createdAt: string;
  prospect: { name: string; niche: string; city: string };
}

const statusIcons: Record<string, any> = {
  SENT: Send, PENDING: Mail, FAILED: AlertCircle,
  OPENED: Eye, REPLIED: CheckCircle2, BOUNCED: AlertCircle,
};

const statusVariants: Record<string, string> = {
  SENT: "secondary", PENDING: "warning", FAILED: "destructive",
  OPENED: "default", REPLIED: "success", BOUNCED: "destructive",
};

const MARKABLE = new Set(["SENT", "OPENED"]);

export default function EmailsPage() {
  const { t } = useI18n();
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/emails/logs?limit=100")
      .then(r => r.json())
      .then(data => {
        setEmails(data.logs || []);
        setLoading(false);
      });
  }, []);

  async function markReplied(id: string) {
    setMarking(prev => ({ ...prev, [id]: true }));
    const res = await fetch(`/api/emails/logs/${id}`, { method: "PATCH" });
    setMarking(prev => ({ ...prev, [id]: false }));
    if (res.ok) {
      setEmails(prev =>
        prev.map(e => e.id === id ? { ...e, status: "REPLIED", repliedAt: new Date().toISOString() } : e)
      );
    }
  }

  const stats = [
    { key: "SENT",    label: t("em_stat_sent"),    icon: Send,         color: "text-indigo-400",  bg: "bg-indigo-500/10"  },
    { key: "OPENED",  label: t("em_stat_opened"),  icon: Eye,          color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { key: "REPLIED", label: t("em_stat_replied"), icon: CheckCircle2, color: "text-violet-400",  bg: "bg-violet-500/10"  },
    { key: "FAILED",  label: t("em_stat_failed"),  icon: AlertCircle,  color: "text-red-400",     bg: "bg-red-500/10"     },
  ];

  return (
    <>
      <TopBar title={t("em_title")} description={t("em_desc")} />

      <div className="p-6 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => {
            const count = emails.filter(e =>
              s.key === "FAILED"
                ? e.status === "FAILED" || e.status === "BOUNCED"
                : e.status === s.key
            ).length;
            return (
              <Card key={s.key}>
                <CardContent className="p-5">
                  <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-white">{count}</p>
                  <p className="text-xs text-gray-400">{s.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* History table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="w-4 h-4 text-gray-400" />
              {t("em_history_title")}
            </CardTitle>
            {/* Help text */}
            <div className="flex items-start gap-2 mt-2 bg-gray-800/50 rounded-lg px-3 py-2.5">
              <Info className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
              <p className="text-xs text-gray-400">{t("em_mark_help")}</p>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
              </div>
            ) : emails.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Mail className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="font-medium">{t("em_no")}</p>
                <p className="text-sm mt-1">{t("em_no_desc")}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium uppercase tracking-wider">
                        {t("em_col_prospect")}
                      </th>
                      <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium uppercase tracking-wider hidden md:table-cell">
                        {t("em_col_subject")}
                      </th>
                      <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium uppercase tracking-wider">
                        {t("em_col_status")}
                      </th>
                      <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium uppercase tracking-wider hidden lg:table-cell">
                        {t("em_col_date")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {emails.map((email) => {
                      const Icon = statusIcons[email.status] || Mail;
                      const isReplied = email.status === "REPLIED";
                      const canMark = MARKABLE.has(email.status);
                      const isMarking = !!marking[email.id];

                      return (
                        <tr key={email.id} className="hover:bg-gray-900/40 transition-colors">
                          {/* Prospect */}
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-gray-200">{email.prospect.name}</p>
                            <p className="text-xs text-gray-500">{email.prospect.niche} · {email.prospect.city}</p>
                          </td>

                          {/* Subject */}
                          <td className="px-6 py-4 hidden md:table-cell">
                            <p className="text-sm text-gray-300 truncate max-w-xs">{email.subject}</p>
                          </td>

                          {/* Status + mark button */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <Icon
                                className={`w-3.5 h-3.5 shrink-0 ${isReplied ? "text-emerald-400" : "text-gray-500"}`}
                              />
                              <Badge variant={(statusVariants[email.status] || "secondary") as any}>
                                {t(`est_${email.status}` as any) || email.status}
                              </Badge>
                            </div>
                            {canMark && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markReplied(email.id)}
                                disabled={isMarking}
                                className="h-6 px-2 text-xs text-gray-400 hover:text-violet-300 hover:bg-violet-500/10 -ml-2"
                              >
                                {isMarking
                                  ? <Loader2 className="w-3 h-3 animate-spin" />
                                  : <><CheckCircle2 className="w-3 h-3 mr-1" />{t("em_mark_replied")}</>
                                }
                              </Button>
                            )}
                          </td>

                          {/* Date */}
                          <td className="px-6 py-4 hidden lg:table-cell">
                            <p className="text-xs text-gray-400">
                              {email.sentAt ? formatDateTime(email.sentAt) : formatDateTime(email.createdAt)}
                            </p>
                            {email.openedAt && (
                              <p className="text-xs text-emerald-500">
                                {t("em_opened_at", { date: formatDateTime(email.openedAt) })}
                              </p>
                            )}
                            {isReplied && email.repliedAt && (
                              <p className="text-xs text-violet-400 flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                {formatDateTime(email.repliedAt)}
                              </p>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
