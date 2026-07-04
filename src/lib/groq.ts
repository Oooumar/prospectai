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

const NO_HALLUCINATION_RULE = `STRICT RULE — never invent contact details: do NOT include any phone number, physical address, postal code, social media handle, or URL that was not explicitly given to you. Do NOT sign with a personal name. End the email with a generic closing only (e.g. "Cordialement", "Best regards", "Mit freundlichen Grüßen").
STRICT RULE — NEVER propose a phone call, video call, or any kind of voice/video meeting. No "15-minute call", no "quick chat on the phone", no "discovery call". The only allowed contact methods are: email reply, or WhatsApp message if a WhatsApp link is provided.`;

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
- Offer a free audit or consultation (via email or WhatsApp, never a phone call)
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

function formatWhatsAppUrl(number: string): string {
  return `https://wa.me/${number.replace(/[^0-9]/g, "")}`;
}

function getUserPrompt(
  prospect: { name: string; company?: string; niche: string; city: string },
  profileType: ProfileType,
  sender?: { companyName?: string; website?: string; productDescription?: string; whatsappNumber?: string },
  lang?: EmailLanguage,
  commanderUrl?: string
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
RECIPIENT: ${prospectId} — ${prospect.niche} sector, ${prospect.city}

EMAIL STRUCTURE (4 sentences max, no bullet points in the email):
1. One-sentence intro connecting my work to the ${prospect.niche} space
2. One sentence proposing a specific collaboration (sponsored content, ambassador, or affiliate)
3. ${ctaInstruction}${langSuffix}`;
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
3. Offer a free audit or consultation
4. ${ctaInstruction}${langSuffix}`;
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
3. ${ctaInstruction}${langSuffix}`;
}

function generateFallbackEmailInner(
  prospect: { name: string; niche: string; city: string },
  profileType: ProfileType,
  lang: EmailLanguage
): { subject: string; body: string } {
  if (lang === "de") {
    return {
      subject: `Zusammenarbeit mit ${prospect.name}`,
      body: `Guten Tag,\n\nIch bin auf Ihr Unternehmen im Bereich ${prospect.niche} in ${prospect.city} aufmerksam geworden.\n\nUnsere Lösung hilft Fachleuten wie Ihnen, ihr Marketing zu automatisieren und schnell mehr Kunden zu gewinnen.\n\nAntworten Sie einfach auf diese E-Mail, wenn Sie mehr erfahren möchten.\n\nMit freundlichen Grüßen`,
    };
  }
  if (lang === "it") {
    return {
      subject: `Proposta per ${prospect.name}`,
      body: `Buongiorno,\n\nHo scoperto la sua attività nel settore ${prospect.niche} a ${prospect.city}.\n\nLa nostra soluzione aiuta professionisti come lei ad automatizzare il marketing e ad attrarre più clienti rapidamente.\n\nRisponda pure a questa email se desidera saperne di più.\n\nCordiali saluti`,
    };
  }
  if (lang === "es") {
    return {
      subject: `Propuesta para ${prospect.name}`,
      body: `Buenos días,\n\nHe encontrado su negocio de ${prospect.niche} en ${prospect.city}.\n\nNuestra solución ayuda a profesionales como usted a automatizar su marketing y atraer más clientes rápidamente.\n\nResponda a este email si desea más información.\n\nAtentamente`,
    };
  }
  if (lang === "en") {
    return {
      subject: `Grow your ${prospect.niche} business in ${prospect.city}`,
      body: `Hello,\n\nI came across your ${prospect.niche} business in ${prospect.city} and wanted to reach out directly.\n\nOur solution helps professionals like you automate their marketing and attract more clients quickly.\n\nFeel free to reply to this email if you'd like to learn more.\n\nBest regards`,
    };
  }
  if (profileType === "creator") {
    return {
      subject: `Proposition de partenariat — ${prospect.name}`,
      body: `Bonjour,\n\nJe suis créateur de contenu spécialisé dans le secteur ${prospect.niche.toLowerCase()} et je suis particulièrement intéressé par vos produits/services.\n\nSeriez-vous ouvert(e) à discuter d'une possible collaboration ? Répondez simplement à cet email.\n\nCordialement`,
    };
  }
  if (profileType === "agency") {
    return {
      subject: `Boostez votre acquisition client — ${prospect.name}`,
      body: `Bonjour,\n\nNotre agence accompagne des entreprises du secteur ${prospect.niche.toLowerCase()} à ${prospect.city} pour multiplier leurs leads.\n\nRépondez à cet email pour bénéficier d'un audit gratuit.\n\nCordialement`,
    };
  }
  return {
    subject: `Développez votre activité de ${prospect.niche.toLowerCase()} à ${prospect.city}`,
    body: `Bonjour,\n\nJ'ai découvert votre activité de ${prospect.niche.toLowerCase()} à ${prospect.city} et je souhaitais vous contacter directement.\n\nRépondez simplement à cet email si vous souhaitez en savoir plus.\n\nBien cordialement`,
  };
}

