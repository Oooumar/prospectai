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

// ── City → /commander URL ───────────────────────────────────────────────────

const COMMANDER_BASE = "https://prospectai.company/commander";

type CommanderZone = "africa-fr" | "africa-en" | "europe" | "amerique";

interface CityCommanderInfo { zone: CommanderZone; lang?: EmailLanguage }

const CITY_COMMANDER: Record<string, CityCommanderInfo> = {
  // ── Africa FR (Côte d'Ivoire)
  abidjan: { zone: "africa-fr" }, yamoussoukro: { zone: "africa-fr" },
  // ── Africa FR (Burkina Faso)
  ouagadougou: { zone: "africa-fr" }, "bobo-dioulasso": { zone: "africa-fr" },
  // ── Africa FR (Sénégal)
  dakar: { zone: "africa-fr" }, thiès: { zone: "africa-fr" }, thies: { zone: "africa-fr" },
  "saint-louis": { zone: "africa-fr" },
  // ── Africa FR (Mali)
  bamako: { zone: "africa-fr" }, sikasso: { zone: "africa-fr" },
  // ── Africa FR (autres)
  cotonou: { zone: "africa-fr" }, "porto-novo": { zone: "africa-fr" },
  lomé: { zone: "africa-fr" }, lome: { zone: "africa-fr" },
  niamey: { zone: "africa-fr" },
  yaoundé: { zone: "africa-fr" }, yaounde: { zone: "africa-fr" }, douala: { zone: "africa-fr" },
  conakry: { zone: "africa-fr" }, antananarivo: { zone: "africa-fr" },
  brazzaville: { zone: "africa-fr" }, kinshasa: { zone: "africa-fr" }, lubumbashi: { zone: "africa-fr" },
  libreville: { zone: "africa-fr" }, nouakchott: { zone: "africa-fr" },
  bujumbura: { zone: "africa-fr" }, bangui: { zone: "africa-fr" },
  ndjamena: { zone: "africa-fr" }, "n'djamena": { zone: "africa-fr" },
  // ── Africa EN
  lagos: { zone: "africa-en" }, abuja: { zone: "africa-en" },
  kano: { zone: "africa-en" }, ibadan: { zone: "africa-en" },
  accra: { zone: "africa-en" }, kumasi: { zone: "africa-en" },
  nairobi: { zone: "africa-en" },
  johannesburg: { zone: "africa-en" }, "cape town": { zone: "africa-en" }, durban: { zone: "africa-en" },
  "dar es salaam": { zone: "africa-en" }, kampala: { zone: "africa-en" },
  kigali: { zone: "africa-en" }, harare: { zone: "africa-en" },
  "addis ababa": { zone: "africa-en" },
  freetown: { zone: "africa-en" }, monrovia: { zone: "africa-en" },
  // ── Europe FR (France + Belgique FR + Suisse FR)
  paris: { zone: "europe", lang: "fr" }, lyon: { zone: "europe", lang: "fr" },
  marseille: { zone: "europe", lang: "fr" }, toulouse: { zone: "europe", lang: "fr" },
  nice: { zone: "europe", lang: "fr" }, nantes: { zone: "europe", lang: "fr" },
  montpellier: { zone: "europe", lang: "fr" }, strasbourg: { zone: "europe", lang: "fr" },
  bordeaux: { zone: "europe", lang: "fr" }, lille: { zone: "europe", lang: "fr" },
  rennes: { zone: "europe", lang: "fr" }, grenoble: { zone: "europe", lang: "fr" },
  dijon: { zone: "europe", lang: "fr" }, reims: { zone: "europe", lang: "fr" },
  bruxelles: { zone: "europe", lang: "fr" },
  genève: { zone: "europe", lang: "fr" }, geneve: { zone: "europe", lang: "fr" },
  lausanne: { zone: "europe", lang: "fr" },
  // ── Europe DE (Allemagne + Autriche + Suisse DE)
  berlin: { zone: "europe", lang: "de" }, munich: { zone: "europe", lang: "de" },
  münchen: { zone: "europe", lang: "de" }, hamburg: { zone: "europe", lang: "de" },
  cologne: { zone: "europe", lang: "de" }, köln: { zone: "europe", lang: "de" },
  frankfurt: { zone: "europe", lang: "de" }, stuttgart: { zone: "europe", lang: "de" },
  düsseldorf: { zone: "europe", lang: "de" }, dortmund: { zone: "europe", lang: "de" },
  essen: { zone: "europe", lang: "de" }, leipzig: { zone: "europe", lang: "de" },
  bremen: { zone: "europe", lang: "de" }, dresden: { zone: "europe", lang: "de" },
  hannover: { zone: "europe", lang: "de" }, nuremberg: { zone: "europe", lang: "de" },
  nürnberg: { zone: "europe", lang: "de" }, aachen: { zone: "europe", lang: "de" },
  vienna: { zone: "europe", lang: "de" }, wien: { zone: "europe", lang: "de" },
  graz: { zone: "europe", lang: "de" }, salzburg: { zone: "europe", lang: "de" },
  innsbruck: { zone: "europe", lang: "de" },
  zurich: { zone: "europe", lang: "de" }, zürich: { zone: "europe", lang: "de" },
  bern: { zone: "europe", lang: "de" }, basel: { zone: "europe", lang: "de" },
  // ── Europe IT
  rome: { zone: "europe", lang: "it" }, roma: { zone: "europe", lang: "it" },
  milan: { zone: "europe", lang: "it" }, milano: { zone: "europe", lang: "it" },
  naples: { zone: "europe", lang: "it" }, napoli: { zone: "europe", lang: "it" },
  turin: { zone: "europe", lang: "it" }, torino: { zone: "europe", lang: "it" },
  bologna: { zone: "europe", lang: "it" },
  florence: { zone: "europe", lang: "it" }, firenze: { zone: "europe", lang: "it" },
  venice: { zone: "europe", lang: "it" }, venezia: { zone: "europe", lang: "it" },
  genoa: { zone: "europe", lang: "it" }, genova: { zone: "europe", lang: "it" },
  // ── Europe ES
  madrid: { zone: "europe", lang: "es" }, barcelona: { zone: "europe", lang: "es" },
  valencia: { zone: "europe", lang: "es" }, seville: { zone: "europe", lang: "es" },
  sevilla: { zone: "europe", lang: "es" }, zaragoza: { zone: "europe", lang: "es" },
  bilbao: { zone: "europe", lang: "es" }, málaga: { zone: "europe", lang: "es" },
  malaga: { zone: "europe", lang: "es" }, granada: { zone: "europe", lang: "es" },
  // ── Europe EN (UK)
  london: { zone: "europe", lang: "en" }, manchester: { zone: "europe", lang: "en" },
  birmingham: { zone: "europe", lang: "en" }, glasgow: { zone: "europe", lang: "en" },
  edinburgh: { zone: "europe", lang: "en" }, liverpool: { zone: "europe", lang: "en" },
  leeds: { zone: "europe", lang: "en" }, bristol: { zone: "europe", lang: "en" },
  cardiff: { zone: "europe", lang: "en" }, sheffield: { zone: "europe", lang: "en" },
  // ── Europe multilingue (pas de lang override)
  amsterdam: { zone: "europe" }, brussels: { zone: "europe" },
  // ── Amérique (USA / Canada / Océanie / Golfe / Asie SE)
  "new york": { zone: "amerique" }, "los angeles": { zone: "amerique" },
  chicago: { zone: "amerique" }, houston: { zone: "amerique" },
  phoenix: { zone: "amerique" }, dallas: { zone: "amerique" },
  "san antonio": { zone: "amerique" }, "san diego": { zone: "amerique" },
  "san francisco": { zone: "amerique" }, miami: { zone: "amerique" },
  philadelphia: { zone: "amerique" }, seattle: { zone: "amerique" },
  toronto: { zone: "amerique" }, vancouver: { zone: "amerique" },
  montreal: { zone: "amerique" }, montréal: { zone: "amerique" },
  calgary: { zone: "amerique" }, ottawa: { zone: "amerique" },
  sydney: { zone: "amerique" }, melbourne: { zone: "amerique" },
  dubai: { zone: "amerique" }, singapore: { zone: "amerique" },
};

