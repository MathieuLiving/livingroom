import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/customSupabaseClient";
import { useAuth } from "@/contexts/SupabaseAuthContext";

function normalizeRole(value) {
  return String(value || "").toLowerCase().trim();
}

function normalizeVideoDisplayMode(value, fallbackEnforceVideo = false) {
  const v = String(value || "").toLowerCase().trim();
  if (v === "agency") return "agency";
  if (v === "personal") return "personal";
  return fallbackEnforceVideo ? "agency" : "personal";
}

function mapAgency(row) {
  if (!row) return null;

  const enforceVideo = !!row.enforce_video;
  const videoDisplayMode = normalizeVideoDisplayMode(
    row.video_display_mode,
    enforceVideo
  );

  return {
    id: row.id ?? null,
    updated_at: row.updated_at ?? null,

    name: row.name ?? "",
    network_name: row.network_name ?? "",
    is_placeholder: !!row.is_placeholder,

    colors_uniform: !!row.colors_uniform,
    lock_colors: !!row.lock_colors,
    lock_links: !!row.lock_links,
    enforce_brand_colors: !!row.enforce_brand_colors,
    enforce_logo: !!row.enforce_logo,
    enforce_video: enforceVideo,
    video_display_mode: videoDisplayMode,

    team_leader_can_edit_agency: !!row.team_leader_can_edit_agency,
    agent_can_edit_agency: !!row.agent_can_edit_agency,

    card_banner_color: row.card_banner_color ?? null,
    card_text_color: row.card_text_color ?? null,
    card_primary_button_color: row.card_primary_button_color ?? null,
    card_secondary_button_color: row.card_secondary_button_color ?? null,
    card_qr_fg_color: row.card_qr_fg_color ?? null,
    card_name_color: row.card_name_color ?? null,
    card_signature_color: row.card_signature_color ?? null,
    card_company_name_color: row.card_company_name_color ?? null,
    card_support_text_color: row.card_support_text_color ?? null,

    website_url: row.website_url ?? "",
    logo_url: row.logo_url ?? "",
    logo_storage_path: row.logo_storage_path ?? "",
    contact_email: row.contact_email ?? "",
    estimation_tool_url: row.estimation_tool_url ?? "",

    linkedin_url: row.linkedin_url ?? "",
    facebook_url: row.facebook_url ?? "",
    instagram_url: row.instagram_url ?? "",
    youtube_url: row.youtube_url ?? "",
    tiktok_url: row.tiktok_url ?? "",
    twitter_url: row.twitter_url ?? "",

    linkedin_display_mode: row.linkedin_display_mode ?? null,
    facebook_display_mode: row.facebook_display_mode ?? null,
    instagram_display_mode: row.instagram_display_mode ?? null,
    youtube_display_mode: row.youtube_display_mode ?? null,
    tiktok_display_mode: row.tiktok_display_mode ?? null,
    reviews_display_mode: row.reviews_display_mode ?? null,

    video_url: row.video_url ?? "",
    video_external_url: row.video_external_url ?? "",
    video_storage_path: row.video_storage_path ?? "",
    video_preferred_source: row.video_preferred_source ?? "none",

    qr_code_with_logo: !!row.qr_code_with_logo,
  };
}

