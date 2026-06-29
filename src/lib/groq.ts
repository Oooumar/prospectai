import Groq from "groq-sdk";

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = "llama-3.3-70b-versatile";

type ProfileType = "b2b" | "creator" | "agency";
type EmailLanguage = "fr" | "en" | "de" | "it" | "es";
export type ReplySentiment = "interested" | "not_interested" | "simple_question" | "needs_human";

const LANG_CITIES: Record<string, EmailLanguage> = {
  // Germany
  berlin: "de", munich: "de", münchen: "de", hamburg: "de", cologne: "de", köln: "de",
  frankfurt: "de", stuttgart: "de", düsseldorf: "de", dortmund: "de", essen: "de",
  leipzig: "de", bremen: "de", dresden: "de", hannover: "de", nuremberg: "de",
  nürnberg: "de", duisburg: "de", bochum: "de", wuppertal: "de", bielefeld: "de",
  bonn: "de", mannheim: "de", karlsruhe: "de", augsburg: "de", wiesbaden: "de",
  freiburg: "de", heidelberg: "de", mainz: "de", kiel: "de", aachen: "de",
  // Austria
  vienna: "de", wien: "de", graz: "de", linz: "de", salzburg: "de", innsbruck: "de",
  // Switzerland (german-speaking)
  zurich: "de", zürich: "de", bern: "de", basel: "de", winterthur: "de", luzern: "de",
  // Italy
  rome: "it", roma: "it", milan: "it", milano: "it", naples: "it", napoli: "it",
  turin: "it", torino: "it", palermo: "it", genoa: "it", genova: "it",
  bologna: "it", florence: "it", firenze: "it", venice: "it", venezia: "it",
  verona: "it", catania: "it", bari: "it", parma: "it", padova: "it",
  // Spain
  madrid: "es", barcelona: "es", valencia: "es", seville: "es", sevilla: "es",
  zaragoza: "es", málaga: "es", malaga: "es", murcia: "es", palma: "es",
  "las palmas": "es", bilbao: "es", alicante: "es", córdoba: "es", cordoba: "es",
  valladolid: "es", vigo: "es", gijón: "es", vitoria: "es", granada: "es",
  // Latin America (Spanish)
  "mexico city": "es", "ciudad de mexico": "es", bogota: "es", bogotá: "es",
  "buenos aires": "es", lima: "es", santiago: "es", caracas: "es",
  // United Kingdom
  london: "en", manchester: "en", birmingham: "en", glasgow: "en", edinburgh: "en",
  liverpool: "en", leeds: "en", sheffield: "en", bristol: "en", cardiff: "en",
  "new york": "en", "los angeles": "en", chicago: "en", houston: "en", phoenix: "en",
  philadelphia: "en", "san antonio": "en", "san diego": "en", dallas: "en",
  toronto: "en", vancouver: "en", sydney: "en", melbourne: "en", dubai: "en",
  singapore: "en", amsterdam: "en", brussels: "en", bruxelles: "en",
};

export function detectEmailLanguage(city: string): EmailLanguage {
  const normalized = city.toLowerCase().trim();
  return LANG_CITIES[normalized] ?? "fr";
}

function getLangName(lang: EmailLanguage): string {
  return { fr: "French", en: "English", de: "German", it: "Italian", es: "Spanish" }[lang];
}

const NO_HALLUCINATION_RULE = `STRICT RULE — never invent contact details: do NOT include any phone number, physical address, postal code, social media handle, or URL that was not explicitly given to you. Do NOT sign with a personal name. End the email with a generic closing only (e.g. "Cordialement", "Best regards", "Mit freundlichen Grüßen").`;

