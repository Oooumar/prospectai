"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/dashboard/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users, Mail, TrendingUp, MessageSquare,
  Megaphone, Send, Eye, ArrowUpRight
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatDateTime } from "@/lib/utils";

interface Stats {
  totalProspects: number;
  emailsSent: number;
  openRate: number;
  replyRate: number;
  activeCampaigns: number;
  todaySent: number;
}

interface RecentEmail {
  id: string;
  subject: string;
  status: string;
  createdAt: string;
  prospect: { name: string; niche: string; city: string };
}

const statusColors: Record<string, string> = {
  SENT: "success",
  PENDING: "warning",
  FAILED: "destructive",
  OPENED: "default",
  REPLIED: "default",
};

const statusLabels: Record<string, string> = {
  SENT: "Envoyé",
  PENDING: "En attente",
  FAILED: "Échec",
  OPENED: "Ouvert",
  REPLIED: "Répondu",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentEmails, setRecentEmails] = useState<RecentEmail[]>([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats);
        setRecentEmails(data.recentEmails || []);
        setChartData(data.chartData || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const cards = stats
    ? [
        { title: "Total Prospects", value: stats.totalProspects.toLocaleString(), icon: Users, color: "text-violet-400", bg: "bg-violet-500/10", change: "+12%" },
        { title: "Emails envoyés", value: stats.emailsSent.toLocaleString(), icon: Send, color: "text-indigo-400", bg: "bg-indigo-500/10", change: "+8%" },
        { title: "Taux d'ouverture", value: `${stats.openRate}%`, icon: Eye, color: "text-emerald-400", bg: "bg-emerald-500/10", change: "+2.1%" },
        { title: "Taux de réponse", value: `${stats.replyRate}%`, icon: MessageSquare, color: "text-amber-400", bg: "bg-amber-500/10", change: "+0.5%" },
      ]
    : [];

  return (
    <>
      <TopBar title="Dashboard" description="Vue d'ensemble de votre activité" />

      <div className="p-6 space-y-6">
        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-16 bg-gray-800 rounded" />
                  </CardContent>
                </Card>
              ))
            : cards.map((card) => (
                <Card key={card.title} className="hover:border-gray-700 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                        <card.icon className={`w-5 h-5 ${card.color}`} />
                      </div>
                      <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                        <ArrowUpRight className="w-3 h-3" />
                        {card.change}
                      </span>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{card.value}</p>
                    <p className="text-sm text-gray-400">{card.title}</p>
                  </CardContent>
                </Card>
              ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Chart */}
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-violet-400" />
                Emails envoyés (7 derniers jours)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: "8px", color: "#f9fafb" }}
                    cursor={{ fill: "rgba(139,92,246,0.05)" }}
                  />
                  <Bar dataKey="emails" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Today's progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-indigo-400" />
                Activité du jour
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {stats && (
                <>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Emails envoyés</span>
                      <span className="text-white font-medium">{stats.todaySent} / 50</span>
                    </div>
                    <Progress value={(stats.todaySent / 50) * 100} />
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: "Campagnes actives", value: stats.activeCampaigns, color: "text-violet-400" },
                      { label: "Prospects en attente", value: stats.totalProspects, color: "text-indigo-400" },
                      { label: "Emails à envoyer", value: Math.max(0, 50 - stats.todaySent), color: "text-emerald-400" },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">{item.label}</span>
                        <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent emails */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              Derniers emails
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentEmails.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Mail className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucun email envoyé pour le moment</p>
              </div>
            ) : (
              <div className="space-y-0">
                {recentEmails.map((email, i) => (
                  <div
                    key={email.id}
                    className={`flex items-center justify-between py-3 ${i < recentEmails.length - 1 ? "border-b border-gray-800/60" : ""}`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-200 truncate">{email.prospect.name}</p>
                      <p className="text-xs text-gray-500 truncate">{email.subject}</p>
                    </div>
                    <div className="flex items-center gap-3 ml-4 shrink-0">
                      <Badge variant={statusColors[email.status] as any || "secondary"}>
                        {statusLabels[email.status] || email.status}
                      </Badge>
                      <span className="text-xs text-gray-500 hidden sm:block">
                        {formatDateTime(email.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