// Wrapper — appends the commander order link to fallback email bodies
function generateFallbackEmail(
  prospect: { name: string; niche: string; city: string },
  profileType: ProfileType,
  lang: EmailLanguage,
  commanderUrl?: string
): { subject: string; body: string } {
  const result = generateFallbackEmailInner(prospect, profileType, lang);
  if (!commanderUrl) return result;
  const CTA: Record<EmailLanguage, string> = {
    fr: `Commander maintenant : ${commanderUrl}`,
    en: `Order now: ${commanderUrl}`,
    de: `Jetzt bestellen: ${commanderUrl}`,
    it: `Ordina ora: ${commanderUrl}`,
    es: `Pedir ahora: ${commanderUrl}`,
  };
  return { ...result, body: result.body + `\n\n${CTA[lang]}` };
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
  sender?: { companyName?: string; website?: string; productDescription?: string; whatsappNumber?: string }
): Promise<{ subject: string; body: string; fallback?: boolean }> {
  const lang = targetLanguage ?? detectEmailLanguage(prospect.city);
  const commanderUrl = getCommanderUrl(prospect.city);
  const signatureLine = buildSignatureLine(lang, sender?.companyName, sender?.website);

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: getSystemPrompt(profileType, lang) },
        { role: "user", content: getUserPrompt(prospect, profileType, sender, lang, commanderUrl) },
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
    const fallback = generateFallbackEmail(prospect, profileType, lang, commanderUrl);
    return { ...fallback, body: fallback.body + signatureLine, fallback: true };
  } catch (err: any) {
    const status = err?.status || err?.statusCode;
    const code = err?.error?.code || err?.code || "";
    console.error("[groq] API error:", { status, code, message: err?.message });
    if (status === 429 || code === "rate_limit_exceeded" || code === "model_decommissioned") {
      const fallback = generateFallbackEmail(prospect, profileType, lang, commanderUrl);
      return { ...fallback, body: fallback.body + signatureLine, fallback: true };
    }
    throw err;
  }
}

export async function generateWhatsAppMessage(
  prospect: { name: string; niche: string; city: string },
  sender: { companyName?: string; productDescription?: string; website?: string; whatsappNumber?: string },
  promo?: string
): Promise<{ message: string; fallback?: boolean }> {
  const lang = detectEmailLanguage(prospect.city);
  const commanderUrl = getCommanderUrl(prospect.city);
  const langName = getLangName(lang);
  const senderName = sender.companyName ?? "notre solution";
  const whatWeDo = sender.productDescription
    ? sender.productDescription
    : `${senderName} aide les entreprises à automatiser leur prospection commerciale`;
  const websiteLine = sender.website
    ? `SENDER WEBSITE (include this exact URL once in the message): ${sender.website}`
    : `NO WEBSITE — do not invent or include any URL.`;
  const waLine = sender.whatsappNumber
    ? `SENDER WHATSAPP (offer as contact option alongside direct reply): ${formatWhatsAppUrl(sender.whatsappNumber)}`
    : "";
  const commanderLine = `ORDER PAGE (include once as the main CTA with localized text — e.g. "Commander ici" / "Order here" / "Jetzt bestellen" / "Ordina qui" / "Pedir aquí"): ${commanderUrl}`;

  console.log("[generateWhatsAppMessage] sender:", JSON.stringify({ companyName: sender.companyName, website: sender.website, whatsappNumber: sender.whatsappNumber }), "| prospect.city:", prospect.city, "| lang:", lang);

  const NO_WA_HALLUCINATION = `STRICT RULE — never invent contact details, phone numbers, addresses, or URLs. Only use URLs/numbers explicitly given above. Do NOT include any formal closing ("Cordialement", "Best regards", etc.). End with an open question or direct CTA. This message is MANUALLY copy-pasted — ProspectAI never sends messages automatically.`;

  const TWO_CHANNELS_RULE = `MANDATORY — the message MUST explicitly mention BOTH of the product's channels:
1. AI-personalized emails (automated cold outreach by email)
2. Unlimited manual WhatsApp messages directly connected to the prospect's own personal WhatsApp
Both features must appear clearly. Use natural phrasing such as "emails personnalisés par IA ET messages WhatsApp illimités en manuel, directement connecté à votre WhatsApp" or equivalent in the output language.`;

  const REGISTER_RULE = `REGISTER — always professional and formal:
- French: start with "Bonjour" (NEVER "Salut", "Hello", "Hey"), use VOUS/votre throughout (NEVER tu/ton/toi)
- German: use "Hallo" or "Guten Tag", use SIE/Ihr throughout (never du)
- Italian: use "Buongiorno", use LEI/Suo throughout (never tu)
- Spanish: use "Buenos días" or "Hola", use USTED/su throughout (never tú)
- English: use "Hello" or "Hi", keep professional and impersonal`;

  const systemPrompt = promo
    ? `You are writing a SHORT WhatsApp promotional message for a B2B SaaS tool. It must be:
- Maximum 5 sentences total
- Professional but conversational tone — WhatsApp style, NOT an email
${REGISTER_RULE}
- Greet the prospect by their company/business name, briefly reference their business type
${TWO_CHANNELS_RULE}
- Make the promotional offer concrete and compelling
- Include the website URL once if provided
- If a sender WhatsApp number is provided, offer it as a contact option alongside direct reply
- End with a clear call-to-action question
- No formal closing signature
- Written entirely in ${langName}
${NO_WA_HALLUCINATION}
Reply with ONLY the message text, no JSON, no quotes, no explanation.`
    : `You are writing a SHORT WhatsApp prospecting message for a B2B SaaS tool. It must be:
- Maximum 5 sentences total
- Professional but conversational tone — WhatsApp style, NOT an email
${REGISTER_RULE}
- Greet the prospect by their business/company name
- Mention their niche and city to show personalization
${TWO_CHANNELS_RULE}
- Include the website URL once if provided
- If a sender WhatsApp number is provided, offer it as a contact option alongside direct reply
- End with one open-ended question ("Seriez-vous disponible pour en discuter ?" or equivalent)
- No formal closing signature
- Written entirely in ${langName}
${NO_WA_HALLUCINATION}
Reply with ONLY the message text, no JSON, no quotes, no explanation.`;

  const userPrompt = promo
    ? `Write a WhatsApp promotional message.

SENDER: ${senderName}
WHAT WE DO: ${whatWeDo}
PROMOTIONAL OFFER (main focus): ${promo}
BOTH CHANNELS TO MENTION: (1) AI-personalized emails, (2) unlimited manual WhatsApp connected to prospect's own WhatsApp
${commanderLine}
${websiteLine}
${waLine}
PROSPECT: ${prospect.name} — ${prospect.niche} in ${prospect.city}

OUTPUT LANGUAGE: ${langName}. Write ONLY in ${langName}.`
    : `Write a WhatsApp prospecting message.

SENDER: ${senderName}
WHAT WE DO: ${whatWeDo}
BOTH CHANNELS TO MENTION: (1) AI-personalized emails, (2) unlimited manual WhatsApp connected to prospect's own WhatsApp
${commanderLine}
${websiteLine}
${waLine}
PROSPECT: ${prospect.name} — ${prospect.niche} in ${prospect.city}

OUTPUT LANGUAGE: ${langName}. Write ONLY in ${langName}.`;

  const websiteSnippet = sender.website ? ` Découvrez-le sur ${sender.website}.` : "";
  const websiteSnippetEn = sender.website ? ` Learn more at ${sender.website}.` : "";
  const websiteSnippetDe = sender.website ? ` Mehr unter ${sender.website}.` : "";
  const websiteSnippetIt = sender.website ? ` Scopra di più su ${sender.website}.` : "";
  const websiteSnippetEs = sender.website ? ` Más info en ${sender.website}.` : "";

  const fallbackMessages: Record<EmailLanguage, string> = {
    fr: `Bonjour ${prospect.name}, j'ai découvert votre activité de ${prospect.niche} à ${prospect.city} et je souhaitais vous contacter. ${senderName} automatise votre prospection commerciale : emails personnalisés par IA ET messages WhatsApp illimités en manuel, directement connecté à votre WhatsApp.${websiteSnippet} Commander ici : ${commanderUrl} — Seriez-vous disponible pour en discuter ?`,
    en: `Hi ${prospect.name}, I came across your ${prospect.niche} business in ${prospect.city} and wanted to reach out. ${senderName} automates your prospecting: AI-personalized emails AND unlimited manual WhatsApp messages, directly connected to your personal WhatsApp.${websiteSnippetEn} Order here: ${commanderUrl} — Would you be open to a quick chat?`,
    de: `Hallo ${prospect.name}, ich habe Ihr ${prospect.niche}-Unternehmen in ${prospect.city} entdeckt und wollte mich melden. ${senderName} automatisiert Ihre Kundenakquise: KI-personalisierte E-Mails UND unbegrenzte manuelle WhatsApp-Nachrichten, direkt mit Ihrem persönlichen WhatsApp verbunden.${websiteSnippetDe} Jetzt bestellen: ${commanderUrl} — Wären Sie an einem kurzen Austausch interessiert?`,
    it: `Ciao ${prospect.name}, ho scoperto la sua attività di ${prospect.niche} a ${prospect.city} e volevo contattarla. ${senderName} automatizza la sua prospezione: email personalizzate dall'IA E messaggi WhatsApp illimitati in manuale, collegati al suo WhatsApp personale.${websiteSnippetIt} Ordina qui: ${commanderUrl} — Sarebbe disponibile per parlarne?`,
    es: `Hola ${prospect.name}, he visto su negocio de ${prospect.niche} en ${prospect.city} y quería contactarle. ${senderName} automatiza su prospección: emails personalizados por IA Y mensajes WhatsApp ilimitados en manual, conectados a su WhatsApp personal.${websiteSnippetEs} Pedir ahora: ${commanderUrl} — ¿Estaría disponible para hablarlo?`,
  };

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 300,
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
