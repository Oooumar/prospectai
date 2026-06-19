import Groq from "groq-sdk";

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = "llama-3.1-8b-instant";

type ProfileType = "b2b" | "creator" | "agency";

function getSystemPrompt(profileType: ProfileType): string {
  if (profileType === "creator") {
    return `Tu es un expert en partenariats de marque et marketing d'influence. Tu rédiges des emails de prospection pour des créateurs de contenu qui cherchent des collaborations avec des marques.
L'email doit être:
- Personnalisé avec le nom de la marque/entreprise
- Orienté partenariat, collaboration ou sponsoring
- Mettre en avant la valeur du créateur (audience, engagement, niche)
- Court (3 paragraphes max) et impactant
- Ton dynamique et professionnel
Réponds UNIQUEMENT avec un JSON valide: {"subject": "...", "body": "..."}`;
  }

  if (profileType === "agency") {
    return `Tu es un expert en développement commercial pour agences. Tu rédiges des emails de prospection B2B pour des agences qui cherchent de nouveaux clients.
L'email doit être:
- Axé sur le ROI et les résultats mesurables
- Mettre en avant l'expertise et les cas clients
- Proposer un audit ou une consultation gratuite
- Court et direct (3-4 paragraphes)
- Ton professionnel et orienté résultats
Réponds UNIQUEMENT avec un JSON valide: {"subject": "...", "body": "..."}`;
  }

  return `Tu es un expert en copywriting B2B. Tu rédiges des emails de prospection courts, personnalisés et efficaces en français.
L'email doit être:
- Personnalisé avec le nom et l'activité du prospect
- Court (3-4 paragraphes max)
- Axé sur la valeur apportée
- Avec un appel à l'action clair
- Ton professionnel mais humain
Réponds UNIQUEMENT avec un JSON valide: {"subject": "...", "body": "..."}`;
}

function getUserPrompt(
  prospect: { name: string; company?: string; niche: string; city: string },
  profileType: ProfileType
): string {
  if (profileType === "creator") {
    return `Rédige un email de prospection pour proposer un partenariat/collaboration à cette marque:
- Marque/Entreprise: ${prospect.name}${prospect.company ? ` (${prospect.company})` : ""}
- Secteur: ${prospect.niche}
- Ville: ${prospect.city}

Je suis créateur de contenu spécialisé dans le secteur ${prospect.niche}. Je cherche à établir un partenariat (contenu sponsorisé, ambassadeur, affiliation).`;
  }

  if (profileType === "agency") {
    return `Rédige un email de prospection pour proposer nos services d'agence à:
- Entreprise: ${prospect.name}${prospect.company ? ` (${prospect.company})` : ""}
- Secteur: ${prospect.niche}
- Ville: ${prospect.city}

Notre agence aide les entreprises du secteur ${prospect.niche} à générer plus de leads et augmenter leur chiffre d'affaires via des stratégies digitales éprouvées.`;
  }

  return `Rédige un email de prospection pour:
- Nom/Entreprise: ${prospect.name}${prospect.company ? ` (${prospect.company})` : ""}
- Secteur: ${prospect.niche}
- Ville: ${prospect.city}

Le but est de proposer nos services de marketing digital/automatisation pour développer leur activité.`;
}

function generateFallbackEmail(
  prospect: { name: string; niche: string; city: string },
  profileType: ProfileType
): { subject: string; body: string } {
  if (profileType === "creator") {
    return {
      subject: `Proposition de partenariat — ${prospect.name}`,
      body: `Bonjour,

Je suis créateur de contenu spécialisé dans le secteur ${prospect.niche.toLowerCase()} et je suis particulièrement intéressé par vos produits/services.

Avec une audience engagée dans votre niche, je pense qu'un partenariat entre nous pourrait générer des résultats concrets pour votre marque — visibilité, engagement et conversions.

Seriez-vous ouvert(e) à discuter d'une possible collaboration ? Je serais ravi de vous partager mes statistiques et quelques idées de contenu.

Cordialement`,
    };
  }

  if (profileType === "agency") {
    return {
      subject: `Boostez votre acquisition client — ${prospect.name}`,
      body: `Bonjour,

Notre agence accompagne des entreprises du secteur ${prospect.niche.toLowerCase()} à ${prospect.city} pour multiplier leurs leads et améliorer leur ROI digital.

Nous avons aidé des structures similaires à la vôtre à augmenter leur chiffre d'affaires de 40 % en moins de 6 mois grâce à des stratégies sur mesure.

Seriez-vous disponible pour un audit gratuit de 30 minutes cette semaine ?

Cordialement`,
    };
  }

  return {
    subject: `Développez votre activité de ${prospect.niche.toLowerCase()} à ${prospect.city}`,
    body: `Bonjour,

J'ai découvert votre activité de ${prospect.niche.toLowerCase()} à ${prospect.city} et je souhaitais vous contacter directement.

Nous aidons les professionnels de votre secteur à attirer plus de clients grâce à des stratégies digitales concrètes et mesurables. En moyenne, nos clients voient leur chiffre d'affaires augmenter de 30 % en moins de 90 jours.

Seriez-vous disponible pour un appel de 15 minutes cette semaine ?

Bien cordialement`,
  };
}

export async function generateProspectEmail(
  prospect: { name: string; company?: string; niche: string; city: string },
  profileType: ProfileType = "b2b"
): Promise<{ subject: string; body: string; fallback?: boolean }> {
  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: getSystemPrompt(profileType) },
        { role: "user", content: getUserPrompt(prospect, profileType) },
      ],
      temperature: 0.7,
      max_tokens: 600,
    });

    const content = completion.choices[0].message.content || "{}";

    try {
      const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
      return JSON.parse(cleanContent);
    } catch {
      return {
        subject: `Développez votre activité de ${prospect.niche} à ${prospect.city}`,
        body: content,
      };
    }
  } catch (err: any) {
    const status = err?.status || err?.statusCode;
    const code = err?.error?.code || err?.code || "";
    if (status === 429 || code === "rate_limit_exceeded" || code === "model_decommissioned") {
      return { ...generateFallbackEmail(prospect, profileType), fallback: true };
    }
    throw err;
  }
}