export function getCommanderUrl(city: string): string {
  const key = city.toLowerCase().trim();
  const info = CITY_COMMANDER[key];
  if (!info) return `${COMMANDER_BASE}?zone=africa-fr`;
  let url = `${COMMANDER_BASE}?zone=${info.zone}`;
  if (info.lang) url += `&lang=${info.lang}`;
  return url;
}

function getLangName(lang: EmailLanguage): string {
  return { fr: "French", en: "English", de: "German", it: "Italian", es: "Spanish" }[lang];
}

// Slogan and trust arguments — language-specific strings injected into prompts
const DUO_SLOGANS: Record<EmailLanguage, string> = {
  fr: "Un site, c'est bien. Des clients, c'est mieux.",
  en: "A website is great. Clients are better.",
  de: "Eine Website ist gut. Kunden sind besser.",
  it: "Un sito è ottimo. I clienti sono meglio.",
  es: "Un sitio web está bien. Los clientes son mejor.",
};

const DUO_TRUST: Record<EmailLanguage, string> = {
  fr: "aperçu gratuit avant tout paiement, seulement 30 % pour démarrer",
  en: "free preview before any payment, only 30% deposit to start",
  de: "kostenlose Vorschau vor jeder Zahlung, nur 30 % Anzahlung zum Starten",
  it: "anteprima gratuita prima di qualsiasi pagamento, solo il 30% per iniziare",
  es: "vista previa gratuita antes de cualquier pago, solo el 30% para empezar",
};

