"use client";

import { useEffect, useState, useCallback } from "react";
import { TopBar } from "@/components/dashboard/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search, Target, Trash2, Mail, Loader2,
  Globe, Phone, Star, MapPin, Building2
} from "lucide-react";
import { ScrapingModule } from "@/components/scraping/scraping-module";
import { EmailComposer } from "@/components/emails/email-composer";
import type { Prospect } from "@/types";

const statusBadge: Record<string, string> = {
  NEW: "secondary",
  CONTACTED: "default",
  OPENED: "default",
  REPLIED: "success",
  CONVERTED: "success",
  UNSUBSCRIBED: "destructive",
};

const statusLabel: Record<string, string> = {
  NEW: "Nouveau",
  CONTACTED: "Contacté",
  OPENED: "Ouvert",
  REPLIED: "Répondu",
  CONVERTED: "Converti",
  UNSUBSCRIBED: "Désabonné",
};

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [showScraping, setShowScraping] = useState(false);

  const fetchProspects = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), search });
    const res = await fetch(`/api/prospects?${params}`);
    const data = await res.json();
    setProspects(data.prospects || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, search]);

  useEffect(() => { fetchProspects(); }, [fetchProspects]);

  async function deleteProspect(id: string) {
    if (!confirm("Supprimer ce prospect ?")) return;
    await fetch(`/api/prospects?id=${id}`, { method: "DELETE" });
    fetchProspects();
  }

  return (
    <>
      <TopBar title="Prospects" description={`${total} prospects trouvés`} />

      <div className="p-6 space-y-6">
        {/* Header actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Rechercher par nom, email, ville…"
              className="pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <Button variant="gradient" onClick={() => setShowScraping(true)}>
            <Target className="w-4 h-4" />
            Scraper des prospects
          </Button>
        </div>

        {/* Scraping module */}
        {showScraping && (
          <ScrapingModule
            onClose={() => setShowScraping(false)}
            onSuccess={() => { setShowScraping(false); fetchProspects(); }}
          />
        )}

        {/* Email composer */}
        {selectedProspect && (
          <EmailComposer
            prospect={selectedProspect}
            onClose={() => setSelectedProspect(null)}
          />
        )}

        {/* Table */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="w-4 h-4 text-violet-400" />
              Liste des prospects
              <span className="ml-auto text-sm font-normal text-gray-400">{total} au total</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
              </div>
            ) : prospects.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Target className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="font-medium">Aucun prospect</p>
                <p className="text-sm mt-1">Utilisez le scraping pour trouver vos premiers prospects</p>
                <Button variant="gradient" className="mt-4" onClick={() => setShowScraping(true)}>
                  Scraper maintenant
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium uppercase tracking-wider">Prospect</th>
                      <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium uppercase tracking-wider hidden md:table-cell">Contact</th>
                      <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium uppercase tracking-wider hidden lg:table-cell">Localisation</th>
                      <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium uppercase tracking-wider">Statut</th>
                      <th className="px-6 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {prospects.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-900/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                              <Building2 className="w-4 h-4 text-violet-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-200">{p.name}</p>
                              <p className="text-xs text-gray-500 capitalize">{p.niche}</p>
                              {p.rating && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                  <span className="text-xs text-gray-400">{p.rating} ({p.reviewCount})</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <div className="space-y-1">
                            {p.email && (
                              <div className="flex items-center gap-1.5 text-xs text-gray-300">
                                <Mail className="w-3 h-3 text-gray-500" />
                                {p.email}
                              </div>
                            )}
                            {p.phone && (
                              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                <Phone className="w-3 h-3 text-gray-500" />
                                {p.phone}
                              </div>
                            )}
                            {p.website && (
                              <a href={p.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-violet-400 hover:underline">
                                <Globe className="w-3 h-3" />
                                Site web
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden lg:table-cell">
                          <div className="flex items-center gap-1.5 text-sm text-gray-400">
                            <MapPin className="w-3 h-3 text-gray-500" />
                            {p.city}
                          </div>
                          {p.address && <p className="text-xs text-gray-600 mt-0.5">{p.address}</p>}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={statusBadge[p.status] as any || "secondary"}>
                            {statusLabel[p.status] || p.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 justify-end">
                            {p.email && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => setSelectedProspect(p)}
                              >
                                <Mail className="w-3 h-3" />
                                Email IA
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 hover:text-red-400 hover:bg-red-500/10"
                              onClick={() => deleteProspect(p.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Page {page} · {total} prospects au total
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Précédent</Button>
              <Button variant="outline" size="sm" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>Suivant</Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