function getSystemPrompt(profileType: ProfileType, targetLanguage: EmailLanguage): string {
  const langInstruction = `IMPORTANT: Write the email in ${getLangName(targetLanguage)}. The entire email body and subject must be in ${getLangName(targetLanguage)}.`;

  if (profileType === "creator") {
    return `You are an expert in brand partnerships and influencer marketing. You write prospecting emails for content creators looking for brand collaborations.
The email must be:
- Personalized with the brand/company name
- Focused on partnership, collaboration or sponsorship
- Highlighting the creator's value (audience, engagement, niche)
- Short (3 paragraphs max) and impactful
- Dynamic and professional tone
${NO_HALLUCINATION_RULE}
${langInstruction}
Reply ONLY with valid JSON: {"subject": "...", "body": "..."}`;
  }

  if (profileType === "agency") {
    return `You are an expert in business development for agencies. You write B2B prospecting emails for agencies seeking new clients.
The email must be:
- Focused on ROI and measurable results
- Highlight expertise and client cases
- Offer a free audit or consultation
- Short and direct (3-4 paragraphs)
- Professional and results-oriented tone
${NO_HALLUCINATION_RULE}
${langInstruction}
Reply ONLY with valid JSON: {"subject": "...", "body": "..."}`;
  }

  return `You are a B2B copywriting expert. You write short, personalized and effective prospecting emails.
The email must be:
- Personalized with the prospect's name and business
- Short (3-4 paragraphs max)
- Focused on the value delivered
- With a clear call to action
- Professional but human tone
${NO_HALLUCINATION_RULE}
${langInstruction}
Reply ONLY with valid JSON: {"subject": "...", "body": "..."}`;
}

function getUserPrompt(
  prospect: { name: string; company?: string; niche: string; city: string },
  profileType: ProfileType,
  sender?: { companyName?: string; website?: string; productDescription?: string },
  lang?: EmailLanguage
): string {
  const senderName = sender?.companyName ?? "our solution";
  const prospectId = `${prospect.name}${prospect.company ? ` (${prospect.company})` : ""}`;
  const langName = lang ? getLangName(lang) : null;
  const langSuffix = langName ? `\n\nOUTPUT LANGUAGE: ${langName}. Write the subject AND body ONLY in ${langName}, regardless of the language used above.` : "";

  if (profileType === "creator") {
    const identity = sender?.productDescription
      ? `I represent ${senderName}: ${sender.productDescription}`
      : sender?.companyName
        ? `I represent ${senderName}`
        : `I am a content creator specialized in the ${prospect.niche} sector`;
    return `Write a short partnership prospecting email.

SENDER: ${identity}
RECIPIENT: ${prospectId} — ${prospect.niche} sector, ${prospect.city}

EMAIL STRUCTURE (4 sentences max, no bullet points in the email):
1. One-sentence intro connecting my work to the ${prospect.niche} space
2. One sentence proposing a specific collaboration (sponsored content, ambassador, or affiliate)
3. One clear call-to-action for a brief chat
4. One short sentence offering email reply as an alternative (e.g. "Feel free to simply reply to this email if you'd prefer more information first.")${langSuffix}`;
  }

  if (profileType === "agency") {
    const whatWeDo = sender?.productDescription
      ? sender.productDescription
      : `${senderName} helps ${prospect.niche} businesses generate more leads and grow revenue`;
    return `Write a short B2B prospecting email from an agency.

SENDER AGENCY: ${senderName}
WHAT WE DO: ${whatWeDo}
RECIPIENT: ${prospectId} — ${prospect.niche} sector, ${prospect.city}

EMAIL STRUCTURE (4-5 sentences max, no bullet points in the email):
1. Open with a specific growth challenge facing ${prospect.niche} businesses
2. Introduce ${senderName} and state ONE concrete result it delivers for ${prospect.niche}
3. Offer a free audit or 20-min discovery call
4. One short sentence offering email reply as an alternative (e.g. "Feel free to simply reply to this email if you'd prefer more information first.")${langSuffix}`;
  }

  const whatWeDo = sender?.productDescription
    ? sender.productDescription
    : `${senderName} helps businesses automate their prospecting and acquire more clients`;
  return `Write a short, high-impact B2B prospecting email.

SENDER PRODUCT: ${senderName}
WHAT IT DOES: ${whatWeDo}
RECIPIENT: ${prospectId} — ${prospect.niche} sector, ${prospect.city}

EMAIL STRUCTURE (4-5 sentences max, no bullet points in the email):
1. One-sentence hook identifying a specific pain point for ${prospect.niche} businesses in ${prospect.city}
2. Introduce ${senderName} by name and explain ONE concrete benefit it brings to ${prospect.niche} businesses
3. One clear call-to-action (e.g. a 15-min call this week)
4. One short sentence offering email reply as an alternative (e.g. "Feel free to simply reply to this email if you'd prefer more information first.")${langSuffix}`;
}