// Slogans & CTA for prospects who ALREADY have a website (ProspectAI-only pitch)
const PROSPECTAI_SLOGANS: Record<EmailLanguage, string> = {
  fr: "Un site, c'est bien. Des clients qui le trouvent, c'est mieux.",
  en: "A website is great. Clients who find it are better.",
  de: "Eine Website ist gut. Kunden, die sie finden, sind besser.",
  it: "Un sito è ottimo. I clienti che lo trovano sono meglio.",
  es: "Un sitio web está bien. Los clientes que lo encuentran son mejor.",
};

const TRIAL_URL = "https://prospectai.company/demo";

const TRIAL_CTA: Record<EmailLanguage, string> = {
  fr: "Essai gratuit 14 jours (sans carte bancaire)",
  en: "14-day free trial (no credit card required)",
  de: "14 Tage kostenlos testen (ohne Kreditkarte)",
  it: "14 giorni di prova gratuita (senza carta di credito)",
  es: "14 días de prueba gratuita (sin tarjeta de crédito)",
};

const NO_HALLUCINATION_RULE = `STRICT RULE — never invent contact details: do NOT include any phone number, physical address, postal code, social media handle, or URL that was not explicitly given to you. Do NOT sign with a personal name. Do NOT add any closing or sign-off ("Cordialement", "Best regards", etc.) — the closing will be added automatically.
STRICT RULE — NEVER propose a phone call, video call, or any kind of voice/video meeting. No "15-minute call", no "quick chat on the phone", no "discovery call". The only allowed contact methods are: email reply, or WhatsApp message if a WhatsApp link is provided.`;

function getSystemPrompt(profileType: ProfileType, targetLanguage: EmailLanguage, hasWebsite = false): string {
  const langInstruction = `IMPORTANT: Write the email in ${getLangName(targetLanguage)}. The entire email body and subject must be in ${getLangName(targetLanguage)}.`;

  if (profileType === "creator") {
    return `You are an expert in brand partnerships and influencer marketing. You write prospecting emails for content creators looking for brand collaborations.
The email must be:
- Personalized with the brand/company name
- Focused on partnership, collaboration or sponsorship
- Highlighting the creator's value (audience, engagement, niche)
- Start with: "Bonjour [brand/company name]," (or language equivalent)
- 3-4 sentences maximum after the salutation, direct and concise
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
- Offer a free audit or consultation (via email or WhatsApp, never a phone call)
- Start with: "Bonjour [prospect name]," (or language equivalent)
- 3-4 sentences maximum after the salutation, direct and concise
- Professional and results-oriented tone
${NO_HALLUCINATION_RULE}
${langInstruction}
Reply ONLY with valid JSON: {"subject": "...", "body": "..."}`;
  }

  if (hasWebsite) {
    return `You are a B2B copywriter specializing in automated client acquisition. You write short, persuasive prospecting emails selling ProspectAI — a tool that finds and contacts potential clients automatically.

THE OFFER:
ProspectAI — automate client acquisition: AI-personalized cold emails + WhatsApp campaigns. ${TRIAL_CTA[targetLanguage]}.

USE this exact slogan once in the email: "${PROSPECTAI_SLOGANS[targetLanguage]}"

EMAIL RULES:
- Start with: "Bonjour [prospect name]," (or language equivalent)
- Open by acknowledging the prospect already has a website — that's a positive signal
- Transition to the real question: do enough new clients actually find them every month?
- Present ProspectAI as the answer: automatic outreach to targeted prospects
- NEVER suggest they need a website — they already have one
- NEVER mention /commander — the only CTA is the free trial signup
- 3-4 sentences maximum after the salutation, no bullet points in the body
- Professional, warm, and confident tone
${NO_HALLUCINATION_RULE}
${langInstruction}
Reply ONLY with valid JSON: {"subject": "...", "body": "..."}`;
  }

  return `You are a B2B copywriter specializing in digital services. You write short, persuasive prospecting emails selling a DUO offer: website creation + automated client acquisition.

THE DUO OFFER:
1. Website (showcase / e-commerce / web app) — ${DUO_TRUST[targetLanguage]}
2. ProspectAI — automate client acquisition: AI-personalized cold emails + WhatsApp campaigns

USE this exact slogan once in the email: "${DUO_SLOGANS[targetLanguage]}"

EMAIL RULES:
- Start with: "Bonjour [prospect name]," (or language equivalent)
- Open with a hook: the prospect's business has no website — potential clients find competitors instead
- Present BOTH services as one natural package ("Site + ProspectAI")
- Include the two trust arguments (free preview + 30% to start)
- NEVER mention any specific city name or any price
- 3-4 sentences maximum after the salutation, no bullet points in the body
- Professional, warm, and reassuring tone
${NO_HALLUCINATION_RULE}
${langInstruction}
Reply ONLY with valid JSON: {"subject": "...", "body": "..."}`;
}

