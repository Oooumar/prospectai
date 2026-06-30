export interface PlaceResult {
  displayName?: { text: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
}

const FIELD_MASK = [
  "places.displayName",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.websiteUri",
  "places.rating",
  "places.userRatingCount",
  "nextPageToken",
].join(",");

export async function searchGooglePlaces(query: string, limit: number): Promise<PlaceResult[]> {
  const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
  if (!API_KEY) throw new Error("GOOGLE_MAPS_API_KEY manquant dans les variables d'environnement");

  const results: PlaceResult[] = [];
  let pageToken: string | undefined;
  let page = 0;

  while (results.length < limit) {
    page++;
    const pageSize = Math.min(limit - results.length, 20);

    const body: Record<string, unknown> = {
      textQuery: query,
      maxResultCount: pageSize,
      languageCode: "fr",
    };
    if (pageToken) body.pageToken = pageToken;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    let res: Response;
    try {
      res = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": API_KEY,
          "X-Goog-FieldMask": FIELD_MASK,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (fetchErr: any) {
      clearTimeout(timer);
      throw new Error(`Timeout ou réseau : ${fetchErr.message}`);
    }
    clearTimeout(timer);

    const data = await res.json();
    if (!res.ok) {
      const msg = data?.error?.message ?? `Google Places HTTP ${res.status}`;
      throw new Error(msg);
    }

    if (Array.isArray(data.places)) results.push(...data.places);
    if (!data.nextPageToken || results.length >= limit) break;

    pageToken = data.nextPageToken;
    await new Promise((r) => setTimeout(r, 200));
  }

  return results.slice(0, limit);
}
