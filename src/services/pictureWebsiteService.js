import { supabase } from "../../lib/customSupabaseClient";

/**
 * ------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------
 */

function getFileExt(file) {
  const parts = String(file?.name || "").split(".");
  return (parts.length > 1 ? parts.pop() : "jpg").toLowerCase();
}

function sanitizeSegment(v) {
  return String(v ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-_.]/g, "");
}

/**
 * Resolves a professional image (avatar, logo) to a usable public URL.
 * Handles:
 * - Absolute URLs (http/https)
 * - Base64 data URIs
 * - Relative storage paths (defaults to 'professional-assets' bucket, fallback to 'agency-assets' for legacy)
 */
export function resolveProImage(pathOrUrl) {
  if (!pathOrUrl) return "";
  const s = String(pathOrUrl).trim();
  if (!s) return "";

  // 1. Absolute URL or Data URI
  if (/^https?:\/\//i.test(s) || s.startsWith("data:")) {
    return s;
  }

  // 2. Relative path -> Resolve via Supabase Storage
  // Heuristic:
  // - "website-photos/..." -> legacy "agency-assets"
  // - "agency/..." -> legacy "agency-assets"
  // - "avatar/..." or "logo/..." -> new "professional-assets"
  // - default -> "professional-assets"
  
  let bucket = "professional-assets";
  if (s.startsWith("website-photos/") || s.startsWith("agency/")) {
    bucket = "agency-assets";
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(s);
  return data?.publicUrl || s;
}

/**
 * Build a storage path following a consistent convention.
 *
 * ✅ NEW CONVENTION (your target):
 * - All professional images stored under: avatar/{professionnelId}/...
 *   - avatar: avatar/{professionnelId}/avatar_{assetId}.{ext}
 *   - logo:   avatar/{professionnelId}/logo_{assetId}.{ext}
 *
 * Other assets:
 * - website: website/{pageSlug}/{slotKey}/{assetId}.{ext}
 * - blog:    blog/{slug}/{assetId}.{ext}
 * - generic: {kind}/{assetId}.{ext}
 */
function buildStoragePath({
  kind = "website", // "website" | "blog" | "avatar" | "logo" | "generic"
  pageSlug,
  slotKey,
  blogSlug,
  professionnelId,
  assetId,
  ext,
}) {
  const safeKind = sanitizeSegment(kind || "generic");
  const safeExt = sanitizeSegment(ext || "jpg");
  const safeAssetId = sanitizeSegment(assetId);

  // ✅ Your requirement: everything for a pro goes under "avatar/{proId}/"
  if (safeKind === "avatar") {
    if (!professionnelId)
      throw new Error("professionnelId is required for avatar uploads.");
    const pid = sanitizeSegment(professionnelId);
    return `avatar/${pid}/avatar_${safeAssetId}.${safeExt}`;
  }

  if (safeKind === "logo") {
    if (!professionnelId)
      throw new Error("professionnelId is required for logo uploads.");
    const pid = sanitizeSegment(professionnelId);
    return `avatar/${pid}/logo_${safeAssetId}.${safeExt}`;
  }

  if (safeKind === "blog") {
    const s = sanitizeSegment(blogSlug || "blog");
    return `blog/${s}/${safeAssetId}.${safeExt}`;
  }

  if (safeKind === "website") {
    const p = sanitizeSegment(pageSlug || "website");
    const k = sanitizeSegment(slotKey || "asset");
    return `website/${p}/${k}/${safeAssetId}.${safeExt}`;
  }

  // fallback
  return `${safeKind}/${safeAssetId}.${safeExt}`;
}

function buildPublicUrl({ provider, public_url, bucket, path }) {
  if (provider === "supabase") {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data?.publicUrl || null;
  }
  return public_url || null;
}

/**
 * ------------------------------------------------------------
 * 1) Read: fetch slot(s) -> resolved image data
 * Requires:
 * - view public.media_slots_resolved (slot_key, provider, public_url, bucket, path, alt, ...)
 * ------------------------------------------------------------
 */
export async function getPicturesBySlots(slotKeys = []) {
  if (!Array.isArray(slotKeys) || slotKeys.length === 0) return {};

  const { data, error } = await supabase
    .from("media_slots_resolved")
    .select("slot_key, provider, public_url, bucket, path, alt")
    .in("slot_key", slotKeys);

  if (error) throw error;

  const map = {};
  for (const row of data || []) {
    map[row.slot_key] = {
      url: buildPublicUrl(row),
      alt: row.alt || row.slot_key,
      provider: row.provider,
      bucket: row.bucket,
      path: row.path,
    };
  }
  return map;
}

/**
 * ------------------------------------------------------------
 * 2) Create/Update: Upload file into Storage + register asset + assign slot
 * Requires:
 * - table public.media_assets
 * - table public.media_slots
 * ------------------------------------------------------------
 */

/**
 * Upload a local file, register it as a library asset, and (optionally) assign it to a slot.
 *
 * ✅ For your "avatar/<proId>/..." target:
 * - bucket: "professional-assets"
 * - kind: "avatar" or "logo"
 * - professionnelId: "<uuid pro>"
 *
 * @returns {Promise<{data:any, error:any}>}
 */
export async function uploadAndRegisterAsset(
  file,
  {
    bucket = "professional-assets",
    provider = "supabase",
    kind = "website",
    pageSlug,
    slotKey,
    pageName,
    title,
    alt,
    tags = [],
    metadata = null,
    blogSlug,
    professionnelId,
    assignSlot = true,
  } = {}
) {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    const user = authData?.user || null;

    const assetId = crypto.randomUUID();
    const ext = getFileExt(file);

    const path = buildStoragePath({
      kind,
      pageSlug,
      slotKey,
      blogSlug,
      professionnelId,
      assetId,
      ext,
    });

    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
    const publicUrl = urlData?.publicUrl || null;

    const assetPayload = {
      id: assetId,
      bucket,
      path,
      public_url: publicUrl,
      provider,
      title: title || null,
      alt: alt || title || null,
      tags: Array.isArray(tags) ? tags : [],
      metadata,
      is_active: true,
    };

    const { data: assetRow, error: assetError } = await supabase
      .from("media_assets")
      .insert(assetPayload)
      .select()
      .single();

    if (assetError) throw assetError;

    let slotRow = null;
    if (assignSlot && slotKey) {
      const slotPayload = {
        slot_key: slotKey,
        page_name: pageName || null,
        asset_id: assetRow.id,
        override_alt: alt || null,
        metadata: metadata || null,
        is_active: true,
      };

      const { data: sRow, error: slotError } = await supabase
        .from("media_slots")
        .upsert(slotPayload, { onConflict: "slot_key" })
        .select()
        .single();

      if (slotError) throw slotError;
      slotRow = sRow;
    }

    return {
      data: {
        asset: assetRow,
        slot: slotRow,
        url: publicUrl,
        userId: user?.id || null,
        bucket,
        path, // ✅ utile pour debug
      },
      error: null,
    };
  } catch (error) {
    console.error("Error in uploadAndRegisterAsset:", error);
    return { data: null, error };
  }
}

