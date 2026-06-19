"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/dashboard/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Loader2, Eye, MessageSquare, Send, AlertCircle } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

const statusConfig: Record<string, { label: string; variant: string; icon: any }> = {
  SENT: { label: "Envoyé", variant: "success", icon: Send },
  PENDING: { label: "En attente", variant: "warning", icon: Mail },
  FAILED: { label: "Échec", variant: "destructive", icon: AlertCircle },
  OPENED: { label: "Ouvert", variant: "default", icon: Eye },
  REPLIED: { label: "Répondu", variant: "default", icon: MessageSquare },
  BOUNCED: { label: "Bounced", variant: "destructive", icon: AlertCircle },
};

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

export default function EmailsPage() {
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then(r => r.json())
      .then(data => {
        setEmails(data.recentEmails || []);
        setLoading(false);
      });
  }, []);

  return (
    <>
      <TopBar title="Emails" description="Suivi de tous vos emails envoyés" />

      <div className="p-6 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total envoyés", icon: Send, color: "text-indigo-400", bg: "bg-indigo-500/10" },
            { label: "Ouverts", icon: Eye, color: "text-emerald-400", bg: "bg-emerald-500/10" },
            { label: "Répondus", icon: MessageSquare, color: "text-violet-400", bg: "bg-violet-500/10" },
            { label: "Échecs", icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10" },
          ].map((s) => {
            const count = emails.filter(e =>
              s.label === "Total envoyés" ? e.status === "SENT" :
              s.label === "Ouverts" ? e.status === "OPENED" :
              s.label === "Répondus" ? e.status === "REPLIED" :
              e.status === "FAILED" || e.status === "BOUNCED"
            ).length;
            return (
              <Card key={s.label}>
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

        {/* Email logs table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="w-4 h-4 text-gray-400" />
              Historique des emails
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
              </div>
            ) : emails.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Mail className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="font-medium">Aucun email</p>
                <p className="text-sm mt-1">Envoyez des emails depuis la page Prospects</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium uppercase tracking-wider">Prospect</th>
                      <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium uppercase tracking-wider hidden md:table-cell">Objet</th>
                      <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium uppercase tracking-wider">Statut</th>
                      <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium uppercase tracking-wider hidden lg:table-cell">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {emails.map((email) => {
                      const config = statusConfig[email.status] || statusConfig.PENDING;
                      return (
                        <tr key={email.id} className="hover:bg-gray-900/40 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-gray-200">{email.prospect.name}</p>
                            <p className="text-xs text-gray-500">{email.prospect.niche} · {email.prospect.city}</p>
                          </td>
                          <td className="px-6 py-4 hidden md:table-cell">
                            <p className="text-sm text-gray-300 truncate max-w-xs">{email.subject}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              <config.icon className="w-3.5 h-3.5 text-gray-500" />
                              <Badge variant={config.variant as any}>{config.label}</Badge>
                            </div>
                          </td>
                          <td className="px-6 py-4 hidden lg:table-cell">
                            <p className="text-xs text-gray-400">
                              {email.sentAt ? formatDateTime(email.sentAt) : formatDateTime(email.createdAt)}
                            </p>
                            {email.openedAt && (
                              <p className="text-xs text-emerald-500">Ouvert {formatDateTime(email.openedAt)}</p>
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
