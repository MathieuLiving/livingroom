import React, {
  useMemo,
  useCallback,
  useState,
  Suspense,
  useEffect,
  useRef,
} from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { useAgencyData } from "@/hooks/useAgencyData";
import {
  Loader2,
  Save,
  User,
  Image,
  Link2,
  Palette,
  Share2,
  KeyRound,
  ExternalLink,
  Info,
  RefreshCw,
  AlertCircle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import SEO from "@/components/SEO";

import { supabase } from "@/lib/customSupabaseClient";
import { useProCardData } from "@/hooks/useProCardData";
import ProfessionnelCard from "@/components/pro/ProfessionnelCard";
import { buildCardColorsPayload } from "@/utils/proHelpers";
import {
  uploadMyAvatarFile,
  uploadMyLogoFile,
} from "@/utils/uploadUserAssetsToSupabase";

const ProfileInfoSection = React.lazy(() =>
  import("@/components/pro/ProfileInfoSection")
);
const SecuritySection = React.lazy(() =>
  import("@/components/pro/SecuritySection")
);
const ImageUploadSection = React.lazy(() =>
  import("@/components/pro/ImageUploadSection")
);
const SocialLinksSection = React.lazy(() =>
  import("@/components/pro/SocialLinksSection")
);
const DigitalCardCustomizationSection = React.lazy(() =>
  import("@/components/pro/DigitalCardCustomizationSection")
);
const CardDistributionTools = React.lazy(() =>
  import("@/components/pro/CardDistributionTools")
);
const CardAnalyticsPanel = React.lazy(() =>
  import("@/components/pro/CardAnalyticsPanel")
);

const SectionLoader = () => (
  <div className="space-y-4 pt-6">
    <Skeleton className="h-4 w-1/3" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-4 w-1/2" />
    <Skeleton className="h-10 w-full" />
  </div>
);

const SAFE_PROFILE_SELECT = `
  id,
  user_id,
  email,
  first_name,
  last_name,
  phone,
  company_name,
  function,
  professionnal_presentation,
  number_card_professional,
  cpi_number,

  scope_intervention_choice_1,
  scope_intervention_choice_2,
  scope_intervention_choice_3,

  avatar_url,
  avatar_path,
  logo_url,
  logo_path,

  agency_id,
  agency_role,
  allow_card_customization,
  is_active,
  is_public,
  visibility_pro_partner_page,
  card_slug,
  premium_professionnel_card,
  digital_card_livingroom_url,

  agency_website_url,
  customer_review_url,
  appointment_url,
  video_external_url,
  linkedin_url,
  facebook_url,
  instagram_url,
  youtube_url,
  tiktok_url,

  card_url_clicks,
  card_qr_scans,

  card_banner_color,
  card_text_color,
  card_primary_button_color,
  card_secondary_button_color,
  card_qr_fg_color,
  card_name_color,
  card_signature_color,
  card_company_name_color,
  card_support_text_color,

  qr_code_with_logo,

  billing_plan,
  access_plan
`;

const buildCanonicalCardUrl = (premiumUrl, cardSlug, proId) => {
  const premium = String(premiumUrl || "").trim();
  if (premium) return premium;

  const base =
    (import.meta?.env?.VITE_PUBLIC_CARD_ORIGIN || "").replace(/\/+$/, "") ||
    "https://card.livingroom.immo";

  if (cardSlug) {
    return `${base}/cvd/${encodeURIComponent(cardSlug)}?cvd=1&entry=external`;
  }

  if (proId) {
    return `${base}/carte-visite-digitale/${encodeURIComponent(
      proId
    )}?entry=external`;
  }

  return "";
};

const normalizeForCompare = (v) => {
  if (typeof v === "string") {
    const t = v.trim();
    return t === "" ? null : t;
  }
  if (v === undefined) return null;
  return v;
};

const buildPatchFromKeys = (keys, current, baseline) => {
  const patch = {};
  for (const k of keys) {
    const cur = normalizeForCompare(current?.[k]);
    const base = normalizeForCompare(baseline?.[k]);
    const changed =
      (cur === null && base !== null) ||
      (cur !== null && base === null) ||
      (cur !== null && base !== null && String(cur) !== String(base));
    if (changed) patch[k] = cur;
  }
  return patch;
};

const SOCIAL_KEYS = [
  "linkedin_url",
  "facebook_url",
  "instagram_url",
  "youtube_url",
  "tiktok_url",
];

const AGENCY_BRANDING_FORBIDDEN_KEYS = new Set([
  "company_name",
  "agency_name",
  "logo_url",
  "logo_path",
  "custom_logo_url",
  "agency_website_url",
  "agency_id",
  "agency_role",
]);

function normalizeRole(value) {
  return String(value || "").toLowerCase().trim();
}

function isAgencyAttachedRole(role) {
  return (
    role === "director" || role === "team_leader" || role === "agent_affiliate"
  );
}

function ProfessionnelProfilePage() {
  const location = useLocation();
  const { user, isAuthBusy, userType } = useAuth();
  const { agency } = useAgencyData();
  const { toast } = useToast();

  const authUid = user?.id || null;
  const authEmail = user?.email || null;

  const {
    profile,
    setProfile,
    loading: loadingProfile,
    refreshProfile,
    error: proCardError,
  } = useProCardData(authUid, authEmail);

  const [profileTimeout, setProfileTimeout] = useState(false);
  const [fallbackProfile, setFallbackProfile] = useState(null);
  const [fallbackLoading, setFallbackLoading] = useState(false);
  const [fallbackError, setFallbackError] = useState(null);
  const fallbackTriedRef = useRef(false);

  const [photoLoading, setPhotoLoading] = useState(false);
  const [logoLoading, setLogoLoading] = useState(false);

  const [savingAll, setSavingAll] = useState(false);
  const [savingColors, setSavingColors] = useState(false);
  const [savingLinks, setSavingLinks] = useState(false);

  const lastSavedRef = useRef(null);

  const role = (userType || "").toLowerCase();
  const next = encodeURIComponent(location.pathname + location.search);

  const displayProfile = useMemo(() => {
    return profile || fallbackProfile || null;
  }, [profile, fallbackProfile]);

  const isLoading = loadingProfile || fallbackLoading;

  const agencyRole = useMemo(
    () => normalizeRole(displayProfile?.agency_role),
    [displayProfile?.agency_role]
  );

  const isAgencyMember = useMemo(
    () => isAgencyAttachedRole(agencyRole),
    [agencyRole]
  );

  const isIndependentAgent = useMemo(
    () => agencyRole === "agent" || !isAgencyMember,
    [agencyRole, isAgencyMember]
  );

  const getAgencyDisplayMode = useCallback(
    (key) => {
      const rawKey = String(key || "").trim();

      const explicitMode =
        rawKey === "video_external_url"
          ? agency?.video_display_mode ??
            agency?.video_external_display_mode ??
            agency?.video_mode
          : undefined;

      if (
        explicitMode !== undefined &&
        explicitMode !== null &&
        String(explicitMode).trim() !== ""
      ) {
        const normalizedExplicit = String(explicitMode).toLowerCase().trim();
        return normalizedExplicit === "personal" ? "personal" : "agency";
      }

      const modeKey = rawKey.replace("_url", "_display_mode");
      const mode = String(agency?.[modeKey] || "agency").toLowerCase().trim();
      return mode === "personal" ? "personal" : "agency";
    },
    [agency]
  );

  const videoManagedByAgency = useMemo(() => {
    if (!isAgencyMember) return false;
    return getAgencyDisplayMode("video_external_url") === "agency";
  }, [isAgencyMember, getAgencyDisplayMode]);

  const canEditCompany = isIndependentAgent;
  const canEditLogo = isIndependentAgent;
  const canEditQrPreference = isIndependentAgent;
  const canEditVideo = !isAgencyMember || !videoManagedByAgency;

  const refetchProfileSafe = useCallback(async () => {
    if (typeof refreshProfile !== "function") return;
    try {
      await refreshProfile({ clearDirty: true });
    } catch {
      try {
        await refreshProfile(true);
      } catch {
        await refreshProfile();
      }
    }
  }, [refreshProfile]);

  const sanitizePatchForAgencyMember = useCallback(
    (patch) => {
      if (!patch) return patch;

      const cleaned = { ...(patch || {}) };

      if (!isAgencyMember) {
        return cleaned;
      }

      for (const key of Object.keys(cleaned)) {
        if (AGENCY_BRANDING_FORBIDDEN_KEYS.has(key)) {
          delete cleaned[key];
        }
      }

      for (const s of SOCIAL_KEYS) {
        if (getAgencyDisplayMode(s) === "agency") {
          delete cleaned[s];
        }
      }

      if (getAgencyDisplayMode("video_external_url") === "agency") {
        delete cleaned.video_external_url;
        delete cleaned.video_url;
        delete cleaned.video_storage_path;
        delete cleaned.video_preferred_source;
        delete cleaned.custom_video_url;
      }

      return cleaned;
    },
    [isAgencyMember, getAgencyDisplayMode]
  );

  const safeSetProfile = useCallback(
    (updater) => {
      setProfile((prev) => {
        const prevObj = prev || {};
        const nextValue =
          typeof updater === "function" ? updater(prevObj) : updater;

        if (!nextValue) return nextValue;
        if (!isAgencyMember) return nextValue;

        const cleaned = { ...(nextValue || {}) };

        for (const forbidden of AGENCY_BRANDING_FORBIDDEN_KEYS) {
          if (forbidden in cleaned) {
            cleaned[forbidden] = prevObj[forbidden];
          }
        }

        for (const s of SOCIAL_KEYS) {
          if (getAgencyDisplayMode(s) === "agency" && s in cleaned) {
            cleaned[s] = prevObj[s];
          }
        }

        if (getAgencyDisplayMode("video_external_url") === "agency") {
          if ("video_external_url" in cleaned) {
            cleaned.video_external_url = prevObj.video_external_url;
          }
          if ("video_url" in cleaned) cleaned.video_url = prevObj.video_url;
          if ("video_storage_path" in cleaned) {
            cleaned.video_storage_path = prevObj.video_storage_path;
          }
          if ("video_preferred_source" in cleaned) {
            cleaned.video_preferred_source = prevObj.video_preferred_source;
          }
          if ("custom_video_url" in cleaned) {
            cleaned.custom_video_url = prevObj.custom_video_url;
          }
        }

        return cleaned;
      });
    },
    [setProfile, isAgencyMember, getAgencyDisplayMode]
  );

  const loadFallbackProfile = useCallback(async () => {
    if (!authUid) return;
    if (fallbackTriedRef.current) return;
    fallbackTriedRef.current = true;

    if (!supabase) {
      setFallbackError(new Error("Configuration Supabase manquante."));
      setFallbackLoading(false);
      return;
    }

    setFallbackLoading(true);
    setFallbackError(null);

    try {
      let { data, error } = await supabase
        .from("professionnels")
        .select(SAFE_PROFILE_SELECT)
        .eq("user_id", authUid)
        .maybeSingle();

      if (!data && !error) {
        const r2 = await supabase
          .from("professionnels")
          .select(SAFE_PROFILE_SELECT)
          .eq("id", authUid)
          .maybeSingle();
        data = r2.data;
        error = r2.error;
      }

      if (error) throw error;

      setFallbackProfile(data || null);

      if (data) {
        setProfile((prev) => ({ ...(prev || {}), ...(data || {}) }));
      }
    } catch (e) {
      console.error("[ProfessionnelProfilePage] fallback fetch error:", e);
      setFallbackError(e);
    } finally {
      setFallbackLoading(false);
    }
  }, [authUid, setProfile]);

  useEffect(() => {
    if (!authUid) return;
    if (!loadingProfile) {
      setProfileTimeout(false);
      return;
    }
    const t = setTimeout(() => setProfileTimeout(true), 5500);
    return () => clearTimeout(t);
  }, [authUid, loadingProfile]);

  useEffect(() => {
    if (!authUid) return;
    if (isAuthBusy) return;

    const needsFallback = (!loadingProfile && !profile) || profileTimeout;
    if (needsFallback) loadFallbackProfile();
  }, [
    authUid,
    isAuthBusy,
    loadingProfile,
    profile,
    profileTimeout,
    loadFallbackProfile,
  ]);

  useEffect(() => {
    if (displayProfile?.id) {
      lastSavedRef.current = { ...(displayProfile || {}) };
    }
  }, [displayProfile?.id]);

  const handleUploadImage = useCallback(
    async (file, type) => {
      if (!file) return;

      const isLogo = type === "logo";

      if (isLogo && isAgencyMember) {
        toast({
          variant: "destructive",
          title: "Action impossible",
          description:
            "Le logo entreprise est géré par l’agence. Modifiez-le depuis l’espace Agence (Directeur).",
        });
        return;
      }

      const setLoading = isLogo ? setLogoLoading : setPhotoLoading;
      setLoading(true);

      try {
        if (file.size > 5 * 1024 * 1024) {
          throw new Error("Fichier trop volumineux (max 5Mo).");
        }

        const validTypes = [
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/gif",
        ];
        if (!validTypes.includes(file.type)) {
          throw new Error("Format invalide. Utilisez JPG, PNG, WEBP ou GIF.");
        }

        const { data: authRes, error: authErr } = await supabase.auth.getUser();
        if (authErr) throw authErr;

        const userId = authRes?.user?.id;
        if (!userId) throw new Error("Utilisateur non authentifié.");

        const uploadResult = isLogo
          ? await uploadMyLogoFile(file)
          : await uploadMyAvatarFile(file);

        const { path, publicUrl } = uploadResult || {};

        if (!path || !publicUrl) {
          throw new Error("Upload incomplet : chemin ou URL publique manquants.");
        }

        const updates = isLogo
          ? {
              logo_path: path,
              logo_url: publicUrl,
              updated_at: new Date().toISOString(),
            }
          : {
              avatar_path: path,
              avatar_url: publicUrl,
              updated_at: new Date().toISOString(),
            };

        const finalUpdates = sanitizePatchForAgencyMember(updates);

        const { error: dbError } = await supabase
          .from("professionnels")
          .update(finalUpdates)
          .eq("user_id", userId);

        if (dbError) throw dbError;

        safeSetProfile((prev) => ({ ...(prev || {}), ...(finalUpdates || {}) }));
        await refetchProfileSafe();

        toast({
          title: "Succès",
          description: `${
            isLogo ? "Logo" : "Photo"
          } enregistrée avec succès !`,
        });
      } catch (error) {
        console.error(`[ProfessionnelProfilePage] upload ${type} error:`, error);
        toast({
          variant: "destructive",
          title: "Erreur lors du téléchargement",
          description: error?.message || "Une erreur est survenue.",
        });
      } finally {
        setLoading(false);
      }
    },
    [
      isAgencyMember,
      safeSetProfile,
      toast,
      sanitizePatchForAgencyMember,
      refetchProfileSafe,
    ]
  );

  const handlePhotoUpload = useCallback(
    (file) => handleUploadImage(file, "photo"),
    [handleUploadImage]
  );

  const handleLogoUpload = useCallback(
    (file) => handleUploadImage(file, "logo"),
    [handleUploadImage]
  );

  const savePatch = useCallback(
    async (patch, { showAlert = true } = {}) => {
      const proId = displayProfile?.id;
      if (!proId) return { ok: false, reason: "no-pro-id" };
      if (!supabase) return { ok: false, reason: "no-supabase" };

      let cleanPatch = { ...(patch || {}) };
      cleanPatch.updated_at = new Date().toISOString();

      if ("cpi_number" in cleanPatch || "number_card_professional" in cleanPatch) {
        const cpi = normalizeForCompare(
          cleanPatch.cpi_number ?? cleanPatch.number_card_professional
        );
        cleanPatch.cpi_number = cpi;
        cleanPatch.number_card_professional = cpi;
      }

      cleanPatch = sanitizePatchForAgencyMember(cleanPatch);

      const keys = Object.keys(cleanPatch).filter((k) => k !== "updated_at");

      if (keys.length === 0) {
        if (showAlert) {
          toast({ title: "Aucune modification à enregistrer" });
        }
        return { ok: true, skipped: true };
      }

      safeSetProfile((prev) => ({ ...(prev || {}), ...(cleanPatch || {}) }));

      try {
        const { error } = await supabase
          .from("professionnels")
          .update(cleanPatch)
          .eq("id", proId);

        if (error) throw error;

        lastSavedRef.current = {
          ...(lastSavedRef.current || {}),
          ...(cleanPatch || {}),
        };

        await refetchProfileSafe();

        if (showAlert) toast({ title: "Modifications enregistrées" });

        return { ok: true };
      } catch (e) {
        console.error("[ProfessionnelProfilePage] savePatch error:", e);
        if (showAlert) {
          toast({
            variant: "destructive",
            title: "Erreur lors de l'enregistrement",
            description: e?.message,
          });
        }
        return { ok: false, error: e };
      }
    },
    [
      displayProfile?.id,
      safeSetProfile,
      toast,
      sanitizePatchForAgencyMember,
      refetchProfileSafe,
    ]
  );

  const isDirtyKeys = useCallback(
    (keys) => {
      const base = lastSavedRef.current || {};
      const cur = displayProfile || {};
      const patch = buildPatchFromKeys(keys, cur, base);
      return Object.keys(sanitizePatchForAgencyMember(patch)).length > 0;
    },
    [displayProfile, sanitizePatchForAgencyMember]
  );

  const COLOR_KEYS = useMemo(
    () => [
      "card_banner_color",
      "card_text_color",
      "card_primary_button_color",
      "card_secondary_button_color",
      "card_qr_fg_color",
      "card_name_color",
      "card_signature_color",
      "card_company_name_color",
      "card_support_text_color",
    ],
    []
  );

  const NON_COLOR_SAVE_KEYS = useMemo(() => {
    const base = [
      "first_name",
      "last_name",
      "phone",
      "function",
      "professionnal_presentation",
      "scope_intervention_choice_1",
      "scope_intervention_choice_2",
      "scope_intervention_choice_3",
      "cpi_number",
      "number_card_professional",
      "customer_review_url",
      "appointment_url",
      "is_public",
      "visibility_pro_partner_page",
    ];

    if (canEditVideo) {
      base.push("video_external_url");
    }

    if (!isAgencyMember) {
      base.push(
        "agency_website_url",
        "linkedin_url",
        "facebook_url",
        "instagram_url",
        "youtube_url",
        "tiktok_url"
      );
    } else {
      if (getAgencyDisplayMode("linkedin_url") === "personal") {
        base.push("linkedin_url");
      }
      if (getAgencyDisplayMode("facebook_url") === "personal") {
        base.push("facebook_url");
      }
      if (getAgencyDisplayMode("instagram_url") === "personal") {
        base.push("instagram_url");
      }
      if (getAgencyDisplayMode("youtube_url") === "personal") {
        base.push("youtube_url");
      }
      if (getAgencyDisplayMode("tiktok_url") === "personal") {
        base.push("tiktok_url");
      }
    }

    if (canEditCompany) base.push("company_name");
    if (canEditQrPreference) base.push("qr_code_with_logo");

    return base;
  }, [
    isAgencyMember,
    getAgencyDisplayMode,
    canEditCompany,
    canEditQrPreference,
    canEditVideo,
  ]);

  const LINKS_KEYS = useMemo(() => {
    const personalAlways = ["customer_review_url", "appointment_url"];

    if (canEditVideo) {
      personalAlways.push("video_external_url");
    }

    if (!isAgencyMember) {
      return [
        "agency_website_url",
        ...personalAlways,
        "linkedin_url",
        "facebook_url",
        "instagram_url",
        "youtube_url",
        "tiktok_url",
      ];
    }

    const socials = [];
    if (getAgencyDisplayMode("linkedin_url") === "personal") {
      socials.push("linkedin_url");
    }
    if (getAgencyDisplayMode("facebook_url") === "personal") {
      socials.push("facebook_url");
    }
    if (getAgencyDisplayMode("instagram_url") === "personal") {
      socials.push("instagram_url");
    }
    if (getAgencyDisplayMode("youtube_url") === "personal") {
      socials.push("youtube_url");
    }
    if (getAgencyDisplayMode("tiktok_url") === "personal") {
      socials.push("tiktok_url");
    }

    return [...personalAlways, ...socials];
  }, [isAgencyMember, getAgencyDisplayMode, canEditVideo]);

  const handleSaveColors = useCallback(async () => {
    if (!displayProfile?.id) return;

    if (isAgencyMember) {
      toast({
        variant: "destructive",
        title: "Action impossible",
        description:
          "Les couleurs de la carte sont gérées par l’agence pour ce rôle.",
      });
      return;
    }

    setSavingColors(true);
    try {
      const base = lastSavedRef.current || {};
      const rawPatch = buildPatchFromKeys(COLOR_KEYS, displayProfile, base);
      const cleanedRawPatch = sanitizePatchForAgencyMember(rawPatch);

      if (Object.keys(cleanedRawPatch).length === 0) {
        toast({ title: "Aucune modification à enregistrer" });
        return;
      }

      const colorPatch = buildCardColorsPayload({
        ...(displayProfile || {}),
        ...(cleanedRawPatch || {}),
      });

      const result = await savePatch(colorPatch, { showAlert: false });
      if (!result?.ok) {
        throw result?.error || new Error("Impossible d'enregistrer les couleurs.");
      }

      await refetchProfileSafe();

      toast({
        title: "Design mis à jour",
        description: "Les couleurs de votre carte ont été enregistrées.",
      });
    } catch (error) {
      console.error("[ProfessionnelProfilePage] handleSaveColors error:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description:
          error?.message || "Impossible d'enregistrer les couleurs.",
      });
    } finally {
      setSavingColors(false);
    }
  }, [
    displayProfile,
    isAgencyMember,
    COLOR_KEYS,
    toast,
    sanitizePatchForAgencyMember,
    savePatch,
    refetchProfileSafe,
  ]);

  const handleSaveLinks = useCallback(async () => {
    if (!displayProfile?.id) return;

    const base = lastSavedRef.current || {};
    const patch = buildPatchFromKeys(LINKS_KEYS, displayProfile, base);
    const cleaned = sanitizePatchForAgencyMember(patch);

    if (Object.keys(cleaned).length === 0) return;

    setSavingLinks(true);
    try {
      await savePatch(cleaned, { showAlert: true });
    } finally {
      setSavingLinks(false);
    }
  }, [displayProfile, LINKS_KEYS, savePatch, sanitizePatchForAgencyMember]);

  const handleSaveAll = useCallback(async () => {
    if (!displayProfile?.id) return;

    setSavingAll(true);
    try {
      const base = lastSavedRef.current || {};
      const nonColorPatch = buildPatchFromKeys(
        NON_COLOR_SAVE_KEYS,
        displayProfile,
        base
      );
      const cleanedNonColorPatch = sanitizePatchForAgencyMember(nonColorPatch);

      if (Object.keys(cleanedNonColorPatch).length > 0) {
        const result = await savePatch(cleanedNonColorPatch, {
          showAlert: false,
        });
        if (!result?.ok) {
          throw result?.error || new Error("Échec de la sauvegarde du profil.");
        }
      }

      if (!isAgencyMember) {
        const colorsChanged = isDirtyKeys(COLOR_KEYS);
        if (colorsChanged) {
          const colorPatch = buildCardColorsPayload(displayProfile);
          const result = await savePatch(colorPatch, { showAlert: false });
          if (!result?.ok) {
            throw result?.error || new Error("Échec de la sauvegarde des couleurs.");
          }
        }
      }

      await refetchProfileSafe();

      toast({
        title: "Modifications enregistrées",
        description: "Votre profil a bien été mis à jour.",
      });
    } catch (error) {
      console.error("[ProfessionnelProfilePage] handleSaveAll error:", error);
      toast({
        variant: "destructive",
        title: "Erreur lors de l'enregistrement",
        description:
          error?.message || "Impossible d'enregistrer les modifications.",
      });
    } finally {
      setSavingAll(false);
    }
  }, [
    displayProfile,
    NON_COLOR_SAVE_KEYS,
    COLOR_KEYS,
    isAgencyMember,
    savePatch,
    sanitizePatchForAgencyMember,
    isDirtyKeys,
    toast,
    refetchProfileSafe,
  ]);

  if (isAuthBusy) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (!user) return <Navigate to={`/auth?next=${next}`} replace />;

  if (role !== "professionnel" && role !== "admin") {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Accès refusé</AlertTitle>
          <AlertDescription>
            Cette page est réservée aux professionnels.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading && !displayProfile) {
    return (
      <div className="container mx-auto py-10 space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!displayProfile && !isLoading) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>
            Impossible de charger votre profil. Veuillez réessayer plus tard.
            {fallbackError && (
              <div className="mt-2 text-xs opacity-80">
                {fallbackError.message}
              </div>
            )}
          </AlertDescription>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Recharger
          </Button>
        </Alert>
      </div>
    );
  }

  const publicCardUrl = buildCanonicalCardUrl(
    displayProfile?.premium_professionnel_card,
    displayProfile?.card_slug,
    displayProfile?.id
  );

  return (
    <>
      <SEO
        title="Mon Profil Professionnel | LivingRoom"
        description="Gérez votre profil professionnel, votre carte de visite digitale et vos informations."
      />

      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mon Profil</h1>
            <p className="mt-1 text-gray-500">
              Gérez vos informations et votre carte de visite digitale
            </p>
            {isAgencyMember && (
              <p className="mt-2 text-xs text-gray-500">
                Certaines informations (nom / logo / liens agence / vidéo selon
                le mode choisi) sont gérées par l’agence et ne sont pas
                modifiables ici.
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSaveAll}
              disabled={savingAll || photoLoading || logoLoading}
              className="bg-brand-blue hover:bg-brand-blue/90"
              title="Enregistrer toutes les modifications"
            >
              {savingAll ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div className="mb-6 flex items-center gap-2">
                  <User className="h-5 w-5 text-brand-blue" />
                  <h2 className="text-xl font-semibold">
                    Informations Personnelles
                  </h2>
                </div>
                <Suspense fallback={<SectionLoader />}>
                  <ProfileInfoSection
                    profile={displayProfile}
                    setProfile={safeSetProfile}
                    saving={savingAll || savingColors || savingLinks}
                    canEditCompany={canEditCompany}
                    isAgencyMember={isAgencyMember}
                    agency={agency}
                  />
                </Suspense>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-brand-blue" />
                  <CardTitle className="text-xl">
                    Mentions Légales & Options
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Les mentions légales sont gérées automatiquement. (CPI et
                options QR déplacés dans les sections dédiées.)
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="mb-6 flex items-center gap-2">
                  <Image className="h-5 w-5 text-brand-blue" />
                  <h2 className="text-xl font-semibold">Photos & Logos</h2>
                </div>
                <Suspense fallback={<SectionLoader />}>
                  <ImageUploadSection
                    profile={displayProfile}
                    onUploadPhoto={handlePhotoUpload}
                    onUploadLogo={handleLogoUpload}
                    photoLoading={photoLoading}
                    logoLoading={logoLoading}
                    canEditLogo={canEditLogo}
                    isAgencyMember={isAgencyMember}
                    agency={agency}
                    onProfileUpdate={async () => {
                      await refetchProfileSafe();
                    }}
                  />
                </Suspense>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="mb-6 flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-brand-blue" />
                  <h2 className="text-xl font-semibold">
                    Réseaux Sociaux & Liens
                  </h2>
                </div>
                <Suspense fallback={<SectionLoader />}>
                  <SocialLinksSection
                    profile={displayProfile}
                    setProfile={safeSetProfile}
                    saving={savingAll || savingColors || savingLinks}
                    onSave={handleSaveLinks}
                    savingLocal={savingLinks}
                    isDirty={() => isDirtyKeys(LINKS_KEYS)}
                    isAgencyMember={isAgencyMember}
                    agency={agency}
                  />
                </Suspense>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="mb-6 flex items-center gap-2">
                  <Palette className="h-5 w-5 text-brand-blue" />
                  <h2 className="text-xl font-semibold">
                    Personnalisation Carte Digitale
                  </h2>
                </div>
                <Suspense fallback={<SectionLoader />}>
                  <DigitalCardCustomizationSection
                    profile={displayProfile}
                    setProfile={safeSetProfile}
                    agency={agency}
                    saving={savingAll || savingColors || savingLinks}
                    onSave={handleSaveColors}
                    savingLocal={savingColors}
                    isDirty={() => isDirtyKeys(COLOR_KEYS)}
                    onRefetch={async () => {
                      await refetchProfileSafe();
                    }}
                  />
                </Suspense>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="mb-6 flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-brand-blue" />
                  <h2 className="text-xl font-semibold">Outils de Diffusion</h2>
                </div>
                <Suspense fallback={<SectionLoader />}>
                  <CardDistributionTools
                    profile={displayProfile}
                    agency={agency}
                    saving={savingAll || savingColors || savingLinks}
                  />
                </Suspense>
              </CardContent>
            </Card>

            <Suspense fallback={<SectionLoader />}>
              <CardAnalyticsPanel professionnelId={displayProfile?.id} />
            </Suspense>

            <Card>
              <CardContent className="p-6">
                <div className="mb-6 flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-brand-blue" />
                  <h2 className="text-xl font-semibold">Sécurité</h2>
                </div>
                <Suspense fallback={<SectionLoader />}>
                  <SecuritySection userEmail={authEmail} />
                </Suspense>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
                  <ExternalLink className="h-4 w-4" />
                  Prévisualisation de votre carte
                </h3>

                <div className="flex justify-center overflow-hidden rounded-lg border bg-gray-50 p-4">
                  <div className="flex w-full origin-top transform justify-center">
                    <div className="w-full max-w-[380px]">
                      <ProfessionnelCard
                        professionnel={displayProfile}
                        origin="preview"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-center">
                  <Button variant="outline" asChild className="w-full">
                    <a
                      href={publicCardUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Voir ma carte en ligne (public)
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>

              <Card className="border-blue-100 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                    <div className="text-sm text-blue-800">
                      <p className="mb-1 font-medium">Astuce Pro</p>
                      <p>
                        Partagez votre carte digitale lors de vos rendez-vous ou
                        ajoutez le lien dans votre signature email pour
                        maximiser votre visibilité.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {proCardError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erreur technique</AlertTitle>
                  <AlertDescription className="text-xs">
                    {proCardError?.message || "Une erreur est survenue."}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ProfessionnelProfilePage;