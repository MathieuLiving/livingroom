// src/components/lead/DirectLeadParticulierForm.jsx
import React from "react";
import { supabase } from "@/lib/customSupabaseClient";
import ProjectForm from "@/components/project/ProjectForm";

/**
 * Rend le même formulaire que le Particulier (ProjectForm "particulier"),
 * puis crée un enregistrement dans `direct_leads` au succès.
 *
 * Props:
 * - professionnel: objet pro minimal { id, ... }
 * - defaults?: valeurs par défaut de pré-remplissage
 * - autocompleteReady?: boolean
 * - onSuccess?: (leadRow) => void
 * - onError?: (error) => void
 */

// Helpers de normalisation sûrs
const num = (v) => {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(String(v).replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
};
const pick = (obj, path, dflt = null) =>
  path.split(".").reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : dflt), obj || null);

const DirectLeadParticulierForm = ({
  professionnel,
  defaults = {},
  autocompleteReady = true,
  onSuccess,
  onError,
}) => {
  const handleProjectSuccess = async (result) => {
    try {
      if (!professionnel?.id) throw new Error("professionnel_id manquant");

      // ---- Extraction robuste depuis le "result" du ProjectForm ----
      const contact = {
        first_name:
          pick(result, "contact.first_name") ||
          pick(result, "owner.first_name") ||
          pick(result, "first_name") ||
          null,
        last_name:
          pick(result, "contact.last_name") ||
          pick(result, "owner.last_name") ||
          pick(result, "last_name") ||
          null,
        email:
          pick(result, "contact.email") ||
          pick(result, "owner.email") ||
          pick(result, "email") ||
          null,
        phone:
          pick(result, "contact.phone") ||
          pick(result, "owner.phone") ||
          pick(result, "phone") ||
          null,
        role:
          pick(result, "contact.role") ||
          pick(result, "role") ||
          "Particulier",
      };

      const projectType =
        String(
          pick(result, "project.type") ||
          pick(result, "type_projet") ||
          pick(result, "project_type") ||
          "achat"
        ).toLowerCase() === "vente"
          ? "vente"
          : "achat";

      const project = {
        type: projectType, // "achat" | "vente"
        type_bien:
          pick(result, "project.property_type") ||
          pick(result, "type_bien") ||
          null,
        title:
          pick(result, "project.title") ||
          pick(result, "title") ||
          pick(result, "project_title") ||
          null,

        budget_max: num(pick(result, "project.budget_max")) ?? num(pick(result, "budget_max")),
        prix_demande: num(pick(result, "project.prix_demande")) ?? num(pick(result, "prix_demande")),

        surface_min: num(pick(result, "project.surface_min")) ?? num(pick(result, "surface_min")),
        surface_max: num(pick(result, "project.surface_max")) ?? num(pick(result, "surface_max")),
        bedrooms_min: num(pick(result, "project.bedrooms_min")) ?? num(pick(result, "bedrooms_min")),

        delai:
          pick(result, "project.delay") ||
          pick(result, "project.delai") ||
          pick(result, "delai") ||
          null,

        // ✅ on stocke ça dans description (car configuration est GENERATED ALWAYS)
        description:
          pick(result, "project.configuration") ||
          pick(result, "configuration") ||
          pick(result, "project.notes") ||
          pick(result, "notes") ||
          null,

        locations:
          pick(result, "project.locations", []) ||
          pick(result, "locations", []),
      };

      // Limite à 5 localisations
      const locs = Array.isArray(project.locations)
        ? project.locations
          .filter((l) => (l?.city || l?.ville || l?.district || l?.quartier))
          .slice(0, 5)
        : [];

      const normLoc = (l) => ({
        city: (l?.city || l?.ville || "").trim() || null,
        district: (l?.district || l?.quartier || "").trim() || null,
      });

      const [l1, l2, l3, l4, l5] = [...locs.map(normLoc), {}, {}, {}, {}];

      // Si ProjectForm renvoie un id projet, on le stocke en payload
      const projectId = pick(result, "id") || pick(result, "project_id") || null;

      const payload = {
        contact,
        project,
        projectId,
        source: "direct_lead_form",
      };

      const { data, error } = await supabase
        .from("direct_leads")
        .insert([
          {
            professionnel_id: professionnel.id,
            payload,
            // Denormalized fields for easier access/filtering
            email: contact.email,
            phone: contact.phone,
            first_name: contact.first_name,
            last_name: contact.last_name,
            project_type: project.type,
            type_bien: project.type_bien,
            budget_max: project.budget_max,
            surface_min: project.surface_min,
            city_choice_1: l1.city,
            quartier_choice_1: l1.district,
            // ... other fields as needed by the table schema
          },
        ])
        .select()
        .single();

      if (error) throw error;

      if (onSuccess) onSuccess(data);
    } catch (err) {
      console.error("Error submitting direct lead:", err);
      if (onError) onError(err);
    }
  };

  return (
    <ProjectForm
      mode="particulier"
      isStandalone={true}
      hideSteps={false}
      initialData={defaults}
      onSubmit={handleProjectSuccess}
      submitLabel="Envoyer ma demande"
    />
  );
};

export default DirectLeadParticulierForm;