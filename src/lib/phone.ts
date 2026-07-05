// City → country dial code (without "+"), aligned with CITY_COMMANDER in groq.ts
const CITY_DIAL_CODE: Record<string, string> = {
  // ── Africa FR ────────────────────────────────────────────────────────────────
  // Côte d'Ivoire (+225)
  abidjan: "225", yamoussoukro: "225",
  // Burkina Faso (+226)
  ouagadougou: "226", "bobo-dioulasso": "226",
  // Sénégal (+221)
  dakar: "221", thiès: "221", thies: "221", "saint-louis": "221",
  // Mali (+223)
  bamako: "223", sikasso: "223",
  // Bénin (+229)
  cotonou: "229", "porto-novo": "229",
  // Togo (+228)
  lomé: "228", lome: "228",
  // Niger (+227)
  niamey: "227",
  // Cameroun (+237)
  yaoundé: "237", yaounde: "237", douala: "237",
  // Guinée (+224)
  conakry: "224",
  // Madagascar (+261)
  antananarivo: "261",
  // Congo (+242)
  brazzaville: "242",
  // RDC (+243)
  kinshasa: "243", lubumbashi: "243",
  // Gabon (+241)
  libreville: "241",
  // Mauritanie (+222)
  nouakchott: "222",
  // Burundi (+257)
  bujumbura: "257",
  // Centrafrique (+236)
  bangui: "236",
  // Tchad (+235)
  ndjamena: "235", "n'djamena": "235",

  // ── Africa EN ────────────────────────────────────────────────────────────────
  // Nigeria (+234)
  lagos: "234", abuja: "234", kano: "234", ibadan: "234",
  // Ghana (+233)
  accra: "233", kumasi: "233",
  // Kenya (+254)
  nairobi: "254",
  // South Africa (+27)
  johannesburg: "27", "cape town": "27", durban: "27",
  // Tanzania (+255)
  "dar es salaam": "255",
  // Uganda (+256)
  kampala: "256",
  // Rwanda (+250)
  kigali: "250",
  // Zimbabwe (+263)
  harare: "263",
  // Ethiopia (+251)
  "addis ababa": "251",
  // Sierra Leone (+232)
  freetown: "232",
  // Liberia (+231)
  monrovia: "231",

  // ── Europe FR ────────────────────────────────────────────────────────────────
  // France (+33)
  paris: "33", lyon: "33", marseille: "33", toulouse: "33", nice: "33",
  nantes: "33", montpellier: "33", strasbourg: "33", bordeaux: "33",
  lille: "33", rennes: "33", grenoble: "33", dijon: "33", reims: "33",
  // Switzerland FR (+41)
  genève: "41", geneve: "41", lausanne: "41",

  // ── Europe DE ────────────────────────────────────────────────────────────────
  // Germany (+49)
  berlin: "49", munich: "49", münchen: "49", hamburg: "49",
  cologne: "49", köln: "49", frankfurt: "49", stuttgart: "49",
  düsseldorf: "49", dortmund: "49", essen: "49", leipzig: "49",
  bremen: "49", dresden: "49", hannover: "49", nuremberg: "49",
  nürnberg: "49", aachen: "49",
  // Austria (+43)
  vienna: "43", wien: "43", graz: "43", salzburg: "43", innsbruck: "43",
  // Switzerland DE (+41)
  zurich: "41", zürich: "41", bern: "41", basel: "41",

  // ── Europe IT ────────────────────────────────────────────────────────────────
  // Italy (+39)
  rome: "39", roma: "39", milan: "39", milano: "39",
  naples: "39", napoli: "39", turin: "39", torino: "39",
  bologna: "39", florence: "39", firenze: "39", venice: "39", venezia: "39",
  genoa: "39", genova: "39",

  // ── Europe ES ────────────────────────────────────────────────────────────────
  // Spain (+34)
  madrid: "34", barcelona: "34", valencia: "34", seville: "34", sevilla: "34",
  zaragoza: "34", bilbao: "34", málaga: "34", malaga: "34", granada: "34",

  // ── Europe EN ────────────────────────────────────────────────────────────────
  // UK (+44)
  london: "44", manchester: "44", birmingham: "44", glasgow: "44",
  edinburgh: "44", liverpool: "44", leeds: "44", bristol: "44",
  cardiff: "44", sheffield: "44",

  // ── Europe multilingual ───────────────────────────────────────────────────────
  // Netherlands (+31)
  amsterdam: "31",
  // Belgium (+32)
  brussels: "32", bruxelles: "32",

  // ── Amérique ─────────────────────────────────────────────────────────────────
  // USA / Canada (+1)
  "new york": "1", "los angeles": "1", chicago: "1", houston: "1",
  phoenix: "1", dallas: "1", "san antonio": "1", "san diego": "1",
  "san francisco": "1", miami: "1", philadelphia: "1", seattle: "1",
  toronto: "1", vancouver: "1", montreal: "1", montréal: "1",
  calgary: "1", ottawa: "1",
  // Latin America
  "mexico city": "52", "ciudad de mexico": "52",
  bogota: "57", bogotá: "57",
  "buenos aires": "54",
  lima: "51",
  santiago: "56",
  caracas: "58",

  // ── Océanie / Golfe / Asie SE ─────────────────────────────────────────────────
  // Australia (+61)
  sydney: "61", melbourne: "61",
  // UAE (+971)
  dubai: "971",
  // Singapore (+65)
  singapore: "65",
};

