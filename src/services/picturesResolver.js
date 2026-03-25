import { supabase } from "../../lib/customSupabaseClient";

/**
 * Resolves pictures from the new media_slots_resolved system with fallback to the legacy picture_website table.
 * 
 * @param {string[]} keys - Array of slot keys (or picture_ids) to resolve.
 * @param {Object} [options] - Options object.
 * @param {string} [options.legacyPageName] - The page name to filter by (used for both new and legacy tables).
 * @returns {Promise<Object>} A map of resolved pictures: { [key]: { url: string|null, alt: string|null } }.
 */
export async function resolvePictures(keys, options = {}) {
  if (!Array.isArray(keys) || keys.length === 0) {
    return {};
  }

  const { legacyPageName } = options;
  const results = {};

  // Initialize results map with nulls
  keys.forEach((key) => {
    results[key] = null;
  });

  try {
    // ---------------------------------------------------------
    // 1. Try resolving from the new `media_slots_resolved` view
    // ---------------------------------------------------------
    let newSystemQuery = supabase
      .from("media_slots_resolved")
      .select("slot_key, bucket, path, public_url, provider, alt")
      .in("slot_key", keys);

    // If a page name is provided, filter by it to avoid collisions 
    // (assuming the new system also scopes slots by page_name)
    if (legacyPageName) {
      newSystemQuery = newSystemQuery.eq("page_name", legacyPageName);
    }

    const { data: newMediaData, error: newMediaError } = await newSystemQuery;

    if (newMediaError) {
      console.warn("Error resolving pictures from media_slots_resolved:", newMediaError);
    } else if (newMediaData) {
      newMediaData.forEach((item) => {
        let url = item.public_url;

        // If stored in Supabase Storage, generate the public URL dynamically
        if (item.provider === "supabase_storage" && item.bucket && item.path) {
          const { data } = supabase.storage.from(item.bucket).getPublicUrl(item.path);
          if (data) {
            url = data.publicUrl;
          }
        }

        results[item.slot_key] = {
          url: url,
          alt: item.alt || "",
        };
      });
    }

    // ---------------------------------------------------------
    // 2. Identify missing keys and fallback to `picture_website`
    // ---------------------------------------------------------
    const missingKeys = keys.filter((key) => !results[key]);

    if (missingKeys.length > 0 && legacyPageName) {
      const { data: legacyData, error: legacyError } = await supabase
        .from("picture_website")
        .select("picture_id, picture_url, picture_name")
        .eq("page_name", legacyPageName)
        .in("picture_id", missingKeys);

      if (legacyError) {
        console.warn("Error resolving pictures from picture_website fallback:", legacyError);
      } else if (legacyData) {
        legacyData.forEach((item) => {
          results[item.picture_id] = {
            url: item.picture_url,
            alt: item.picture_name || "", // Legacy fallback for alt text
          };
        });
      }
    }
  } catch (err) {
    console.error("Unexpected error in resolvePictures:", err);
  }

  return results;
}