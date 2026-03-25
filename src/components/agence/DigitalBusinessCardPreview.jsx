// src/components/agence/DigitalBusinessCardPreview.jsx
import React, { useMemo, useState } from "react";
import { Smartphone, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import DigitalCardRenderer from "@/components/digital-card/DigitalCardRenderer";

const isFilled = (v) => v !== undefined && v !== null && String(v).trim() !== "";
const normalizeRole = (value) => String(value || "").toLowerCase().trim();

const isAgencyAttachedRole = (role) => {
  const r = normalizeRole(role);
  return r === "director" || r === "team_leader" || r === "agent_affiliate";
};

const normalizeHttpUrl = (raw) => {
  const v = String(raw || "").trim();
  if (!v) return "";
  if (/^(mailto:|tel:|sms:)/i.test(v)) return v;
  if (/^https?:\/\//i.test(v)) return v;
  if (v.startsWith("//")) return `https:${v}`;
  return `https://${v}`;
};

const formatWhatsAppUrl = (phone) => {
  if (!phone) return "";
  let p = String(phone).replace(/\D/g, "");
  if (p.startsWith("0")) p = "33" + p.substring(1);
  return `https://wa.me/${p}`;
};

const normalizeVideoDisplayMode = (value, fallbackAgencyMode = false) => {
  const v = String(value || "").toLowerCase().trim();
  if (v === "agency") return "agency";
  if (v === "personal") return "personal";
  return fallbackAgencyMode ? "agency" : "personal";
};

export default function DigitalBusinessCardPreview({
  agencyData,
  proData,
  enforcement,
  previewOverrides,
}) {
  const [viewMode, setViewMode] = useState("mobile");
  const [isDarkMode, setIsDarkMode] = useState(false);

  const agency = agencyData || {};
  const pro = proData || {};
  const overrides = previewOverrides || {};

  const hasAgencyId = useMemo(() => {
    return isFilled(pro.agency_id) || isFilled(agency.id);
  }, [pro.agency_id, agency.id]);

  const useAgencyBranding = useMemo(() => {
    return hasAgencyId && isAgencyAttachedRole(pro.agency_role);
  }, [hasAgencyId, pro.agency_role]);

  const effectiveVideoMode = useMemo(() => {
    return normalizeVideoDisplayMode(
      agency.video_display_mode,
      !!enforcement?.video || !!agency.enforce_video
    );
  }, [agency.video_display_mode, agency.enforce_video, enforcement?.video]);

  const resolveValue = (overrideKey, agencyKey, proKey, customKey = null) => {
    if (overrides[overrideKey] !== undefined) {
      return overrides[overrideKey];
    }

    if (useAgencyBranding) {
      return agency?.[agencyKey];
    }

    if (customKey && pro?.custom_brand_colors?.[customKey]) {
      return pro.custom_brand_colors[customKey];
    }

    if (
      proKey &&
      pro?.[proKey] !== undefined &&
      pro?.[proKey] !== null &&
      pro?.[proKey] !== ""
    ) {
      return pro[proKey];
    }

    return agency?.[agencyKey];
  };

  const colors = useMemo(() => {
    return {
      bannerColor:
        resolveValue(
          "card_banner_color",
          "card_banner_color",
          "card_banner_color",
          "card_banner_color"
        ) || "#3b82f6",

      textColor:
        resolveValue(
          "card_text_color",
          "card_text_color",
          "card_text_color",
          "card_text_color"
        ) || "#1e293b",

      primaryButtonColor:
        resolveValue(
          "card_primary_button_color",
          "card_primary_button_color",
          "card_primary_button_color",
          "card_primary_button_color"
        ) || "#000000",

      secondaryButtonColor:
        resolveValue(
          "card_secondary_button_color",
          "card_secondary_button_color",
          "card_secondary_button_color",
          "card_secondary_button_color"
        ) || "#ffffff",

      nameColor:
        resolveValue(
          "card_name_color",
          "card_name_color",
          "card_name_color",
          "card_name_color"
        ) || "#1e293b",

      signatureColor:
        resolveValue(
          "card_signature_color",
          "card_signature_color",
          "card_signature_color",
          "card_signature_color"
        ) || "#64748b",

      companyNameColor:
        resolveValue(
          "card_company_name_color",
          "card_company_name_color",
          "card_company_name_color",
          "card_company_name_color"
        ) || "#3b82f6",

      supportTextColor:
        resolveValue(
          "card_support_text_color",
          "card_support_text_color",
          "card_support_text_color",
          "card_support_text_color"
        ) || "#94a3b8",

      qrFgColor:
        resolveValue(
          "card_qr_fg_color",
          "card_qr_fg_color",
          "card_qr_fg_color",
          "card_qr_fg_color"
        ) || "#000000",
    };
  }, [agency, pro, overrides, useAgencyBranding]);

  const logoUrl = useMemo(() => {
    if (overrides.logo_url !== undefined) return overrides.logo_url || "";

    if (useAgencyBranding) {
      return (
        agency.logo_url ||
        agency.logo_storage_path ||
        pro.agency_logo_url ||
        pro.agency_logo_path ||
        ""
      );
    }

    return (
      pro.custom_logo_url ||
      pro.logo_url ||
      pro.logo_path ||
      agency.logo_url ||
      ""
    );
  }, [
    overrides.logo_url,
    useAgencyBranding,
    agency.logo_url,
    agency.logo_storage_path,
    pro.agency_logo_url,
    pro.agency_logo_path,
    pro.custom_logo_url,
    pro.logo_url,
    pro.logo_path,
  ]);

  const fullName = useMemo(() => {
    const first = overrides.first_name ?? pro.first_name ?? "Jean";
    const last = overrides.last_name ?? pro.last_name ?? "Dupont";
    return `${first} ${last}`.trim();
  }, [overrides.first_name, overrides.last_name, pro.first_name, pro.last_name]);

  const initialsText = useMemo(() => {
    const parts = fullName.split(" ").filter(Boolean);
    const first = parts[0] || "";
    const last = parts[1] || "";
    const a = first.charAt(0).toUpperCase();
    const b = last.charAt(0).toUpperCase();
    return `${a}${b}`.trim() || "JD";
  }, [fullName]);

  const companyName = useMemo(() => {
    if (overrides.company_name !== undefined) return overrides.company_name || "";

    if (useAgencyBranding) {
      return agency.name || pro.agency_name || "Agence Immobilière";
    }

    return pro.company_name || agency.name || "Professionnel immobilier";
  }, [overrides.company_name, useAgencyBranding, agency.name, pro.company_name, pro.agency_name]);

  const roleLabel = useMemo(() => {
    if (overrides.function !== undefined) return overrides.function || "";
    return pro.function || pro.role_label || "Agent Commercial";
  }, [overrides.function, pro.function, pro.role_label]);

  const supportText = useMemo(() => {
    if (overrides.professionnal_presentation !== undefined) {
      return overrides.professionnal_presentation || "";
    }

    return (
      pro.professionnal_presentation ||
      "Présentez ici votre expertise, vos secteurs et votre accompagnement."
    );
  }, [overrides.professionnal_presentation, pro.professionnal_presentation]);

  const scopeAreas = useMemo(() => {
    return [
      overrides.scope_intervention_choice_1 ?? pro.scope_intervention_choice_1,
      overrides.scope_intervention_choice_2 ?? pro.scope_intervention_choice_2,
      overrides.scope_intervention_choice_3 ?? pro.scope_intervention_choice_3,
    ].filter(isFilled);
  }, [
    overrides.scope_intervention_choice_1,
    overrides.scope_intervention_choice_2,
    overrides.scope_intervention_choice_3,
    pro.scope_intervention_choice_1,
    pro.scope_intervention_choice_2,
    pro.scope_intervention_choice_3,
  ]);

  const themeMode = agency?.theme_mode || pro?.theme_mode || "light";
  const effectiveDarkMode = isDarkMode || themeMode === "dark";

  const lockBadge = useMemo(() => {
    if (useAgencyBranding) {
      return "Charte Agence";
    }
    return enforcement?.colors
      ? "Couleurs Agence (Verrouillé)"
      : "Couleurs Personnalisables";
  }, [useAgencyBranding, enforcement?.colors]);

  const emailHref = useMemo(() => {
    const email = overrides.email ?? pro.email;
    return isFilled(email) ? `mailto:${email}` : undefined;
  }, [overrides.email, pro.email]);

  const phoneHref = useMemo(() => {
    const phone = overrides.phone ?? pro.phone;
    return isFilled(phone) ? `tel:${phone}` : undefined;
  }, [overrides.phone, pro.phone]);

  const whatsAppHref = useMemo(() => {
    const phone = overrides.phone ?? pro.phone;
    return isFilled(phone) ? formatWhatsAppUrl(phone) : undefined;
  }, [overrides.phone, pro.phone]);

  const appointmentHref = useMemo(() => {
    const url = overrides.appointment_url ?? pro.appointment_url;
    return isFilled(url) ? normalizeHttpUrl(url) : undefined;
  }, [overrides.appointment_url, pro.appointment_url]);

  const agencyWebsiteUrl = useMemo(() => {
    const raw = useAgencyBranding
      ? agency.website_url || pro.agency_website_url || ""
      : overrides.agency_website_url ||
        pro.agency_website_url ||
        pro.website_url ||
        pro.site_url ||
        agency.website_url ||
        "";

    return isFilled(raw) ? normalizeHttpUrl(raw) : "";
  }, [
    useAgencyBranding,
    overrides.agency_website_url,
    agency.website_url,
    pro.agency_website_url,
    pro.website_url,
    pro.site_url,
  ]);

  const customerReviewUrl = useMemo(() => {
    const raw =
      overrides.customer_review_url ||
      pro.customer_review_url ||
      pro.reviews_url ||
      pro.google_reviews_url ||
      pro.avis_url ||
      (useAgencyBranding ? agency.customer_review_url : "");

    return isFilled(raw) ? normalizeHttpUrl(raw) : "";
  }, [
    overrides.customer_review_url,
    pro.customer_review_url,
    pro.reviews_url,
    pro.google_reviews_url,
    pro.avis_url,
    useAgencyBranding,
    agency.customer_review_url,
  ]);

  const linkedinUrl = useMemo(() => {
    const raw = useAgencyBranding
      ? overrides.linkedin_url || agency.linkedin_url || pro.linkedin_url || ""
      : overrides.linkedin_url || pro.linkedin_url || agency.linkedin_url || "";
    return isFilled(raw) ? normalizeHttpUrl(raw) : "";
  }, [useAgencyBranding, overrides.linkedin_url, agency.linkedin_url, pro.linkedin_url]);

  const facebookUrl = useMemo(() => {
    const raw = useAgencyBranding
      ? overrides.facebook_url || agency.facebook_url || pro.facebook_url || ""
      : overrides.facebook_url || pro.facebook_url || agency.facebook_url || "";
    return isFilled(raw) ? normalizeHttpUrl(raw) : "";
  }, [useAgencyBranding, overrides.facebook_url, agency.facebook_url, pro.facebook_url]);

  const instagramUrl = useMemo(() => {
    const raw = useAgencyBranding
      ? overrides.instagram_url || agency.instagram_url || pro.instagram_url || ""
      : overrides.instagram_url || pro.instagram_url || agency.instagram_url || "";
    return isFilled(raw) ? normalizeHttpUrl(raw) : "";
  }, [useAgencyBranding, overrides.instagram_url, agency.instagram_url, pro.instagram_url]);

  const youtubeUrl = useMemo(() => {
    const raw = useAgencyBranding
      ? overrides.youtube_url || agency.youtube_url || pro.youtube_url || ""
      : overrides.youtube_url || pro.youtube_url || agency.youtube_url || "";
    return isFilled(raw) ? normalizeHttpUrl(raw) : "";
  }, [useAgencyBranding, overrides.youtube_url, agency.youtube_url, pro.youtube_url]);

  const tiktokUrl = useMemo(() => {
    const raw = useAgencyBranding
      ? overrides.tiktok_url || agency.tiktok_url || pro.tiktok_url || ""
      : overrides.tiktok_url || pro.tiktok_url || agency.tiktok_url || "";
    return isFilled(raw) ? normalizeHttpUrl(raw) : "";
  }, [useAgencyBranding, overrides.tiktok_url, agency.tiktok_url, pro.tiktok_url]);

  const videoUrl = useMemo(() => {
    if (overrides.video_url !== undefined) {
      return isFilled(overrides.video_url) ? normalizeHttpUrl(overrides.video_url) : "";
    }

    const agencyVideoRaw =
      agency.video_external_url ||
      agency.video_url ||
      "";

    const personalVideoRaw =
      pro.custom_video_url ||
      pro.video_external_url ||
      pro.video_url ||
      "";

    const selected =
      useAgencyBranding && effectiveVideoMode === "agency"
        ? agencyVideoRaw
        : personalVideoRaw || agencyVideoRaw;

    return isFilled(selected) ? normalizeHttpUrl(selected) : "";
  }, [
    overrides.video_url,
    agency.video_external_url,
    agency.video_url,
    pro.custom_video_url,
    pro.video_external_url,
    pro.video_url,
    useAgencyBranding,
    effectiveVideoMode,
  ]);

  const payload = useMemo(() => {
    return {
      identity: {
        displayName: fullName,
        functionLabel: roleLabel,
        companyName,
        avatarUrl: "",
        logoUrl,
        initialsText,
      },
      theme: {
        bannerColor: colors.bannerColor,
        textColor: colors.textColor,
        primaryButtonColor: colors.primaryButtonColor,
        secondaryButtonColor: colors.secondaryButtonColor,
        nameColor: colors.nameColor,
        signatureColor: colors.signatureColor,
        companyNameColor: colors.companyNameColor,
        supportTextColor: colors.supportTextColor,
      },
      contact: {
        emailHref,
        phoneHref,
        whatsAppHref,
        appointmentHref,
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
        scopeAreas,
        shareUrl: "https://card.livingroom.immo/cvd/apercu",
        shareText: `Je te partage le profil de ${fullName}`,
        shareSubject: `Profil pro — ${fullName}`,
        shareBodyWithImage: `Je te partage le profil de ${fullName}\nhttps://card.livingroom.immo/cvd/apercu`,
        supportText,
        videoUrl,
      },
      qr: {
        enabled: true,
        url: "https://card.livingroom.immo/cvd/apercu",
        fgColor: colors.qrFgColor,
        logoUrl: logoUrl || undefined,
        withLogo: false,
        size: 220,
      },
      ui: {
        isPublicDigitalCard: false,
        isAgencyMember: useAgencyBranding,
        showRecommendedBadge: false,
        showLeadCta: true,
        showListingsCta: true,
        showVideoCta: true,
      },
    };
  }, [
    fullName,
    roleLabel,
    companyName,
    logoUrl,
    initialsText,
    colors,
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
    scopeAreas,
    supportText,
    videoUrl,
    useAgencyBranding,
  ]);

  return (
    <div className="flex flex-col items-center gap-6 w-full h-full">
      <div className="flex flex-col sm:flex-row items-center justify-between w-full max-w-sm px-4 py-2 bg-slate-100 rounded-lg gap-4 sm:gap-0">
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === "mobile" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("mobile")}
            className="h-8 w-8 p-0"
          >
            <Smartphone className="h-4 w-4" />
          </Button>

          <Button
            variant={viewMode === "desktop" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("desktop")}
            className="h-8 w-8 p-0"
          >
            <Monitor className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="preview-theme"
            checked={effectiveDarkMode}
            onCheckedChange={setIsDarkMode}
          />
          <Label htmlFor="preview-theme" className="text-xs">
            Mode Sombre
          </Label>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap justify-center">
        <Badge
          variant="outline"
          className={
            useAgencyBranding || enforcement?.colors
              ? "bg-orange-50 text-orange-700 border-orange-200"
              : "bg-blue-50 text-blue-700 border-blue-200"
          }
        >
          {lockBadge}
        </Badge>

        {!isFilled(videoUrl) ? (
          <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
            Sans vidéo
          </Badge>
        ) : effectiveVideoMode === "agency" && useAgencyBranding ? (
          <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200">
            Vidéo Agence
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            Vidéo Personnelle
          </Badge>
        )}
      </div>

      <div
        className={`
          relative transition-all duration-500 border-8 border-gray-800 rounded-[2rem] overflow-hidden shadow-2xl bg-white
          ${viewMode === "mobile" ? "w-[300px] min-h-[600px]" : "w-[420px] min-h-[600px] rounded-xl border-4"}
        `}
      >
        <div
          className="w-full h-full overflow-y-auto scrollbar-hide p-3"
          style={{ backgroundColor: effectiveDarkMode ? "#0f172a" : "#ffffff" }}
        >
          <DigitalCardRenderer
            payload={payload}
            origin="preview"
            onOpenLeadForm={undefined}
            onOpenListings={undefined}
            onCopyLink={async () => {}}
            onNativeShare={async () => false}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">Aperçu en temps réel</p>
    </div>
  );
}