export function useAgencyPermissions(agencyId) {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [agency, setAgency] = useState(null);
  const [professionnel, setProfessionnel] = useState(null);
  const [ctx, setCtx] = useState(null);
  const [error, setError] = useState(null);

  const fetchPermissions = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      setCtx(null);
      setRole(null);
      setAgency(null);
      setProfessionnel(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let ctxRow = null;

      try {
        let q = supabase
          .from("professionnels_agency_v3")
          .select("*")
          .eq("user_id", user.id);

        if (agencyId) {
          q = q.eq("agency_id", agencyId);
        }

        const { data, error: ctxErr } = await q.maybeSingle();
        if (ctxErr) throw ctxErr;

        ctxRow = data || null;
      } catch (viewErr) {
        console.warn(
          "[useAgencyPermissions] professionnels_agency_v3 indisponible :",
          viewErr
        );
      }

      setCtx(ctxRow);

      const { data: proRow, error: proErr } = await supabase
        .from("professionnels")
        .select(
          [
            "id",
            "user_id",
            "updated_at",
            "agency_id",
            "agency_role",
            "allow_card_customization",
            "custom_brand_colors",
            "custom_logo_url",
            "custom_video_url",
            "qr_code_with_logo",
            "is_premium_public",
            "logo_url",
            "video_url",
            "video_external_url",
            "video_storage_path",
            "video_preferred_source",
            "card_banner_color",
            "card_text_color",
            "card_primary_button_color",
            "card_secondary_button_color",
            "card_qr_fg_color",
            "card_name_color",
            "card_signature_color",
            "card_company_name_color",
            "card_support_text_color",
          ].join(",")
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (proErr) throw proErr;

      setProfessionnel(proRow || null);

      const resolvedRole = normalizeRole(
        ctxRow?.agency_role ?? proRow?.agency_role ?? null
      );
      setRole(resolvedRole || null);

      const agencyTargetId =
        agencyId ?? ctxRow?.agency_id ?? proRow?.agency_id ?? null;

      if (!agencyTargetId) {
        setAgency(null);
      } else {
        const { data: agencyRow, error: agencyErr } = await supabase
          .from("agencies")
          .select(
            [
              "id",
              "updated_at",
              "name",
              "network_name",
              "is_placeholder",
              "colors_uniform",
              "lock_colors",
              "lock_links",
              "enforce_brand_colors",
              "enforce_logo",
              "enforce_video",
              "video_display_mode",
              "team_leader_can_edit_agency",
              "agent_can_edit_agency",
              "card_banner_color",
              "card_text_color",
              "card_primary_button_color",
              "card_secondary_button_color",
              "card_qr_fg_color",
              "card_name_color",
              "card_signature_color",
              "card_company_name_color",
              "card_support_text_color",
              "website_url",
              "logo_url",
              "logo_storage_path",
              "contact_email",
              "estimation_tool_url",
              "linkedin_url",
              "facebook_url",
              "instagram_url",
              "youtube_url",
              "tiktok_url",
              "twitter_url",
              "linkedin_display_mode",
              "facebook_display_mode",
              "instagram_display_mode",
              "youtube_display_mode",
              "tiktok_display_mode",
              "reviews_display_mode",
              "video_url",
              "video_external_url",
              "video_storage_path",
              "video_preferred_source",
              "qr_code_with_logo",
            ].join(",")
          )
          .eq("id", agencyTargetId)
          .maybeSingle();

        if (agencyErr) throw agencyErr;

        setAgency(mapAgency(agencyRow));
      }
    } catch (err) {
      console.error("[useAgencyPermissions] error", err);
      setError(err);
      setCtx(null);
      setRole(null);
      setAgency(null);
      setProfessionnel(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id, agencyId]);

  useEffect(() => {
    if (user?.id) {
      fetchPermissions();
    } else {
      setLoading(false);
      setCtx(null);
      setRole(null);
      setAgency(null);
      setProfessionnel(null);
      setError(null);
    }
  }, [user?.id, fetchPermissions]);

  const isDirector = role === "director";
  const isTeamLeader = role === "team_leader";
  const isAgentAffiliate = role === "agent_affiliate";
  const isAgent = role === "agent";

  const isInAgency = !!agency?.id;
  const isIndependent = !isInAgency;
  const isAgencyPremium = isInAgency;

  const isAgencyVideoManaged = useMemo(() => {
    if (isIndependent || !agency) return false;
    return agency.video_display_mode === "agency";
  }, [isIndependent, agency]);

  const canModifyColors = useMemo(() => {
    if (isIndependent) return true;
    if (!agency) return false;
    if (isDirector) return true;

    if (agency.colors_uniform) return false;
    if (agency.lock_colors || agency.enforce_brand_colors) return false;

    return !!professionnel?.allow_card_customization;
  }, [isIndependent, agency, isDirector, professionnel?.allow_card_customization]);

  const canModifyLogo = useMemo(() => {
    if (isIndependent) return true;
    if (!agency) return false;
    if (isDirector) return true;
    if (agency.enforce_logo) return false;
    return true;
  }, [isIndependent, agency, isDirector]);

  const canModifyVideo = useMemo(() => {
    if (isIndependent) return true;
    if (!agency) return false;
    if (isDirector) return true;
    if (agency.video_display_mode === "agency") return false;
    return true;
  }, [isIndependent, agency, isDirector]);

  const canModifyLinks = useMemo(() => {
    if (isIndependent) return true;
    if (!agency) return false;

    if (isDirector) return true;
    if (agency.lock_links) return false;
    if (isTeamLeader) return !!agency.team_leader_can_edit_agency;
    if (isAgentAffiliate || isAgent) return !!agency.agent_can_edit_agency;

    return false;
  }, [isIndependent, agency, isDirector, isTeamLeader, isAgentAffiliate, isAgent]);

  const colorsMessage = useMemo(() => {
    if (isIndependent) {
      return "Vous êtes indépendant : vous pouvez personnaliser librement votre carte.";
    }
    if (!agency) {
      return "Aucune agence trouvée.";
    }
    if (agency.colors_uniform) {
      return "Charte graphique uniforme : les couleurs sont définies par l’agence et appliquées à tous.";
    }
    if (agency.lock_colors || agency.enforce_brand_colors) {
      return "Personnalisation verrouillée par l’agence : les couleurs ne sont pas modifiables ici.";
    }
    if (isDirector) {
      return "Vous pouvez définir la charte graphique de l’agence, ainsi que les règles QR de l’équipe.";
    }
    if (professionnel?.allow_card_customization) {
      return "Votre agence autorise la personnalisation : vous pouvez ajuster vos couleurs (base agence par défaut).";
    }
    return "La personnalisation des couleurs est gérée par votre agence.";
  }, [isIndependent, agency, isDirector, professionnel?.allow_card_customization]);

  const linksMessage = useMemo(() => {
    if (isIndependent) {
      return "Vous êtes indépendant : vous pouvez gérer librement vos liens et réseaux.";
    }
    if (!agency) {
      return "Aucune agence trouvée.";
    }
    if (isDirector) {
      return agency.lock_links
        ? "Liens verrouillés pour les membres : vous gardez la main sur les réseaux de l’agence."
        : "Vous pouvez gérer les réseaux de l’agence et autoriser/désactiver l’édition pour les membres.";
    }
    if (agency.lock_links) {
      return "Les liens de l’agence sont verrouillés : seule la direction peut les modifier.";
    }
    if (isTeamLeader) {
      return agency.team_leader_can_edit_agency
        ? "Vous pouvez modifier les réseaux sociaux de l’agence (autorisation active)."
        : "Les réseaux sociaux de l’agence sont gérés par la direction.";
    }
    if (isAgentAffiliate || isAgent) {
      return agency.agent_can_edit_agency
        ? "Vous pouvez modifier les réseaux sociaux de l’agence (autorisation active)."
        : "Les réseaux sociaux de l’agence sont gérés par la direction.";
    }
    return "Les réseaux sociaux de l’agence sont gérés par la direction.";
  }, [isIndependent, agency, isDirector, isTeamLeader, isAgentAffiliate, isAgent]);

  const videoMessage = useMemo(() => {
    if (isIndependent) {
      return "Vous êtes indépendant : vous pouvez gérer librement votre vidéo.";
    }
    if (!agency) {
      return "Aucune agence trouvée.";
    }
    if (isDirector) {
      return agency.video_display_mode === "agency"
        ? "La vidéo agence est actuellement imposée à tous les collaborateurs."
        : "Chaque collaborateur peut actuellement utiliser sa propre vidéo.";
    }
    return agency.video_display_mode === "agency"
      ? "La vidéo affichée sur votre carte est gérée par l’agence."
      : "Votre agence autorise une vidéo personnelle sur votre carte.";
  }, [isIndependent, agency, isDirector]);

  const isFreeCustomizationColors = useMemo(() => {
    if (isIndependent) return true;
    return !(agency?.colors_uniform ?? false);
  }, [isIndependent, agency?.colors_uniform]);

  const isFreeCustomizationLogo = useMemo(() => {
    if (isIndependent) return true;
    return !(agency?.enforce_logo ?? false);
  }, [isIndependent, agency?.enforce_logo]);

  const isFreeCustomizationVideo = useMemo(() => {
    if (isIndependent) return true;
    return !isAgencyVideoManaged;
  }, [isIndependent, isAgencyVideoManaged]);

  return {
    loading,
    error,

    role,
    isDirector,
    isTeamLeader,
    isAgentAffiliate,
    isAgent,

    isIndependent,
    isInAgency,
    isAgencyPremium,

    agency,
    professionnel,
    ctx,

    isAgencyVideoManaged,

    isFreeCustomizationColors,
    isFreeCustomizationLogo,
    isFreeCustomizationVideo,

    canModifyColors,
    canModifyLogo,
    canModifyVideo,
    canModifyLinks,

    linksMessage,
    colorsMessage,
    videoMessage,

    refetch: fetchPermissions,
  };
}