function formatWhatsAppUrl(number: string): string {
  return `https://wa.me/${number.replace(/[^0-9]/g, "")}`;
}

function getUserPrompt(
  prospect: { name: string; company?: string; niche: string; city: string },
  profileType: ProfileType,
  sender?: { companyName?: string; website?: string; productDescription?: string; whatsappNumber?: string },
  lang?: EmailLanguage,
  commanderUrl?: string,
  hasWebsite = false
): string {
  const senderName = sender?.companyName ?? "our solution";
  const prospectId = `${prospect.name}${prospect.company ? ` (${prospect.company})` : ""}`;
  const langName = lang ? getLangName(lang) : null;
  const langSuffix = langName ? `\n\nOUTPUT LANGUAGE: ${langName}. Write the subject AND body ONLY in ${langName}, regardless of the language used above.` : "";
  const waUrl = sender?.whatsappNumber ? formatWhatsAppUrl(sender.whatsappNumber) : null;

  // commander URL is the primary CTA (order page); WA/email are secondary contact methods
  const orderCta = commanderUrl
    ? `Include this order link in the email body with localized anchor text (e.g. "Commander maintenant" / "Order now" / "Jetzt bestellen" / "Ordina ora" / "Pedir ahora"): ${commanderUrl}`
    : null;
  const ctaInstruction = orderCta
    ? (waUrl
        ? `${orderCta}. Also offer WhatsApp as secondary contact (never a phone call): ${waUrl}.`
        : `${orderCta}. Also invite the prospect to reply by email.`)
    : (waUrl
        ? `Propose to WRITE a WhatsApp message (never a phone call) with this exact link: ${waUrl} — and also offer email reply as an alternative.`
        : `Propose to reply by email only. NEVER suggest a phone call, video call, or meeting.`);

  if (profileType === "creator") {
    const identity = sender?.productDescription
      ? `I represent ${senderName}: ${sender.productDescription}`
      : sender?.companyName
        ? `I represent ${senderName}`
        : `I am a content creator specialized in the ${prospect.niche} sector`;
    return `Write a short partnership prospecting email.

SENDER: ${identity}
RECIPIENT: ${prospectId} — ${prospect.niche} sector

EMAIL STRUCTURE (4 sentences max, no bullet points in the email):
1. Salutation: "Bonjour [brand/company name]," (or language equivalent)
2. One-sentence intro connecting my work to the ${prospect.niche} space
3. One sentence proposing a specific collaboration (sponsored content, ambassador, or affiliate)
4. ${ctaInstruction}
IMPORTANT: Do not mention any city name. Do NOT add any closing line.${langSuffix}`;
  }

  if (profileType === "agency") {
    const whatWeDo = sender?.productDescription
      ? sender.productDescription
      : `${senderName} helps ${prospect.niche} businesses generate more leads and grow revenue`;
    return `Write a short B2B prospecting email from an agency.

SENDER AGENCY: ${senderName}
WHAT WE DO: ${whatWeDo}
RECIPIENT: ${prospectId} — ${prospect.niche} sector

EMAIL STRUCTURE (4-5 sentences max, no bullet points in the email):
1. Salutation: "Bonjour [prospect name]," (or language equivalent)
2. Open with a specific growth challenge facing ${prospect.niche} businesses
3. Introduce ${senderName} and state ONE concrete result it delivers for ${prospect.niche}
4. Offer a free audit or consultation
5. ${ctaInstruction}
IMPORTANT: Do not mention any city name. Do NOT add any closing line.${langSuffix}`;
  }

  // b2b — branch on whether the prospect already has a website
  const l = lang ?? "fr";
  const businessName = prospect.company ?? prospect.name;

  if (hasWebsite) {
    const trialCta = `Include the free trial link with localized anchor text ("${TRIAL_CTA[l]}"): ${TRIAL_URL}`;
    const trialCtaFull = waUrl
      ? `${trialCta}. Also offer WhatsApp as a secondary contact option (never a phone call): ${waUrl}.`
      : `${trialCta}. Also invite the prospect to reply by email.`;
    return `Write a B2B prospecting email pitching ProspectAI for automated client acquisition.

SENDER: ${senderName}
RECIPIENT: ${prospectId} — ${prospect.niche} sector (they already have a website)

EMAIL STRUCTURE (3-4 sentences, no bullet points, NO city, NO price):
1. Salutation: "Bonjour [prospect name]," (or language equivalent)
2. Hook: acknowledge that ${businessName} already has a website — that's a positive sign
3. Transition: but do enough new clients find them every month? Most businesses lose clients to competitors not because of their product, but because of lack of visibility
4. Present ProspectAI: find and contact targeted prospects automatically — AI-personalized emails + WhatsApp campaigns
5. Include this exact slogan once: "${PROSPECTAI_SLOGANS[l]}"
6. ${trialCtaFull}
IMPORTANT: Do not mention any city name. Do not mention any price. Do NOT suggest they need a website — they already have one. Do NOT add any closing line.${langSuffix}`;
  }

  return `Write a B2B prospecting email pitching the Site + ProspectAI duo.

SENDER: ${senderName}
RECIPIENT: ${prospectId} — ${prospect.niche} sector

EMAIL STRUCTURE (3-4 sentences, no bullet points, NO city, NO price):
1. Salutation: "Bonjour [prospect name]," (or language equivalent)
2. Hook: ${businessName} (${prospect.niche}) does not appear to have a website — potential clients find competitors instead
3. Present the duo: we create their website (${DUO_TRUST[l]}) AND automate their client acquisition with ProspectAI (AI emails + WhatsApp campaigns)
4. Include this exact slogan once: "${DUO_SLOGANS[l]}"
5. ${ctaInstruction}
IMPORTANT: Do not mention any city name. Do not mention any price. Do NOT add any closing line.${langSuffix}`;
}

