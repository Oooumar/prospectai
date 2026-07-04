"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/dashboard/topbar";
import { Loader2, ExternalLink, RefreshCw } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ServiceOrder {
  id: string;
  nom: string;
  entreprise: string | null;
  email: string;
  telephone: string;
  besoin: string;
  categorie: string;
  typePrecis: string;
  options: string[];
  marche: string;
  devise: string;
  prixEstime: number;
  statut: string;
  createdAt: string;
}

interface Stats {
  total: number;
  nouvelles: number;
  enCours: number;
  terminees: number;
}

// ─── Labels ────────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  vitrine:  "Site vitrine",
  pro_seo:  "Site Pro + SEO",
  boutique: "Boutique en ligne",
  webapp:   "Web App / PWA",
  native:   "App native",
};

const OPTION_LABELS: Record<string, string> = {
  reservation:   "Réservation",
  mobile_money:  "Mobile Money",
  espace_client: "Espace client",
  seo_avance:    "SEO avancé",
  chat_whatsapp: "Chat/WA",
  maintenance:   "Maintenance",
};

const STATUTS = ["nouvelle", "en cours", "terminée", "annulée"] as const;

const STATUT_STYLE: Record<string, { badge: "warning" | "default" | "success" | "destructive" | "secondary"; border: string }> = {
  "nouvelle":  { badge: "warning",     border: "border-amber-500/60"   },
  "en cours":  { badge: "default",     border: "border-violet-500/60"  },
  "terminée":  { badge: "success",     border: "border-emerald-500/60" },
  "annulée":   { badge: "destructive", border: "border-red-500/60"     },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) { return n.toLocaleString("fr-FR"); }

function fmtPrice(order: ServiceOrder) {
  if (order.devise === "EUR")  return `${fmt(order.prixEstime)} €`;
  if (order.devise === "USD")  return `$${order.prixEstime.toLocaleString("en-US")}`;
  return `${fmt(order.prixEstime)} FCFA`;
}

function cleanPhone(tel: string) { return tel.replace(/[^0-9]/g, ""); }

