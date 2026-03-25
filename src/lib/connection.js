import { supabase } from "../../lib/customSupabaseClient";

/**
 * Crée ou réactive une demande de mise en relation.
 *
 * Compatible avec la table `connections` actuelle :
 * - user_id requis par la RLS
 * - requesting_user_id / target_user_id
 * - colonne projet dynamique via `projectKey`
 * - project_marketplace_id pour les vues / statuts côté marketplace
 *
 * IMPORTANT :
 * - on ne renseigne PAS `is_active` à l'insert/update depuis le front
 *   car la colonne semble gérée côté base.
 */
export async function upsertConnection({
  requesting_user_id,
  target_user_id,
  projectKey,
  project_id,
  connection_type,
  message,
  target_professionnel_id = null,

  // Métadonnées projet optionnelles mais utiles
  project_marketplace_id = null,
  project_type = null,
  project_type_bien = null,
  project_city_choice_1 = null,
  city_choice_1 = null,
  project_origin = null,
}) {
  try {
    if (!requesting_user_id) {
      throw new Error("requesting_user_id manquant.");
    }

    if (!target_user_id) {
      throw new Error("target_user_id manquant.");
    }

    if (!projectKey) {
      throw new Error("projectKey manquant.");
    }

    if (!project_id) {
      throw new Error("project_id manquant.");
    }

    const allowedProjectKeys = [
      "buying_project_particulier_id",
      "selling_project_particulier_id",
      "buying_project_professionnel_id",
      "selling_project_professionnel_id",
    ];

    if (!allowedProjectKeys.includes(projectKey)) {
      throw new Error(`projectKey invalide : ${projectKey}`);
    }

    if (requesting_user_id === target_user_id) {
      throw new Error("Impossible de créer une mise en relation avec soi-même.");
    }

    // Vérifie si une connexion existe déjà sur ce même projet entre ces deux users
    const { data: existing, error: fetchError } = await supabase
      .from("connections")
      .select("id, status, user_id")
      .eq("user_id", requesting_user_id)
      .eq("requesting_user_id", requesting_user_id)
      .eq("target_user_id", target_user_id)
      .eq(projectKey, project_id)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    // Si une connexion existe déjà
    if (existing) {
      if (existing.status === "rejected" || existing.status === "suspended") {
        const updatePayload = {
          status: "pending",
          first_message: message?.trim() || null,
        };

        const { error: updateError } = await supabase
          .from("connections")
          .update(updatePayload)
          .eq("id", existing.id)
          .eq("user_id", requesting_user_id);

        if (updateError) {
          throw updateError;
        }

        return {
          data: {
            id: existing.id,
            status: "pending",
          },
          error: null,
          isReopened: true,
        };
      }

      return {
        data: existing,
        error: null,
        isDuplicate: true,
      };
    }

    // Nouvelle connexion
    const payload = {
      user_id: requesting_user_id,
      requesting_user_id,
      target_user_id,
      connection_type: connection_type || "direct",
      status: "pending",
      first_message: message?.trim() || null,
      project_marketplace_id: project_marketplace_id || project_id,
      project_type: project_type || null,
      project_type_bien: project_type_bien || null,
      project_city_choice_1: project_city_choice_1 || null,
      city_choice_1: city_choice_1 || project_city_choice_1 || null,
      project_origin: project_origin || null,
      [projectKey]: project_id,
    };

    // Si la cible est un professionnel, on peut renseigner explicitement l'id pro
    if (target_professionnel_id) {
      payload.target_professionnel_id = target_professionnel_id;
    }

    const { error: insertError } = await supabase
      .from("connections")
      .insert(payload);

    if (insertError) {
      throw insertError;
    }

    return {
      data: {
        requesting_user_id,
        target_user_id,
        status: "pending",
        project_id,
        projectKey,
      },
      error: null,
      created: true,
    };
  } catch (error) {
    console.error("[upsertConnection] error:", error);
    return { data: null, error };
  }
}