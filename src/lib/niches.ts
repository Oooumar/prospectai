import type { T } from "./i18n/types";

// Ordered list of i18n keys for the niche suggestion list shown in the
// scraping form (ScrapingModule) and the auto-campaign config form
// (dashboard/drafts). Purely a suggestion list — any free-text niche is
// still accepted everywhere this is used.
//
// To add a niche: add the key below, then add the matching `key: "..."`
// translation to all 5 files in src/lib/i18n/ (types.ts + fr/en/de/it/es.ts).
export const NICHE_KEYS: (keyof T)[] = [
  // Local B2C services
  "nch_plombier", "nch_electricien", "nch_restaurant", "nch_boulangerie",
  "nch_coiffeur", "nch_dentiste", "nch_avocat", "nch_comptable",
  "nch_auto_ecole", "nch_carreleur",
  // Creator-oriented brands
  "nch_marque_beaute", "nch_marque_mode", "nch_marque_tech",
  "nch_agence_influence", "nch_marque_alimentaire", "nch_startup",
  // Agencies
  "nch_agence_marketing", "nch_agence_web", "nch_agence_seo", "nch_agence_video",
  "nch_agences_marketing_seo",
  // B2B / tech / professional services
  "nch_esn", "nch_conseil_strategie", "nch_recrutement", "nch_saas_b2b",
  "nch_editeurs_logiciels", "nch_cybersecurite",
  // Real estate & finance
  "nch_promoteurs_immo", "nch_investisseurs_immo", "nch_gestion_patrimoine",
  // Industry & trade
  "nch_fabricants_industriels", "nch_logistique_transport", "nch_grossistes_distributeurs",
  // Training & HR
  "nch_formation_pro", "nch_coaching_management", "nch_conseil_rh",
];
