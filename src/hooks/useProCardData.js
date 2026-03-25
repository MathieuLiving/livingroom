import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/customSupabaseClient";
import {
  COLOR_DEFAULTS,
  CARD_COLOR_KEYS,
  trimOrNull,
  ensureAvatarLogoPathFromLegacyUrl,
} from "@/utils/proHelpers";

const withTimeout = (promise, ms, label = "timeout") =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`[useProCardData] ${label} after ${ms}ms`)), ms)
    ),
  ]);

const PRO_BRANDING_EFFECTIVE_VIEW = "pro_branding_effective_v1";
const PRO_CARDS_EFFECTIVE_VIEW = "pro_cards_effective_v4";
const ATTACHED_ROLES = new Set(["director", "team_leader", "agent_affiliate"]);

const BRANDING_SERVER_KEYS = new Set([
  "company_name",
  "logo_url",
  "logo_path",
  "agency_website_url",
  "customer_review_url",
  "linkedin_url",
  "facebook_url",
  "instagram_url",
  "youtube_url",
  "tiktok_url",
  "video_url",
  "video_external_url",
  "video_storage_path",
  "video_preferred_source",
  "card_banner_color",
  "card_text_color",
  "card_primary_button_color",
  "card_secondary_button_color",
  "card_name_color",
  "card_signature_color",
  "card_company_name_color",
  "card_support_text_color",
  "card_qr_fg_color",
  "qr_code_with_logo",
  "agency",
  "agency_name",
  "agency_logo_url",
  "agency_logo_path",
  "agency_public_website_url",
  "agency_qr_code_with_logo",
  "effective_company_name",
  "effective_logo_url",
  "effective_logo_path",
  "effective_website_url",
  "effective_customer_review_url",
  "effective_linkedin_url",
  "effective_facebook_url",
  "effective_instagram_url",
  "effective_youtube_url",
  "effective_tiktok_url",
  "effective_video_url",
  "effective_video_external_url",
  "effective_video_storage_path",
  "effective_video_preferred_source",
  "effective_card_banner_color",
  "effective_card_text_color",
  "effective_card_primary_button_color",
  "effective_card_secondary_button_color",
  "effective_card_name_color",
  "effective_card_signature_color",
  "effective_card_company_name_color",
  "effective_card_support_text_color",
  "effective_card_qr_fg_color",
  "effective_qr_code_with_logo",
  "card_url_clicks",
  "card_qr_scans",
  "premium_professionnel_card",
  "premium_card_tracking_key",
  "digital_card_livingroom_url",
  "digital_card_livingpage_url",
]);

const normalizeRole = (value) => String(value || "").toLowerCase().trim();

function isAgencyMemberRole(role) {
  return ATTACHED_ROLES.has(normalizeRole(role));
}

const EFFECTIVE_SELECT = [
  "professionnel_id",
  "user_id",
  "professionnel_updated_at",
  "agency_id",
  "agency_role",
  "is_agency_member",

  "first_name",
  "last_name",
  "email",
  "phone",
  "function",
  "professionnal_presentation",
  "scope_intervention_choice_1",
  "scope_intervention_choice_2",
  "scope_intervention_choice_3",
  "avatar_url",
  "avatar_path",
  "appointment_url",
  "cpi_number",
  "card_slug",
  "digital_card_livingroom_url",
  "is_public",
  "visibility_pro_partner_page",
  "is_active",
  "is_archived",

  "own_company_name",
  "own_logo_url",
  "own_logo_path",
  "own_agency_website_url",
  "own_customer_review_url",
  "own_linkedin_url",
  "own_facebook_url",
  "own_instagram_url",
  "own_youtube_url",
  "own_tiktok_url",
  "own_video_url",
  "own_video_external_url",
  "own_video_storage_path",
  "own_video_preferred_source",
  "own_qr_code_with_logo",

  "agency_updated_at",
  "agency_name",
  "agency_logo_url",
  "agency_logo_path",
  "agency_website_url",
  "agency_customer_review_url",
  "agency_linkedin_url",
  "agency_facebook_url",
  "agency_instagram_url",
  "agency_youtube_url",
  "agency_tiktok_url",
  "agency_video_url",
  "agency_video_external_url",
  "agency_video_storage_path",
  "agency_video_preferred_source",
  "agency_qr_code_with_logo",

  "agency_card_banner_color",
  "agency_card_text_color",
  "agency_card_primary_button_color",
  "agency_card_secondary_button_color",
  "agency_card_name_color",
  "agency_card_signature_color",
  "agency_card_company_name_color",
  "agency_card_support_text_color",
  "agency_card_qr_fg_color",

  "effective_company_name",
  "effective_logo_url",
  "effective_logo_path",
  "effective_website_url",
  "effective_customer_review_url",
  "effective_linkedin_url",
  "effective_facebook_url",
  "effective_instagram_url",
  "effective_youtube_url",
  "effective_tiktok_url",
  "effective_video_url",
  "effective_video_external_url",
  "effective_video_storage_path",
  "effective_video_preferred_source",

  "effective_card_banner_color",
  "effective_card_text_color",
  "effective_card_primary_button_color",
  "effective_card_secondary_button_color",
  "effective_card_name_color",
  "effective_card_signature_color",
  "effective_card_company_name_color",
  "effective_card_support_text_color",
  "effective_card_qr_fg_color",

  "effective_qr_code_with_logo",
].join(",");

const PRO_CARDS_EFFECTIVE_SELECT = [
  "professionnel_id",
  "premium_professionnel_card",
  "premium_card_tracking_key",
  "digital_card_livingroom_url",
  "digital_card_livingpage_url",
  "card_url_clicks",
  "card_qr_scans",
].join(",");

const LEGACY_PRO_SELECT = [
  "id",
  "user_id",
  "created_at",
  "updated_at",
  "first_name",
  "last_name",
  "phone",
  "email",
  "company_name",
  "function",
  "professionnal_presentation",
  "scope_intervention_choice_1",
  "scope_intervention_choice_2",
  "scope_intervention_choice_3",
  "avatar_url",
  "avatar_path",
  "logo_url",
  "logo_path",
  "video_url",
  "video_external_url",
  "video_storage_path",
  "video_preferred_source",
  "custom_video_url",
  "custom_logo_url",
  "card_slug",
  "premium_professionnel_card",
  "digital_card_livingroom_url",
  "is_public",
  "visibility_pro_partner_page",
  "is_active",
  "is_archived",
  "agency_id",
  "agency_role",
  "team_leader_id",
  "allow_card_customization",
  ...CARD_COLOR_KEYS,
  "card_url_clicks",
  "card_qr_scans",
  "appointment_url",
  "agency_website_url",
  "customer_review_url",
  "linkedin_url",
  "facebook_url",
  "instagram_url",
  "youtube_url",
  "tiktok_url",
  "cpi_number",
  "qr_code_with_logo",
].join(",");

