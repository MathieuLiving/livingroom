import { supabase } from "@/lib/customSupabaseClient";

const extFromFile = (file) => {
  const name = String(file?.name || "").trim();
  const ext = name.includes(".") ? name.split(".").pop() : "";
  const normalized = (ext || "png").toLowerCase();
  return normalized === "jpeg" ? "jpg" : normalized;
};

const getAuthedUserId = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;

  const userId = data?.user?.id;
  if (!userId) throw new Error("Utilisateur non authentifié.");

  return userId;
};

const getPublicUrl = (bucket, path) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl || null;
};

const cleanupSiblingFiles = async ({ bucket, folderPath, keepPath }) => {
  try {
    const { data: files, error: listError } = await supabase.storage
      .from(bucket)
      .list(folderPath, {
        limit: 100,
        sortBy: { column: "name", order: "asc" },
      });

    if (listError) {
      console.warn(`[cleanupSiblingFiles] list error on ${bucket}/${folderPath}:`, listError);
      return;
    }

    if (!Array.isArray(files) || files.length === 0) {
      return;
    }

    const toDelete = files
      .filter((item) => item?.name)
      .map((item) => `${folderPath}/${item.name}`)
      .filter((fullPath) => fullPath !== keepPath);

    if (toDelete.length === 0) {
      return;
    }

    const { error: removeError } = await supabase.storage.from(bucket).remove(toDelete);

    if (removeError) {
      console.warn(`[cleanupSiblingFiles] remove error on ${bucket}:`, removeError);
    }
  } catch (error) {
    console.warn(`[cleanupSiblingFiles] unexpected error on ${bucket}/${folderPath}:`, error);
  }
};

/**
 * Upload avatar
 * Bucket: public-avatars
 * Path: avatars/{auth.uid()}/avatar-<timestamp>.<ext>
 *
 * Retourne:
 * - path
 * - publicUrl
 *
 * Nettoyage:
 * - supprime les anciens avatars du même utilisateur dans avatars/{uid}/
 */
export async function uploadMyAvatarFile(file) {
  if (!file) throw new Error("Aucun fichier fourni.");

  const userId = await getAuthedUserId();
  const ext = extFromFile(file);
  const folderPath = `avatars/${userId}`;
  const path = `${folderPath}/avatar-${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from("public-avatars").upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
  });

  if (error) throw error;

  const publicUrl = getPublicUrl("public-avatars", path);
  if (!publicUrl) {
    throw new Error("Impossible de construire l’URL publique de l’avatar.");
  }

  await cleanupSiblingFiles({
    bucket: "public-avatars",
    folderPath,
    keepPath: path,
  });

  return { path, publicUrl };
}

/**
 * Upload logo
 * Bucket: public-logos
 * Path: logos/{auth.uid()}/logo-<timestamp>.<ext>
 *
 * Retourne:
 * - path
 * - publicUrl
 *
 * Nettoyage:
 * - supprime les anciens logos du même utilisateur dans logos/{uid}/
 */
export async function uploadMyLogoFile(file) {
  if (!file) throw new Error("Aucun fichier fourni.");

  const userId = await getAuthedUserId();
  const ext = extFromFile(file);
  const folderPath = `logos/${userId}`;
  const path = `${folderPath}/logo-${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from("public-logos").upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
  });

  if (error) throw error;

  const publicUrl = getPublicUrl("public-logos", path);
  if (!publicUrl) {
    throw new Error("Impossible de construire l’URL publique du logo.");
  }

  await cleanupSiblingFiles({
    bucket: "public-logos",
    folderPath,
    keepPath: path,
  });

  return { path, publicUrl };
}