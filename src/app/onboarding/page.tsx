"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Check, ArrowRight, Share2, LayoutDashboard, Rocket } from "lucide-react";

const STORAGE_KEY = "prospectai_onboarding_v1";

interface Step {
  id: number;
  title: string;
  desc: string;
  autoCheck?: boolean;
  href?: string;
  ctaLabel?: string;
  isShare?: boolean;
}

const STEPS: Step[] = [
  {
    id: 1,
    title: "Compte créé",
    desc: "Bienvenue sur ProspectAI ! Votre compte est prêt à l'emploi.",
    autoCheck: true,
  },
  {
    id: 2,
    title: "Trouvez vos premiers prospects",
    desc: "Lancez une recherche dans votre niche et votre ville cible. ProspectAI trouve les entreprises locales pour vous.",
    href: "/dashboard/prospects",
    ctaLabel: "Rechercher des prospects",
  },
  {
    id: 3,
    title: "Générez votre premier message IA",
    desc: "Sélectionnez un prospect et laissez l'IA rédiger un email ou un message WhatsApp personnalisé.",
    href: "/dashboard/prospects",
    ctaLabel: "Générer un message IA",
  },
  {
    id: 4,
    title: "Lancez votre première campagne",
    desc: "Créez une campagne email automatique pour prospecter chaque jour sans effort.",
    href: "/dashboard/campaigns",
    ctaLabel: "Créer une campagne",
  },
  {
    id: 5,
    title: "Invitez un premier client",
    desc: "Partagez ProspectAI avec quelqu'un qui pourrait en bénéficier et gagnez des commissions.",
    isShare: true,
  },
];

function launchConfetti() {
  if (typeof window === "undefined") return;
  if (!document.getElementById("cfkf")) {
    const s = document.createElement("style");
    s.id = "cfkf";
    s.textContent =
      "@keyframes cffall{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:0}}" +
      "@keyframes cfsway{0%,100%{margin-left:0}50%{margin-left:22px}}";
    document.head.appendChild(s);
  }
  const wrap = document.createElement("div");
  wrap.style.cssText =
    "position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden";
  document.body.appendChild(wrap);
  const colors = ["#7B61FF", "#C77DFF", "#4ade80", "#facc15", "#f472b6", "#60a5fa", "#fb923c"];
  for (let i = 0; i < 110; i++) {
    const p = document.createElement("div");
    const sz = 4 + Math.random() * 8;
    const dur = 1500 + Math.random() * 1500;
    const del = Math.random() * 800;
    p.style.cssText =
      `position:absolute;top:-12px;left:${Math.random() * 100}%;` +
      `width:${sz}px;height:${sz}px;` +
      `background:${colors[i % colors.length]};` +
      `border-radius:${Math.random() > 0.5 ? "50%" : "2px"};` +
      `animation:cffall ${dur}ms ${del}ms ease-in forwards,` +
      `cfsway ${600 + Math.random() * 500}ms ${del}ms ease-in-out infinite`;
    wrap.appendChild(p);
  }
  setTimeout(() => wrap.remove(), 4200);
}