function generateFallbackEmailInner(
  prospect: { name: string; niche: string; city: string },
  profileType: ProfileType,
  lang: EmailLanguage,
  hasWebsite = false
): { subject: string; body: string } {
  // ── Prospect already has a website → pitch ProspectAI only ────────────────
  if (hasWebsite && profileType === "b2b") {
    const subjects: Record<EmailLanguage, string> = {
      fr: `${prospect.name} a un site — mais assez de clients le trouvent-ils ?`,
      en: `${prospect.name} has a website — but do enough clients find it?`,
      de: `${prospect.name} hat eine Website — finden genug Kunden sie?`,
      it: `${prospect.name} ha un sito — ma abbastanza clienti lo trovano?`,
      es: `${prospect.name} tiene un sitio — ¿suficientes clientes lo encuentran?`,
    };
    const bodies: Record<EmailLanguage, string> = {
      fr: `Bonjour ${prospect.name},\n\nJ'ai vu que ${prospect.name} dispose déjà d'un site web — c'est un bon signe. Mais est-ce que suffisamment de nouveaux clients le trouvent chaque mois ?\n\nProspectAI automatise votre prospection : l'outil identifie vos clients cibles et les contacte automatiquement par email personnalisé IA et campagnes WhatsApp.\n\nUn site, c'est bien. Des clients qui le trouvent, c'est mieux.\n\n${TRIAL_CTA.fr} : ${TRIAL_URL}`,
      en: `Hello ${prospect.name},\n\nI noticed that ${prospect.name} already has a website — that's a good sign. But do enough new clients actually find it every month?\n\nProspectAI automates your outreach: it identifies your target clients and contacts them automatically with AI-personalized emails and WhatsApp campaigns.\n\nA website is great. Clients who find it are better.\n\n${TRIAL_CTA.en}: ${TRIAL_URL}`,
      de: `Guten Tag ${prospect.name},\n\nIch habe gesehen, dass ${prospect.name} bereits eine Website hat — das ist ein gutes Zeichen. Aber finden genug neue Kunden sie jeden Monat?\n\nProspectAI automatisiert Ihre Kundengewinnung: Das Tool findet Zielkunden und kontaktiert sie automatisch per KI-E-Mail und WhatsApp-Kampagnen.\n\nEine Website ist gut. Kunden, die sie finden, sind besser.\n\n${TRIAL_CTA.de}: ${TRIAL_URL}`,
      it: `Buongiorno ${prospect.name},\n\nHo visto che ${prospect.name} ha già un sito web — è un buon segno. Ma abbastanza nuovi clienti lo trovano ogni mese?\n\nProspectAI automatizza la sua prospezione: il tool identifica i clienti target e li contatta automaticamente con email IA personalizzate e campagne WhatsApp.\n\nUn sito è ottimo. I clienti che lo trovano sono meglio.\n\n${TRIAL_CTA.it}: ${TRIAL_URL}`,
      es: `Buenos días ${prospect.name},\n\nHe visto que ${prospect.name} ya tiene un sitio web — es una buena señal. Pero ¿suficientes nuevos clientes lo encuentran cada mes?\n\nProspectAI automatiza su prospección: la herramienta identifica sus clientes objetivo y los contacta automáticamente con emails IA personalizados y campañas de WhatsApp.\n\nUn sitio web está bien. Los clientes que lo encuentran son mejor.\n\n${TRIAL_CTA.es}: ${TRIAL_URL}`,
    };
    return { subject: subjects[lang], body: bodies[lang] };
  }

  // ── No website → keep existing DUO pitch ─────────────────────────────────
  if (lang === "de") {
    return {
      subject: `Ihre Website + Ihre ersten Kunden — ${prospect.name}`,
      body: `Guten Tag ${prospect.name},\n\nIch habe festgestellt, dass ${prospect.name} (${prospect.niche}) noch keine Website zu haben scheint — Ihre potenziellen Kunden finden stattdessen Ihre Mitbewerber.\n\nIch biete das Duo Website + ProspectAI an: Ich erstelle Ihre Website (kostenlose Vorschau, nur 30 % Anzahlung zum Starten) UND automatisiere Ihre Kundengewinnung mit KI-personalisierten E-Mails und WhatsApp-Kampagnen.\n\nEine Website ist gut. Kunden sind besser.`,
    };
  }
  if (lang === "it") {
    return {
      subject: `Il suo sito web + i suoi primi clienti — ${prospect.name}`,
      body: `Buongiorno ${prospect.name},\n\nHo notato che ${prospect.name} (${prospect.niche}) non sembra avere ancora un sito web — i suoi potenziali clienti trovano i suoi concorrenti al suo posto.\n\nPropongo il duo Sito + ProspectAI: creo il suo sito (anteprima gratuita, solo il 30% per iniziare) E automatizzo la sua prospezione con email personalizzate dall'IA e campagne WhatsApp.\n\nUn sito è ottimo. I clienti sono meglio.`,
    };
  }
  if (lang === "es") {
    return {
      subject: `Su sitio web + sus primeros clientes — ${prospect.name}`,
      body: `Buenos días ${prospect.name},\n\nHe observado que ${prospect.name} (${prospect.niche}) no parece tener todavía un sitio web — sus clientes potenciales encuentran a sus competidores en su lugar.\n\nPropongo el dúo Sitio + ProspectAI: creo su sitio web (vista previa gratuita, solo el 30% para empezar) Y automatizzo su prospección con emails IA y campañas de WhatsApp.\n\nUn sitio web está bien. Los clientes son mejor.`,
    };
  }
  if (lang === "en") {
    return {
      subject: `Your website + your first clients — ${prospect.name}`,
      body: `Hello ${prospect.name},\n\nI noticed ${prospect.name} (${prospect.niche}) doesn't appear to have a website — your potential clients find your competitors instead.\n\nI offer the Site + ProspectAI duo: I build your website (free preview, only 30% to start) AND automate your client acquisition with AI-personalized emails and WhatsApp campaigns.\n\nA website is great. Clients are better.`,
    };
  }
  if (profileType === "creator") {
    return {
      subject: `Proposition de partenariat — ${prospect.name}`,
      body: `Bonjour ${prospect.name},\n\nJe suis créateur de contenu spécialisé dans le secteur ${prospect.niche.toLowerCase()} et je suis particulièrement intéressé par vos produits/services.\n\nSeriez-vous ouvert(e) à discuter d'une possible collaboration ? Répondez simplement à cet email.`,
    };
  }
  if (profileType === "agency") {
    return {
      subject: `Boostez votre acquisition client — ${prospect.name}`,
      body: `Bonjour ${prospect.name},\n\nNotre agence accompagne des entreprises du secteur ${prospect.niche.toLowerCase()} pour multiplier leurs leads.\n\nRépondez à cet email pour bénéficier d'un audit gratuit.`,
    };
  }
  return {
    subject: `Votre site web + vos premiers clients — ${prospect.name}`,
    body: `Bonjour ${prospect.name},\n\nJ'ai remarqué que ${prospect.name} (${prospect.niche}) n'a pas encore de site web — vos clients potentiels trouvent vos concurrents à votre place.\n\nJe propose le duo Site + ProspectAI : je crée votre site (aperçu gratuit, seulement 30 % pour démarrer) ET j'automatise votre prospection — emails personnalisés par IA et campagnes WhatsApp.\n\nUn site, c'est bien. Des clients, c'est mieux.`,
  };
}

