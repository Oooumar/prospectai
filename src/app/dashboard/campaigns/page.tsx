"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/dashboard/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Megaphone, Plus, Play, Pause, Trash2, Loader2,
  Mail, Target, BarChart2
} from "lucide-react";
import type { Campaign } from "@/types";
import { formatDate } from "@/lib/utils";

const statusColors: Record<string, string> = {
  DRAFT: "secondary",
  ACTIVE: "success",
  PAUSED: "warning",
  COMPLETED: "default",
};

const statusLabels: Record<string, string> = {
  DRAFT: "Brouillon",
  ACTIVE: "Active",
  PAUSED: "Pausée",
  COMPLETED: "Terminée",
};

const defaultTemplate = `Bonjour,

J'ai découvert votre {niche} à {city} et j'aimerais vous présenter une opportunité qui pourrait vraiment booster votre activité.

Notre solution permet à des professionnels comme vous d'automatiser leur marketing et d'attirer plus de clients rapidement.

Seriez-vous disponible pour un appel de 15 minutes cette semaine ?

Cordialement,
{nom}`;

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "", niche: "", city: "", subject: "", template: defaultTemplate, dailyLimit: 20,
  });

  async function fetchCampaigns() {
    const res = await fetch("/api/campaigns");
    const data = await res.json();
    setCampaigns(data.campaigns || []);
    setLoading(false);
  }

  useEffect(() => { fetchCampaigns(); }, []);

  async function createCampaign() {
    setCreating(true);
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowCreate(false);
      setForm({ name: "", niche: "", city: "", subject: "", template: defaultTemplate, dailyLimit: 20 });
      fetchCampaigns();
    }
    setCreating(false);
  }

  async function updateStatus(id: string, status: string) {
    await fetch("/api/campaigns", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    fetchCampaigns();
  }

  async function deleteCampaign(id: string) {
    if (!confirm("Supprimer cette campagne ?")) return;
    await fetch(`/api/campaigns?id=${id}`, { method: "DELETE" });
    fetchCampaigns();
  }

  return (
    <>
      <TopBar title="Campagnes" description="Gérez vos campagnes de prospection" />

      <div className="p-6 space-y-6">
        <div className="flex justify-end">
          <Button variant="gradient" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" />
            Nouvelle campagne
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
          </div>
        ) : campaigns.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-gray-500">
              <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Aucune campagne</p>
              <p className="text-sm mt-1">Créez votre première campagne de prospection</p>
              <Button variant="gradient" className="mt-4" onClick={() => setShowCreate(true)}>
                Créer une campagne
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {campaigns.map((c) => (
              <Card key={c.id} className="hover:border-gray-700 transition-colors">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-white truncate">{c.name}</h3>
                        <Badge variant={statusColors[c.status] as any}>{statusLabels[c.status]}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Target className="w-3.5 h-3.5" /> {c.niche} · {c.city}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" /> {c.dailyLimit}/jour
                        </span>
                        <span className="text-gray-600">{formatDate(c.createdAt)}</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6">
                      {[
                        { label: "Envoyés", value: c.sentCount, icon: Mail },
                        { label: "Ouverts", value: c.openCount, icon: BarChart2 },
                        { label: "Réponses", value: c.replyCount, icon: Megaphone },
                      ].map((s) => (
                        <div key={s.label} className="text-center">
                          <p className="text-xl font-bold text-white">{s.value}</p>
                          <p className="text-xs text-gray-500">{s.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {c.status === "ACTIVE" ? (
                        <Button variant="outline" size="sm" onClick={() => updateStatus(c.id, "PAUSED")}>
                          <Pause className="w-3.5 h-3.5" />
                          Pause
                        </Button>
                      ) : c.status !== "COMPLETED" ? (
                        <Button variant="gradient" size="sm" onClick={() => updateStatus(c.id, "ACTIVE")}>
                          <Play className="w-3.5 h-3.5" />
                          Lancer
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:text-red-400 hover:bg-red-500/10"
                        onClick={() => deleteCampaign(c.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nouvelle campagne</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label>Nom de la campagne</Label>
                <Input
                  placeholder="ex: Plombiers Paris Q1 2026"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Niche</Label>
                <Input
                  placeholder="ex: plombier"
                  value={form.niche}
                  onChange={(e) => setForm(f => ({ ...f, niche: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Ville</Label>
                <Input
                  placeholder="ex: Paris"
                  value={form.city}
                  onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Objet de l&apos;email</Label>
                <Input
                  placeholder="ex: Développez votre activité de plomberie…"
                  value={form.subject}
                  onChange={(e) => setForm(f => ({ ...f, subject: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Template d&apos;email</Label>
                <Textarea
                  rows={8}
                  value={form.template}
                  onChange={(e) => setForm(f => ({ ...f, template: e.target.value }))}
                />
                <p className="text-xs text-gray-500">Utilisez {"{niche}"}, {"{city}"}, {"{nom}"} comme variables</p>
              </div>
              <div className="space-y-1.5">
                <Label>Limite journalière</Label>
                <Input
                  type="number"
                  min={1}
                  max={500}
                  value={form.dailyLimit}
                  onChange={(e) => setForm(f => ({ ...f, dailyLimit: parseInt(e.target.value) || 20 }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
            <Button
              variant="gradient"
              onClick={createCampaign}
              disabled={creating || !form.name || !form.niche || !form.city}
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Créer la campagne
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