/**
 * Register an existing external URL into the library and (optionally) assign it to a slot.
 */
export async function registerExternalAsset(
  url,
  {
    slotKey,
    pageName,
    title,
    alt,
    tags = [],
    metadata = null,
    assignSlot = true,
  } = {}
) {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    const user = authData?.user || null;

    const assetId = crypto.randomUUID();
    const pseudoPath = slotKey ? sanitizeSegment(slotKey) : assetId;

    const assetPayload = {
      id: assetId,
      bucket: "external",
      path: pseudoPath,
      public_url: url,
      provider: "external",
      title: title || null,
      alt: alt || title || null,
      tags: Array.isArray(tags) ? tags : [],
      metadata,
      is_active: true,
    };

    const { data: assetRow, error: assetError } = await supabase
      .from("media_assets")
      .insert(assetPayload)
      .select()
      .single();

    if (assetError) throw assetError;

    let slotRow = null;
    if (assignSlot && slotKey) {
      const slotPayload = {
        slot_key: slotKey,
        page_name: pageName || null,
        asset_id: assetRow.id,
        override_alt: alt || null,
        metadata: metadata || null,
        is_active: true,
      };

      const { data: sRow, error: slotError } = await supabase
        .from("media_slots")
        .upsert(slotPayload, { onConflict: "slot_key" })
        .select()
        .single();

      if (slotError) throw slotError;
      slotRow = sRow;
    }

    return {
      data: {
        asset: assetRow,
        slot: slotRow,
        url,
        userId: user?.id || null,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error in registerExternalAsset:", error);
    return { data: null, error };
  }
}

/**
 * ------------------------------------------------------------
 * 3) Backward compatibility (legacy picture_website)
 * ------------------------------------------------------------
 */

export async function uploadAndRegisterPictureLegacy(
  file,
  { pageName, pictureName },
  bucket = "agency-assets",
  folder = "website-photos"
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    const fileExt = getFileExt(file);
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);

    const pictureIds = crypto.randomUUID();
    const userId = user ? user.id : null;

    const { data: insertData, error: insertError } = await supabase
      .from("picture_website")
      .insert({
        page_name: pageName,
        picture_name: pictureName,
        picture_url: publicUrl,
        picture_id: pictureIds,
        user_id: userId,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return { data: insertData, error: null };
  } catch (error) {
    console.error("Error in uploadAndRegisterPictureLegacy:", error);
    return { data: null, error };
  }
}

export async function registerExternalPictureLegacy(
  url,
  { pageName, pictureName },
  pictureId = crypto.randomUUID()
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    const { data: insertData, error: insertError } = await supabase
      .from("picture_website")
      .upsert(
        {
          page_name: pageName,
          picture_name: pictureName,
          picture_url: url,
          picture_id: pictureId,
          user_id: user?.id || null,
          created_at: new Date().toISOString(),
        },
        { onConflict: "picture_id" }
      )
      .select()
      .single();

    if (insertError) throw insertError;

    return { data: insertData, error: null };
  } catch (error) {
    console.error("Error in registerExternalPictureLegacy:", error);
    return { data: null, error };
  }
}