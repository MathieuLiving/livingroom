import { useState } from "react";
import { supabase } from "@/lib/customSupabaseClient";
import { useToast } from "@/components/ui/use-toast";
import {
  trimOrNull,
  buildCardColorsPayload,
  normalizeUuidTextOrNull,
} from "@/utils/proHelpers";
import { getPublicCvdUrl } from "@/utils/cvdHelpers";
import { uploadMyAvatarFile, uploadMyLogoFile } from "@/utils/uploadUserAssetsToSupabase";

const PREMIUM_CARD_TABLE = "premium_professionnel_cards";

const pick = (obj, keys) => {
  const out = {};
  keys.forEach((k) => {
    if (Object.prototype.hasOwnProperty.call(obj || {}, k)) out[k] = obj[k];
  });
  return out;
};

const norm = (v) => String(v ?? "").trim().toLowerCase();

function isMissingColumnError(err) {
  const code = String(err?.code || "");
  const msg = String(err?.message || "").toLowerCase();
  return code === "42703" || msg.includes("column") || msg.includes("does not exist");
}

function isMissingRelationError(err) {
  const code = String(err?.code || "");
  const msg = String(err?.message || "").toLowerCase();
  return code === "42p01" || msg.includes("relation") || msg.includes("does not exist");
}

function looksLikeAuthKeyError(err) {
  const msg = String(err?.message || "").toLowerCase();
  const hint = String(err?.hint || "").toLowerCase();
  return msg.includes("invalid api key") || hint.includes("invalid api key");
}

function isAgencyMember(profile) {
  const role = norm(profile?.agency_role);
  return (
    !!profile?.agency_id &&
    (role === "director" ||
      role === "team_leader" ||
      role === "agent" ||
      role === "agent_affiliate")
  );
}

async function resolveProfessionnelIdentity(authUid, profile, authEmail) {
  if (!authUid) {
    throw new Error("resolveProfessionnelIdentity: authUid manquant");
  }
  if (!supabase) {
    throw new Error("Supabase client not initialized");
  }

  const profileId = normalizeUuidTextOrNull(profile?.id);
  const profileUserId = normalizeUuidTextOrNull(profile?.user_id);

  if (profileId && profileUserId) {
    return {
      professionnelId: profileId,
      userId: profileUserId,
      email: trimOrNull(profile?.email) || authEmail || null,
    };
  }

  const byUserQ = supabase
    .from("professionnels")
    .select("id,user_id,email")
    .eq("user_id", authUid)
    .maybeSingle();

  const byIdQ = supabase
    .from("professionnels")
    .select("id,user_id,email")
    .eq("id", authUid)
    .maybeSingle();

  const [byUserRes, byIdRes] = await Promise.allSettled([byUserQ, byIdQ]);

  const rowByUser = byUserRes.status === "fulfilled" ? byUserRes.value.data : null;
  const rowById = byIdRes.status === "fulfilled" ? byIdRes.value.data : null;
  const errByUser = byUserRes.status === "fulfilled" ? byUserRes.value.error : byUserRes.reason;
  const errById = byIdRes.status === "fulfilled" ? byIdRes.value.error : byIdRes.reason;

  if (errByUser && looksLikeAuthKeyError(errByUser)) {
    throw new Error("Invalid API key (vérifie VITE_SUPABASE_ANON_KEY).");
  }
  if (errById && looksLikeAuthKeyError(errById)) {
    throw new Error("Invalid API key (vérifie VITE_SUPABASE_ANON_KEY).");
  }

  if (errByUser && !isMissingColumnError(errByUser) && !isMissingRelationError(errByUser)) {
    throw errByUser;
  }
  if (errById && !isMissingColumnError(errById) && !isMissingRelationError(errById)) {
    throw errById;
  }

  const row = rowByUser || rowById || null;

  return {
    professionnelId: normalizeUuidTextOrNull(row?.id) || profileId || authUid,
    userId: normalizeUuidTextOrNull(row?.user_id) || profileUserId || authUid,
    email: trimOrNull(row?.email) || trimOrNull(profile?.email) || authEmail || null,
  };
}

