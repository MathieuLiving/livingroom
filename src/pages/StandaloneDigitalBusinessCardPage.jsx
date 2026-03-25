import React, { useEffect, useMemo, useState } from "react";
import { useParams, useLocation, useNavigate, Navigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/lib/customSupabaseClient";
import ProfessionnelCard from "@/components/pro/ProfessionnelCard";
import { Loader2 } from "lucide-react";

import {
  buildCvdTitleFromPro,
  buildCvdMetaDescriptionFromPro,
  generateCvdSeoTextFromPro,
} from "@/utils/seoCvd";

const CARD_SITE_URL = "https://card.livingroom.immo";
const MAIN_SITE_URL = "https://livingroom.immo";

const getEffectiveCompanyName = (pro) =>
  pro?.effective_company_name || pro?.company_name || pro?.agency_name || "";

const getEffectiveAvatarUrl = (pro) =>
  pro?.avatar_url || pro?.effective_avatar_url || "";

const getEffectiveLogoUrl = (pro) =>
  pro?.effective_logo_url || pro?.logo_url || "";

const getEffectiveImageUrl = (pro) =>
  getEffectiveAvatarUrl(pro) || getEffectiveLogoUrl(pro) || "";

const getAreas = (pro) =>
  [
    pro?.scope_intervention_choice_1,
    pro?.scope_intervention_choice_2,
    pro?.scope_intervention_choice_3,
  ].filter(Boolean);

const getSameAs = (pro) =>
  [
    pro?.effective_linkedin_url || pro?.linkedin_url,
    pro?.effective_facebook_url || pro?.facebook_url,
    pro?.effective_instagram_url || pro?.instagram_url,
    pro?.effective_youtube_url || pro?.youtube_url,
    pro?.effective_tiktok_url || pro?.tiktok_url,
    pro?.effective_customer_review_url || pro?.customer_review_url,
  ].filter(Boolean);

const buildStructuredData = (pro, canonicalUrl) => {
  if (!pro || !canonicalUrl) return null;

  const fullName =
    `${pro.first_name || ""} ${pro.last_name || ""}`.trim() ||
    "Professionnel immobilier";

  const image = getEffectiveImageUrl(pro) || undefined;
  const areas = getAreas(pro);
  const sameAs = getSameAs(pro);

  const companyName = getEffectiveCompanyName(pro);
  const jobTitle = pro.function || "Agent immobilier";

  const personId = `${canonicalUrl}#person`;
  const orgId = `${canonicalUrl}#org`;
  const agentId = `${canonicalUrl}#agent`;
  const webpageId = `${canonicalUrl}#webpage`;
  const breadcrumbId = `${canonicalUrl}#breadcrumb`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": webpageId,
        url: canonicalUrl,
        name: fullName,
        isPartOf: {
          "@type": "WebSite",
          name: "LivingRoom.immo",
          url: CARD_SITE_URL,
        },
        mainEntity: {
          "@id": personId,
        },
        about: {
          "@id": agentId,
        },
      },
      {
        "@type": "Person",
        "@id": personId,
        name: fullName,
        url: canonicalUrl,
        ...(image ? { image } : {}),
        jobTitle,
        email: pro.email || undefined,
        telephone: pro.phone || undefined,
        sameAs,
        worksFor: companyName
          ? {
              "@id": orgId,
            }
          : undefined,
      },
      ...(companyName
        ? [
            {
              "@type": "Organization",
              "@id": orgId,
              name: companyName,
              url: pro.effective_website_url || pro.agency_website_url || undefined,
              logo: getEffectiveLogoUrl(pro) || undefined,
            },
          ]
        : []),
      {
        "@type": "RealEstateAgent",
        "@id": agentId,
        name: fullName,
        url: canonicalUrl,
        ...(image ? { image } : {}),
        jobTitle,
        email: pro.email || undefined,
        telephone: pro.phone || undefined,
        description: generateCvdSeoTextFromPro(pro) || undefined,
        sameAs,
        ...(companyName
          ? {
              worksFor: {
                "@id": orgId,
              },
            }
          : {}),
        ...(areas.length
          ? {
              areaServed: areas.map((a) => ({
                "@type": "Place",
                name: a,
              })),
            }
          : {}),
      },
      {
        "@type": "BreadcrumbList",
        "@id": breadcrumbId,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Accueil",
            item: CARD_SITE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Carte de visite digitale",
            item: canonicalUrl,
          },
        ],
      },
    ],
  };
};

const RESERVED_CVD_SLUGS = new Set([
  "dashboard",
  "administration",
  "admin",
  "mon-espace",
  "connexion",
  "inscription",
  "auth",
  "projets",
  "demandes",
  "alertes",
  "particulier",
  "particuliers",
  "professionnel",
  "professionnels",
  "place-des-projets",
  "matching",
  "chat",
  "qr",
  "go",
]);

const PUBLIC_CVD_SOURCES = [
  "professionnels_public",
  "professionnels_partner_page_public",
];

const PUBLIC_CVD_SELECT = [
  "id",
  "user_id",
  "card_slug",
  "premium_professionnel_card",
  "first_name",
  "last_name",
  "email",
  "phone",
  "function",
  "professionnal_presentation",

  "scope_intervention_choice_1",
  "scope_intervention_choice_2",
  "scope_intervention_choice_3",

  "agency_id",
  "agency_role",
  "agency_name",
  "is_agency_member",

  "avatar_url",
  "avatar_path",
  "logo_url",
  "logo_path",

  "appointment_url",
  "agency_website_url",
  "customer_review_url",
  "linkedin_url",
  "facebook_url",
  "instagram_url",
  "youtube_url",
  "tiktok_url",

  "video_url",
  "video_external_url",
  "video_storage_path",
  "video_preferred_source",

  "effective_company_name",
  "effective_logo_url",
  "effective_logo_path",
  "effective_website_url",
  "effective_customer_review_url",
  "effective_linkedin_url",
  "effective_facebook_url",
  "effective_instagram_url",
  "effective_youtube_url",
  "effective_tiktok_url",
  "effective_video_url",
  "effective_video_external_url",
  "effective_video_storage_path",
  "effective_video_preferred_source",

  "card_banner_color",
  "card_text_color",
  "card_primary_button_color",
  "card_secondary_button_color",
  "card_name_color",
  "card_signature_color",
  "card_company_name_color",
  "card_support_text_color",
  "card_qr_fg_color",
  "qr_code_with_logo",

  "effective_card_banner_color",
  "effective_card_text_color",
  "effective_card_primary_button_color",
  "effective_card_secondary_button_color",
  "effective_card_name_color",
  "effective_card_signature_color",
  "effective_card_company_name_color",
  "effective_card_support_text_color",
  "effective_card_qr_fg_color",
  "effective_qr_code_with_logo",

  "digital_card_livingroom_url",
].join(",");

const PROFESSIONNELS_FALLBACK_SELECT = [
  "id",
  "user_id",
  "card_slug",
  "premium_professionnel_card",
  "first_name",
  "last_name",
  "email",
  "phone",
  "function",
  "professionnal_presentation",

  "scope_intervention_choice_1",
  "scope_intervention_choice_2",
  "scope_intervention_choice_3",

  "agency_id",
  "agency_role",
  "agency_name",
  "is_agency_member",

  "avatar_url",
  "avatar_path",
  "logo_url",
  "logo_path",

  "appointment_url",
  "agency_website_url",
  "customer_review_url",
  "linkedin_url",
  "facebook_url",
  "instagram_url",
  "youtube_url",
  "tiktok_url",

  "video_url",
  "video_external_url",
  "video_storage_path",
  "video_preferred_source",

  "card_banner_color",
  "card_text_color",
  "card_primary_button_color",
  "card_secondary_button_color",
  "card_name_color",
  "card_signature_color",
  "card_company_name_color",
  "card_support_text_color",
  "card_qr_fg_color",
  "qr_code_with_logo",

  "digital_card_livingroom_url",

  "is_public",
  "is_active",
  "is_archived",
  "validation_status",
  "visibility_pro_partner_page",

  "card_url_clicks",
  "card_qr_scans",
].join(",");

