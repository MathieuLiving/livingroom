import { supabase } from "@/lib/customSupabaseClient";

/**
 * Checks if a value is not null, undefined, or an empty string.
 */
const isFilled = (v) => v !== undefined && v !== null && String(v).trim() !== "";

/**
 * Checks if a string starts with http:// or https://
 */
const isHttpUrl = (v) => /^https?:\/\//i.test(String(v || "").trim());

/**
 * Constants for the different Supabase storage buckets used in the application.
 */
export const ASSET_BUCKETS = {
  PROFESSIONAL_ASSETS: "professional-assets",
  AGENCY_ASSETS: "agency-assets",
};

/**
 * Adds a cache-busting version parameter to a URL if an update timestamp is provided.
 * @param {string} url - The base URL
 * @param {string|Date} updatedAt - The timestamp to use as version
 * @returns {string} The URL with the version parameter appended
 */
export function withCacheBuster(url, updatedAt) {
  const u = String(url || "").trim();
  const t = String(updatedAt || "").trim();
  if (!u || !t) return u;
  // If URL already has a query string, use & instead of ?
  return `${u}${u.includes("?") ? "&" : "?"}v=${encodeURIComponent(t)}`;
}

/**
 * Resolves a storage path to a public URL or returns the input if it's already a full URL.
 * @param {string} bucket - The Supabase storage bucket name
 * @param {string} pathOrUrl - The file path in storage or a direct URL
 * @returns {string} The public URL or an empty string if invalid
 */
export function storagePublicUrl(bucket, pathOrUrl) {
  const v = String(pathOrUrl || "").trim();
  if (!v) return "";
  
  // If it's already a full HTTP URL (legacy data), return it as is
  if (isHttpUrl(v)) return v;

  try {
    // Note: getPublicUrl is a synchronous call in Supabase JS v2
    const { data } = supabase.storage.from(bucket).getPublicUrl(v);
    return data?.publicUrl || "";
  } catch (error) {
    console.error(`Error resolving public URL for bucket ${bucket}:`, error);
    return "";
  }
}

/**
 * Generic image resolver that handles path vs url logic and adds cache busting.
 * @param {Object} params
 * @param {string} params.bucket - The storage bucket
 * @param {string} params.path - The storage path (e.g., avatar_path)
 * @param {string} params.url - The legacy direct URL (e.g., avatar_url)
 * @param {string|Date} params.updatedAt - The update timestamp for cache busting
 * @returns {string} The resolved image URL
 */
export function resolveImage({ bucket, path, url, updatedAt }) {
  const p = String(path || "").trim();
  const u = String(url || "").trim();

  // 1. Priority to the new storage path standard
  if (isFilled(p)) {
    const pub = storagePublicUrl(bucket, p);
    return withCacheBuster(pub, updatedAt);
  }

  // 2. Fallback to the legacy direct URL field
  if (isFilled(u)) {
    return withCacheBuster(u, updatedAt);
  }

  return "";
}

/**
 * Domain Helper: Resolves a professional's avatar URL.
 * @param {Object} pro - Professional data object
 * @returns {string}
 */
export function resolveProAvatar(pro) {
  return resolveImage({
    bucket: ASSET_BUCKETS.PROFESSIONAL_ASSETS,
    path: pro?.avatar_path,
    url: pro?.avatar_url,
    updatedAt: pro?.updated_at,
  });
}

/**
 * Domain Helper: Resolves a professional's logo URL.
 * @param {Object} pro - Professional data object
 * @returns {string}
 */
export function resolveProLogo(pro) {
  return resolveImage({
    bucket: ASSET_BUCKETS.PROFESSIONAL_ASSETS,
    path: pro?.logo_path,
    url: pro?.logo_url,
    updatedAt: pro?.updated_at,
  });
}

/**
 * Domain Helper: Resolves an agency's logo URL.
 * @param {Object} agency - Agency data object
 * @returns {string}
 */
export function resolveAgencyLogo(agency) {
  return resolveImage({
    bucket: ASSET_BUCKETS.AGENCY_ASSETS,
    path: agency?.logo_path,
    url: agency?.logo_url,
    updatedAt: agency?.updated_at,
  });
}