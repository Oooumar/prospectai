export interface T {
  // Nav
  nav_features: string; nav_pricing: string; nav_signin: string; nav_signup_free: string;
  // Hero
  hero_badge: string; hero_title1: string; hero_title2: string; hero_sub: string;
  hero_btn_start: string; hero_btn_demo: string; hero_no_card: string;
  // Dashboard preview labels
  prev_prospects: string; prev_emails_sent: string; prev_open_rate: string; prev_replies: string;
  prev_scraped: string; prev_live: string; prev_generated: string;
  // Early adopter banner
  early_tag: string; early_line1: string; early_line2: string;
  // Features
  feat_title: string; feat_sub: string;
  feat1_title: string; feat1_desc: string; feat2_title: string; feat2_desc: string;
  feat3_title: string; feat3_desc: string; feat4_title: string; feat4_desc: string;
  // Pricing
  price_title: string; price_sub: string; price_trial_banner: string;
  price_month: string; price_trial_then: string; price_trial_btn: string; price_payment_note: string;
  // Plan descriptions
  plan_starter_desc: string; plan_creator_desc: string; plan_pro_desc: string; plan_agency_desc: string;
  plan_popular_badge: string;
  // Plan features - Starter
  pf_s1: string; pf_s2: string; pf_s3: string; pf_s4: string; pf_s5: string;
  // Plan features - Creator
  pf_c1: string; pf_c2: string; pf_c3: string; pf_c4: string; pf_c5: string; pf_c6: string;
  // Plan features - Pro
  pf_p1: string; pf_p2: string; pf_p3: string; pf_p4: string; pf_p5: string; pf_p6: string;
  // Plan features - Agency
  pf_a1: string; pf_a2: string; pf_a3: string; pf_a4: string; pf_a5: string; pf_a6: string;
  // CTA section
  cta_title: string; cta_sub: string; cta_btn: string;
  // Footer
  footer_legal: string; footer_cgu: string; footer_privacy: string; footer_contact: string; footer_copyright: string;
  // Auth common
  auth_terms: string; auth_cgu: string; auth_privacy: string;
  // Signin
  si_title: string; si_sub: string; si_email: string; si_pw: string;
  si_email_ph: string; si_pw_ph: string; si_btn: string; si_loading: string;
  si_error: string; si_no_account: string; si_signup_link: string;
  // Signup
  su_title: string; su_trial: string; su_profile_label: string;
  su_b2b_label: string; su_b2b_desc: string;
  su_creator_label: string; su_creator_desc: string;
  su_agency_label: string; su_agency_desc: string;
  su_name: string; su_name_ph: string; su_email: string; su_email_ph: string;
  su_pw: string; su_pw_ph: string; su_confirm: string;
  su_plan_label: string; su_trial_line: string;
  su_pay_label: string; su_stripe_label: string; su_stripe_sub: string;
  su_paypal_label: string; su_paypal_sub: string;
  su_btn: string; su_loading: string; su_cgu_note: string; su_cgu_link: string;
  su_has_account: string; su_signin_link: string;
  // Validation
  val_email: string; val_pw_min: string; val_name_min: string; val_pw_match: string;
  // Sidebar
  sb_dashboard: string; sb_prospects: string; sb_campaigns: string;
  sb_emails: string; sb_replies: string; sb_settings: string; sb_logout: string;
  // Topbar
  tb_search: string;
  // Dashboard home
  dh_title: string; dh_desc: string; dh_total_prospects: string; dh_emails_sent: string;
  dh_open_rate: string; dh_reply_rate: string; dh_chart_title: string;
  dh_activity_title: string; dh_emails_sent_label: string; dh_active_campaigns: string;
  dh_pending: string; dh_remaining: string; dh_recent_emails: string;
  dh_no_emails: string; dh_no_emails_desc: string;
  // Email statuses
  est_SENT: string; est_PENDING: string; est_FAILED: string;
  est_OPENED: string; est_REPLIED: string; est_BOUNCED: string;
  // Prospect statuses
  pst_NEW: string; pst_CONTACTED: string; pst_OPENED: string;
  pst_REPLIED: string; pst_CONVERTED: string; pst_UNSUBSCRIBED: string;
  // Prospects page
  pp_title: string; pp_desc: string; pp_search_ph: string; pp_scrape_btn: string;
  pp_list_title: string; pp_total: string; pp_no: string; pp_no_desc: string;
  pp_scrape_now: string; pp_col_prospect: string; pp_col_contact: string;
  pp_col_location: string; pp_col_status: string; pp_website: string;
  pp_email_ai: string; pp_delete_confirm: string;
  pp_no_website: string; pp_no_website_badge: string;
  pp_page: string; pp_total_label: string; pp_prev: string; pp_next: string;
  // Campaigns
  cam_title: string; cam_desc: string; cam_new_btn: string;
  cam_no: string; cam_no_desc: string; cam_create_first: string;
  cam_st_DRAFT: string; cam_st_ACTIVE: string; cam_st_PAUSED: string; cam_st_COMPLETED: string;
  cam_col_sent: string; cam_col_opened: string; cam_col_replies: string; cam_per_day: string;
  cam_pause: string; cam_launch: string; cam_delete_confirm: string;
  cam_form_title: string; cam_form_name: string; cam_form_name_ph: string;
  cam_form_niche: string; cam_form_niche_ph: string;
  cam_form_city: string; cam_form_city_ph: string;
  cam_form_subject: string; cam_form_subject_ph: string;
  cam_form_template: string; cam_form_template_hint: string;
  cam_form_limit: string; cam_form_cancel: string;
  cam_form_create: string; cam_form_creating: string;
  cam_default_template: string;
  cam_auto_banner: string;
  // Emails page
  em_title: string; em_desc: string;
  em_stat_sent: string; em_stat_opened: string; em_stat_replied: string; em_stat_failed: string;
  em_history_title: string; em_no: string; em_no_desc: string;
  em_col_prospect: string; em_col_subject: string; em_col_status: string;
  em_col_date: string; em_opened_at: string;
  em_mark_replied: string; em_mark_help: string;
  // Settings
  set_title: string; set_desc: string;
  set_profile_title: string; set_profile_desc: string;
  set_name: string; set_email: string; set_member: string;
  set_save: string; set_saved: string;
  set_limits_title: string; set_limits_desc: string;
  set_limit_label: string; set_limit_hint: string; set_update: string;
  set_warmup_desc: string; set_warmup_next: string; set_warmup_hint: string;
  set_security_title: string; set_security_desc: string;
  set_current_pw: string; set_new_pw: string; set_confirm_pw: string;
  set_save_pw: string; set_saved_pw: string; set_pw_mismatch: string; set_pw_wrong: string;
  set_config_title: string; set_config_desc: string; set_config_required: string;
  set_lang_title: string; set_lang_desc: string;
  // Company / product card
  set_company_title: string; set_company_desc: string;
  set_company_name: string; set_company_name_ph: string;
  set_company_website: string; set_company_website_ph: string;
  set_company_product_desc: string; set_company_product_desc_ph: string;
  set_whatsapp: string; set_whatsapp_ph: string; set_whatsapp_hint: string;
  // Scraping module
  sc_title: string; sc_niche: string; sc_niche_ph: string;
  sc_city: string; sc_city_ph: string; sc_limit: string;
  sc_search_btn: string; sc_searching: string; sc_results: string;
  sc_new_search: string; sc_view_all: string; sc_again: string; sc_more: string;
  sc_g_b2b: string; sc_g_creator: string; sc_g_agency: string; sc_error_server: string;
  sc_no_website: string;
  // Email composer
  ec_title_prefix: string; ec_generate: string; ec_generating: string;
  ec_subject: string; ec_subject_ph: string; ec_body: string; ec_body_ph: string;
  ec_send: string; ec_sending: string; ec_sent_title: string; ec_sent_desc: string;
  ec_cancel: string; ec_no_email: string;
  // Email composer — company reminder
  ec_no_company: string; ec_no_company_link: string;
  // Drafts page
  sb_drafts: string;
  dr_title: string; dr_desc: string; dr_no: string; dr_no_desc: string; dr_help: string;
  dr_edit: string; dr_send: string; dr_delete: string; dr_sending: string;
  dr_delete_confirm: string; dr_subject: string; dr_body_label: string;
  dr_save: string; dr_cancel: string; dr_sent: string;
  est_DRAFT: string;
  // Auto campaigns
  ac_title: string; ac_desc: string; ac_new: string; ac_no: string;
  ac_niche: string; ac_niche_ph: string; ac_cities: string; ac_cities_ph: string;
  ac_freq: string; ac_daily: string; ac_weekly: string;
  ac_limit: string; ac_per_cycle: string;
  ac_create: string; ac_creating: string; ac_created: string;
  ac_active: string; ac_paused: string;
  ac_delete_confirm: string;
  // Replies page
  rep_title: string; rep_desc: string; rep_no: string; rep_no_desc: string;
  rep_s_interested: string; rep_s_not_interested: string;
  rep_s_simple_question: string; rep_s_needs_human: string;
  rep_pending: string; rep_sent_status: string; rep_archived: string;
  rep_ai_analysis: string; rep_draft: string; rep_message: string;
  rep_approve: string; rep_approving: string; rep_archive: string;
  rep_human_warning: string;
}
