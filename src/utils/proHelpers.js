import { supabase } from "../../lib/customSupabaseClient";

// --- Constants ---
export const COLOR_DEFAULTS = {
  card_banner_color: "#22577A",
  card_text_color: "#22577A",
  card_primary_button_color: "#F89223",
  card_secondary_button_color: "#22577A",
  card_qr_fg_color: "#005E9E",
  card_name_color: "#22577A",
  card_signature_color: "#22577A",
  card_company_name_color: "#6B7280",
  card_support_text_color: "#334155",
};

export const CARD_COLOR_KEYS = [
  "card_banner_color",
  "card_text_color",
  "card_primary_button_color",
  "card_secondary_button_color",
  "card_qr_fg_color",
  "card_name_color",
  "card_signature_color",
  "card_company_name_color",
  "card_support_text_color",
];

const HEX_REGEX = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
const BUCKET = "professional-assets";

// --- Helper Functions ---

export const isValidHex = (v) => {
  if (!v) return false;
  const val = String(v).trim();
  return HEX_REGEX.test(val);
};

export const normalizeHexOrUndefined = (v) => {
  const s = String(v || "").trim();
  if (!s) return undefined;
  if (!isValidHex(s)) return undefined;
  return s;
};

export const trimOrNull = (v) => {
  const s = (v ?? "").toString().trim();
  return s ? s : null;
};

export const appendParam = (url, key, value) => {
  if (!url) return null;
  try {
    const u = new URL(url);
    u.searchParams.set(key, value);
    return u.toString();
  } catch {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
  }
};

export const getSiteOrigin = () =>
  (import.meta?.env?.VITE_SITE_ORIGIN || "https://livingroom.immo").replace(
    /\/+$/,
    ""
  );

export const getUpgradeUrl = (plan = "premium") => {
  const origin = getSiteOrigin();
  const base =
    (import.meta?.env?.VITE_PRO_UPGRADE_URL || "").trim() ||
    `${origin}/pro-de-limmo#pricing`;
  return appendParam(base, "plan", plan);
};

/**
 * Conservé uniquement comme helper rétro-compatible
 * pour d'éventuels écrans de facturation encore non migrés.
 * Ne doit plus être utilisé pour piloter le rendu de la carte digitale.
 */
export const hasPremiumAccess = (p) => {
  if (typeof p?.has_premium_access === "boolean") return p.has_premium_access;

  const effective = String(p?.effective_plan || "").toLowerCase();
  if (["premium", "premium_plus"].includes(effective)) return true;

  const plan = String(p?.billing_plan || "").toLowerCase();
  const access = String(p?.access_plan || "").toLowerCase();
  return (
    ["premium", "premium_plus"].includes(plan) ||
    ["premium", "premium_plus"].includes(access)
  );
};

/**
 * Retourne toujours les 9 couleurs de carte.
 * Toute valeur invalide ou vide est remplacée par un défaut stable.
 */
export const buildCardColorsPayload = (profile) => ({
  card_banner_color:
    normalizeHexOrUndefined(profile?.card_banner_color) ??
    COLOR_DEFAULTS.card_banner_color,
  card_text_color:
    normalizeHexOrUndefined(profile?.card_text_color) ??
    COLOR_DEFAULTS.card_text_color,
  card_primary_button_color:
    normalizeHexOrUndefined(profile?.card_primary_button_color) ??
    COLOR_DEFAULTS.card_primary_button_color,
  card_secondary_button_color:
    normalizeHexOrUndefined(profile?.card_secondary_button_color) ??
    COLOR_DEFAULTS.card_secondary_button_color,
  card_qr_fg_color:
    normalizeHexOrUndefined(profile?.card_qr_fg_color) ??
    COLOR_DEFAULTS.card_qr_fg_color,
  card_name_color:
    normalizeHexOrUndefined(profile?.card_name_color) ??
    COLOR_DEFAULTS.card_name_color,
  card_signature_color:
    normalizeHexOrUndefined(profile?.card_signature_color) ??
    COLOR_DEFAULTS.card_signature_color,
  card_company_name_color:
    normalizeHexOrUndefined(profile?.card_company_name_color) ??
    COLOR_DEFAULTS.card_company_name_color,
  card_support_text_color:
    normalizeHexOrUndefined(profile?.card_support_text_color) ??
    COLOR_DEFAULTS.card_support_text_color,
});

export const getPublicUrlFromPath = (path) => {
  if (!path) return null;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data?.publicUrl || null;
};