const PRO_CARDS_EFFECTIVE_SELECT = [
  "professionnel_id",
  "premium_professionnel_card",
  "premium_card_tracking_key",
  "digital_card_livingroom_url",
  "digital_card_livingpage_url",

  "avatar_url",
  "avatar_path",

  "pro_logo_url",
  "pro_logo_path",
  "agency_logo_url",
  "effective_logo_url",
  "effective_logo_path",
  "effective_logo_source",

  "card_url_clicks",
  "card_qr_scans",

  "card_banner_color",
  "card_text_color",
  "card_primary_button_color",
  "card_secondary_button_color",
  "card_qr_fg_color",
  "card_name_color",
  "card_signature_color",
  "card_company_name_color",
  "card_support_text_color",

  "pro_video_preferred_source",
  "pro_video_url",
  "pro_video_external_url",
  "pro_video_storage_path",

  "effective_video_preferred_source",
  "effective_video_url",
  "effective_video_external_url",
  "effective_video_storage_path",
].join(",");

const pickFirst = (res) =>
  Array.isArray(res?.data) && res.data.length ? res.data[0] : null;

const normalizeSlug = (value) => String(value || "").trim();

const normalizeLoose = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const mergeWithEffectiveCard = (base, effective) => {
  if (!base) return null;
  if (!effective) return base;

  return {
    ...base,

    premium_professionnel_card:
      effective.premium_professionnel_card || base.premium_professionnel_card,

    premium_card_tracking_key:
      effective.premium_card_tracking_key ||
      effective.premium_professionnel_card ||
      base.premium_card_tracking_key ||
      base.premium_professionnel_card ||
      "",

    digital_card_livingroom_url:
      effective.digital_card_livingroom_url || base.digital_card_livingroom_url,

    digital_card_livingpage_url:
      effective.digital_card_livingpage_url || base.digital_card_livingpage_url,

    effective_logo_url: effective.effective_logo_url || base.effective_logo_url,
    effective_logo_path: effective.effective_logo_path || base.effective_logo_path,
    effective_logo_source:
      effective.effective_logo_source || base.effective_logo_source,

    effective_video_preferred_source:
      effective.effective_video_preferred_source ||
      base.effective_video_preferred_source,

    effective_video_url: effective.effective_video_url || base.effective_video_url,
    effective_video_external_url:
      effective.effective_video_external_url ||
      base.effective_video_external_url,
    effective_video_storage_path:
      effective.effective_video_storage_path ||
      base.effective_video_storage_path,

    card_banner_color: effective.card_banner_color || base.card_banner_color,
    card_text_color: effective.card_text_color || base.card_text_color,
    card_primary_button_color:
      effective.card_primary_button_color || base.card_primary_button_color,
    card_secondary_button_color:
      effective.card_secondary_button_color || base.card_secondary_button_color,
    card_qr_fg_color: effective.card_qr_fg_color || base.card_qr_fg_color,
    card_name_color: effective.card_name_color || base.card_name_color,
    card_signature_color:
      effective.card_signature_color || base.card_signature_color,
    card_company_name_color:
      effective.card_company_name_color || base.card_company_name_color,
    card_support_text_color:
      effective.card_support_text_color || base.card_support_text_color,

    avatar_url: base.avatar_url || effective.avatar_url,
    avatar_path: base.avatar_path || effective.avatar_path,

    card_url_clicks:
      Number(effective?.card_url_clicks ?? base?.card_url_clicks ?? 0) || 0,
    card_qr_scans:
      Number(effective?.card_qr_scans ?? base?.card_qr_scans ?? 0) || 0,

    effective_card_banner_color:
      base.effective_card_banner_color || effective.card_banner_color,
    effective_card_text_color:
      base.effective_card_text_color || effective.card_text_color,
    effective_card_primary_button_color:
      base.effective_card_primary_button_color ||
      effective.card_primary_button_color,
    effective_card_secondary_button_color:
      base.effective_card_secondary_button_color ||
      effective.card_secondary_button_color,
    effective_card_name_color:
      base.effective_card_name_color || effective.card_name_color,
    effective_card_signature_color:
      base.effective_card_signature_color || effective.card_signature_color,
    effective_card_company_name_color:
      base.effective_card_company_name_color ||
      effective.card_company_name_color,
    effective_card_support_text_color:
      base.effective_card_support_text_color ||
      effective.card_support_text_color,
    effective_card_qr_fg_color:
      base.effective_card_qr_fg_color || effective.card_qr_fg_color,
  };
};