export default function OnboardingPage() {
  const [completed, setCompleted] = useState<Set<number>>(new Set([1]));
  const [justCompleted, setJustCompleted] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const initial: Set<number> = saved
      ? new Set(JSON.parse(saved) as number[])
      : new Set();
    initial.add(1);
    setCompleted(initial);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(initial)));
    setMounted(true);
  }, []);

  const markDone = useCallback((id: number) => {
    setCompleted((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
    setJustCompleted(id);
    launchConfetti();
    setTimeout(() => setJustCompleted(null), 3000);
  }, []);

  const copyLink = useCallback(async () => {
    const url = `${window.location.origin}/auth/signup`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // fallback: show the URL in a prompt
    }
    setCopied(true);
    markDone(5);
    setTimeout(() => setCopied(false), 2500);
  }, [markDone]);

  const progress = Math.round((completed.size / STEPS.length) * 100);
  const allDone = completed.size === STEPS.length;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-start px-4 py-12">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 mb-6">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#7B61FF,#C77DFF)" }}
          >
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">ProspectAI</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Guide de démarrage</h1>
        <p className="text-gray-400 text-sm max-w-md">
          Suivez ces 5 étapes pour tirer le meilleur de ProspectAI en quelques minutes.
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-lg mb-8">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-400">
            {mounted ? `${completed.size} / ${STEPS.length} étapes complétées` : "Chargement…"}
          </span>
          <span className="font-semibold" style={{ color: "#9B8CFF" }}>
            {progress}%
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden bg-gray-800">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg,#7B61FF,#C77DFF)",
            }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="w-full max-w-lg space-y-3">
        {STEPS.map((step, idx) => {
          const done = completed.has(step.id);
          const isJust = justCompleted === step.id;

          return (
            <div
              key={step.id}
              className="rounded-xl border p-5 transition-all duration-300"
              style={
                done
                  ? { borderColor: "rgba(123,97,255,0.4)", background: "rgba(123,97,255,0.05)" }
                  : { borderColor: "rgb(31,41,55)", background: "rgba(17,24,39,0.6)" }
              }
            >
              <div className="flex items-start gap-4">
                {/* Step circle */}
                <button
                  type="button"
                  onClick={() => !done && !step.autoCheck && !step.isShare && markDone(step.id)}
                  className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300"
                  style={
                    done
                      ? { background: "#7B61FF", color: "#fff" }
                      : { border: "2px solid rgb(55,65,81)", color: "rgb(107,114,128)" }
                  }
                  aria-label={done ? "Étape complétée" : `Étape ${idx + 1}`}
                >
                  {done ? <Check className="w-4 h-4" /> : idx + 1}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3
                      className="font-semibold text-sm"
                      style={{ color: done ? "#C4B5FD" : "#fff" }}
                    >
                      {step.title}
                    </h3>
                    {isJust && (
                      <span className="text-xs font-medium text-emerald-400 animate-pulse">
                        ✓ Félicitations !
                      </span>
                    )}
                    {done && !isJust && <span className="text-xs text-gray-600">✓</span>}
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed mb-3">{step.desc}</p>

                  {/* CTA: navigate to dashboard section */}
                  {!done && step.href && (
                    <Link
                      href={step.href}
                      onClick={() => markDone(step.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-90"
                      style={{
                        background: "linear-gradient(135deg,#7B61FF,#C77DFF)",
                        color: "#fff",
                      }}
                    >
                      {step.ctaLabel}
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}

                  {/* CTA: share link */}
                  {step.isShare && !done && (
                    <button
                      type="button"
                      onClick={copyLink}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-90"
                      style={{
                        background: "linear-gradient(135deg,#7B61FF,#C77DFF)",
                        color: "#fff",
                      }}
                    >
                      <Share2 className="w-3 h-3" />
                      {copied ? "Lien copié !" : "Copier le lien d'invitation"}
                    </button>
                  )}

                  {/* Share link display when done */}
                  {step.isShare && done && (
                    <p className="text-xs text-violet-400/70">Lien partagé avec succès.</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* All done banner */}
      {allDone && (
        <div
          className="mt-8 text-center rounded-xl border p-6 w-full max-w-lg"
          style={{ borderColor: "rgba(52,211,153,0.3)", background: "rgba(52,211,153,0.08)" }}
        >
          <div className="text-3xl mb-2">🎉</div>
          <h3 className="text-white font-bold mb-1">Vous êtes prêt !</h3>
          <p className="text-gray-400 text-sm">
            Toutes les étapes sont complétées. ProspectAI est maintenant configuré pour travailler pour vous.
          </p>
        </div>
      )}

      {/* Dashboard link */}
      <div className="mt-10">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-violet-400 transition-colors"
        >
          <LayoutDashboard className="w-4 h-4" />
          Aller au tableau de bord
        </Link>
      </div>
    </div>
  );
}