export const parseStoragePathFromPublicUrl = (url) => {
  if (!url || typeof url !== "string") return null;
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const path = url.slice(idx + marker.length);
  return path || null;
};

export const ensureAvatarLogoPathFromLegacyUrl = ({
  avatar_url,
  logo_url,
  avatar_path,
  logo_path,
}) => {
  const out = {};
  if (!avatar_path) {
    const p = parseStoragePathFromPublicUrl(avatar_url);
    if (p) out.avatar_path = p;
  }
  if (!logo_path) {
    const p = parseStoragePathFromPublicUrl(logo_url);
    if (p) out.logo_path = p;
  }
  return out;
};

export const withCacheBuster = (url) => {
  if (!url) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${Date.now()}`;
};

export const normalizeCvdUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  try {
    const url = new URL(rawUrl);
    const isCvd =
      url.hostname === "card.livingroom.immo" &&
      url.pathname.startsWith("/cvd/");
    if (!isCvd) return rawUrl;

    const parts = url.pathname.split("/").filter(Boolean);
    const slug = parts[1] || "";
    const slugClean = slug.replace(/-[a-z0-9]{3,10}$/i, "");

    const clean = new URL("https://card.livingroom.immo/");
    clean.pathname = `/cvd/${slugClean}`;
    clean.searchParams.set("cvd", "1");
    clean.searchParams.set("entry", "external");
    return clean.toString();
  } catch {
    return rawUrl;
  }
};

export const buildOperationalCvdFromSlug = (slug) => {
  const s = String(slug || "").trim();
  if (!s) return "";
  const u = new URL("https://card.livingroom.immo/");
  u.pathname = `/cvd/${encodeURIComponent(s)}`;
  u.searchParams.set("cvd", "1");
  u.searchParams.set("entry", "external");
  return u.toString();
};

export const buildQrValueFromOperationalUrl = (operationalUrl) => {
  return appendParam(operationalUrl, "src", "qr");
};

// UUID helper conservé pour compatibilité éventuelle hors carte.
export const isUuid = (v) =>
  typeof v === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    String(v).trim()
  );

export const normalizeUuidTextOrNull = (v) => {
  const s = String(v ?? "").trim();
  return isUuid(s) ? s : null;
};

/**
 * La carte digitale n'est plus pilotée par une logique premium.
 * Les compteurs sont désormais lus/écrits sur `professionnels`.
 */
export const bumpProCardsCounter = async (professionnelId, field) => {
  if (!professionnelId) return;
  if (field !== "card_url_clicks" && field !== "card_qr_scans") return;

  try {
    const { data, error: selErr } = await supabase
      .from("professionnels")
      .select("card_url_clicks, card_qr_scans")
      .eq("id", professionnelId)
      .maybeSingle();

    if (selErr) return;

    const next =
      field === "card_url_clicks"
        ? Number(data?.card_url_clicks || 0) + 1
        : Number(data?.card_qr_scans || 0) + 1;

    await supabase
      .from("professionnels")
      .update({
        [field]: next,
        updated_at: new Date().toISOString(),
      })
      .eq("id", professionnelId);
  } catch {
    // no-op
  }
};

export const dayKey = (d = new Date()) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString().slice(0, 10);
};

export const safeJsonParse = (s, fallback) => {
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
};

export const getDailySnapshotKey = (proId) => `lr_pro_daily_stats_${proId}`;

export const ensureTodaySnapshot = (proId, clicks, scans) => {
  if (!proId) return;
  const key = getDailySnapshotKey(proId);
  const store = safeJsonParse(localStorage.getItem(key) || "{}", {});
  const today = dayKey();
  if (!store[today]) {
    store[today] = {
      clicks,
      scans,
      created_at: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(store));
  }
};

export const computeTodayDeltas = (proId, clicks, scans) => {
  if (!proId) return { clicksDelta: 0, scansDelta: 0, today: dayKey() };
  const key = getDailySnapshotKey(proId);
  const store = safeJsonParse(localStorage.getItem(key) || "{}", {});
  const today = dayKey();
  const base = store[today] || { clicks, scans };
  return {
    today,
    clicksDelta: Math.max(0, Number(clicks || 0) - Number(base.clicks || 0)),
    scansDelta: Math.max(0, Number(scans || 0) - Number(base.scans || 0)),
  };
};

export const getExtFromFile = (file) => {
  const raw = (file?.name?.split(".").pop() || "jpg").toLowerCase();
  const clean = raw.replace(/[^a-z0-9]/g, "");
  if (["jpg", "jpeg", "png", "webp"].includes(clean)) return clean;
  return "jpg";
};