async function upsertProfessionnelRobust(payload, identity) {
  const authUserId = identity?.userId || null;
  const professionnelId = identity?.professionnelId || null;

  if (!authUserId) throw new Error("upsertProfessionnelRobust: userId manquant");
  if (!professionnelId) throw new Error("upsertProfessionnelRobust: professionnelId manquant");
  if (!supabase) throw new Error("Supabase client not initialized");

  const basePayload = {
    ...(payload || {}),
    id: professionnelId,
    user_id: authUserId,
    updated_at: new Date().toISOString(),
  };

  const tryUpdateByUserId = async (p) => {
    const { error } = await supabase.from("professionnels").update(p).eq("user_id", authUserId);
    return { error, data: error ? null : p };
  };

  const tryUpdateById = async (p) => {
    const { error } = await supabase.from("professionnels").update(p).eq("id", professionnelId);
    return { error, data: error ? null : p };
  };

  const tryInsert = async (p) =>
    supabase.from("professionnels").insert(p).select("*").maybeSingle();

  let upd = await tryUpdateByUserId(basePayload);
  if (upd.error && isMissingColumnError(upd.error)) {
    const { user_id, ...noUserId } = basePayload;
    upd = await tryUpdateByUserId(noUserId);
  }
  if (upd.error) throw upd.error;
  if (upd.data?.id) return upd.data;

  upd = await tryUpdateById(basePayload);
  if (upd.error && isMissingColumnError(upd.error)) {
    const { user_id, ...noUserId } = basePayload;
    upd = await tryUpdateById(noUserId);
  }
  if (upd.error) throw upd.error;
  if (upd.data?.id) return upd.data;

  const insertBase = {
    ...basePayload,
    agency_role: basePayload.agency_role || "agent",
    is_active: basePayload.is_active ?? true,
    visibility_pro_partner_page: basePayload.visibility_pro_partner_page ?? true,
    is_public: basePayload.is_public ?? true,
    is_archived: basePayload.is_archived ?? false,
    allow_card_customization: basePayload.allow_card_customization ?? false,
  };

  let ins = await tryInsert(insertBase);
  if (ins.error && isMissingColumnError(ins.error)) {
    const { user_id, ...noUserId } = insertBase;
    ins = await tryInsert(noUserId);
  }
  if (ins.error) throw ins.error;

  return ins.data || null;
}

/**
 * Les couleurs des indépendants sont stockées UNIQUEMENT
 * dans premium_professionnel_cards.
 */
async function saveCardColors({ professionnelId, premiumCardId, cardColors }) {
  if (!cardColors) return;
  if (!professionnelId) throw new Error("saveCardColors: professionnelId manquant");
  if (!supabase) throw new Error("Supabase client not initialized");

  if (!premiumCardId) {
    throw new Error(
      "Aucune carte premium liée à ce professionnel. Les couleurs des indépendants doivent être enregistrées uniquement dans premium_professionnel_cards."
    );
  }

  const { data: premRow, error: premSelErr } = await supabase
    .from(PREMIUM_CARD_TABLE)
    .select("id, professionnel_id")
    .eq("id", premiumCardId)
    .maybeSingle();

  if (premSelErr) throw premSelErr;

  if (!premRow?.id) {
    throw new Error("Carte premium introuvable (premium_professionnel_card incohérent).");
  }

  if (String(premRow.professionnel_id || "") !== String(professionnelId)) {
    throw new Error("Carte premium incohérente : ne correspond pas à ce professionnel.");
  }

  const { error: premUpdErr } = await supabase
    .from(PREMIUM_CARD_TABLE)
    .update({
      ...cardColors,
      updated_at: new Date().toISOString(),
    })
    .eq("id", premiumCardId);

  if (premUpdErr) throw premUpdErr;
}

async function isLogoLockedForUser(profile) {
  const hasAgency = Boolean(profile?.agency_id);
  const role = norm(profile?.agency_role);

  if (!hasAgency) return false;
  if (role === "director") return false;

  try {
    const { data, error } = await supabase
      .from("agencies")
      .select("enforce_logo")
      .eq("id", profile.agency_id)
      .maybeSingle();

    if (error && isMissingColumnError(error)) return false;
    if (error) return false;

    return data?.enforce_logo === true;
  } catch {
    return false;
  }
}

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || "").replace(/\/+$/, "");
const PUBLIC_STORAGE_BASE = SUPABASE_URL ? `${SUPABASE_URL}/storage/v1/object/public` : "";