const LEGACY_AGENCY_SELECT = [
  "id",
  "updated_at",
  "name",
  "logo_url",
  "logo_storage_path",
  "website_url",
  "customer_review_url",
  "linkedin_url",
  "facebook_url",
  "instagram_url",
  "youtube_url",
  "tiktok_url",
  "qr_code_with_logo",
  ...CARD_COLOR_KEYS,
  "video_url",
  "video_external_url",
  "video_storage_path",
  "video_preferred_source",
].join(",");

function isMissingColumnError(err) {
  const code = String(err?.code || "");
  const msg = String(err?.message || "").toLowerCase();
  return code === "42703" || msg.includes("column") || msg.includes("does not exist");
}

function isMissingRelationError(err) {
  const code = String(err?.code || "");
  const msg = String(err?.message || "").toLowerCase();
  return code === "42p01" || msg.includes("relation") || msg.includes("does not exist");
}

function looksLikeAuthKeyError(err) {
  const msg = String(err?.message || "").toLowerCase();
  const hint = String(err?.hint || "").toLowerCase();
  return msg.includes("invalid api key") || hint.includes("invalid api key");
}

const pickColor = (...values) => {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return null;
};

const isObject = (v) => v && typeof v === "object" && !Array.isArray(v);
const hasFilledValue = (v) => v !== undefined && v !== null && String(v).trim() !== "";

function sanitizeLegacyFixForRole(legacyFix, agencyRole, agencyId = null) {
  if (!legacyFix || !isObject(legacyFix)) return {};

  const isAgencyMember = !!agencyId && isAgencyMemberRole(agencyRole);
  if (!isAgencyMember) return { ...legacyFix };

  const cleaned = { ...legacyFix };
  delete cleaned.logo_url;
  delete cleaned.logo_path;
  delete cleaned.company_name;
  delete cleaned.agency_name;
  delete cleaned.agency_website_url;
  delete cleaned.video_url;
  delete cleaned.video_external_url;
  delete cleaned.video_storage_path;
  delete cleaned.video_preferred_source;
  delete cleaned.custom_logo_url;
  delete cleaned.custom_video_url;
  return cleaned;
}

function shouldOverlayLegacyIndependentData(row) {
  if (!row) return false;

  const role = trimOrNull(row?.agency_role) || "agent";
  const isAgencyMember =
    !!row?.agency_id && (row?.is_agency_member === true || isAgencyMemberRole(role));

  if (isAgencyMember) return false;

  const independentSignals = [
    row?.effective_card_banner_color,
    row?.effective_card_text_color,
    row?.effective_card_primary_button_color,
    row?.effective_card_secondary_button_color,
    row?.effective_card_name_color,
    row?.effective_card_signature_color,
    row?.effective_card_company_name_color,
    row?.effective_card_support_text_color,
    row?.effective_card_qr_fg_color,
  ];

  return !independentSignals.some(hasFilledValue);
}

async function resolveProfessionnelIdentity(authUid, authEmail) {
  if (!authUid || !supabase) {
    return {
      professionnelId: authUid || null,
      userId: authUid || null,
      row: null,
    };
  }

  const byUserQ = supabase
    .from("professionnels")
    .select("id,user_id,email,agency_id,agency_role")
    .eq("user_id", authUid)
    .maybeSingle();

  const byIdQ = supabase
    .from("professionnels")
    .select("id,user_id,email,agency_id,agency_role")
    .eq("id", authUid)
    .maybeSingle();

  const [byUserRes, byIdRes] = await Promise.allSettled([
    withTimeout(byUserQ, 4500, "professionnels identity select (user_id)"),
    withTimeout(byIdQ, 4500, "professionnels identity select (id)"),
  ]);

  const rowByUser =
    byUserRes.status === "fulfilled" && !byUserRes.value.error ? byUserRes.value.data : null;
  const rowById =
    byIdRes.status === "fulfilled" && !byIdRes.value.error ? byIdRes.value.data : null;

  const errByUser = byUserRes.status === "fulfilled" ? byUserRes.value.error : byUserRes.reason;
  const errById = byIdRes.status === "fulfilled" ? byIdRes.value.error : byIdRes.reason;

  if (errByUser && looksLikeAuthKeyError(errByUser)) {
    throw new Error("Invalid API key (vérifie VITE_SUPABASE_ANON_KEY).");
  }
  if (errById && looksLikeAuthKeyError(errById)) {
    throw new Error("Invalid API key (vérifie VITE_SUPABASE_ANON_KEY).");
  }

  if (errByUser && !isMissingColumnError(errByUser) && !isMissingRelationError(errByUser)) {
    throw errByUser;
  }
  if (errById && !isMissingColumnError(errById) && !isMissingRelationError(errById)) {
    throw errById;
  }

  const row = rowByUser || rowById || null;

  return {
    professionnelId: row?.id || authUid,
    userId: row?.user_id || authUid,
    row,
    authEmail: trimOrNull(row?.email) || authEmail || null,
  };
}

async function updateThenInsertProfessionnel(identity, patch, authEmail) {
  const authUid = identity?.userId || identity?.professionnelId || identity;
  const professionnelId = identity?.professionnelId || identity?.userId || identity;

  if (!authUid || !supabase) return;

  const nowIso = new Date().toISOString();
  const agencyRoleSafe = trimOrNull(patch?.agency_role) || "agent";
  const { billing_plan, access_plan, ...cleanPatch } = patch || {};

  const payload = {
    id: professionnelId,
    user_id: authUid,
    ...cleanPatch,
    agency_role: agencyRoleSafe,
    email: trimOrNull(patch?.email) || authEmail || null,
    updated_at: nowIso,
  };

  const tryUpdateByUserId = async (p) =>
    supabase.from("professionnels").update(p).eq("user_id", authUid).select("id").maybeSingle();

  const tryUpdateById = async (p) =>
    supabase.from("professionnels").update(p).eq("id", professionnelId).select("id").maybeSingle();

  const tryInsert = async (p) =>
    supabase.from("professionnels").insert(p).select("id").maybeSingle();

  let upd = await tryUpdateByUserId(payload);

  if (upd.error && isMissingColumnError(upd.error)) {
    const { user_id, ...noUserId } = payload;
    upd = await tryUpdateByUserId(noUserId);
  }
  if (upd.error) throw upd.error;
  if (upd.data?.id) return;

  upd = await tryUpdateById(payload);
  if (upd.error && isMissingColumnError(upd.error)) {
    const { user_id, ...noUserId } = payload;
    upd = await tryUpdateById(noUserId);
  }
  if (upd.error) throw upd.error;
  if (upd.data?.id) return;

  const insertPayload = {
    ...payload,
    role: "professionnel",
    agency_role: agencyRoleSafe,
    is_active: payload.is_active ?? true,
    visibility_pro_partner_page: payload.visibility_pro_partner_page ?? true,
    is_public: payload.is_public ?? true,
    is_archived: payload.is_archived ?? false,
    allow_card_customization: payload.allow_card_customization ?? false,
  };

  let ins = await tryInsert(insertPayload);
  if (ins.error && isMissingColumnError(ins.error)) {
    const { user_id, ...noUserId } = insertPayload;
    ins = await tryInsert(noUserId);
  }
  if (ins.error) throw ins.error;
}