// Wrapper — appends the commander order link to fallback email bodies (no-website case only)
function generateFallbackEmail(
  prospect: { name: string; niche: string; city: string },
  profileType: ProfileType,
  lang: EmailLanguage,
  commanderUrl?: string,
  hasWebsite = false
): { subject: string; body: string } {
  const result = generateFallbackEmailInner(prospect, profileType, lang, hasWebsite);
  // "has website" fallback already includes the trial link — don't append /commander
  if (hasWebsite || !commanderUrl) return result;
  const CTA: Record<EmailLanguage, string> = {
    fr: `Commander maintenant : ${commanderUrl}`,
    en: `Order now: ${commanderUrl}`,
    de: `Jetzt bestellen: ${commanderUrl}`,
    it: `Ordina ora: ${commanderUrl}`,
    es: `Pedir ahora: ${commanderUrl}`,
  };
  return { ...result, body: result.body + `\n\n${CTA[lang]}` };
}

const CLOSING: Record<EmailLanguage, string> = {
  fr: "Cordialement",
  en: "Best regards",
  de: "Mit freundlichen Grüßen",
  it: "Cordiali saluti",
  es: "Atentamente",
};

function buildSignatureLine(
  lang: EmailLanguage,
  companyName?: string
): string {
  const closing = CLOSING[lang];
  if (!companyName) return `\n\n${closing}`;
  return `\n\n${closing},\n${companyName}`;
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
  prospect: { name: string; company?: string; niche: string; city: string; website?: string; email?: string },
  profileType: ProfileType = "b2b",
  targetLanguage?: EmailLanguage,
  sender?: { companyName?: string; website?: string; productDescription?: string; whatsappNumber?: string }
): Promise<{ subject: string; body: string; fallback?: boolean }> {
  const lang = targetLanguage ?? detectEmailLanguage(prospect.city);
  // A prospect has a website if the field is set OR if they have an email (scraped from their site)
  const hasWebsite = profileType === "b2b" && !!(prospect.website);
  const commanderUrl = hasWebsite ? undefined : getCommanderUrl(prospect.city);
  const signatureLine = buildSignatureLine(lang, sender?.companyName);

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: getSystemPrompt(profileType, lang, hasWebsite) },
        { role: "user", content: getUserPrompt(prospect, profileType, sender, lang, commanderUrl, hasWebsite) },
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
    const fallback = generateFallbackEmail(prospect, profileType, lang, commanderUrl, hasWebsite);
    return { ...fallback, body: fallback.body + signatureLine, fallback: true };
  } catch (err: any) {
    const status = err?.status || err?.statusCode;
    const code = err?.error?.code || err?.code || "";
    console.error("[groq] API error:", { status, code, message: err?.message });
    if (status === 429 || code === "rate_limit_exceeded" || code === "model_decommissioned") {
      const fallback = generateFallbackEmail(prospect, profileType, lang, commanderUrl, hasWebsite);
      return { ...fallback, body: fallback.body + signatureLine, fallback: true };
    }
    throw err;
  }
}