const StandaloneDigitalBusinessCardPage = () => {
  const { slug, professionnelId, cardSlug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [pro, setPro] = useState(null);
  const [loading, setLoading] = useState(true);

  const resolvedSlug = useMemo(
    () => normalizeSlug(slug || cardSlug || ""),
    [slug, cardSlug]
  );

  const candidateSlug = useMemo(
    () => resolvedSlug.toLowerCase(),
    [resolvedSlug]
  );

  const isReservedSlug = useMemo(() => {
    if (!candidateSlug) return false;
    return RESERVED_CVD_SLUGS.has(candidateSlug);
  }, [candidateSlug]);

  useEffect(() => {
    if (isReservedSlug) return;

    let cancelled = false;

    const fetchBySlug = async (table, slugValue) => {
      return await supabase
        .from(table)
        .select(PUBLIC_CVD_SELECT)
        .eq("card_slug", slugValue)
        .limit(1);
    };

    const fetchByIdOrUserId = async (table, idValue) => {
      const rId = await supabase
        .from(table)
        .select(PUBLIC_CVD_SELECT)
        .eq("id", idValue)
        .limit(1);

      if (rId?.error) return rId;
      if (Array.isArray(rId.data) && rId.data.length) return rId;

      return await supabase
        .from(table)
        .select(PUBLIC_CVD_SELECT)
        .eq("user_id", idValue)
        .limit(1);
    };

    const fetchFromPublicViews = async () => {
      for (const table of PUBLIC_CVD_SOURCES) {
        const res = resolvedSlug
          ? await fetchBySlug(table, resolvedSlug)
          : professionnelId
            ? await fetchByIdOrUserId(table, professionnelId)
            : { data: null, error: null };

        if (res?.error) {
          console.error(`[CVD] fetch public source error (${table})`, res.error);
          continue;
        }

        const candidate = pickFirst(res);
        if (candidate) return candidate;
      }

      return null;
    };

    const fetchFallbackProfessionnel = async () => {
      if (resolvedSlug) {
        const res = await supabase
          .from("professionnels")
          .select(PROFESSIONNELS_FALLBACK_SELECT)
          .eq("card_slug", resolvedSlug)
          .eq("is_public", true)
          .eq("is_active", true)
          .or("is_archived.is.null,is_archived.eq.false")
          .limit(1);

        if (res?.error) {
          console.error("[CVD] fallback professionnels by slug error:", res.error);
          return null;
        }

        return pickFirst(res);
      }

      if (professionnelId) {
        const byId = await supabase
          .from("professionnels")
          .select(PROFESSIONNELS_FALLBACK_SELECT)
          .eq("id", professionnelId)
          .limit(1);

        if (!byId?.error) {
          const candidate = pickFirst(byId);
          if (candidate) return candidate;
        }

        const byUserId = await supabase
          .from("professionnels")
          .select(PROFESSIONNELS_FALLBACK_SELECT)
          .eq("user_id", professionnelId)
          .limit(1);

        if (byUserId?.error) {
          console.error(
            "[CVD] fallback professionnels by user_id error:",
            byUserId.error
          );
          return null;
        }

        return pickFirst(byUserId);
      }

      return null;
    };

    const fetchSlugAliasProfessionnel = async () => {
      if (!resolvedSlug) return null;

      const looseTarget = normalizeLoose(resolvedSlug);
      if (!looseTarget) return null;

      const res = await supabase
        .from("professionnels")
        .select(
          "id, user_id, card_slug, first_name, last_name, is_public, is_active, is_archived"
        )
        .eq("is_public", true)
        .eq("is_active", true)
        .or("is_archived.is.null,is_archived.eq.false")
        .limit(500);

      if (res?.error) {
        console.error("[CVD] alias slug fallback error:", res.error);
        return null;
      }

      const rows = Array.isArray(res.data) ? res.data : [];
      return rows.find((row) => normalizeLoose(row?.card_slug) === looseTarget) || null;
    };

    const resolveCanonicalProfessionnel = async (candidate) => {
      if (!candidate) return null;

      const tryById = candidate?.id
        ? await supabase
            .from("professionnels")
            .select("id, user_id, card_slug, premium_professionnel_card")
            .eq("id", candidate.id)
            .limit(1)
        : null;

      if (Array.isArray(tryById?.data) && tryById.data.length) {
        return tryById.data[0];
      }

      const tryByUserId = candidate?.user_id
        ? await supabase
            .from("professionnels")
            .select("id, user_id, card_slug, premium_professionnel_card")
            .eq("user_id", candidate.user_id)
            .limit(1)
        : null;

      if (Array.isArray(tryByUserId?.data) && tryByUserId.data.length) {
        return tryByUserId.data[0];
      }

      const tryBySlug = candidate?.card_slug
        ? await supabase
            .from("professionnels")
            .select("id, user_id, card_slug, premium_professionnel_card")
            .eq("card_slug", candidate.card_slug)
            .limit(1)
        : null;

      if (Array.isArray(tryBySlug?.data) && tryBySlug.data.length) {
        return tryBySlug.data[0];
      }

      return null;
    };

    const fetchEffectiveCard = async (professionnelIdValue) => {
      if (!professionnelIdValue) return null;

      const res = await supabase
        .from("pro_cards_effective_v4")
        .select(PRO_CARDS_EFFECTIVE_SELECT)
        .eq("professionnel_id", professionnelIdValue)
        .limit(1);

      if (res?.error) {
        console.error("[CVD] fetch effective card error:", res.error);
        return null;
      }

      return pickFirst(res);
    };

    const fetchPro = async () => {
      if (!cancelled) {
        setLoading(true);
        setPro(null);
      }

      try {
        let candidate = await fetchFromPublicViews();

        if (!candidate) {
          candidate = await fetchFallbackProfessionnel();
        }

        if (!candidate && resolvedSlug) {
          const aliasMatch = await fetchSlugAliasProfessionnel();

          if (aliasMatch?.card_slug && aliasMatch.card_slug !== resolvedSlug) {
            if (!cancelled) {
              navigate(`/cvd/${encodeURIComponent(aliasMatch.card_slug)}`, {
                replace: true,
              });
            }
            return;
          }
        }

        if (!candidate) {
          if (!cancelled) setPro(null);
          return;
        }

        const canonicalPro = await resolveCanonicalProfessionnel(candidate);

        const resolvedProfessionnelId =
          canonicalPro?.id || candidate?.professionnel_id || candidate?.id || null;

        const mergedCandidate = {
          ...candidate,
          professionnel_id: resolvedProfessionnelId || candidate?.professionnel_id || "",
          card_slug: candidate?.card_slug || canonicalPro?.card_slug || "",
          premium_professionnel_card:
            candidate?.premium_professionnel_card ||
            canonicalPro?.premium_professionnel_card ||
            "",
          premium_card_tracking_key:
            candidate?.premium_card_tracking_key ||
            candidate?.premium_professionnel_card ||
            canonicalPro?.premium_professionnel_card ||
            "",
          user_id: candidate?.user_id || canonicalPro?.user_id || "",
        };

        const merged = mergeWithEffectiveCard(
          mergedCandidate,
          await fetchEffectiveCard(resolvedProfessionnelId)
        );

        const canonicalSlug = normalizeSlug(
          merged?.card_slug || canonicalPro?.card_slug || resolvedSlug
        );

        if (
          canonicalSlug &&
          resolvedSlug &&
          canonicalSlug !== resolvedSlug &&
          !cancelled
        ) {
          navigate(`/cvd/${encodeURIComponent(canonicalSlug)}`, {
            replace: true,
          });
          return;
        }

        if (!cancelled) {
          setPro(merged);
        }
      } catch (e) {
        console.error("[CVD] Unexpected fetchPro error:", e);
        if (!cancelled) {
          setPro(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchPro();

    return () => {
      cancelled = true;
    };
  }, [resolvedSlug, professionnelId, isReservedSlug, navigate]);

  const canonicalSlug = useMemo(
    () => normalizeSlug(pro?.card_slug || resolvedSlug),
    [pro?.card_slug, resolvedSlug]
  );

  const canonicalUrl = useMemo(() => {
    if (!canonicalSlug) return "";
    return `${CARD_SITE_URL}/cvd/${encodeURIComponent(canonicalSlug)}`;
  }, [canonicalSlug]);

  const currentUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.href;
  }, [location.pathname, location.search]);

  const title = useMemo(() => buildCvdTitleFromPro(pro), [pro]);
  const description = useMemo(() => buildCvdMetaDescriptionFromPro(pro), [pro]);

  const fullName = useMemo(() => {
    return `${pro?.first_name || ""} ${pro?.last_name || ""}`.trim() || "Professionnel";
  }, [pro]);

  const companyName = useMemo(() => getEffectiveCompanyName(pro), [pro]);
  const imageUrl = useMemo(() => getEffectiveImageUrl(pro), [pro]);
  const areas = useMemo(() => getAreas(pro), [pro]);

  const seoText = useMemo(() => {
    return generateCvdSeoTextFromPro(pro) || "";
  }, [pro]);

  const shouldIndex = useMemo(() => {
    return Boolean(
      pro &&
        canonicalSlug &&
        (pro.is_public !== false) &&
        (pro.is_active !== false) &&
        (pro.is_archived !== true)
    );
  }, [pro, canonicalSlug]);

  const schema = useMemo(
    () => buildStructuredData(pro, canonicalUrl),
    [pro, canonicalUrl]
  );

  if (isReservedSlug) {
    return <Navigate to="/nos-professionnels-partenaires" replace />;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!pro) {
    return (
      <>
        <Helmet>
          <html lang="fr" />
          <title>Professionnel introuvable | LivingRoom.immo</title>
          <meta name="robots" content="noindex,nofollow" />
        </Helmet>
        <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
          Professionnel introuvable
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <html lang="fr" />
        <title>{title}</title>
        <meta name="description" content={description} />

        {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
        {imageUrl && <link rel="icon" href={imageUrl} />}

        <meta
          name="robots"
          content={
            shouldIndex
              ? "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
              : "noindex,nofollow"
          }
        />

        <meta property="og:locale" content="fr_FR" />
        <meta property="og:type" content="profile" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonicalUrl || currentUrl} />
        <meta property="og:site_name" content="LivingRoom.immo" />

        {imageUrl && (
          <>
            <meta property="og:image" content={imageUrl} />
            <meta property="og:image:secure_url" content={imageUrl} />
            <meta property="og:image:alt" content={`Photo de ${fullName}`} />
          </>
        )}

        <meta
          name="twitter:card"
          content={imageUrl ? "summary_large_image" : "summary"}
        />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        {imageUrl && <meta name="twitter:image" content={imageUrl} />}

        {schema && (
          <script type="application/ld+json">
            {JSON.stringify(schema)}
          </script>
        )}
      </Helmet>

      <div className="min-h-screen bg-slate-100 px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex justify-center md:items-start">
            <div className="w-full max-w-xl">
              <ProfessionnelCard professionnel={pro} origin="digital-card" />
            </div>
          </div>

          <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h1 className="text-2xl font-bold text-slate-900">
              {fullName}
            </h1>

            <div className="mt-2 text-sm text-slate-600">
              {pro?.function || "Professionnel de l’immobilier"}
              {companyName ? ` · ${companyName}` : ""}
            </div>

            {areas.length > 0 && (
              <p className="mt-3 text-sm text-slate-700">
                <span className="font-semibold">Secteurs d’intervention :</span>{" "}
                {areas.join(", ")}
              </p>
            )}

            {seoText && (
              <div className="mt-5 space-y-4 text-slate-700 leading-relaxed">
                <p>{seoText}</p>
              </div>
            )}

            {!seoText && pro?.professionnal_presentation && (
              <div className="mt-5 space-y-4 text-slate-700 leading-relaxed">
                <p>{pro.professionnal_presentation}</p>
              </div>
            )}

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <h2 className="text-base font-semibold text-slate-900">
                  À propos de cette carte de visite digitale
                </h2>
                <p className="mt-2 text-sm text-slate-700 leading-relaxed">
                  Cette page présente le profil public de {fullName}
                  {companyName ? `, ${companyName}` : ""}, sur LivingRoom. Elle permet de
                  découvrir son activité, ses coordonnées professionnelles, ses
                  secteurs d’intervention et ses liens utiles.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <h2 className="text-base font-semibold text-slate-900">
                  Besoin d’un professionnel immobilier ?
                </h2>
                <p className="mt-2 text-sm text-slate-700 leading-relaxed">
                  LivingRoom met en relation particuliers et professionnels de
                  l’immobilier grâce à des projets qualifiés et des profils
                  vérifiés.
                </p>
                <div className="mt-3 flex flex-wrap gap-3 text-sm">
                  <a
                    href={`${MAIN_SITE_URL}/particuliers`}
                    className="font-medium text-brand-blue hover:underline"
                  >
                    Espace particuliers
                  </a>
                  <a
                    href={`${MAIN_SITE_URL}/pro-de-limmo`}
                    className="font-medium text-brand-blue hover:underline"
                  >
                    Offre pro
                  </a>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default StandaloneDigitalBusinessCardPage;