async function loadFromEffectiveView(authUid, professionnelId = null) {
  const tryByUser = await withTimeout(
    supabase
      .from(PRO_BRANDING_EFFECTIVE_VIEW)
      .select(EFFECTIVE_SELECT)
      .eq("user_id", authUid)
      .maybeSingle(),
    4500,
    "pro_branding_effective_v1 select by user_id"
  );

  if (tryByUser?.error) throw tryByUser.error;
  if (tryByUser?.data) return tryByUser.data;

  if (!professionnelId) return null;

  const tryByProId = await withTimeout(
    supabase
      .from(PRO_BRANDING_EFFECTIVE_VIEW)
      .select(EFFECTIVE_SELECT)
      .eq("professionnel_id", professionnelId)
      .maybeSingle(),
    4500,
    "pro_branding_effective_v1 select by professionnel_id"
  );

  if (tryByProId?.error) throw tryByProId.error;
  return tryByProId?.data || null;
}

async function loadFromProCardsEffective(professionnelId) {
  if (!professionnelId) return null;

  const res = await withTimeout(
    supabase
      .from(PRO_CARDS_EFFECTIVE_VIEW)
      .select(PRO_CARDS_EFFECTIVE_SELECT)
      .eq("professionnel_id", professionnelId)
      .maybeSingle(),
    4500,
    "pro_cards_effective_v4 select by professionnel_id"
  );

  if (res?.error) throw res.error;
  return res?.data || null;
}

async function loadLegacyRaw(authUid, authEmail, professionnelId = null) {
  const queries = [
    supabase.from("professionnels").select(LEGACY_PRO_SELECT).eq("user_id", authUid).maybeSingle(),
    supabase.from("professionnels").select(LEGACY_PRO_SELECT).eq("id", authUid).maybeSingle(),
  ];

  if (professionnelId && professionnelId !== authUid) {
    queries.push(
      supabase
        .from("professionnels")
        .select(LEGACY_PRO_SELECT)
        .eq("id", professionnelId)
        .maybeSingle()
    );
  }

  const results = await Promise.allSettled(
    queries.map((q, i) => withTimeout(q, 4500, `professionnels legacy select ${i + 1}`))
  );

  let base = null;

  for (const res of results) {
    const err = res.status === "fulfilled" ? res.value.error : res.reason;
    const data = res.status === "fulfilled" ? res.value.data : null;

    if (err) {
      if (looksLikeAuthKeyError(err)) {
        throw new Error("Invalid API key (vérifie VITE_SUPABASE_ANON_KEY).");
      }
      if (!isMissingColumnError(err) && !isMissingRelationError(err)) {
        throw err;
      }
    }

    if (data && !base) {
      base = data;
    }
  }

  base =
    base || {
      id: professionnelId || authUid,
      user_id: authUid,
      email: authEmail || null,
      role: "professionnel",
      is_active: true,
      visibility_pro_partner_page: true,
      is_public: true,
      is_archived: false,
      allow_card_customization: true,
      agency_id: null,
      team_leader_id: null,
      agency_role: "agent",
      premium_professionnel_card: null,
      video_url: null,
      video_external_url: null,
      video_storage_path: null,
      video_preferred_source: "none",
      custom_video_url: null,
      custom_logo_url: null,
      qr_code_with_logo: false,
      card_url_clicks: 0,
      card_qr_scans: 0,
    };

  const legacyRole = trimOrNull(base?.agency_role) || "agent";
  const isAgencyMember = !!base.agency_id && isAgencyMemberRole(legacyRole);

  let agency = null;

  if (isAgencyMember && base.agency_id) {
    const agencyRes = await withTimeout(
      supabase.from("agencies").select(LEGACY_AGENCY_SELECT).eq("id", base.agency_id).maybeSingle(),
      4500,
      "agencies select"
    );
    if (agencyRes?.error) throw agencyRes.error;
    agency = agencyRes?.data || null;
  }

  return { base, agency, isAgencyMember };
}

function buildHydratedFromEffectiveRow(
  row,
  authUid,
  authEmail,
  subRow,
  legacyBase = null,
  premiumCardRow = null
) {
  const agencyRoleSafe = trimOrNull(row?.agency_role) || "agent";
  const isAgencyMember =
    !!row?.agency_id && (row?.is_agency_member === true || isAgencyMemberRole(agencyRoleSafe));

  const legacy = legacyBase || {};

  const independentCompanyName =
    row?.own_company_name ?? legacy?.company_name ?? row?.effective_company_name ?? null;

  const independentLogoUrl =
    row?.own_logo_url ?? legacy?.logo_url ?? row?.effective_logo_url ?? null;

  const independentLogoPath =
    row?.own_logo_path ?? legacy?.logo_path ?? row?.effective_logo_path ?? null;

  const independentWebsite =
    row?.own_agency_website_url ?? legacy?.agency_website_url ?? row?.effective_website_url ?? null;

  const independentReview =
    row?.own_customer_review_url ??
    legacy?.customer_review_url ??
    row?.effective_customer_review_url ??
    null;

  const independentLinkedin =
    row?.own_linkedin_url ?? legacy?.linkedin_url ?? row?.effective_linkedin_url ?? null;

  const independentFacebook =
    row?.own_facebook_url ?? legacy?.facebook_url ?? row?.effective_facebook_url ?? null;

  const independentInstagram =
    row?.own_instagram_url ?? legacy?.instagram_url ?? row?.effective_instagram_url ?? null;

  const independentYoutube =
    row?.own_youtube_url ?? legacy?.youtube_url ?? row?.effective_youtube_url ?? null;

  const independentTiktok =
    row?.own_tiktok_url ?? legacy?.tiktok_url ?? row?.effective_tiktok_url ?? null;

  const independentVideoUrl =
    row?.own_video_url ?? legacy?.video_url ?? row?.effective_video_url ?? null;

  const independentVideoExternalUrl =
    row?.own_video_external_url ?? legacy?.video_external_url ?? row?.effective_video_external_url ?? null;

  const independentVideoStoragePath =
    row?.own_video_storage_path ?? legacy?.video_storage_path ?? row?.effective_video_storage_path ?? null;

  const independentVideoPreferredSource =
    trimOrNull(
      row?.own_video_preferred_source ??
      legacy?.video_preferred_source ??
      row?.effective_video_preferred_source
    ) || "none";

  const independentQrWithLogo =
    legacy?.qr_code_with_logo ??
    row?.own_qr_code_with_logo ??
    row?.effective_qr_code_with_logo ??
    false;

  const cardBannerColor =
    pickColor(
      row?.effective_card_banner_color,
      isAgencyMember ? row?.agency_card_banner_color : legacy?.card_banner_color,
      COLOR_DEFAULTS.card_banner_color
    ) ?? COLOR_DEFAULTS.card_banner_color;

  const cardTextColor =
    pickColor(
      row?.effective_card_text_color,
      isAgencyMember ? row?.agency_card_text_color : legacy?.card_text_color,
      COLOR_DEFAULTS.card_text_color
    ) ?? COLOR_DEFAULTS.card_text_color;

  const cardPrimaryButtonColor =
    pickColor(
      row?.effective_card_primary_button_color,
      isAgencyMember ? row?.agency_card_primary_button_color : legacy?.card_primary_button_color,
      COLOR_DEFAULTS.card_primary_button_color
    ) ?? COLOR_DEFAULTS.card_primary_button_color;

  const cardSecondaryButtonColor =
    pickColor(
      row?.effective_card_secondary_button_color,
      isAgencyMember ? row?.agency_card_secondary_button_color : legacy?.card_secondary_button_color,
      COLOR_DEFAULTS.card_secondary_button_color
    ) ?? COLOR_DEFAULTS.card_secondary_button_color;

  const cardNameColor =
    pickColor(
      row?.effective_card_name_color,
      isAgencyMember ? row?.agency_card_name_color : legacy?.card_name_color,
      COLOR_DEFAULTS.card_name_color
    ) ?? COLOR_DEFAULTS.card_name_color;

  const cardSignatureColor =
    pickColor(
      row?.effective_card_signature_color,
      isAgencyMember ? row?.agency_card_signature_color : legacy?.card_signature_color,
      COLOR_DEFAULTS.card_signature_color
    ) ?? COLOR_DEFAULTS.card_signature_color;

  const cardCompanyNameColor =
    pickColor(
      row?.effective_card_company_name_color,
      isAgencyMember ? row?.agency_card_company_name_color : legacy?.card_company_name_color,
      COLOR_DEFAULTS.card_company_name_color
    ) ?? COLOR_DEFAULTS.card_company_name_color;

  const cardSupportTextColor =
    pickColor(
      row?.effective_card_support_text_color,
      isAgencyMember ? row?.agency_card_support_text_color : legacy?.card_support_text_color,
      COLOR_DEFAULTS.card_support_text_color
    ) ?? COLOR_DEFAULTS.card_support_text_color;

  const cardQrFgColor =
    pickColor(
      row?.effective_card_qr_fg_color,
      isAgencyMember ? row?.agency_card_qr_fg_color : legacy?.card_qr_fg_color,
      COLOR_DEFAULTS.card_qr_fg_color
    ) ?? COLOR_DEFAULTS.card_qr_fg_color;

  return {
    id: row?.professionnel_id || authUid,
    user_id: row?.user_id || authUid,
    created_at: null,
    updated_at: row?.professionnel_updated_at || legacy?.updated_at || null,

    first_name: row?.first_name ?? legacy?.first_name ?? null,
    last_name: row?.last_name ?? legacy?.last_name ?? null,
    phone: row?.phone ?? legacy?.phone ?? null,
    email: trimOrNull(row?.email) || trimOrNull(legacy?.email) || authEmail || null,
    function: row?.function ?? legacy?.function ?? null,
    professionnal_presentation:
      row?.professionnal_presentation ?? legacy?.professionnal_presentation ?? null,
    scope_intervention_choice_1:
      row?.scope_intervention_choice_1 ?? legacy?.scope_intervention_choice_1 ?? null,
    scope_intervention_choice_2:
      row?.scope_intervention_choice_2 ?? legacy?.scope_intervention_choice_2 ?? null,
    scope_intervention_choice_3:
      row?.scope_intervention_choice_3 ?? legacy?.scope_intervention_choice_3 ?? null,
    avatar_url: row?.avatar_url ?? legacy?.avatar_url ?? null,
    avatar_path: row?.avatar_path ?? legacy?.avatar_path ?? null,

    company_name: isAgencyMember
      ? row?.agency_name ?? row?.effective_company_name ?? null
      : independentCompanyName,

    logo_url: isAgencyMember
      ? row?.agency_logo_url ?? row?.effective_logo_url ?? null
      : independentLogoUrl,

    logo_path: isAgencyMember
      ? row?.agency_logo_path ?? row?.effective_logo_path ?? null
      : independentLogoPath,

    agency_website_url: isAgencyMember
      ? row?.agency_website_url ?? row?.effective_website_url ?? null
      : independentWebsite,

    customer_review_url: isAgencyMember
      ? row?.agency_customer_review_url ?? row?.effective_customer_review_url ?? null
      : independentReview,

    linkedin_url: isAgencyMember ? row?.effective_linkedin_url ?? null : independentLinkedin,
    facebook_url: isAgencyMember ? row?.effective_facebook_url ?? null : independentFacebook,
    instagram_url: isAgencyMember ? row?.effective_instagram_url ?? null : independentInstagram,
    youtube_url: isAgencyMember ? row?.effective_youtube_url ?? null : independentYoutube,
    tiktok_url: isAgencyMember ? row?.effective_tiktok_url ?? null : independentTiktok,

    own_company_name: row?.own_company_name ?? legacy?.company_name ?? null,
    own_logo_url: row?.own_logo_url ?? legacy?.logo_url ?? null,
    own_logo_path: row?.own_logo_path ?? legacy?.logo_path ?? null,
    own_agency_website_url: row?.own_agency_website_url ?? legacy?.agency_website_url ?? null,
    own_customer_review_url: row?.own_customer_review_url ?? legacy?.customer_review_url ?? null,
    own_linkedin_url: row?.own_linkedin_url ?? legacy?.linkedin_url ?? null,
    own_facebook_url: row?.own_facebook_url ?? legacy?.facebook_url ?? null,
    own_instagram_url: row?.own_instagram_url ?? legacy?.instagram_url ?? null,
    own_youtube_url: row?.own_youtube_url ?? legacy?.youtube_url ?? null,
    own_tiktok_url: row?.own_tiktok_url ?? legacy?.tiktok_url ?? null,
    own_video_url: row?.own_video_url ?? legacy?.video_url ?? null,
    own_video_external_url: row?.own_video_external_url ?? legacy?.video_external_url ?? null,
    own_video_storage_path: row?.own_video_storage_path ?? legacy?.video_storage_path ?? null,
    own_video_preferred_source:
      row?.own_video_preferred_source ?? legacy?.video_preferred_source ?? null,
    own_qr_code_with_logo: !!(row?.own_qr_code_with_logo ?? legacy?.qr_code_with_logo),

    agency_id: isAgencyMember ? row?.agency_id ?? null : null,
    agency_role: agencyRoleSafe,
    team_leader_id: null,
    is_agency_member: isAgencyMember,

    agency: isAgencyMember
      ? {
        id: row?.agency_id ?? null,
        updated_at: row?.agency_updated_at ?? null,
        name: row?.agency_name ?? null,
        logo_url: row?.agency_logo_url ?? null,
        logo_storage_path: row?.agency_logo_path ?? null,
        website_url: row?.agency_website_url ?? null,
        customer_review_url: row?.agency_customer_review_url ?? null,
        linkedin_url: row?.agency_linkedin_url ?? null,
        facebook_url: row?.agency_facebook_url ?? null,
        instagram_url: row?.agency_instagram_url ?? null,
        youtube_url: row?.agency_youtube_url ?? null,
        tiktok_url: row?.agency_tiktok_url ?? null,
        video_url: row?.agency_video_url ?? null,
        video_external_url: row?.agency_video_external_url ?? null,
        video_storage_path: row?.agency_video_storage_path ?? null,
        video_preferred_source: row?.agency_video_preferred_source ?? null,
        qr_code_with_logo: !!row?.agency_qr_code_with_logo,
        card_banner_color: row?.agency_card_banner_color ?? null,
        card_text_color: row?.agency_card_text_color ?? null,
        card_primary_button_color: row?.agency_card_primary_button_color ?? null,
        card_secondary_button_color: row?.agency_card_secondary_button_color ?? null,
        card_name_color: row?.agency_card_name_color ?? null,
        card_signature_color: row?.agency_card_signature_color ?? null,
        card_company_name_color: row?.agency_card_company_name_color ?? null,
        card_support_text_color: row?.agency_card_support_text_color ?? null,
        card_qr_fg_color: row?.agency_card_qr_fg_color ?? null,
      }
      : null,

    agency_name: isAgencyMember ? row?.agency_name ?? null : null,
    agency_logo_url: isAgencyMember ? row?.agency_logo_url ?? null : null,
    agency_logo_path: isAgencyMember ? row?.agency_logo_path ?? null : null,
    agency_public_website_url: isAgencyMember ? row?.agency_website_url ?? null : null,
    agency_qr_code_with_logo: isAgencyMember ? !!row?.agency_qr_code_with_logo : false,

    video_url: isAgencyMember ? row?.effective_video_url ?? null : independentVideoUrl,
    video_external_url: isAgencyMember
      ? row?.effective_video_external_url ?? null
      : independentVideoExternalUrl,
    video_storage_path: isAgencyMember
      ? row?.effective_video_storage_path ?? null
      : independentVideoStoragePath,
    video_preferred_source: isAgencyMember
      ? trimOrNull(row?.effective_video_preferred_source) || "none"
      : independentVideoPreferredSource,

    custom_video_url: legacy?.custom_video_url ?? null,
    custom_logo_url: legacy?.custom_logo_url ?? null,

    effective_company_name: row?.effective_company_name ?? null,
    effective_logo_url: row?.effective_logo_url ?? null,
    effective_logo_path: row?.effective_logo_path ?? null,
    effective_website_url: row?.effective_website_url ?? null,
    effective_customer_review_url: row?.effective_customer_review_url ?? null,
    effective_linkedin_url: row?.effective_linkedin_url ?? null,
    effective_facebook_url: row?.effective_facebook_url ?? null,
    effective_instagram_url: row?.effective_instagram_url ?? null,
    effective_youtube_url: row?.effective_youtube_url ?? null,
    effective_tiktok_url: row?.effective_tiktok_url ?? null,
    effective_video_url: row?.effective_video_url ?? null,
    effective_video_external_url: row?.effective_video_external_url ?? null,
    effective_video_storage_path: row?.effective_video_storage_path ?? null,
    effective_video_preferred_source: row?.effective_video_preferred_source ?? null,

    effective_card_banner_color: row?.effective_card_banner_color ?? cardBannerColor,
    effective_card_text_color: row?.effective_card_text_color ?? cardTextColor,
    effective_card_primary_button_color:
      row?.effective_card_primary_button_color ?? cardPrimaryButtonColor,
    effective_card_secondary_button_color:
      row?.effective_card_secondary_button_color ?? cardSecondaryButtonColor,
    effective_card_name_color: row?.effective_card_name_color ?? cardNameColor,
    effective_card_signature_color: row?.effective_card_signature_color ?? cardSignatureColor,
    effective_card_company_name_color:
      row?.effective_card_company_name_color ?? cardCompanyNameColor,
    effective_card_support_text_color:
      row?.effective_card_support_text_color ?? cardSupportTextColor,
    effective_card_qr_fg_color: row?.effective_card_qr_fg_color ?? cardQrFgColor,
    effective_qr_code_with_logo: !!row?.effective_qr_code_with_logo,

    card_banner_color: cardBannerColor,
    card_text_color: cardTextColor,
    card_primary_button_color: cardPrimaryButtonColor,
    card_secondary_button_color: cardSecondaryButtonColor,
    card_name_color: cardNameColor,
    card_signature_color: cardSignatureColor,
    card_company_name_color: cardCompanyNameColor,
    card_support_text_color: cardSupportTextColor,
    card_qr_fg_color: cardQrFgColor,

    card_url_clicks: Number(
      premiumCardRow?.card_url_clicks ??
      legacy?.card_url_clicks ??
      0
    ),
    card_qr_scans: Number(
      premiumCardRow?.card_qr_scans ??
      legacy?.card_qr_scans ??
      0
    ),

    appointment_url: row?.appointment_url ?? legacy?.appointment_url ?? null,
    cpi_number: trimOrNull(row?.cpi_number ?? legacy?.cpi_number),
    card_slug: row?.card_slug ?? legacy?.card_slug ?? null,
    premium_professionnel_card:
      premiumCardRow?.premium_professionnel_card ??
      row?.premium_professionnel_card ??
      legacy?.premium_professionnel_card ??
      null,
    premium_card_tracking_key:
      premiumCardRow?.premium_card_tracking_key ??
      premiumCardRow?.premium_professionnel_card ??
      row?.premium_professionnel_card ??
      legacy?.premium_professionnel_card ??
      row?.card_slug ??
      legacy?.card_slug ??
      null,
    digital_card_livingroom_url:
      premiumCardRow?.digital_card_livingroom_url ||
      row?.digital_card_livingroom_url ||
      legacy?.digital_card_livingroom_url ||
      null,
    digital_card_livingpage_url:
      premiumCardRow?.digital_card_livingpage_url || null,

    is_public: row?.is_public ?? legacy?.is_public ?? true,
    visibility_pro_partner_page:
      row?.visibility_pro_partner_page ?? legacy?.visibility_pro_partner_page ?? true,
    is_active: row?.is_active ?? legacy?.is_active ?? true,
    is_archived: row?.is_archived ?? legacy?.is_archived ?? false,

    allow_card_customization: !isAgencyMember,

    qr_code_with_logo: isAgencyMember
      ? !!(row?.effective_qr_code_with_logo ?? row?.agency_qr_code_with_logo)
      : !!independentQrWithLogo,

    billing_plan: subRow?.billing_plan || null,
    access_plan: subRow?.access_plan || null,
  };
}