// Prefixes of the national subscriber number (after stripping the country code)
// that indicate a mobile/cellular line. Empty array → cannot determine.
const MOBILE_NATIONAL_PREFIXES: Record<string, string[]> = {
  // ── Africa FR ────────────────────────────────────────────────────────────────
  "226": ["5", "6", "7"],          // Burkina Faso (fixe: 20, 25)
  "225": ["07", "05", "06", "01", "02"], // Côte d'Ivoire (format: 0X XXXXXXXX)
  "221": ["7"],                    // Sénégal (mobile: 7x; fixe: 33)
  "223": ["6", "7", "8", "9"],     // Mali
  "229": ["6", "9", "4", "5"],     // Bénin
  "228": ["9", "7"],               // Togo
  "227": ["7", "8", "9", "6"],     // Niger
  "237": ["6", "7"],               // Cameroun
  "224": ["6"],                    // Guinée
  "261": ["3"],                    // Madagascar
  "242": ["06", "05", "04"],       // Congo
  "243": ["8", "9"],               // RDC
  "241": ["06", "07"],             // Gabon
  "222": ["2", "3", "4"],          // Mauritanie
  "257": ["6", "7", "9"],          // Burundi
  "236": ["7"],                    // Centrafrique
  "235": ["6", "9", "3"],          // Tchad
  // ── Africa EN ────────────────────────────────────────────────────────────────
  "234": ["7", "8", "9"],          // Nigeria
  "233": ["2", "5"],               // Ghana (024x, 023x, 054x, 055x)
  "254": ["7", "1"],               // Kenya
  "27":  ["6", "7", "8"],          // South Africa
  "255": ["6", "7"],               // Tanzania
  "256": ["7", "3", "4"],          // Uganda
  "250": ["7"],                    // Rwanda
  "263": ["7"],                    // Zimbabwe
  "251": ["9"],                    // Ethiopia
  "232": ["7", "8"],               // Sierra Leone
  "231": ["8", "7"],               // Liberia
  // ── Europe ───────────────────────────────────────────────────────────────────
  "33":  ["6", "7"],               // France
  "49":  ["15", "16", "17"],       // Allemagne
  "43":  ["6"],                    // Autriche
  "41":  ["7"],                    // Suisse (075-079)
  "39":  ["3"],                    // Italie
  "34":  ["6", "7"],               // Espagne
  "32":  ["4"],                    // Belgique (047x-049x)
  "44":  ["7"],                    // UK (07xxx)
  "31":  ["6"],                    // Pays-Bas
  // ── Americas / Reste ─────────────────────────────────────────────────────────
  "1":   [],                       // USA/Canada — indistinguishable
  "52":  ["4", "5", "6", "7", "8", "9"], // Mexique
  "57":  ["3"],                    // Colombie (3xx)
  "54":  ["9"],                    // Argentine (9 XXXXXXXXXX)
  "51":  ["9"],                    // Pérou
  "56":  ["9"],                    // Chili
  "58":  ["4"],                    // Venezuela (04xx)
  "61":  ["4"],                    // Australie (04xx → national starts with 4)
  "971": ["5"],                    // UAE
  "65":  ["8", "9"],               // Singapore
};

/**
 * Returns whether a phone number is a mobile, landline, or unknown.
 * Pass the raw stored number and the prospect's city for best accuracy.
 */
export function detectPhoneType(raw: string, city?: string): "mobile" | "landline" | "unknown" {
  const normalized = normalizePhoneForWA(raw, city);
  if (!normalized || normalized.length < 7) return "unknown";

  // Try country codes longest-first to avoid false prefix matches (e.g. "1" vs "27")
  const codes = Object.keys(MOBILE_NATIONAL_PREFIXES).sort((a, b) => b.length - a.length);

  for (const cc of codes) {
    if (normalized.startsWith(cc)) {
      const national = normalized.slice(cc.length);
      if (!national) return "unknown";
      const mobilePrefixes = MOBILE_NATIONAL_PREFIXES[cc];
      if (mobilePrefixes.length === 0) return "unknown";
      return mobilePrefixes.some(p => national.startsWith(p)) ? "mobile" : "landline";
    }
  }

  return "unknown";
}

/**
 * Normalise un numéro brut pour wa.me : retourne uniquement des chiffres
 * avec l'indicatif pays au début (sans "0" de tronc initial).
 *
 * Règles :
 *  - "+226 70 70 13 52"   → "22670701352"  (format international avec +)
 *  - "0022670701352"      → "22670701352"  (préfixe 00)
 *  - "70 70 13 52"  + city="ouagadougou" → "22670701352"  (national → +indicatif)
 *  - "070701352"    + city="ouagadougou" → "22670701352"  (0 tronc + indicatif)
 */
export function normalizePhoneForWA(raw: string, city?: string): string {
  if (!raw?.trim()) return "";

  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith("+");
  const hasDoubleZero = trimmed.startsWith("00");

  // Strip every non-digit char
  let digits = trimmed.replace(/[^0-9]/g, "");
  if (!digits) return "";

  // Already international — "00CCNUMBER" or "+CCNUMBER"
  if (hasDoubleZero) return digits.slice(2);
  if (hasPlus) return digits;

  // Local / national format — look up country code from city
  const cc = city ? (CITY_DIAL_CODE[city.toLowerCase().trim()] ?? "") : "";
  if (!cc) return digits; // unknown country, return best-effort

  // Remove national trunk prefix "0" if present
  if (digits.startsWith("0")) digits = digits.slice(1);

  return cc + digits;
}
