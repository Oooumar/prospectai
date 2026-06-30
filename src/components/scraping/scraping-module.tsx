"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, X, Loader2, Target, Check, Mail, Phone, Ban } from "lucide-react";
import { useI18n } from "@/components/language-provider";

type FormData = { niche: string; city: string; limit: number };

interface ScrapingModuleProps {
  onClose: () => void;
  onSuccess: () => void;
}

function ScrapingSteps({ city, t }: { city: string; t: (key: any, p?: any) => string }) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    t("sc_step1"),
    t("sc_step2", { city: city || "…" }),
    t("sc_step3"),
    t("sc_step4"),
    t("sc_step5"),
  ];

  useEffect(() => {
    setCurrentStep(0);
    const timers = [1400, 2800, 4400, 6200].map((delay, i) =>
      setTimeout(() => setCurrentStep(i + 1), delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="py-4 space-y-3">
      {steps.map((label, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        return (
          <div
            key={i}
            className={`flex items-center gap-3 transition-all duration-400 ${
              active ? "opacity-100" : done ? "opacity-70" : "opacity-30"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                done
                  ? "bg-emerald-500/25 border border-emerald-500/50"
                  : active
                  ? "bg-orange-500/20 border border-orange-400/50"
                  : "bg-gray-800 border border-gray-700"
              }`}
            >
              {done ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : active ? (
                <Loader2 className="w-3.5 h-3.5 text-orange-400 animate-spin" />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
              )}
            </div>
            <span
              className={`text-sm transition-colors duration-300 ${
                done
                  ? "text-emerald-400 line-through decoration-emerald-600"
                  : active
                  ? "text-white font-medium"
                  : "text-gray-600"
              }`}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function ScrapingModule({ onClose, onSuccess }: ScrapingModuleProps) {
  const { t } = useI18n();
  const [results, setResults] = useState<any[]>([]);
  const [scraped, setScraped] = useState(false);
  const [apiError, setApiError] = useState("");
  const [noWebsiteOnly, setNoWebsiteOnly] = useState(false);
  const [limitVal, setLimitVal] = useState(20);
  const [submittingCity, setSubmittingCity] = useState("");

  const schema = z.object({
    niche: z.string().min(2),
    city: z.string().min(2),
    limit: z.coerce.number().min(5).max(30),
  });

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { limit: 20 },
  });

  const watchedCity = watch("city");

  const NICHE_GROUPS = {
    [t("sc_g_b2b")]: ["Plombier", "Électricien", "Restaurant", "Boulangerie", "Coiffeur", "Dentiste", "Avocat", "Comptable", "Auto école", "Carreleur"],
    [t("sc_g_creator")]: ["Marque beauté", "Marque mode", "Marque tech", "Agence influence", "Marque alimentaire", "Startup"],
    [t("sc_g_agency")]: ["Agence marketing", "Agence web", "Agence SEO", "Agence vidéo"],
  };

  async function onSubmit(data: FormData) {
    setApiError("");
    setSubmittingCity(data.city);
    try {
      const res = await fetch("/api/scraping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, noWebsiteOnly }),
      });
      const json = await res.json();
      if (res.ok) {
        setResults(json.prospects || []);
        setScraped(true);
      } else {
        setApiError(json.error || "Erreur lors du scraping");
      }
    } catch {
      setApiError(t("sc_error_server"));
    }
  }

  return (
    <Card className="border-violet-500/30 bg-violet-500/5">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="w-4 h-4 text-violet-400" />
            {t("sc_title")}
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {!scraped ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5 md:col-span-1">
                <Label>{t("sc_niche")}</Label>
                <Input placeholder={t("sc_niche_ph")} {...register("niche")} />
                {errors.niche && <p className="text-xs text-red-400">{errors.niche.message}</p>}
                <div className="space-y-2 mt-2">
                  {Object.entries(NICHE_GROUPS).map(([group, niches]) => (
                    <div key={group}>
                      <p className="text-xs text-gray-500 mb-1">{group}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {niches.map((n) => (
                          <button
                            key={n}
                            type="button"
                            className="text-xs px-2 py-0.5 rounded-full border border-gray-700 bg-gray-800/60 text-gray-300 hover:border-violet-500/50 hover:text-violet-300 transition-colors"
                            onClick={() => setValue("niche", n)}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>{t("sc_city")}</Label>
                <Input placeholder={t("sc_city_ph")} {...register("city")} />
                {errors.city && <p className="text-xs text-red-400">{errors.city.message}</p>}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>{t("sc_limit")}</Label>
                  <span className="text-sm font-semibold text-orange-400 tabular-nums">{limitVal}</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={30}
                  step={5}
                  value={limitVal}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setLimitVal(v);
                    setValue("limit", v);
                  }}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer accent-orange-500 bg-gray-700"
                />
                <div className="flex justify-between text-[10px] text-gray-600">
                  <span>5</span><span>10</span><span>15</span><span>20</span><span>25</span><span>30</span>
                </div>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={noWebsiteOnly}
                onChange={e => setNoWebsiteOnly(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-orange-500 focus:ring-orange-500/30"
              />
              <Ban className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{t("sc_no_website")}</span>
            </label>

            {isSubmitting && (
              <ScrapingSteps city={submittingCity || watchedCity} t={t} />
            )}

            {apiError && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {apiError}
              </div>
            )}

            <Button type="submit" variant="warm" disabled={isSubmitting} className="w-full md:w-auto">
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" />{t("sc_searching")}</>
              ) : (
                <><Search className="w-4 h-4" />{t("sc_search_btn")}</>
              )}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="text-sm font-medium text-white">
                  {t("sc_results", { n: results.length })}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={() => setScraped(false)}>
                {t("sc_new_search")}
              </Button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 rounded-xl border border-gray-800 bg-gray-900/50 p-2">
              {results.slice(0, 10).map((p: any, i: number) => (
                <div key={i} className="flex items-start justify-between p-3 rounded-lg bg-gray-800/40 hover:bg-gray-800/60 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-200">{p.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {p.email && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Mail className="w-3 h-3" /> {p.email}
                        </span>
                      )}
                      {p.phone && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Phone className="w-3 h-3" /> {p.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!p.website && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400 border border-orange-500/30">
                        <Ban className="w-2.5 h-2.5" />
                      </span>
                    )}
                    <Badge variant="secondary" className="text-xs">{p.city}</Badge>
                  </div>
                </div>
              ))}
              {results.length > 10 && (
                <p className="text-center text-xs text-gray-500 py-2">
                  {t("sc_more", { n: results.length - 10 })}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="warm" onClick={onSuccess} className="flex-1">
                {t("sc_view_all")}
              </Button>
              <Button variant="outline" onClick={() => setScraped(false)}>
                {t("sc_again")}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