function generateFallbackEmail(
  prospect: { name: string; niche: string; city: string },
  profileType: ProfileType,
  lang: EmailLanguage
): { subject: string; body: string } {
  if (lang === "de") {
    return {
      subject: `Zusammenarbeit mit ${prospect.name}`,
      body: `Guten Tag,\n\nIch bin auf Ihr Unternehmen im Bereich ${prospect.niche} in ${prospect.city} aufmerksam geworden.\n\nUnsere Lösung hilft Fachleuten wie Ihnen, ihr Marketing zu automatisieren und schnell mehr Kunden zu gewinnen.\n\nWären Sie diese Woche für einen 15-minütigen Anruf verfügbar?\n\nMit freundlichen Grüßen`,
    };
  }
  if (lang === "it") {
    return {
      subject: `Proposta per ${prospect.name}`,
      body: `Buongiorno,\n\nHo scoperto la sua attività nel settore ${prospect.niche} a ${prospect.city}.\n\nLa nostra soluzione aiuta professionisti come lei ad automatizzare il marketing e ad attrarre più clienti rapidamente.\n\nSarebbe disponibile per una chiamata di 15 minuti questa settimana?\n\nCordiali saluti`,
    };
  }
  if (lang === "es") {
    return {
      subject: `Propuesta para ${prospect.name}`,
      body: `Buenos días,\n\nHe encontrado su negocio de ${prospect.niche} en ${prospect.city}.\n\nNuestra solución ayuda a profesionales como usted a automatizar su marketing y atraer más clientes rápidamente.\n\n¿Estaría disponible para una llamada de 15 minutos esta semana?\n\nAtentamente`,
    };
  }
  if (lang === "en") {
    return {
      subject: `Grow your ${prospect.niche} business in ${prospect.city}`,
      body: `Hello,\n\nI came across your ${prospect.niche} business in ${prospect.city} and wanted to reach out directly.\n\nOur solution helps professionals like you automate their marketing and attract more clients quickly.\n\nWould you be available for a 15-minute call this week?\n\nBest regards`,
    };
  }
  if (profileType === "creator") {
    return {
      subject: `Proposition de partenariat — ${prospect.name}`,
      body: `Bonjour,\n\nJe suis créateur de contenu spécialisé dans le secteur ${prospect.niche.toLowerCase()} et je suis particulièrement intéressé par vos produits/services.\n\nSeriez-vous ouvert(e) à discuter d'une possible collaboration ?\n\nCordialement`,
    };
  }
  if (profileType === "agency") {
    return {
      subject: `Boostez votre acquisition client — ${prospect.name}`,
      body: `Bonjour,\n\nNotre agence accompagne des entreprises du secteur ${prospect.niche.toLowerCase()} à ${prospect.city} pour multiplier leurs leads.\n\nSeriez-vous disponible pour un audit gratuit de 30 minutes cette semaine ?\n\nCordialement`,
    };
  }
  return {
    subject: `Développez votre activité de ${prospect.niche.toLowerCase()} à ${prospect.city}`,
    body: `Bonjour,\n\nJ'ai découvert votre activité de ${prospect.niche.toLowerCase()} à ${prospect.city} et je souhaitais vous contacter directement.\n\nSeriez-vous disponible pour un appel de 15 minutes cette semaine ?\n\nBien cordialement`,
  };
}

function buildSignatureLine(
  lang: EmailLanguage,
  companyName?: string,
  website?: string
): string {
  if (!companyName && !website) return "";
  if (companyName && website) return `\n\n— ${companyName}: ${website}`;
  if (website) return `\n\n— ${website}`;
  return `\n\n— ${companyName}`;
}

function extractJson<T>(raw: string): T | null {
  const cleaned = raw.replace(/```json\s*|\s*```/g, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {}
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]) as T;
    } catch {}
  }
  return null;
}

function extractJsonFromContent(raw: string): { subject: string; body: string } | null {
  const result = extractJson<{ subject?: string; body?: string }>(raw);
  if (result?.subject && result?.body) return result as { subject: string; body: string };
  return null;
}