function buildHydratedFromLegacy(
  base,
  agencyData,
  isAgencyMember,
  authUid,
  authEmail,
  subRow,
  premiumCardRow = null
) {
  const agencyRoleSafe = trimOrNull(base?.agency_role) || "agent";
  const rawLegacyFix = ensureAvatarLogoPathFromLegacyUrl(base || {});
  const legacyFix = sanitizeLegacyFixForRole(rawLegacyFix, agencyRoleSafe, base?.agency_id);
  const cardSource = base || {};

  const cardBannerColor =
    pickColor(
      isAgencyMember ? agencyData?.card_banner_color : null,
      cardSource?.card_banner_color,
      COLOR_DEFAULTS.card_banner_color
    ) ?? COLOR_DEFAULTS.card_banner_color;

  const cardTextColor =
    pickColor(
      isAgencyMember ? agencyData?.card_text_color : null,
      cardSource?.card_text_color,
      COLOR_DEFAULTS.card_text_color
    ) ?? COLOR_DEFAULTS.card_text_color;

  const cardPrimaryButtonColor =
    pickColor(
      isAgencyMember ? agencyData?.card_primary_button_color : null,
      cardSource?.card_primary_button_color,
      COLOR_DEFAULTS.card_primary_button_color
    ) ?? COLOR_DEFAULTS.card_primary_button_color;

  const cardSecondaryButtonColor =
    pickColor(
      isAgencyMember ? agencyData?.card_secondary_button_color : null,
      cardSource?.card_secondary_button_color,
      COLOR_DEFAULTS.card_secondary_button_color
    ) ?? COLOR_DEFAULTS.card_secondary_button_color;

  const cardNameColor =
    pickColor(
      isAgencyMember ? agencyData?.card_name_color : null,
      cardSource?.card_name_color,
      COLOR_DEFAULTS.card_name_color
    ) ?? COLOR_DEFAULTS.card_name_color;

  const cardSignatureColor =
    pickColor(
      isAgencyMember ? agencyData?.card_signature_color : null,
      cardSource?.card_signature_color,
      COLOR_DEFAULTS.card_signature_color
    ) ?? COLOR_DEFAULTS.card_signature_color;

  const cardCompanyNameColor =
    pickColor(
      isAgencyMember ? agencyData?.card_company_name_color : null,
      cardSource?.card_company_name_color,
      COLOR_DEFAULTS.card_company_name_color
    ) ?? COLOR_DEFAULTS.card_company_name_color;

  const cardSupportTextColor =
    pickColor(
      isAgencyMember ? agencyData?.card_support_text_color : null,
      cardSource?.card_support_text_color,
      COLOR_DEFAULTS.card_support_text_color
    ) ?? COLOR_DEFAULTS.card_support_text_color;

  const cardQrFgColor =
    pickColor(
      isAgencyMember ? agencyData?.card_qr_fg_color : null,
      cardSource?.card_qr_fg_color,
      COLOR_DEFAULTS.card_qr_fg_color
    ) ?? COLOR_DEFAULTS.card_qr_fg_color;

  return {
    ...base,
    ...legacyFix,

    id: base?.id || authUid,
    user_id: base?.user_id || authUid,
    email: trimOrNull(base?.email) || authEmail || null,

    own_company_name: base?.company_name ?? null,
    own_logo_url: base?.logo_url ?? null,
    own_logo_path: base?.logo_path ?? null,
    own_agency_website_url: base?.agency_website_url ?? null,
    own_customer_review_url: base?.customer_review_url ?? null,
    own_linkedin_url: base?.linkedin_url ?? null,
    own_facebook_url: base?.facebook_url ?? null,
    own_instagram_url: base?.instagram_url ?? null,
    own_youtube_url: base?.youtube_url ?? null,
    own_tiktok_url: base?.tiktok_url ?? null,
    own_video_url: base?.video_url ?? null,
    own_video_external_url: base?.video_external_url ?? null,
    own_video_storage_path: base?.video_storage_path ?? null,
    own_video_preferred_source: base?.video_preferred_source ?? null,
    own_qr_code_with_logo: !!base?.qr_code_with_logo,

    agency_id: isAgencyMember ? base?.agency_id ?? null : null,
    team_leader_id: base?.team_leader_id ?? null,
    agency_role: agencyRoleSafe,
    is_agency_member: isAgencyMember,

    agency: isAgencyMember ? agencyData || null : null,
    agency_name: isAgencyMember ? agencyData?.name ?? null : null,
    agency_logo_url: isAgencyMember ? agencyData?.logo_url ?? null : null,
    agency_logo_path: isAgencyMember ? agencyData?.logo_storage_path ?? null : null,
    agency_public_website_url: isAgencyMember ? agencyData?.website_url ?? null : null,
    agency_qr_code_with_logo: isAgencyMember ? !!agencyData?.qr_code_with_logo : false,

    company_name: isAgencyMember ? agencyData?.name ?? null : base?.company_name ?? null,
    logo_url: isAgencyMember ? agencyData?.logo_url ?? null : base?.logo_url ?? null,
    logo_path: isAgencyMember ? agencyData?.logo_storage_path ?? null : base?.logo_path ?? null,
    agency_website_url: isAgencyMember
      ? agencyData?.website_url ?? null
      : base?.agency_website_url ?? null,

    customer_review_url: isAgencyMember
      ? agencyData?.customer_review_url ?? null
      : base?.customer_review_url ?? null,

    linkedin_url: isAgencyMember ? agencyData?.linkedin_url ?? null : base?.linkedin_url ?? null,
    facebook_url: isAgencyMember ? agencyData?.facebook_url ?? null : base?.facebook_url ?? null,
    instagram_url: isAgencyMember
      ? agencyData?.instagram_url ?? null
      : base?.instagram_url ?? null,
    youtube_url: isAgencyMember ? agencyData?.youtube_url ?? null : base?.youtube_url ?? null,
    tiktok_url: isAgencyMember ? agencyData?.tiktok_url ?? null : base?.tiktok_url ?? null,

    video_url: isAgencyMember ? agencyData?.video_url ?? null : base?.video_url ?? null,
    video_external_url: isAgencyMember
      ? agencyData?.video_external_url ?? null
      : base?.video_external_url ?? null,
    video_storage_path: isAgencyMember
      ? agencyData?.video_storage_path ?? null
      : base?.video_storage_path ?? null,
    video_preferred_source:
      trimOrNull(isAgencyMember ? agencyData?.video_preferred_source : base?.video_preferred_source) ||
      "none",

    effective_company_name: isAgencyMember ? agencyData?.name ?? null : base?.company_name ?? null,
    effective_logo_url: isAgencyMember ? agencyData?.logo_url ?? null : base?.logo_url ?? null,
    effective_logo_path: isAgencyMember
      ? agencyData?.logo_storage_path ?? null
      : base?.logo_path ?? null,
    effective_website_url: isAgencyMember
      ? agencyData?.website_url ?? null
      : base?.agency_website_url ?? null,
    effective_customer_review_url: isAgencyMember
      ? agencyData?.customer_review_url ?? null
      : base?.customer_review_url ?? null,
    effective_linkedin_url: isAgencyMember ? agencyData?.linkedin_url ?? null : base?.linkedin_url ?? null,
    effective_facebook_url: isAgencyMember ? agencyData?.facebook_url ?? null : base?.facebook_url ?? null,
    effective_instagram_url: isAgencyMember ? agencyData?.instagram_url ?? null : base?.instagram_url ?? null,
    effective_youtube_url: isAgencyMember ? agencyData?.youtube_url ?? null : base?.youtube_url ?? null,
    effective_tiktok_url: isAgencyMember ? agencyData?.tiktok_url ?? null : base?.tiktok_url ?? null,
    effective_video_url: isAgencyMember ? agencyData?.video_url ?? null : base?.video_url ?? null,
    effective_video_external_url: isAgencyMember
      ? agencyData?.video_external_url ?? null
      : base?.video_external_url ?? null,
    effective_video_storage_path: isAgencyMember
      ? agencyData?.video_storage_path ?? null
      : base?.video_storage_path ?? null,
    effective_video_preferred_source: isAgencyMember
      ? agencyData?.video_preferred_source ?? null
      : base?.video_preferred_source ?? null,

    card_banner_color: cardBannerColor,
    card_text_color: cardTextColor,
    card_primary_button_color: cardPrimaryButtonColor,
    card_secondary_button_color: cardSecondaryButtonColor,
    card_name_color: cardNameColor,
    card_signature_color: cardSignatureColor,
    card_company_name_color: cardCompanyNameColor,
    card_support_text_color: cardSupportTextColor,
    card_qr_fg_color: cardQrFgColor,

    effective_card_banner_color: cardBannerColor,
    effective_card_text_color: cardTextColor,
    effective_card_primary_button_color: cardPrimaryButtonColor,
    effective_card_secondary_button_color: cardSecondaryButtonColor,
    effective_card_name_color: cardNameColor,
    effective_card_signature_color: cardSignatureColor,
    effective_card_company_name_color: cardCompanyNameColor,
    effective_card_support_text_color: cardSupportTextColor,
    effective_card_qr_fg_color: cardQrFgColor,

    card_url_clicks: Number(
      premiumCardRow?.card_url_clicks ??
      cardSource?.card_url_clicks ??
      0
    ),
    card_qr_scans: Number(
      premiumCardRow?.card_qr_scans ??
      cardSource?.card_qr_scans ??
      0
    ),

    appointment_url: base?.appointment_url ?? null,
    cpi_number: trimOrNull(base?.cpi_number),
    card_slug: base?.card_slug ?? null,
    premium_professionnel_card:
      premiumCardRow?.premium_professionnel_card ??
      base?.premium_professionnel_card ??
      null,
    premium_card_tracking_key:
      premiumCardRow?.premium_card_tracking_key ??
      premiumCardRow?.premium_professionnel_card ??
      base?.premium_professionnel_card ??
      base?.card_slug ??
      null,
    digital_card_livingroom_url:
      premiumCardRow?.digital_card_livingroom_url ||
      base?.digital_card_livingroom_url ||
      null,
    digital_card_livingpage_url:
      premiumCardRow?.digital_card_livingpage_url || null,

    is_public: base?.is_public ?? true,
    visibility_pro_partner_page: base?.visibility_pro_partner_page ?? true,
    is_active: base?.is_active ?? true,
    is_archived: base?.is_archived ?? false,

    allow_card_customization: !isAgencyMember,

    qr_code_with_logo: isAgencyMember ? !!agencyData?.qr_code_with_logo : !!base?.qr_code_with_logo,
    effective_qr_code_with_logo: isAgencyMember
      ? !!agencyData?.qr_code_with_logo
      : !!base?.qr_code_with_logo,

    custom_video_url: base?.custom_video_url ?? null,
    custom_logo_url: base?.custom_logo_url ?? null,

    billing_plan: subRow?.billing_plan || null,
    access_plan: subRow?.access_plan || null,
  };
}

