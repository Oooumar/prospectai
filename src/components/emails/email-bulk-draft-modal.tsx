"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Loader2, Mail, Wand2, AlertCircle, CheckCircle2, ChevronDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

const PROFILE_LS_KEY = "pa_last_profile_id";

interface Profile { id: string; name: string; companyName: string | null; isDefault: boolean }

interface Props {
  prospectIds: string[];
  onClose: () => void;
}

export function EmailBulkDraftModal({ prospectIds, onClose }: Props) {
  const router = useRouter();
  const [profiles, setProfiles]             = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [generating, setGenerating]         = useState(false);
  const [error, setError]                   = useState("");
  const [result, setResult]                 = useState<{ created: number; skipped: number } | null>(null);

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

  async function handleGenerate() {
    setError("");
    setGenerating(true);
    try {
      const res = await fetch("/api/emails/bulk-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospectIds,
          profileId: selectedProfileId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de la génération");
        setGenerating(false);
        return;
      }
      setResult({ created: data.created, skipped: data.skipped });
    } catch (e: any) {
      setError(e.message || "Erreur réseau");
    } finally {
      setGenerating(false);
    }
  }

  function goToDrafts() {
    router.push("/dashboard/drafts");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-gray-950 border border-violet-500/30 rounded-2xl shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-violet-400" />
            Campagne email groupée
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-gray-800 text-gray-500 hover:text-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">

          {result ? (
            /* ── Success state ── */
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-emerald-300 font-semibold">
                    {result.created} brouillon{result.created > 1 ? "s" : ""} créé{result.created > 1 ? "s" : ""}
                  </p>
                  {result.skipped > 0 && (
                    <p className="text-gray-400 mt-0.5">
                      {result.skipped} prospect{result.skipped > 1 ? "s" : ""} ignoré{result.skipped > 1 ? "s" : ""} (sans email ou quota atteint)
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <Button className="flex-1" onClick={goToDrafts}>
                  <Mail className="w-4 h-4" />
                  Voir les brouillons
                </Button>
                <Button variant="outline" onClick={onClose}>Fermer</Button>
              </div>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              {/* Info */}
              <div className="rounded-xl bg-gray-900/60 border border-gray-800 px-4 py-3 text-sm text-gray-300">
                <span className="font-semibold text-white">{prospectIds.length}</span> prospect{prospectIds.length > 1 ? "s" : ""} sélectionné{prospectIds.length > 1 ? "s" : ""}
                <span className="text-gray-500 ml-1">— seuls ceux avec un email seront traités.</span>
              </div>

              {/* Profile selector */}
              {profiles.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-400">Profil expéditeur</Label>
                  <div className="relative">
                    <select
                      value={selectedProfileId}
                      onChange={e => {
                        setSelectedProfileId(e.target.value);
                        localStorage.setItem(PROFILE_LS_KEY, e.target.value);
                      }}
                      className="w-full appearance-none rounded-md border border-gray-700 bg-gray-900 px-3 py-2 pr-8 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
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

              {/* What happens */}
              <div className="rounded-xl border border-gray-800 bg-gray-900/40 px-4 py-3 space-y-1.5 text-xs text-gray-400">
                <p className="font-medium text-gray-300">Ce qui va se passer :</p>
                <p>• L'IA génère un email personnalisé pour chaque prospect avec email</p>
                <p>• Les emails sont sauvegardés en <span className="text-violet-300">brouillons</span> — rien n'est envoyé</p>
                <p>• Tu les valides et envoies depuis l'onglet Brouillons</p>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <div className="pt-1 flex gap-3">
                <Button
                  className="flex-1"
                  onClick={handleGenerate}
                  disabled={generating}
                >
                  {generating ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Génération en cours…</>
                  ) : (
                    <><Wand2 className="w-4 h-4" />Générer les brouillons</>
                  )}
                </Button>
                <Button variant="outline" onClick={onClose} disabled={generating}>
                  Annuler
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