export async function generateProspectEmail(
  prospect: { name: string; company?: string; niche: string; city: string },
  profileType: ProfileType = "b2b",
  targetLanguage?: EmailLanguage,
  sender?: { companyName?: string; website?: string; productDescription?: string }
): Promise<{ subject: string; body: string; fallback?: boolean }> {
  const lang = targetLanguage ?? detectEmailLanguage(prospect.city);
  const signatureLine = buildSignatureLine(lang, sender?.companyName, sender?.website);

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: getSystemPrompt(profileType, lang) },
        { role: "user", content: getUserPrompt(prospect, profileType, sender, lang) },
      ],
      temperature: 0.7,
      max_tokens: 600,
    });

    const content = completion.choices[0].message.content || "";
    const parsed = extractJsonFromContent(content);

    if (parsed) {
      return { ...parsed, body: parsed.body + signatureLine };
    }

    console.error("[groq] JSON parse failed. sender:", JSON.stringify(sender), "raw:", content.substring(0, 400));
    const fallback = generateFallbackEmail(prospect, profileType, lang);
    return { ...fallback, body: fallback.body + signatureLine, fallback: true };
  } catch (err: any) {
    const status = err?.status || err?.statusCode;
    const code = err?.error?.code || err?.code || "";
    console.error("[groq] API error:", { status, code, message: err?.message });
    if (status === 429 || code === "rate_limit_exceeded" || code === "model_decommissioned") {
      const fallback = generateFallbackEmail(prospect, profileType, lang);
      return { ...fallback, body: fallback.body + signatureLine, fallback: true };
    }
    throw err;
  }
}

export async function analyzeEmailReply({
  replyText,
  originalSubject,
  originalBody,
  prospect,
  sender,
  lang,
}: {
  replyText: string;
  originalSubject: string;
  originalBody: string;
  prospect: { name: string; niche: string; city: string };
  sender: { companyName?: string; productDescription?: string };
  lang: EmailLanguage;
}): Promise<{ sentiment: ReplySentiment; analysis: string; draftResponse: string }> {
  const langName = getLangName(lang);
  const senderName = sender.companyName ?? "notre solution";
  const whatWeDo = sender.productDescription ?? `${senderName} automatise la prospection B2B`;

  const systemPrompt = `You are a B2B sales assistant. Analyze a prospect's reply to a cold email.
${NO_HALLUCINATION_RULE}
Write the draft reply in ${langName}.
Reply ONLY with valid JSON: {"sentiment": "...", "analysis": "...", "draftResponse": "..."}`;

  const userPrompt = `PROSPECT: ${prospect.name} — ${prospect.niche} sector, ${prospect.city}
SENDER PRODUCT: ${senderName}
WHAT IT DOES: ${whatWeDo}

ORIGINAL EMAIL WE SENT:
Subject: ${originalSubject}
${originalBody.substring(0, 400)}

PROSPECT'S REPLY:
${replyText.substring(0, 1200)}

CLASSIFY the reply as exactly one of:
- "interested": clear positive interest, wants to continue the conversation
- "not_interested": clear rejection, unsubscribe request, or disinterest
- "simple_question": asks a specific, directly answerable question (pricing, features, availability, how it works)
- "needs_human": negotiation, complex objection, ambiguous intent, or emotional tone

Write a DRAFT REPLY in ${langName} (3-5 sentences, professional, natural tone):
- "interested" → confirm enthusiasm, propose a specific next step (call or short demo)
- "not_interested" → thank gracefully, no hard sell, leave door open
- "simple_question" → answer directly using only info provided (invent nothing)
- "needs_human" → provide a thoughtful starting point; human will review before sending

ANALYSIS: 1-2 sentences explaining the classification and what the draft does.`;

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
      max_tokens: 800,
    });

    const content = completion.choices[0].message.content || "";
    const parsed = extractJson<{ sentiment?: string; analysis?: string; draftResponse?: string }>(content);

    const validSentiments: ReplySentiment[] = ["interested", "not_interested", "simple_question", "needs_human"];
    const sentiment = validSentiments.includes(parsed?.sentiment as ReplySentiment)
      ? (parsed!.sentiment as ReplySentiment)
      : "needs_human";

    return {
      sentiment,
      analysis: parsed?.analysis || "Analyse non disponible.",
      draftResponse: parsed?.draftResponse || "",
    };
  } catch (err) {
    console.error("[groq] analyzeEmailReply error:", err);
    return {
      sentiment: "needs_human",
      analysis: "Analyse IA indisponible — vérifiez manuellement.",
      draftResponse: "",
    };
  }
}