// Handles both old ("afrique"/"europe") and new 4-zone IDs
const ZONE_DISPLAY: Record<string, string> = {
  "afrique":   "🌍 Afrique",
  "europe":    "🇪🇺 Europe",
  "africa-fr": "🌍 Africa FR",
  "africa-en": "🌍 Africa EN",
  "amerique":  "🌎 Amérique",
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, variant }: {
  label: string; value: number; variant?: "warning" | "default" | "success";
}) {
  const colors = {
    warning: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    default: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    success: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  };
  const cls = variant ? colors[variant] : "text-white bg-gray-800/60 border-gray-700/60";
  return (
    <div className={`rounded-xl border px-4 py-3 ${cls}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs mt-0.5 opacity-75">{label}</p>
    </div>
  );
}

function StatusSelect({ orderId, current, onChange }: {
  orderId: string; current: string; onChange: (id: string, statut: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const style = STATUT_STYLE[current] ?? STATUT_STYLE["nouvelle"];

  async function handleChange(statut: string) {
    onChange(orderId, statut); // optimistic
    setSaving(true);
    try {
      const res = await fetch(`/api/commandes?id=${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut }),
      });
      if (!res.ok) {
        onChange(orderId, current); // revert
      }
    } catch {
      onChange(orderId, current); // revert
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative">
      <select
        value={current}
        onChange={e => handleChange(e.target.value)}
        disabled={saving}
        className={`w-full appearance-none rounded-lg border bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white
          focus:outline-none focus:ring-1 focus:ring-violet-500 transition-colors cursor-pointer
          disabled:opacity-50 ${style.border}`}
      >
        {STATUTS.map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      {saving && (
        <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin text-violet-400 pointer-events-none" />
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function CommandesPage() {
  const [orders, setOrders]   = useState<ServiceOrder[]>([]);
  const [stats, setStats]     = useState<Stats>({ total: 0, nouvelles: 0, enCours: 0, terminees: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/commandes");
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Erreur de chargement");
        return;
      }
      const data = await res.json();
      setOrders(data.orders);
      setStats({ total: data.total, nouvelles: data.nouvelles, enCours: data.enCours, terminees: data.terminees });
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function updateStatus(id: string, statut: string) {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, statut } : o));
    // Recompute stats
    setStats(prev => {
      const updated = orders.map(o => o.id === id ? { ...o, statut } : o);
      return {
        total:     updated.length,
        nouvelles: updated.filter(o => o.statut === "nouvelle").length,
        enCours:   updated.filter(o => o.statut === "en cours").length,
        terminees: updated.filter(o => o.statut === "terminée").length,
      };
    });
  }

  return (
    <>
      <TopBar
        title="Commandes de services"
        description={loading ? undefined : `${stats.total} commande${stats.total > 1 ? "s" : ""} · ${stats.nouvelles} nouvelle${stats.nouvelles > 1 ? "s" : ""}`}
      />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total"     value={stats.total}     />
          <StatCard label="Nouvelles" value={stats.nouvelles} variant="warning" />
          <StatCard label="En cours"  value={stats.enCours}   variant="default" />
          <StatCard label="Terminées" value={stats.terminees} variant="success" />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">Triées par date, plus récentes en premier</p>
          <Button variant="ghost" size="sm" onClick={load} disabled={loading}
            className="text-gray-400 hover:text-white gap-1.5 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
        ) : orders.length === 0 ? (
          <div className="rounded-xl border border-gray-800 bg-gray-900/40 px-6 py-16 text-center">
            <p className="text-gray-400 text-sm">Aucune commande pour l&apos;instant.</p>
            <p className="text-gray-600 text-xs mt-1">Les commandes de /commander apparaîtront ici.</p>
          </div>
        ) : (
          /* Table — horizontally scrollable on mobile */
          <div className="rounded-xl border border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-900/60">
                    {["Date", "Client", "Contact", "Service", "Options", "Marché · Prix", "Statut"].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-400 px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-900/40 transition-colors">

                      {/* Date */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-xs text-gray-300">{formatDateTime(order.createdAt)}</p>
                        <p className="text-[11px] text-gray-600 mt-0.5">#{order.id.slice(-6)}</p>
                      </td>

                      {/* Client */}
                      <td className="px-4 py-3">
                        <p className="text-sm text-white font-medium leading-tight">{order.nom}</p>
                        {order.entreprise && (
                          <p className="text-xs text-gray-400 mt-0.5">{order.entreprise}</p>
                        )}
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-3">
                        <a href={`mailto:${order.email}`}
                          className="text-xs text-violet-400 hover:underline block leading-tight truncate max-w-[160px]">
                          {order.email}
                        </a>
                        <a
                          href={`https://wa.me/${cleanPhone(order.telephone)}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 mt-0.5 transition-colors"
                        >
                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          {order.telephone}
                        </a>
                      </td>

                      {/* Service */}
                      <td className="px-4 py-3">
                        <p className="text-xs text-white font-medium">
                          {TYPE_LABELS[order.typePrecis] ?? order.typePrecis}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5 capitalize">
                          {order.categorie === "site" ? "Site web" : "Application"}
                        </p>
                      </td>

                      {/* Options */}
                      <td className="px-4 py-3">
                        {order.options.length === 0 ? (
                          <span className="text-[11px] text-gray-600">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {order.options.slice(0, 3).map(o => (
                              <span key={o}
                                className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">
                                {OPTION_LABELS[o] ?? o}
                              </span>
                            ))}
                            {order.options.length > 3 && (
                              <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500 border border-gray-700">
                                +{order.options.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Zone + Prix */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-xs text-white font-semibold">{fmtPrice(order)}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {ZONE_DISPLAY[order.marche] ?? `🌐 ${order.marche}`}
                        </p>
                      </td>

                      {/* Statut */}
                      <td className="px-4 py-3 w-32">
                        <StatusSelect
                          orderId={order.id}
                          current={order.statut}
                          onChange={updateStatus}
                        />
                        {order.besoin && (
                          <details className="mt-1.5">
                            <summary className="text-[10px] text-gray-600 cursor-pointer hover:text-gray-400 transition-colors select-none">
                              Voir besoin
                            </summary>
                            <p className="mt-1 text-[11px] text-gray-400 leading-relaxed max-w-[200px] bg-gray-900 rounded p-1.5 border border-gray-800">
                              {order.besoin.slice(0, 200)}{order.besoin.length > 200 ? "…" : ""}
                            </p>
                          </details>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