export function useProCardData(authUid, authEmail) {
  const [profile, _setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cacheRef = useRef({});
  const inFlightRef = useRef(false);

  const dirtyRef = useRef(false);
  const dirtyKeysRef = useRef(new Set());

  const markDirtyFromNext = useCallback((prev, next) => {
    if (!isObject(prev) || !isObject(next)) {
      dirtyRef.current = true;
      return;
    }

    const keys = new Set([...Object.keys(prev || {}), ...Object.keys(next || {})]);
    keys.forEach((k) => {
      if (prev?.[k] !== next?.[k]) dirtyKeysRef.current.add(k);
    });

    dirtyRef.current = true;
  }, []);

  const setProfile = useCallback(
    (updater) => {
      _setProfile((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        try {
          markDirtyFromNext(prev, next);
        } catch {
          dirtyRef.current = true;
        }
        return next;
      });
    },
    [markDirtyFromNext]
  );

  const refreshProfile = useCallback(
    async (opts = {}) => {
      const { clearDirty = false } = opts || {};

      if (clearDirty) {
        dirtyRef.current = false;
        dirtyKeysRef.current = new Set();
      }

      if (!authUid) {
        _setProfile(null);
        setLoading(false);
        return;
      }

      if (!supabase) {
        setError(
          new Error("La connexion à la base de données est impossible (client Supabase manquant).")
        );
        setLoading(false);
        return;
      }

      if (inFlightRef.current) return;
      inFlightRef.current = true;

      setLoading(true);
      setError(null);

      try {
        const identity = await resolveProfessionnelIdentity(authUid, authEmail);
        const professionnelId = identity?.professionnelId || authUid;
        const resolvedAuthEmail = identity?.authEmail || authEmail || null;

        let premiumCardRow = null;

        try {
          premiumCardRow = await loadFromProCardsEffective(professionnelId);
        } catch (e) {
          if (!isMissingRelationError(e) && !isMissingColumnError(e)) {
            throw e;
          }
        }

        const subQ = supabase
          .from("pro_subscriptions")
          .select("billing_plan, access_plan")
          .eq("professionnel_id", professionnelId)
          .maybeSingle();

        const subRes = await Promise.allSettled([
          withTimeout(subQ, 4500, "pro_subscriptions select"),
        ]);

        const subRow =
          subRes[0].status === "fulfilled" && !subRes[0].value.error
            ? subRes[0].value.data
            : null;

        let hydrated = null;

        try {
          const effectiveRow = await loadFromEffectiveView(authUid, professionnelId);

          if (effectiveRow) {
            let legacyOverlay = null;

            if (shouldOverlayLegacyIndependentData(effectiveRow)) {
              const legacy = await loadLegacyRaw(authUid, resolvedAuthEmail, professionnelId);
              legacyOverlay = legacy?.base || null;
            }

            hydrated = buildHydratedFromEffectiveRow(
              effectiveRow,
              authUid,
              resolvedAuthEmail,
              subRow,
              legacyOverlay,
              premiumCardRow
            );
          } else {
            const legacy = await loadLegacyRaw(authUid, resolvedAuthEmail, professionnelId);

            hydrated = buildHydratedFromLegacy(
              legacy.base,
              legacy.agency,
              legacy.isAgencyMember,
              authUid,
              resolvedAuthEmail,
              subRow,
              premiumCardRow
            );

            const backfillPatch = {};
            const agencyRoleSafe = trimOrNull(legacy.base?.agency_role) || "agent";
            const rawLegacyFix = ensureAvatarLogoPathFromLegacyUrl(legacy.base || {});
            const legacyFix = sanitizeLegacyFixForRole(
              rawLegacyFix,
              agencyRoleSafe,
              legacy.base?.agency_id
            );

            if (!trimOrNull(legacy.base?.agency_role)) {
              backfillPatch.agency_role = "agent";
            }

            if (!legacy.isAgencyMember) {
              if ("avatar_path" in legacyFix) backfillPatch.avatar_path = legacyFix.avatar_path;
              if ("avatar_url" in legacyFix) backfillPatch.avatar_url = legacyFix.avatar_url;
              if ("logo_path" in legacyFix) backfillPatch.logo_path = legacyFix.logo_path;
              if ("logo_url" in legacyFix) backfillPatch.logo_url = legacyFix.logo_url;
            } else {
              if ("avatar_path" in legacyFix) backfillPatch.avatar_path = legacyFix.avatar_path;
              if ("avatar_url" in legacyFix) backfillPatch.avatar_url = legacyFix.avatar_url;
            }

            if (Object.keys(backfillPatch).length > 0) {
              updateThenInsertProfessionnel(identity, backfillPatch, resolvedAuthEmail).catch((e) =>
                console.warn("PROFILE_BACKFILL_FAILED", e)
              );
            }
          }
        } catch (effectiveErr) {
          if (!isMissingRelationError(effectiveErr) && !isMissingColumnError(effectiveErr)) {
            throw effectiveErr;
          }

          const legacy = await loadLegacyRaw(authUid, resolvedAuthEmail, professionnelId);

          hydrated = buildHydratedFromLegacy(
            legacy.base,
            legacy.agency,
            legacy.isAgencyMember,
            authUid,
            resolvedAuthEmail,
            subRow,
            premiumCardRow
          );

          const backfillPatch = {};
          const agencyRoleSafe = trimOrNull(legacy.base?.agency_role) || "agent";
          const rawLegacyFix = ensureAvatarLogoPathFromLegacyUrl(legacy.base || {});
          const legacyFix = sanitizeLegacyFixForRole(
            rawLegacyFix,
            agencyRoleSafe,
            legacy.base?.agency_id
          );

          if (!trimOrNull(legacy.base?.agency_role)) {
            backfillPatch.agency_role = "agent";
          }

          if (!legacy.isAgencyMember) {
            if ("avatar_path" in legacyFix) backfillPatch.avatar_path = legacyFix.avatar_path;
            if ("avatar_url" in legacyFix) backfillPatch.avatar_url = legacyFix.avatar_url;
            if ("logo_path" in legacyFix) backfillPatch.logo_path = legacyFix.logo_path;
            if ("logo_url" in legacyFix) backfillPatch.logo_url = legacyFix.logo_url;
          } else {
            if ("avatar_path" in legacyFix) backfillPatch.avatar_path = legacyFix.avatar_path;
            if ("avatar_url" in legacyFix) backfillPatch.avatar_url = legacyFix.avatar_url;
          }

          if (Object.keys(backfillPatch).length > 0) {
            updateThenInsertProfessionnel(identity, backfillPatch, resolvedAuthEmail).catch((e) =>
              console.warn("PROFILE_BACKFILL_FAILED", e)
            );
          }
        }

        cacheRef.current[authUid] = { hydrated };

        _setProfile((prev) => {
          if (!prev || !dirtyRef.current) return hydrated;

          const merged = { ...hydrated };

          dirtyKeysRef.current.forEach((k) => {
            if (BRANDING_SERVER_KEYS.has(k)) return;
            merged[k] = prev?.[k];
          });

          return merged;
        });
      } catch (e) {
        console.error("LOAD_PRO_PROFILE_ERROR", e);
        setError(e);
        _setProfile(null);
      } finally {
        inFlightRef.current = false;
        setLoading(false);
      }
    },
    [authUid, authEmail]
  );

  useEffect(() => {
    if (authUid && cacheRef.current[authUid]) {
      _setProfile(cacheRef.current[authUid].hydrated);
      setLoading(false);
      refreshProfile({ clearDirty: true });
    } else {
      refreshProfile({ clearDirty: true });
    }
  }, [authUid, refreshProfile]);

  return {
    profile,
    setProfile,
    loading,
    error,
    refreshProfile,
  };
}