export async function generateWhatsAppMessage(
  prospect: { name: string; niche: string; city: string; website?: string; email?: string },
  sender: { companyName?: string; productDescription?: string; website?: string; whatsappNumber?: string },
  promo?: string
): Promise<{ message: string; fallback?: boolean }> {
  const lang = detectEmailLanguage(prospect.city);
  const hasWebsite = !!(prospect.website);
  const langName = getLangName(lang);
  const name = prospect.name;

  console.log("[generateWhatsAppMessage] sender:", JSON.stringify({ companyName: sender.companyName, website: sender.website, whatsappNumber: sender.whatsappNumber }), "| prospect.city:", prospect.city, "| lang:", lang);

  const greeting: Record<EmailLanguage, string> = {
    fr: `Bonjour ${name} 👋`,
    en: `Hello ${name} 👋`,
    de: `Hallo ${name} 👋`,
    it: `Buongiorno ${name} 👋`,
    es: `Hola ${name} 👋`,
  };

  const closingQ: Record<EmailLanguage, string> = {
    fr: "Ça vous intéresse ? 😊",
    en: "Interested? 😊",
    de: "Interessiert? 😊",
    it: "Le interessa? 😊",
    es: "¿Le interesa? 😊",
  };

  // ── System prompt — strict 4-line format, no link ─────────────────
  const systemPrompt = hasWebsite
    ? `You write ultra-short WhatsApp cold messages. Exactly 4 lines. Tone: warm, human, direct — NOT an email.

EXACT FORMAT:
Line 1: "${greeting[lang]}"
Line 2: Note that they already have a website — but do enough new clients find them every month?
Line 3: ProspectAI automates their outreach: AI-personalized emails + WhatsApp campaigns, no effort needed.
Line 4: "${closingQ[lang]}"

ABSOLUTE RULES — no exceptions:
- NO link, NO URL anywhere in the message
- NO "Essai gratuit", NO "14 jours", NO slogan, NO price, NO city name
- NO closing line ("Cordialement", "Best regards", etc.)
- Adapt lines 2–3 naturally to the prospect's sector
- Write entirely in ${langName}
- Reply with ONLY the 4 lines, nothing else`
    : `You write ultra-short WhatsApp cold messages. Exactly 4 lines. Tone: warm, human, direct — NOT an email.

EXACT FORMAT:
Line 1: "${greeting[lang]}"
Line 2: Observation that their ${prospect.niche} business has no website yet — potential clients find competitors instead.
Line 3: Offer: I create their website with a FREE preview before any payment, only 30% to start.
Line 4: "${closingQ[lang]}"

ABSOLUTE RULES — no exceptions:
- NO link, NO URL anywhere in the message
- NO "Commander ici", NO "Obtenez un site", NO slogan, NO price, NO city name
- NO closing line ("Cordialement", "Best regards", etc.)
- Adapt line 2 naturally to the actual sector (${prospect.niche})
- Write entirely in ${langName}
- Reply with ONLY the 4 lines, nothing else`;

  const userPrompt = promo
    ? `PROSPECT: ${name} — ${prospect.niche}\nPROMO CONTEXT: ${promo}\nLANGUAGE: ${langName}`
    : `PROSPECT: ${name} — ${prospect.niche}\nLANGUAGE: ${langName}`;

  // ── Fallbacks — exact 4-line format, no link ──────────────────────
  const fallbackMessages: Record<EmailLanguage, string> = hasWebsite
    ? {
        fr: `Bonjour ${name} 👋\nJ'ai remarqué que ${name} a déjà un site web — très bien. Mais est-ce que suffisamment de clients vous trouvent chaque mois ?\nProspectAI automatise votre prospection : emails personnalisés par IA et WhatsApp pour trouver vos clients automatiquement.\nÇa vous intéresse ? 😊`,
        en: `Hello ${name} 👋\nI noticed ${name} already has a website — great. But do enough new clients actually find you every month?\nProspectAI automates your outreach: AI-personalized emails and WhatsApp campaigns to find clients automatically.\nInterested? 😊`,
        de: `Hallo ${name} 👋\nIch habe gesehen, dass ${name} bereits eine Website hat — sehr gut. Aber finden genug neue Kunden Sie jeden Monat?\nProspectAI automatisiert Ihre Kundengewinnung: KI-E-Mails und WhatsApp-Kampagnen — vollautomatisch.\nInteressiert? 😊`,
        it: `Buongiorno ${name} 👋\nHo visto che ${name} ha già un sito web — ottimo. Ma abbastanza nuovi clienti la trovano ogni mese?\nProspectAI automatizza la sua prospezione: email IA personalizzate e campagne WhatsApp per trovare clienti automaticamente.\nLe interessa? 😊`,
        es: `Hola ${name} 👋\nHe visto que ${name} ya tiene sitio web — muy bien. ¿Pero suficientes clientes le encuentran cada mes?\nProspectAI automatiza su prospección: emails IA personalizados y campañas WhatsApp para encontrar clientes automáticamente.\n¿Le interesa? 😊`,
      }
    : {
        fr: `Bonjour ${name} 👋\nJ'ai remarqué que votre activité de ${prospect.niche} n'a pas encore de site web — vos clients potentiels trouvent vos concurrents à votre place.\nJe crée votre site avec un aperçu GRATUIT avant tout paiement, seulement 30% pour démarrer.\nÇa vous intéresse ? 😊`,
        en: `Hello ${name} 👋\nI noticed your ${prospect.niche} business doesn't have a website yet — potential clients find your competitors instead.\nI build your website with a FREE preview before any payment, only 30% deposit to start.\nInterested? 😊`,
        de: `Hallo ${name} 👋\nIch habe bemerkt, dass Ihr ${prospect.niche}-Unternehmen noch keine Website hat — potenzielle Kunden finden stattdessen Ihre Mitbewerber.\nIch erstelle Ihre Website mit einer KOSTENLOSEN Vorschau vor jeder Zahlung, nur 30% Anzahlung zum Starten.\nInteressiert? 😊`,
        it: `Buongiorno ${name} 👋\nHo notato che la sua attività di ${prospect.niche} non ha ancora un sito web — i clienti potenziali trovano i suoi concorrenti.\nCreo il suo sito con un'anteprima GRATUITA prima di qualsiasi pagamento, solo il 30% per iniziare.\nLe interessa? 😊`,
        es: `Hola ${name} 👋\nHe notado que su negocio de ${prospect.niche} no tiene todavía sitio web — sus clientes potenciales encuentran a sus competidores.\nCreo su sitio con una vista previa GRATUITA antes de cualquier pago, solo el 30% para empezar.\n¿Le interesa? 😊`,
      };

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 150,
    });

    const message = (completion.choices[0].message.content || "").trim();
    if (message.length > 20) return { message };
    return { message: fallbackMessages[lang], fallback: true };
  } catch (err: any) {
    console.error("[groq] generateWhatsAppMessage error:", err);
    return { message: fallbackMessages[lang], fallback: true };
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
