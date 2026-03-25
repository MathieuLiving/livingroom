import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  memo,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/customSupabaseClient";
import { useToast } from "@/components/ui/use-toast";
import { getCvdSlug, getPublicCvdUrl } from "@/utils/cvdHelpers";
import { useIsMobile } from "@/hooks/useIsMobile";
import { getNeutralMode, withCvdContext } from "@/utils/cvdContext";
import { withCacheBuster } from "@/utils/assets";
import DigitalCardRenderer from "@/components/digital-card/DigitalCardRenderer";

const ATTACHED_ROLES = new Set(["director", "team_leader", "agent_affiliate"]);

const BUCKET_PUBLIC_AVATARS = "public-avatars";
const BUCKET_PUBLIC_LOGOS = "public-logos";

const isFilled = (v) => v !== undefined && v !== null && String(v).trim() !== "";
const join2 = (a, b, sep = " - ") => [a, b].filter(isFilled).join(sep);
const normalizeRole = (v) => String(v || "").trim().toLowerCase();
const normalizeText = (v) => String(v || "").trim();
const isAgencyAttachedRole = (role) => ATTACHED_ROLES.has(normalizeRole(role));
const isHttpUrl = (value) => /^https?:\/\//i.test(String(value || "").trim());

const normalizeHttpUrl = (raw) => {
  const v = String(raw || "").trim();
  if (!v) return "";
  if (/^(mailto:|tel:|sms:)/i.test(v)) return v;
  if (/^https?:\/\//i.test(v)) return v;
  if (v.startsWith("//")) return `https:${v}`;
  return `https://${v}`;
};

const normalizeProjectType = (type) => {
  const v = String(type || "").trim().toLowerCase();
  if (v === "selling" || v === "vente") return "vente";
  if (v === "buying" || v === "achat") return "achat";
  return "";
};

const formatWhatsAppUrl = (phone) => {
  if (!phone) return "";
  let p = String(phone).replace(/\D/g, "");
  if (p.startsWith("0")) p = `33${p.substring(1)}`;
  return p ? `https://wa.me/${p}` : "";
};

const collectScopeAreas = (pro) => {
  if (!pro) return [];
  return [
    pro.scope_intervention_choice_1,
    pro.scope_intervention_choice_2,
    pro.scope_intervention_choice_3,
  ].filter(isFilled);
};

const getQP = (search, key) => {
  try {
    const sp = new URLSearchParams(search || "");
    return sp.get(key);
  } catch {
    return null;
  }
};

const HEX = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
const RGB =
  /^rgb\(\s*(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\s*,\s*(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\s*,\s*(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\s*\)$/;
const RGBA =
  /^rgba\(\s*(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\s*,\s*(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\s*,\s*(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\s*,\s*(?:0|0?\.\d+|1(\.0)?)\s*\)$/;
const isColor = (v) => !!v && (HEX.test(v) || RGB.test(v) || RGBA.test(v));

const pickFirstFilled = (...values) => values.find(isFilled) || "";

const PUBLIC_CARD_ORIGIN =
  (import.meta?.env?.VITE_PUBLIC_CARD_ORIGIN || "").replace(/\/+$/, "") ||
  "https://card.livingroom.immo";

const getStoragePublicUrl = (bucket, path) => {
  const cleanPath = String(path || "").trim().replace(/^\/+/, "");
  if (!bucket || !cleanPath || !supabase) return null;
  const { data } = supabase.storage.from(bucket).getPublicUrl(cleanPath);
  return data?.publicUrl || null;
};

const resolveProfessionnelId = (pro) => {
  if (!pro) return "";
  return String(pro.professionnel_id || pro.id || "").trim();
};

const getStableCardSlug = (pro) =>
  String(pro?.card_slug || getCvdSlug(pro) || "").trim();

const resolveAvatarRobust = (pro, cacheKey = "") => {
  const rawUrl = normalizeText(
    pickFirstFilled(pro?.effective_avatar_url, pro?.avatar_url)
  );
  const rawPath = normalizeText(
    pickFirstFilled(pro?.effective_avatar_path, pro?.avatar_path)
  );

  if (rawUrl && isHttpUrl(rawUrl)) {
    return withCacheBuster(rawUrl, cacheKey) || "";
  }

  if (rawPath) {
    const rebuilt = getStoragePublicUrl(BUCKET_PUBLIC_AVATARS, rawPath);
    return rebuilt ? withCacheBuster(rebuilt, cacheKey) || "" : "";
  }

  return "";
};

const resolveLogoRobust = (
  pro,
  agencyData,
  useAgencyBranding,
  cacheKey = ""
) => {
  const effectiveLogoUrl = normalizeText(pro?.effective_logo_url);
  const effectiveLogoPath = normalizeText(pro?.effective_logo_path);

  const proLogoUrl = normalizeText(pro?.logo_url);
  const proLogoPath = normalizeText(pro?.logo_path);

  const agencyLogoUrl = normalizeText(
    pickFirstFilled(pro?.agency_logo_url, agencyData?.logo_url)
  );

  const agencyLogoPath = normalizeText(
    pickFirstFilled(
      pro?.agency_logo_path,
      agencyData?.logo_storage_path,
      agencyData?.logo_path
    )
  );

  if (effectiveLogoUrl && isHttpUrl(effectiveLogoUrl)) {
    return withCacheBuster(effectiveLogoUrl, cacheKey) || "";
  }

  if (effectiveLogoPath) {
    const rebuilt = getStoragePublicUrl(BUCKET_PUBLIC_LOGOS, effectiveLogoPath);
    if (rebuilt) return withCacheBuster(rebuilt, cacheKey) || "";
  }

  if (useAgencyBranding) {
    if (agencyLogoUrl && isHttpUrl(agencyLogoUrl)) {
      return withCacheBuster(agencyLogoUrl, cacheKey) || "";
    }

    if (agencyLogoPath) {
      const rebuilt = getStoragePublicUrl(BUCKET_PUBLIC_LOGOS, agencyLogoPath);
      if (rebuilt) return withCacheBuster(rebuilt, cacheKey) || "";
    }
  }

  if (proLogoUrl && isHttpUrl(proLogoUrl)) {
    return withCacheBuster(proLogoUrl, cacheKey) || "";
  }

  if (proLogoPath) {
    const rebuilt = getStoragePublicUrl(BUCKET_PUBLIC_LOGOS, proLogoPath);
    if (rebuilt) return withCacheBuster(rebuilt, cacheKey) || "";
  }

  return "";
};

const toAbsoluteUrl = (raw) => {
  const v0 = String(raw || "").trim();
  if (!v0) return "";
  if (/^https?:\/\//i.test(v0)) return v0;

  const v = v0.startsWith("/") ? v0 : `/${v0}`;

  if (
    v.startsWith("/cvd") ||
    v.startsWith("/carte-visite-digitale") ||
    v.startsWith("/digital-card")
  ) {
    return `${PUBLIC_CARD_ORIGIN}${v}`;
  }

  if (typeof window === "undefined") return v;
  return `${window.location.origin}${v}`;
};

const buildCanonicalCardUrl = (pro) => {
  if (!pro) return "";

  const slug = getStableCardSlug(pro);
  if (slug) {
    const u = new URL(`${PUBLIC_CARD_ORIGIN}/cvd/${encodeURIComponent(slug)}`);
    u.searchParams.set("cvd", "1");
    u.searchParams.set("entry", "external");
    return u.toString();
  }

  const direct = String(pro?.digital_card_livingroom_url || "").trim();
  if (direct) {
    try {
      const abs = toAbsoluteUrl(normalizeHttpUrl(direct));
      const u = new URL(abs);
      if (u.searchParams.get("cvd") !== "1") u.searchParams.set("cvd", "1");
      if (!u.searchParams.get("entry")) u.searchParams.set("entry", "external");
      return u.toString();
    } catch {
      return toAbsoluteUrl(direct);
    }
  }

  const helper = (getPublicCvdUrl(pro) || "").trim();
  if (helper) {
    try {
      const abs = toAbsoluteUrl(helper);
      const u = new URL(abs);
      if (u.searchParams.get("cvd") !== "1") u.searchParams.set("cvd", "1");
      if (!u.searchParams.get("entry")) u.searchParams.set("entry", "external");
      return u.toString();
    } catch {
      return toAbsoluteUrl(helper);
    }
  }

  return "";
};

const buildTrackedCardUrl = (rawUrl, options = {}) => {
  const abs = toAbsoluteUrl(rawUrl);
  if (!abs) return "";

  try {
    const u = new URL(abs);
    u.searchParams.set("cvd", "1");
    u.searchParams.set("entry", "external");

    if (options.src) {
      u.searchParams.set("src", String(options.src).trim().toLowerCase());
    } else {
      u.searchParams.delete("src");
    }

    return u.toString();
  } catch {
    return abs;
  }
};

const ProfessionnelCardComponent = ({
  professionnel,
  showRecommendedBadge = false,
  origin,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const fromPartnersList = origin === "partners-list";
  const isPublicDigitalCard = origin === "digital-card";

  const [proData, setProData] = useState(professionnel || null);
  const [agency, setAgency] = useState(null);
  const [featuredProjectsPreview, setFeaturedProjectsPreview] = useState([]);
  const [featuredProjectsLoaded, setFeaturedProjectsLoaded] = useState(false);

  useEffect(() => {
    setProData((prev) => {
      if (!prev) return professionnel || null;

      const prevKey =
        prev?.professionnel_id || prev?.id || prev?.user_id || null;
      const nextKey =
        professionnel?.professionnel_id ||
        professionnel?.id ||
        professionnel?.user_id ||
        null;

      if (prevKey && nextKey && prevKey !== nextKey) {
        return professionnel || null;
      }

      return { ...(prev || {}), ...(professionnel || {}) };
    });
  }, [professionnel]);

  const professionnelId = useMemo(
    () => resolveProfessionnelId(proData),
    [proData]
  );

  const role = useMemo(
    () => normalizeRole(proData?.agency_role),
    [proData?.agency_role]
  );

  const isAgencyMember = useMemo(() => {
    if (typeof proData?.is_agency_member === "boolean") {
      return proData.is_agency_member;
    }
    return isAgencyAttachedRole(role);
  }, [proData?.is_agency_member, role]);

  const proAgencyId = useMemo(() => {
    if (!isAgencyMember) return null;
    return proData?.agency_id || null;
  }, [isAgencyMember, proData?.agency_id]);

  const useAgencyBranding = useMemo(() => {
    if (typeof proData?.is_agency_member === "boolean") {
      return !!proData.is_agency_member && !!proAgencyId;
    }
    return isAgencyMember && !!proAgencyId;
  }, [proData?.is_agency_member, isAgencyMember, proAgencyId]);

  useEffect(() => {
    let mounted = true;

    if (!proAgencyId || !supabase || !useAgencyBranding) {
      setAgency(null);
      return;
    }

    const fetchAgency = async () => {
      try {
        const { data, error } = await supabase
          .from("agencies")
          .select(
            [
              "id",
              "name",
              "logo_url",
              "logo_storage_path",
              "logo_path",
              "updated_at",
              "linkedin_display_mode",
              "facebook_display_mode",
              "instagram_display_mode",
              "youtube_display_mode",
              "tiktok_display_mode",
              "video_display_mode",
              "website_url",
              "customer_review_url",
              "video_external_url",
              "video_url",
              "linkedin_url",
              "facebook_url",
              "instagram_url",
              "youtube_url",
              "tiktok_url",
              "qr_code_with_logo",
              "card_banner_color",
              "card_text_color",
              "card_primary_button_color",
              "card_secondary_button_color",
              "card_name_color",
              "card_signature_color",
              "card_company_name_color",
              "card_support_text_color",
              "card_qr_fg_color",
            ].join(",")
          )
          .eq("id", proAgencyId)
          .maybeSingle();

        if (!mounted) return;

        if (!error && data) setAgency(data);
        else setAgency(null);
      } catch {
        if (mounted) setAgency(null);
      }
    };

    fetchAgency();

    return () => {
      mounted = false;
    };
  }, [proAgencyId, useAgencyBranding]);

  useEffect(() => {
    let cancelled = false;

    async function preloadFeaturedProjects() {
      if (!professionnelId) {
        if (!cancelled) {
          setFeaturedProjectsPreview([]);
          setFeaturedProjectsLoaded(true);
        }
        return;
      }

      try {
        const { data: keys, error: keysError } = await supabase.rpc(
          "get_featured_projects_for_professionnel",
          { p_professionnel_id: professionnelId }
        );

        if (keysError) throw keysError;

        const normalizedKeys = Array.isArray(keys)
          ? keys
            .map((item) => ({
              ...item,
              project_type: normalizeProjectType(item?.project_type),
            }))
            .filter(
              (item) =>
                isFilled(item?.project_id) && isFilled(item?.project_type)
            )
          : [];

        if (!normalizedKeys.length) {
          if (!cancelled) {
            setFeaturedProjectsPreview([]);
            setFeaturedProjectsLoaded(true);
          }
          return;
        }

        const achatIds = normalizedKeys
          .filter((x) => x.project_type === "achat")
          .map((x) => x.project_id);

        const venteIds = normalizedKeys
          .filter((x) => x.project_type === "vente")
          .map((x) => x.project_id);

        const [buyRes, sellRes] = await Promise.all([
          achatIds.length
            ? supabase
              .from("buying_projects_professionnel")
              .select("*")
              .in("id", achatIds)
            : Promise.resolve({ data: [], error: null }),
          venteIds.length
            ? supabase
              .from("selling_projects_professionnel")
              .select("*")
              .in("id", venteIds)
            : Promise.resolve({ data: [], error: null }),
        ]);

        if (buyRes.error) {
          console.error("[ProfessionnelCard] preload buyRes error:", buyRes.error);
          throw buyRes.error;
        }

        if (sellRes.error) {
          console.error(
            "[ProfessionnelCard] preload sellRes error:",
            sellRes.error
          );
          throw sellRes.error;
        }

        const buyMap = new Map(
          (buyRes.data || []).map((p) => [p.id, { ...p, type_projet: "achat" }])
        );

        const sellMap = new Map(
          (sellRes.data || []).map((p) => [p.id, { ...p, type_projet: "vente" }])
        );

        const ordered = normalizedKeys
          .map((k) => {
            if (k.project_type === "achat") return buyMap.get(k.project_id) || null;
            if (k.project_type === "vente") return sellMap.get(k.project_id) || null;
            return null;
          })
          .filter(Boolean)
          .slice(0, 2);

        if (!cancelled) {
          setFeaturedProjectsPreview(ordered);
          setFeaturedProjectsLoaded(true);
        }
      } catch (error) {
        console.error("[ProfessionnelCard] preload featured projects error:", error);
        if (!cancelled) {
          setFeaturedProjectsPreview([]);
          setFeaturedProjectsLoaded(true);
        }
      }
    }

    preloadFeaturedProjects();

    return () => {
      cancelled = true;
    };
  }, [professionnelId]);

  const scopeAreas = useMemo(() => collectScopeAreas(proData), [proData]);

  const displayName = useMemo(
    () => join2(proData?.first_name, proData?.last_name, " "),
    [proData?.first_name, proData?.last_name]
  );

  const effectiveCompanyName = useMemo(
    () =>
      pickFirstFilled(
        proData?.effective_company_name,
        useAgencyBranding ? proData?.agency_name : "",
        useAgencyBranding ? agency?.name : "",
        proData?.company_name,
        proData?.own_company_name
      ),
    [proData, useAgencyBranding, agency?.name]
  );

  const first = (proData?.first_name || "").trim().charAt(0).toUpperCase();
  const last = (proData?.last_name || "").trim().charAt(0).toUpperCase();
  const initialsText = first || last ? `${first}${last}` : "";

  const cacheKey = useMemo(() => {
    const tAgency = String(
      agency?.updated_at || proData?.agency_updated_at || ""
    ).trim();
    const tPro = String(
      proData?.updated_at || proData?.professionnel_updated_at || ""
    ).trim();
    return tAgency || tPro || "";
  }, [
    agency?.updated_at,
    proData?.agency_updated_at,
    proData?.updated_at,
    proData?.professionnel_updated_at,
  ]);

  const avatarUrl = useMemo(
    () => resolveAvatarRobust(proData, cacheKey),
    [proData, cacheKey]
  );

  const logoUrl = useMemo(
    () => resolveLogoRobust(proData, agency, useAgencyBranding, cacheKey),
    [proData, agency, useAgencyBranding, cacheKey]
  );

  const effectiveQrWithLogo = useMemo(() => {
    if (typeof proData?.effective_qr_code_with_logo === "boolean") {
      return proData.effective_qr_code_with_logo;
    }
    if (useAgencyBranding) return !!agency?.qr_code_with_logo;
    return !!proData?.qr_code_with_logo;
  }, [
    proData?.effective_qr_code_with_logo,
    useAgencyBranding,
    agency?.qr_code_with_logo,
    proData?.qr_code_with_logo,
  ]);

  const qrLogoUrl = useMemo(() => {
    if (!effectiveQrWithLogo) return "";
    return logoUrl || "";
  }, [effectiveQrWithLogo, logoUrl]);

  const qpBanner = getQP(location.search, "banner");
  const qpButtons = getQP(location.search, "buttons");
  const qpText = getQP(location.search, "text");
  const qpName = getQP(location.search, "name");
  const qpSignature = getQP(location.search, "signature");
  const qpCompany = getQP(location.search, "company");
  const qpSupport = getQP(location.search, "support");

  const baseBannerColor = pickFirstFilled(
    proData?.effective_card_banner_color,
    useAgencyBranding ? agency?.card_banner_color : "",
    proData?.card_banner_color
  );

  const baseTextColor = pickFirstFilled(
    proData?.effective_card_text_color,
    useAgencyBranding ? agency?.card_text_color : "",
    proData?.card_text_color
  );

  const basePrimaryButtonColor = pickFirstFilled(
    proData?.effective_card_primary_button_color,
    useAgencyBranding ? agency?.card_primary_button_color : "",
    proData?.card_primary_button_color
  );

  const baseSecondaryButtonColor = pickFirstFilled(
    proData?.effective_card_secondary_button_color,
    useAgencyBranding ? agency?.card_secondary_button_color : "",
    proData?.card_secondary_button_color
  );

  const baseNameColor = pickFirstFilled(
    proData?.effective_card_name_color,
    useAgencyBranding ? agency?.card_name_color : "",
    proData?.card_name_color
  );

  const baseSignatureColor = pickFirstFilled(
    proData?.effective_card_signature_color,
    useAgencyBranding ? agency?.card_signature_color : "",
    proData?.card_signature_color
  );

  const baseCompanyNameColor = pickFirstFilled(
    proData?.effective_card_company_name_color,
    useAgencyBranding ? agency?.card_company_name_color : "",
    proData?.card_company_name_color
  );

  const baseSupportTextColor = pickFirstFilled(
    proData?.effective_card_support_text_color,
    useAgencyBranding ? agency?.card_support_text_color : "",
    proData?.card_support_text_color
  );

  const baseQrColor = pickFirstFilled(
    proData?.effective_card_qr_fg_color,
    useAgencyBranding ? agency?.card_qr_fg_color : "",
    proData?.card_qr_fg_color
  );

  const bannerColor = isColor(qpBanner)
    ? qpBanner
    : isColor(baseBannerColor)
      ? baseBannerColor
      : "#22577A";

  const textColor = isColor(qpText)
    ? qpText
    : isColor(baseTextColor)
      ? baseTextColor
      : "#22577A";

  const primaryButtonColor = isColor(qpButtons)
    ? qpButtons
    : isColor(basePrimaryButtonColor)
      ? basePrimaryButtonColor
      : "#F89223";

  const secondaryButtonColor = isColor(baseSecondaryButtonColor)
    ? baseSecondaryButtonColor
    : "#22577A";

  const nameColor = isColor(qpName)
    ? qpName
    : isColor(baseNameColor)
      ? baseNameColor
      : textColor;

  const signatureColor = isColor(qpSignature)
    ? qpSignature
    : isColor(baseSignatureColor)
      ? baseSignatureColor
      : secondaryButtonColor;

  const companyNameColor = isColor(qpCompany)
    ? qpCompany
    : isColor(baseCompanyNameColor)
      ? baseCompanyNameColor
      : "#6b7280";

  const supportTextColor = isColor(qpSupport)
    ? qpSupport
    : isColor(baseSupportTextColor)
      ? baseSupportTextColor
      : "#334155";

  const cvdFlow = getNeutralMode(location.pathname, location.search);
  const entry = getQP(location.search, "entry");
  const cvdParam = getQP(location.search, "cvd");

  const path = location?.pathname || "";
  const isDigitalCardRoute =
    path.startsWith("/cvd") ||
    path.startsWith("/carte-visite-digitale") ||
    path.includes("/livingroom");

  const fromDigitalCard =
    cvdFlow || isDigitalCardRoute || cvdParam === "1" || entry === "external";

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!fromDigitalCard) return;

    try {
      const u = new URL(window.location.href);
      let changed = false;

      if (u.searchParams.get("cvd") !== "1") {
        u.searchParams.set("cvd", "1");
        changed = true;
      }
      if (!u.searchParams.get("entry")) {
        u.searchParams.set("entry", "external");
        changed = true;
      }

      if (changed) window.history.replaceState(null, "", u.toString());
    } catch {
      // ignore
    }

    if (!isMobile) return;

    const onPop = (e) => {
      e.preventDefault?.();
      window.history.go(1);
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [isMobile, fromDigitalCard]);

  const shareUrl = useMemo(() => {
    const base = buildCanonicalCardUrl(proData);
    return buildTrackedCardUrl(base);
  }, [proData]);

  const qrUrl = useMemo(() => {
    const base = buildCanonicalCardUrl(proData);
    return buildTrackedCardUrl(base, { src: "qr" });
  }, [proData]);

  const internalCardReturnTo = useMemo(() => {
    return `${location.pathname}${location.search || ""}`;
  }, [location.pathname, location.search]);

  const emailHref = isFilled(proData?.email)
    ? `mailto:${proData.email}`
    : undefined;

  const phoneHref = isFilled(proData?.phone)
    ? `tel:${proData.phone}`
    : undefined;

  const whatsAppHref = isFilled(proData?.phone)
    ? formatWhatsAppUrl(proData.phone)
    : undefined;

  const appointmentHref = isFilled(proData?.appointment_url)
    ? normalizeHttpUrl(proData.appointment_url)
    : undefined;

  const agencyWebsiteUrlRaw = pickFirstFilled(
    proData?.effective_website_url,
    useAgencyBranding ? agency?.website_url : "",
    proData?.agency_website_url,
    proData?.website_url,
    proData?.site_url
  );

  const customerReviewUrlRaw = pickFirstFilled(
    proData?.effective_customer_review_url,
    useAgencyBranding ? agency?.customer_review_url : "",
    proData?.customer_review_url,
    proData?.reviews_url,
    proData?.google_reviews_url,
    proData?.avis_url
  );

  const agencyWebsiteUrl = isFilled(agencyWebsiteUrlRaw)
    ? normalizeHttpUrl(agencyWebsiteUrlRaw)
    : "";

  const customerReviewUrl = isFilled(customerReviewUrlRaw)
    ? normalizeHttpUrl(customerReviewUrlRaw)
    : "";

  const modeOf = useCallback(
    (key) => {
      const rawKey = String(key || "").trim();

      if (rawKey === "video_external_url") {
        const explicitMode = agency?.video_display_mode;
        if (isFilled(explicitMode)) {
          const normalized = String(explicitMode).toLowerCase().trim();
          return normalized === "personal" ? "personal" : "agency";
        }
      }

      const modeKey = rawKey.replace("_url", "_display_mode");
      const m = String(agency?.[modeKey] || "agency").toLowerCase().trim();
      return m === "personal" ? "personal" : "agency";
    },
    [agency]
  );

  const pickSocial = useCallback(
    (key) => {
      const effectiveVal = proData?.[`effective_${key}`] || "";
      const personalVal = proData?.[key] || "";
      const agencyVal =
        agency?.[key] ||
        proData?.[`agency_${key}`] ||
        proData?.[`agency_${key.replace("_url", "")}_url`] ||
        "";

      if (isFilled(effectiveVal)) return effectiveVal;
      if (!isAgencyMember) return personalVal;
      if (modeOf(key) === "personal") return personalVal;
      return agencyVal || personalVal;
    },
    [proData, agency, isAgencyMember, modeOf]
  );

  const linkedinUrl = useMemo(() => {
    const v = pickSocial("linkedin_url");
    return isFilled(v) ? normalizeHttpUrl(v) : "";
  }, [pickSocial]);

  const facebookUrl = useMemo(() => {
    const v = pickSocial("facebook_url");
    return isFilled(v) ? normalizeHttpUrl(v) : "";
  }, [pickSocial]);

  const instagramUrl = useMemo(() => {
    const v = pickSocial("instagram_url");
    return isFilled(v) ? normalizeHttpUrl(v) : "";
  }, [pickSocial]);

  const youtubeUrl = useMemo(() => {
    const v = pickSocial("youtube_url");
    return isFilled(v) ? normalizeHttpUrl(v) : "";
  }, [pickSocial]);

  const tiktokUrl = useMemo(() => {
    const v = pickSocial("tiktok_url");
    return isFilled(v) ? normalizeHttpUrl(v) : "";
  }, [pickSocial]);

  const videoUrl = useMemo(() => {
    const effectiveVal = pickFirstFilled(
      proData?.effective_video_external_url,
      proData?.effective_video_url
    );

    const personalVal = pickFirstFilled(
      proData?.video_external_url,
      proData?.video_url,
      proData?.custom_video_url
    );

    const agencyVal = pickFirstFilled(
      agency?.video_external_url,
      agency?.video_url,
      proData?.agency_video_external_url,
      proData?.agency_video_url
    );

    const selected = isFilled(effectiveVal)
      ? effectiveVal
      : !isAgencyMember
        ? personalVal
        : modeOf("video_external_url") === "personal"
          ? personalVal
          : agencyVal || personalVal;

    return isFilled(selected) ? normalizeHttpUrl(selected) : "";
  }, [proData, agency, isAgencyMember, modeOf]);

  const returnTo = useMemo(() => {
    if (fromPartnersList) return "/nos-professionnels-partenaires";
    return internalCardReturnTo;
  }, [fromPartnersList, internalCardReturnTo]);

  const currentSearch = useMemo(() => location.search || "", [location.search]);

  const leadUrl = useMemo(() => {
    if (!professionnelId) return "";

    const sp = new URLSearchParams();

    if (fromPartnersList) {
      sp.set("layout", "1");
      sp.set("from", "partners-list");
    }

    if (fromDigitalCard) {
      sp.set("cvd", "1");
      sp.set("entry", "external");
    }

    const raw = `/direct-lead-form/${encodeURIComponent(professionnelId)}${sp.toString() ? `?${sp.toString()}` : ""
      }`;

    return fromDigitalCard ? withCvdContext(raw, currentSearch) : raw;
  }, [professionnelId, fromPartnersList, fromDigitalCard, currentSearch]);

  const listingsUrl = useMemo(() => {
    const slug = getStableCardSlug(proData);
    if (!isFilled(slug)) return "";

    const sp = new URLSearchParams();
    sp.set("view", "list-only");

    if (fromDigitalCard) {
      sp.set("cvd", "1");
      sp.set("entry", "external");
    }

    const raw = `/nos-professionnels-partenaires/slug/${encodeURIComponent(
      slug
    )}?${sp.toString()}`;

    return fromDigitalCard ? withCvdContext(raw, currentSearch) : raw;
  }, [proData, fromDigitalCard, currentSearch]);

  const featuredOpportunitiesUrl = useMemo(() => {
    const slug = getStableCardSlug(proData);
    if (!isFilled(slug)) return "";

    const sp = new URLSearchParams();

    if (fromDigitalCard) {
      sp.set("cvd", "1");
      sp.set("entry", "external");
    }

    sp.set("returnTo", internalCardReturnTo);

    const raw = `/pro/${encodeURIComponent(slug)}/opportunites${sp.toString() ? `?${sp.toString()}` : ""
      }`;

    return fromDigitalCard ? withCvdContext(raw, currentSearch) : raw;
  }, [proData, fromDigitalCard, currentSearch, internalCardReturnTo]);

  const goToDirectLeadForm = useCallback(() => {
    if (!professionnelId) return;

    const target = `/direct-lead-form/${encodeURIComponent(professionnelId)}`;
    const sp = new URLSearchParams();

    if (fromPartnersList) {
      sp.set("layout", "1");
      sp.set("from", "partners-list");
    }

    if (fromDigitalCard) {
      sp.set("cvd", "1");
      sp.set("entry", "external");
    }

    const raw = {
      pathname: target,
      search: sp.toString() ? `?${sp.toString()}` : "",
    };

    const finalPath = fromDigitalCard
      ? (() => {
        const merged = withCvdContext(
          `${raw.pathname}${raw.search}`,
          currentSearch
        );
        const idx = merged.indexOf("?");
        return {
          pathname: idx >= 0 ? merged.slice(0, idx) : merged,
          search: idx >= 0 ? merged.slice(idx) : "",
        };
      })()
      : raw;

    navigate(finalPath, {
      state: {
        returnTo,
        proId: professionnelId,
        fromDigitalCard,
        fromPartnersList,
        cvdSlug: proData?.card_slug || getCvdSlug(proData),
      },
    });
  }, [
    professionnelId,
    navigate,
    returnTo,
    fromDigitalCard,
    fromPartnersList,
    currentSearch,
    proData,
  ]);

  const goToListingsOnly = useCallback(() => {
    const slug = getStableCardSlug(proData);

    if (!isFilled(slug)) {
      toast({
        variant: "destructive",
        title: "Profil incomplet",
        description:
          'Impossible d\'ouvrir "Recherches et ventes de biens" (slug manquant).',
      });
      return;
    }

    const basePath = `/nos-professionnels-partenaires/slug/${encodeURIComponent(
      slug
    )}`;
    const sp = new URLSearchParams();
    sp.set("view", "list-only");

    if (fromDigitalCard) {
      sp.set("cvd", "1");
      sp.set("entry", "external");
    }

    const rawUrl = `${basePath}?${sp.toString()}`;
    const finalUrl = fromDigitalCard
      ? withCvdContext(rawUrl, currentSearch)
      : rawUrl;

    const urlObj = new URL(
      finalUrl,
      typeof window !== "undefined"
        ? window.location.origin
        : "https://example.com"
    );

    navigate(
      { pathname: urlObj.pathname, search: urlObj.search },
      {
        state: {
          returnTo,
          proId: professionnelId,
          fromDigitalCard,
          fromPartnersList,
          cvdSlug: slug,
        },
      }
    );
  }, [
    proData,
    navigate,
    returnTo,
    fromDigitalCard,
    fromPartnersList,
    currentSearch,
    toast,
    professionnelId,
  ]);

  const goToFeaturedOpportunities = useCallback(() => {
    const slug = getStableCardSlug(proData);

    if (!isFilled(slug)) {
      toast({
        variant: "destructive",
        title: "Profil incomplet",
        description:
          "Impossible d’ouvrir les opportunités à la une (slug manquant).",
      });
      return;
    }

    const sp = new URLSearchParams();

    if (fromDigitalCard) {
      sp.set("cvd", "1");
      sp.set("entry", "external");
    }

    sp.set("returnTo", internalCardReturnTo);

    const rawUrl = `/pro/${encodeURIComponent(slug)}/opportunites${sp.toString() ? `?${sp.toString()}` : ""
      }`;

    const finalUrl = fromDigitalCard
      ? withCvdContext(rawUrl, currentSearch)
      : rawUrl;

    const urlObj = new URL(
      finalUrl,
      typeof window !== "undefined"
        ? window.location.origin
        : "https://example.com"
    );

    navigate(
      { pathname: urlObj.pathname, search: urlObj.search },
      {
        state: {
          returnTo: internalCardReturnTo,
          proId: professionnelId,
          fromDigitalCard,
          fromPartnersList,
          cvdSlug: slug,
        },
      }
    );
  }, [
    proData,
    toast,
    fromDigitalCard,
    currentSearch,
    navigate,
    internalCardReturnTo,
    fromPartnersList,
    professionnelId,
  ]);

  const goToFeaturedProject = useCallback(
    (project) => {
      const slug = getStableCardSlug(proData);
      const projectType = String(project?.type_projet || "").trim();
      const projectId = String(project?.id || "").trim();

      if (!isFilled(slug) || !isFilled(projectType) || !isFilled(projectId)) {
        goToFeaturedOpportunities();
        return;
      }

      const listReturnBase = `/pro/${encodeURIComponent(slug)}/opportunites`;
      const listReturnUrl = fromDigitalCard
        ? withCvdContext(listReturnBase, currentSearch)
        : listReturnBase;

      const sp = new URLSearchParams();

      if (fromDigitalCard) {
        sp.set("cvd", "1");
        sp.set("entry", "external");
      }

      sp.set("returnTo", listReturnUrl);
      sp.set("cardReturnTo", internalCardReturnTo);

      const rawUrl = `/pro/${encodeURIComponent(
        slug
      )}/opportunites/${encodeURIComponent(projectType)}/${encodeURIComponent(
        projectId
      )}${sp.toString() ? `?${sp.toString()}` : ""}`;

      const finalUrl = fromDigitalCard
        ? withCvdContext(rawUrl, currentSearch)
        : rawUrl;

      const urlObj = new URL(
        finalUrl,
        typeof window !== "undefined"
          ? window.location.origin
          : "https://example.com"
      );

      navigate(
        { pathname: urlObj.pathname, search: urlObj.search },
        {
          state: {
            returnTo: listReturnUrl,
            cardReturnTo: internalCardReturnTo,
            fromFeaturedList: true,
            cvdSlug: slug,
            projectSnapshot: project || null,
          },
        }
      );
    },
    [
      proData,
      fromDigitalCard,
      currentSearch,
      navigate,
      internalCardReturnTo,
      goToFeaturedOpportunities,
    ]
  );

  const companySuffix = effectiveCompanyName ? ` — ${effectiveCompanyName}` : "";
  const shareText = `Je te partage le profil de ${displayName}${companySuffix}`;
  const shareSubject = `Profil pro — ${displayName}${companySuffix}`;

  const shareBodyWithImage = useMemo(
    () => [shareText, shareUrl, avatarUrl].filter(Boolean).join("\n"),
    [shareText, shareUrl, avatarUrl]
  );

  const supportText = useMemo(
    () => String(proData?.professionnal_presentation || "").trim(),
    [proData?.professionnal_presentation]
  );

  const copyToClipboard = useCallback(
    async (text) => {
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        toast({
          title: "Copié !",
          description: "Le lien a été copié dans le presse-papiers.",
        });
      } catch {
        toast({
          title: "Impossible de copier",
          description: "Copiez manuellement le lien affiché.",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  const handleNativeShare = useCallback(async ({ title, text, url }) => {
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  }, []);

  const payload = useMemo(() => {
    if (!proData) return null;

    const qrFg = isColor(baseQrColor) ? baseQrColor : "#000000";

    return {
      identity: {
        displayName: displayName || "Professionnel",
        functionLabel: proData?.function || "Professionnel Immobilier",
        companyName: effectiveCompanyName || "",
        avatarUrl,
        logoUrl,
        initialsText,
      },
      theme: {
        bannerColor,
        textColor,
        primaryButtonColor,
        secondaryButtonColor,
        nameColor,
        signatureColor,
        companyNameColor,
        supportTextColor,
      },
      contact: {
        emailHref: isFilled(emailHref) ? emailHref : undefined,
        phoneHref: isFilled(phoneHref) ? phoneHref : undefined,
        whatsAppHref,
        appointmentHref: isFilled(appointmentHref)
          ? appointmentHref
          : undefined,
      },
      social: {
        linkedinUrl,
        facebookUrl,
        instagramUrl,
        youtubeUrl,
        tiktokUrl,
        agencyWebsiteUrl,
        customerReviewUrl,
      },
      content: {
        professionnelId: professionnelId || "",
        scopeAreas,
        shareUrl,
        shareText,
        shareSubject,
        shareBodyWithImage,
        supportText,
        leadUrl,
        listingsUrl,
        featuredOpportunitiesUrl,
        featuredProjectsPreview: featuredProjectsLoaded
          ? featuredProjectsPreview
          : null,
        videoUrl,
      },
      qr: {
        enabled: !!qrUrl,
        url: qrUrl,
        fgColor: qrFg,
        logoUrl: qrLogoUrl || undefined,
        withLogo: effectiveQrWithLogo && !!qrLogoUrl,
        size: 220,
      },
      ui: {
        showRecommendedBadge,
        isPublicDigitalCard,
        isAgencyMember,
        showLeadCta: true,
        showListingsCta: true,
        showFeaturedProjectsPreview: true,
        showVideoCta: true,
      },
    };
  }, [
    proData,
    baseQrColor,
    displayName,
    effectiveCompanyName,
    avatarUrl,
    logoUrl,
    initialsText,
    bannerColor,
    textColor,
    primaryButtonColor,
    secondaryButtonColor,
    nameColor,
    signatureColor,
    companyNameColor,
    supportTextColor,
    emailHref,
    phoneHref,
    whatsAppHref,
    appointmentHref,
    linkedinUrl,
    facebookUrl,
    instagramUrl,
    youtubeUrl,
    tiktokUrl,
    agencyWebsiteUrl,
    customerReviewUrl,
    professionnelId,
    scopeAreas,
    shareUrl,
    shareText,
    shareSubject,
    shareBodyWithImage,
    supportText,
    leadUrl,
    listingsUrl,
    featuredOpportunitiesUrl,
    featuredProjectsLoaded,
    featuredProjectsPreview,
    videoUrl,
    qrUrl,
    qrLogoUrl,
    effectiveQrWithLogo,
    showRecommendedBadge,
    isPublicDigitalCard,
    isAgencyMember,
  ]);

  if (!proData || !payload) return null;

  return (
    <DigitalCardRenderer
      payload={payload}
      origin={origin}
      onOpenLeadForm={goToDirectLeadForm}
      onOpenListings={goToListingsOnly}
      onOpenFeatured={goToFeaturedOpportunities}
      onOpenFeaturedProject={goToFeaturedProject}
      onCopyLink={copyToClipboard}
      onNativeShare={handleNativeShare}
    />
  );
};

const ProfessionnelCard = memo(ProfessionnelCardComponent);
export default ProfessionnelCard;