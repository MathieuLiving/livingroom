import { supabase } from "../../lib/customSupabaseClient";

// URL publique Supabase
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || "").replace(/\/+$/, "");
const PUBLIC_BASE = SUPABASE_URL ? `${SUPABASE_URL}/storage/v1/object/public` : "";

/**
 * Ajoute un cache-buster à une URL (utile après upload)
 */
export const withCacheBuster = (url, buster) => {
  const u = String(url || "").trim();
  const b = String(buster || "").trim();
  if (!u) return null;
  if (!b) return u;
  return `${u}${u.includes("?") ? "&" : "?"}v=${encodeURIComponent(b)}`;
};

const isHttpUrl = (value) => /^https?:\/\//i.test(String(value || "").trim());

const publicUrlFrom = (bucket, path) => {
  const b = String(bucket || "").trim();
  const p = String(path || "").trim();

  if (!b || !p) return null;
  if (isHttpUrl(p)) return p;
  if (!PUBLIC_BASE) return null;

  return `${PUBLIC_BASE}/${b}/${p}`;
};

const getPathFromSupabasePublicUrl = (url, bucket) => {
  const u = String(url || "").trim();
  const b = String(bucket || "").trim();
  if (!u || !b) return null;

  const marker = `/storage/v1/object/public/${b}/`;
  const idx = u.indexOf(marker);
  if (idx === -1) return null;

  const path = u.slice(idx + marker.length).trim();
  return path || null;
};

/**
 * Retourne une URL publique stable à partir :
 * - d'une URL complète
 * - d'un path storage
 * - ou d'un legacy url Supabase
 */
export const getStoragePublicUrl = (bucket, value) => {
  const raw = String(value || "").trim();
  if (!bucket || !raw) return null;

  if (isHttpUrl(raw)) return raw;

  const direct = publicUrlFrom(bucket, raw);
  if (direct) return direct;

  try {
    const { data } = supabase.storage.from(bucket).getPublicUrl(raw);
    return data?.publicUrl || null;
  } catch {
    return null;
  }
};

/**
 * ✅ AVATARS
 * Standard :
 * - public-avatars / avatars/{uid}/...
 * Legacy :
 * - professional-assets
 */
export const getAvatarUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return null;

  if (isHttpUrl(raw)) return raw;

  if (raw.startsWith("avatars/")) {
    return publicUrlFrom("public-avatars", raw);
  }

  return publicUrlFrom("professional-assets", raw);
};

export const getAvatarUrlWithBust = (value, buster) =>
  withCacheBuster(getAvatarUrl(value), buster);

/**
 * ✅ LOGOS
 * Cas supportés :
 * - agence      : agency/...        -> agency-assets
 * - indépendant : logos/...         -> public-logos
 * - legacy      : autres paths      -> professional-assets
 * - URL déjà complète -> renvoyée telle quelle
 */
export const getLogoUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return null;

  if (isHttpUrl(raw)) return raw;

  // Logo agence
  if (raw.startsWith("agency/")) {
    return publicUrlFrom("agency-assets", raw);
  }

  // Logo pro standard
  if (raw.startsWith("logos/")) {
    return publicUrlFrom("public-logos", raw);
  }

  // Legacy
  return publicUrlFrom("professional-assets", raw);
};

export const getLogoUrlWithBust = (value, buster) =>
  withCacheBuster(getLogoUrl(value), buster);

/**
 * Project photos
 */
export const getProjectPhotoUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return null;

  if (isHttpUrl(raw)) return raw;

  return publicUrlFrom("project-photos", raw);
};

/**
 * Helpers de conversion éventuels si tu as encore des logo_url legacy
 */
export const getAgencyLogoPathFromUrl = (url) =>
  getPathFromSupabasePublicUrl(url, "agency-assets");

export const getProLogoPathFromUrl = (url) =>
  getPathFromSupabasePublicUrl(url, "public-logos");

export const getProfessionalAssetsPathFromUrl = (url) =>
  getPathFromSupabasePublicUrl(url, "professional-assets");