const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

// Only accept emails whose local part starts with a professional keyword
const PROFESSIONAL_PREFIXES = [
  "contact", "contacts", "info", "infos", "information",
  "hello", "bonjour", "accueil", "bienvenue",
  "service", "services", "support", "aide",
  "admin", "administration", "secretariat",
  "commercial", "commerciale", "vente", "ventes", "devis",
  "direction", "directeur",
  "communication", "presse", "media",
  "reservation", "demande", "commande",
  "team", "equipe", "recrutement", "rh",
  "pro", "general", "web", "site", "agence",
];

function isProfessional(email: string): boolean {
  const local = email.split("@")[0].toLowerCase().replace(/[^a-z]/g, "");
  return PROFESSIONAL_PREFIXES.some((p) => local.startsWith(p));
}

function extractEmails(html: string): string[] {
  const raw = html.match(EMAIL_RE) ?? [];
  // deduplicate + lowercase
  return [...new Set(raw.map((e) => e.toLowerCase()))];
}

async function fetchHTML(url: string, timeoutMs = 5000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ProspectBot/1.0; +https://prospectai.app)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    clearTimeout(timer);
    if (!res.ok) return "";
    // Don't try to parse huge pages
    const text = await res.text();
    return text.slice(0, 500_000);
  } catch {
    clearTimeout(timer);
    return "";
  }
}

export async function extractEmailFromWebsite(
  websiteUrl: string
): Promise<string | null> {
  let origin: string;
  try {
    origin = new URL(websiteUrl).origin;
  } catch {
    return null;
  }

  const pagesToTry = [
    websiteUrl,
    `${origin}/contact`,
    `${origin}/nous-contacter`,
    `${origin}/kontakt`,
    `${origin}/impressum`,
  ];

  for (const url of pagesToTry) {
    const html = await fetchHTML(url);
    if (!html) continue;

    const emails = extractEmails(html);
    const professional = emails.find(isProfessional);
    if (professional) return professional;
  }

  return null;
}

// Run extractions concurrently (max `concurrency` at a time)
export async function extractEmailsBatch(
  urls: (string | null | undefined)[],
  concurrency = 5
): Promise<(string | null)[]> {
  const results: (string | null)[] = new Array(urls.length).fill(null);

  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);

    const settled = await Promise.allSettled(
      batch.map((url) =>
        url ? extractEmailFromWebsite(url) : Promise.resolve(null)
      )
    );

    settled.forEach((r, j) => {
      results[i + j] = r.status === "fulfilled" ? r.value : null;
    });

    // Respectful delay between batches
    if (i + concurrency < urls.length) {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  return results;
}