function publicUrlFrom(bucket, path) {
  if (!PUBLIC_STORAGE_BASE) return null;
  const p = String(path || "").trim();
  if (!p) return null;
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
  return `${PUBLIC_STORAGE_BASE}/${bucket}/${p}`;
}

/**
 * Retire les champs branding/interdits pour les membres d’agence.
 * Règle métier :
 * - indépendant => peut porter son branding
 * - membre d’agence => branding agence, pas de logo/société/site agence perso ici
 */
function stripForbiddenProfessionnelFields(clean, profile) {
  if (!isAgencyMember(profile)) return clean;

  const next = { ...clean };

  delete next.company_name;
  delete next.agency_website_url;
  delete next.logo_url;
  delete next.logo_path;
  delete next.agency_id;
  delete next.agency_role;
  delete next.qr_code_with_logo;
  delete next.allow_card_customization;

  return next;
}

export function useProCardSave(profile, setProfile, authUid, authEmail) {
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async (refreshCallback) => {
    if (!profile || !authUid) return;

    if (!supabase) {
      toast({
        variant: "destructive",
        title: "Erreur de configuration",
        description: "La connexion à la base de données est impossible.",
      });
      return;
    }

    if (!profile.number_card_professional || !String(profile.number_card_professional).trim()) {
      toast({
        variant: "destructive",
        title: "Numéro de carte professionnelle requis",
        description:
          "Veuillez renseigner votre numéro de carte professionnelle pour sauvegarder votre profil.",
      });
      return;
    }

    setSaving(true);

    try {
      const identity = await resolveProfessionnelIdentity(authUid, profile, authEmail);
      const professionnelId = identity.professionnelId;
      const resolvedEmail = identity.email;
      const memberOfAgency = isAgencyMember(profile);

      let clean = {
        id: professionnelId,
        user_id: identity.userId,
        email: trimOrNull(profile.email) || resolvedEmail || null,

        first_name: trimOrNull(profile.first_name),
        last_name: trimOrNull(profile.last_name),
        company_name: trimOrNull(profile.company_name),
        phone: trimOrNull(profile.phone),
        function: trimOrNull(profile.function),
        professionnal_presentation: trimOrNull(profile.professionnal_presentation),

        scope_intervention_choice_1: trimOrNull(profile.scope_intervention_choice_1),
        scope_intervention_choice_2: trimOrNull(profile.scope_intervention_choice_2),
        scope_intervention_choice_3: trimOrNull(profile.scope_intervention_choice_3),

        number_card_professional: trimOrNull(profile.number_card_professional),
        cpi_number: trimOrNull(profile.cpi_number),

        agency_website_url: trimOrNull(profile.agency_website_url),
        appointment_url: trimOrNull(profile.appointment_url),
        customer_review_url: trimOrNull(profile.customer_review_url),

        linkedin_url: trimOrNull(profile.linkedin_url),
        facebook_url: trimOrNull(profile.facebook_url),
        instagram_url: trimOrNull(profile.instagram_url),
        youtube_url: trimOrNull(profile.youtube_url),
        tiktok_url: trimOrNull(profile.tiktok_url),

        logo_url: profile.logo_url || null,
        avatar_url: profile.avatar_url || null,
        logo_path: profile.logo_path || null,
        avatar_path: profile.avatar_path || null,

        visibility_pro_partner_page: profile.visibility_pro_partner_page ?? true,
        is_active: profile.is_active ?? true,

        // indépendant uniquement ; supprimé plus bas pour membres agence
        qr_code_with_logo: profile.qr_code_with_logo ?? false,

        ...pick(profile, [
          "is_archived",
          "validation_status",
          "is_validated_by_administrator",
          "card_slug",
          "is_public",
          "agency_id",
          "agency_role",
        ]),
      };

      clean.allow_card_customization = !memberOfAgency;
      clean = stripForbiddenProfessionnelFields(clean, profile);

      const existingFree = trimOrNull(profile.digital_card_livingroom_url);
      const generatedFree =
        existingFree ||
        trimOrNull(
          getPublicCvdUrl({
            ...profile,
            ...clean,
            id: professionnelId,
            user_id: identity.userId,
            card_slug: profile.card_slug || clean.card_slug || null,
          })
        ) ||
        null;

      const proRow = await upsertProfessionnelRobust(
        { ...clean, digital_card_livingroom_url: generatedFree },
        identity
      );

      const cardColors = buildCardColorsPayload(profile);
      const premiumCardId = normalizeUuidTextOrNull(
        profile?.premium_professionnel_card || proRow?.premium_professionnel_card
      );

      // Couleurs : seulement pour les indépendants, et uniquement dans premium_professionnel_cards
      if (!memberOfAgency) {
        await saveCardColors({
          professionnelId,
          premiumCardId,
          cardColors,
        });
      }

      setProfile((p) => ({
        ...(p || {}),
        ...(proRow || {}),
        ...(!memberOfAgency ? cardColors : {}),
        id: professionnelId,
        user_id: identity.userId,
        email: trimOrNull(p?.email) || resolvedEmail || null,
        allow_card_customization: !memberOfAgency,
        premium_professionnel_card:
          premiumCardId ||
          p?.premium_professionnel_card ||
          proRow?.premium_professionnel_card ||
          null,
      }));

      toast({
        title: "Profil sauvegardé",
        description: "Vos informations ont été mises à jour.",
      });

      if (refreshCallback) {
        await refreshCallback({ clearDirty: true });
      }
    } catch (error) {
      console.error("Profile save error:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error?.message || "La sauvegarde du profil a échoué.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (file, fileType, refreshCallback) => {
    if (!file || !authUid) return;
    if (fileType !== "logo" && fileType !== "avatar") return;

    if (!supabase) {
      toast({
        variant: "destructive",
        title: "Erreur de configuration",
        description: "La connexion à la base de données est impossible.",
      });
      return;
    }

    const memberOfAgency = isAgencyMember(profile);

    if (fileType === "logo" && memberOfAgency) {
      toast({
        variant: "destructive",
        title: "Logo géré par l’agence",
        description: "Le logo doit être modifié depuis l’espace Agence.",
      });
      return;
    }

    if (fileType === "logo") {
      const locked = await isLogoLockedForUser(profile);
      if (locked) {
        toast({
          variant: "destructive",
          title: "Logo verrouillé",
          description: "Le logo est géré par le directeur de l'agence.",
        });
        return;
      }
    }

    setSaving(true);

    try {
      const identity = await resolveProfessionnelIdentity(authUid, profile, authEmail);
      const professionnelId = identity.professionnelId;
      const resolvedEmail = identity.email;

      await upsertProfessionnelRobust(
        {
          id: professionnelId,
          user_id: identity.userId,
          email: trimOrNull(profile?.email) || resolvedEmail || null,
          is_active: true,
          visibility_pro_partner_page: profile?.visibility_pro_partner_page ?? true,
          allow_card_customization: !memberOfAgency,
        },
        identity
      );

      const { path } =
        fileType === "logo" ? await uploadMyLogoFile(file) : await uploadMyAvatarFile(file);

      const bucket = fileType === "logo" ? "public-logos" : "public-avatars";
      const publicUrl = publicUrlFrom(bucket, path);

      const updateData =
        fileType === "logo"
          ? { logo_path: path, logo_url: publicUrl || null }
          : { avatar_path: path, avatar_url: publicUrl || null };

      const safeUpdateData =
        fileType === "logo" ? stripForbiddenProfessionnelFields(updateData, profile) : updateData;

      const updated = await upsertProfessionnelRobust(
        { id: professionnelId, user_id: identity.userId, ...safeUpdateData },
        identity
      );

      setProfile((p) => ({
        ...(p || {}),
        ...(updated || {}),
        id: professionnelId,
        user_id: identity.userId,
      }));

      toast({
        title: "Image mise à jour",
        description: "Téléversement réussi.",
      });

      if (refreshCallback) {
        await refreshCallback({ clearDirty: true });
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        variant: "destructive",
        title: "Erreur d'upload",
        description: error?.message || "Upload échoué.",
      });
    } finally {
      setSaving(false);
    }
  };

  return { saving, handleSave, handleUpload };
}