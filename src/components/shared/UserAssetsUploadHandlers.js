import { supabase } from "@/lib/customSupabaseClient";
import { uploadMyAvatarFile, uploadMyLogoFile } from "@/utils/uploadUserAssetsToSupabase";

/**
 * Valide un fichier image avant l'upload
 * @param {File} file - Le fichier à valider
 * @throws {Error} Si le fichier est manquant, trop grand ou de mauvais type
 */
export const validateImageFile = (file) => {
  if (!file) {
    throw new Error("Aucun fichier fourni.");
  }

  const maxSize = 5 * 1024 * 1024; // 5Mo
  if (file.size > maxSize) {
    throw new Error("Le fichier est trop volumineux. La taille maximale est de 5Mo.");
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Format de fichier non supporté. Les formats acceptés sont : JPEG, PNG, WEBP, GIF.");
  }
};

/**
 * Récupère l'ID de l'utilisateur authentifié
 * @returns {Promise<string>} L'ID de l'utilisateur
 * @throws {Error} Si l'utilisateur n'est pas authentifié
 */
export const getAuthUid = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;

  if (!data?.user?.id) {
    throw new Error("Utilisateur non authentifié.");
  }

  return data.user.id;
};

/**
 * Upload un avatar, met à jour la base de données et gère les callbacks
 * @param {File} file - Le fichier image
 * @param {Object} options - Options (setProfile, refreshProfile)
 * @returns {Promise<{path: string, publicUrl: string}>}
 */
export const uploadMyAvatarAndSave = async (file, options = {}) => {
  try {
    validateImageFile(file);
    const userId = await getAuthUid();

    const { path, publicUrl } = await uploadMyAvatarFile(file);

    if (!path || !publicUrl) {
      throw new Error("Upload avatar incomplet : chemin ou URL publique manquants.");
    }

    const { error } = await supabase
      .from("professionnels")
      .update({
        avatar_path: path,
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) throw error;

    if (typeof options.setProfile === "function") {
      options.setProfile((prev) => ({
        ...prev,
        avatar_path: path,
        avatar_url: publicUrl,
      }));
    }

    if (typeof options.refreshProfile === "function") {
      await options.refreshProfile();
    }

    return { path, publicUrl };
  } catch (error) {
    console.error("Erreur lors de l'upload de l'avatar:", error);
    throw error;
  }
};

/**
 * Upload un logo, met à jour la base de données et gère les callbacks
 * @param {File} file - Le fichier image
 * @param {Object} options - Options (setProfile, refreshProfile)
 * @returns {Promise<{path: string, publicUrl: string}>}
 */
export const uploadMyLogoAndSave = async (file, options = {}) => {
  try {
    validateImageFile(file);
    const userId = await getAuthUid();

    const { path, publicUrl } = await uploadMyLogoFile(file);

    if (!path || !publicUrl) {
      throw new Error("Upload logo incomplet : chemin ou URL publique manquants.");
    }

    const { error } = await supabase
      .from("professionnels")
      .update({
        logo_path: path,
        logo_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) throw error;

    if (typeof options.setProfile === "function") {
      options.setProfile((prev) => ({
        ...prev,
        logo_path: path,
        logo_url: publicUrl,
      }));
    }

    if (typeof options.refreshProfile === "function") {
      await options.refreshProfile();
    }

    return { path, publicUrl };
  } catch (error) {
    console.error("Erreur lors de l'upload du logo:", error);
    throw error;
  }
};