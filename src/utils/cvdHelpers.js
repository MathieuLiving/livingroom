import { supabase } from "../../lib/customSupabaseClient";

const trimSlashes = (value = "") => String(value || "").trim().replace(/\/+$/, "");
const isHttpUrl = (value) => /^https?:\/\//i.test(String(value || "").trim());

const getCardOrigin = () => {
  const cardOrigin = trimSlashes(import.meta.env.VITE_PUBLIC_CARD_ORIGIN || "");
  if (cardOrigin) return cardOrigin;

  const appOrigin = trimSlashes(import.meta.env.VITE_PUBLIC_APP_ORIGIN || "");
  if (appOrigin) return appOrigin;

  if (typeof window !== "undefined" && window.location?.origin) {
    return trimSlashes(window.location.origin);
  }

  return "";
};

const ensureExternalCardParams = (rawUrl, options = {}) => {
  const raw = String(rawUrl || "").trim();
  if (!raw) return "";

  try {
    const u = new URL(raw);

    if (options.cvd !== false) {
      u.searchParams.set("cvd", "1");
    }

    if (options.entry !== false) {
      u.searchParams.set("entry", options.entry || "external");
    }

    if (options.from) {
      u.searchParams.set("from", options.from);
    }

    if (options.layout) {
      u.searchParams.set("layout", String(options.layout));
    }

    return u.toString();
  } catch {
    return raw;
  }
};

export const getCvdSlug = (pro) => {
  return pro?.card_slug || null;
};

export const getPremiumPublicCardUrl = (pro, options = {}) => {
  const premiumUrl = String(
    pro?.premium_professionnel_card ||
      pro?.premium_public_url ||
      pro?.premium_card_url ||
      pro?.premiumCard?.public_url ||
      pro?.premiumCard?.publicUrl ||
      ""
  ).trim();

  if (!isHttpUrl(premiumUrl)) return null;

  return ensureExternalCardParams(premiumUrl, options);
};

export const getPublicCvdPath = (pro, options = {}) => {
  if (!pro) return null;

  const slug = getCvdSlug(pro);
  const params = new URLSearchParams();

  if (options.cvd !== false) {
    params.set("cvd", "1");
  }

  if (options.entry !== false) {
    params.set("entry", options.entry || "external");
  }

  if (options.from) {
    params.set("from", options.from);
  }

  if (options.layout) {
    params.set("layout", String(options.layout));
  }

  const qs = params.toString();
  const suffix = qs ? `?${qs}` : "";

  if (slug) {
    return `/cvd/${encodeURIComponent(slug)}${suffix}`;
  }

  if (pro.id) {
    return `/carte-visite-digitale/${encodeURIComponent(pro.id)}${suffix}`;
  }

  return null;
};

export const getPublicCvdUrl = (pro, options = {}) => {
  const premiumUrl = getPremiumPublicCardUrl(pro, options);
  if (premiumUrl) return premiumUrl;

  const path = getPublicCvdPath(pro, options);
  if (!path) return null;

  const origin = getCardOrigin();
  return origin ? `${origin}${path}` : path;
};

/**
 * Checks if a slug is available.
 * Returns true if available, false if taken.
 */
export const checkSlugAvailability = async (slug) => {
  if (!slug || slug.length < 3) return false;

  try {
    const { count, error } = await supabase
      .from("professionnels")
      .select("id", { count: "exact", head: true })
      .eq("card_slug", slug);

    if (error) throw error;

    return count === 0;
  } catch (error) {
    console.error("Error checking slug availability:", error);
    return false;
  }
};