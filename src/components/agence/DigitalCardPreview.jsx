import React, { useMemo, useState } from "react";
import { Smartphone, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import DigitalCardRenderer from "@/components/digital-card/DigitalCardRenderer";

const isFilled = (v) => v !== undefined && v !== null && String(v).trim() !== "";
const normalizeRole = (value) => String(value || "").trim().toLowerCase();

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

const pickFirstFilled = (...values) => values.find(isFilled) || "";

export default function DigitalCardPreview({
  agencyData,
  proData,
  overrides,
  title = "Aperçu en temps réel",
}) {
  const [viewMode, setViewMode] = useState("mobile");
  const [isDarkMode, setIsDarkMode] = useState(false);

  const pro = proData || {};
  const agency = agencyData || {};
  const ov = overrides || {};

  const hasAgencyId = useMemo(() => {
    return isFilled(pro.agency_id) || isFilled(agency.id);
  }, [pro.agency_id, agency.id]);

  // director / team_leader / agent_affiliate = branding agence
  // agent = branding personnel
  const useAgencyBranding = useMemo(() => {
    return hasAgencyId && isAgencyAttachedRole(pro.agency_role);
  }, [hasAgencyId, pro.agency_role]);

  const resolvedLogo = useMemo(() => {
    if (useAgencyBranding) {
      return (
        ov.logo_url ||
        agency.logo_url ||
        agency.logo_storage_path ||
        pro.agency_logo_url ||
        pro.agency_logo_path ||
        ""
      );
    }

    return ov.logo_url || pro.logo_url || pro.logo_path || agency.logo_url || "";
  }, [
    useAgencyBranding,
    ov.logo_url,
    agency.logo_url,
    agency.logo_storage_path,
    pro.agency_logo_url,
    pro.agency_logo_path,
    pro.logo_url,
    pro.logo_path,
  ]);

  const resolvedCompanyName = useMemo(() => {
    if (useAgencyBranding) {
      return ov.company_name || agency.name || pro.agency_name || "Agence Immobilière";
    }

    return ov.company_name || pro.company_name || agency.name || "Professionnel immobilier";
  }, [useAgencyBranding, ov.company_name, agency.name, pro.company_name, pro.agency_name]);

  const resolvedFullName = useMemo(() => {
    const first = ov.first_name || pro.first_name || "";
    const last = ov.last_name || pro.last_name || "";
    const full = `${first} ${last}`.trim();
    return full || "Jean Dupont";
  }, [ov.first_name, ov.last_name, pro.first_name, pro.last_name]);

  const initialsText = useMemo(() => {
    const [first = "", last = ""] = resolvedFullName.split(" ");
    const a = first.charAt(0).toUpperCase();
    const b = last.charAt(0).toUpperCase();
    return `${a}${b}`.trim() || "JD";
  }, [resolvedFullName]);

  const resolvedRoleLabel = useMemo(() => {
    return ov.function || pro.function || pro.role_label || "Agent Commercial";
  }, [ov.function, pro.function, pro.role_label]);

  const resolvedBio = useMemo(() => {
    return (
      ov.professionnal_presentation ||
      pro.professionnal_presentation ||
      "Présentez ici votre expertise, vos secteurs et votre accompagnement."
    );
  }, [ov.professionnal_presentation, pro.professionnal_presentation]);

  const resolvedScopeAreas = useMemo(() => {
    return [
      ov.scope_intervention_choice_1 ?? pro.scope_intervention_choice_1,
      ov.scope_intervention_choice_2 ?? pro.scope_intervention_choice_2,
      ov.scope_intervention_choice_3 ?? pro.scope_intervention_choice_3,
    ].filter(isFilled);
  }, [
    ov.scope_intervention_choice_1,
    ov.scope_intervention_choice_2,
    ov.scope_intervention_choice_3,
    pro.scope_intervention_choice_1,
    pro.scope_intervention_choice_2,
    pro.scope_intervention_choice_3,
  ]);

  const isDark = isDarkMode || agency.theme_mode === "dark" || pro.theme_mode === "dark";

  const colors = useMemo(() => {
    const source = {
      ...(useAgencyBranding ? agency : {}),
      ...(useAgencyBranding ? {} : pro),
      ...ov,
    };

    return {
      bannerColor: source.card_banner_color || "#3b82f6",
      textColor: isDark ? "#f8fafc" : source.card_text_color || "#1e293b",
      primaryButtonColor: source.card_primary_button_color || "#000000",
      secondaryButtonColor: source.card_secondary_button_color || "#ffffff",
      nameColor: source.card_name_color || "#1e293b",
      signatureColor: source.card_signature_color || "#64748b",
      companyNameColor: source.card_company_name_color || "#3b82f6",
      supportTextColor: source.card_support_text_color || "#94a3b8",
      qrFgColor: source.card_qr_fg_color || "#000000",
    };
  }, [useAgencyBranding, agency, pro, ov, isDark]);

  const emailHref = useMemo(() => {
    const email = ov.email ?? pro.email;
    return isFilled(email) ? `mailto:${email}` : undefined;
  }, [ov.email, pro.email]);

  const phoneHref = useMemo(() => {
    const phone = ov.phone ?? pro.phone;
    return isFilled(phone) ? `tel:${phone}` : undefined;
  }, [ov.phone, pro.phone]);

  const whatsAppHref = useMemo(() => {
    const phone = ov.phone ?? pro.phone;
    return isFilled(phone) ? formatWhatsAppUrl(phone) : undefined;
  }, [ov.phone, pro.phone]);

  const appointmentHref = useMemo(() => {
    const url = ov.appointment_url ?? pro.appointment_url;
    return isFilled(url) ? normalizeHttpUrl(url) : undefined;
  }, [ov.appointment_url, pro.appointment_url]);

  const agencyWebsiteUrl = useMemo(() => {
    const raw = pickFirstFilled(
      ov.agency_website_url,
      useAgencyBranding ? agency.website_url : "",
      pro.agency_website_url,
      pro.website_url,
      pro.site_url
    );
    return isFilled(raw) ? normalizeHttpUrl(raw) : "";
  }, [
    ov.agency_website_url,
    useAgencyBranding,
    agency.website_url,
    pro.agency_website_url,
    pro.website_url,
    pro.site_url,
  ]);

  const customerReviewUrl = useMemo(() => {
    const raw = pickFirstFilled(
      ov.customer_review_url,
      pro.customer_review_url,
      pro.reviews_url,
      pro.google_reviews_url,
      pro.avis_url,
      useAgencyBranding ? agency.customer_review_url : ""
    );
    return isFilled(raw) ? normalizeHttpUrl(raw) : "";
  }, [
    ov.customer_review_url,
    pro.customer_review_url,
    pro.reviews_url,
    pro.google_reviews_url,
    pro.avis_url,
    useAgencyBranding,
    agency.customer_review_url,
  ]);

  const linkedinUrl = useMemo(() => {
    const raw = pickFirstFilled(
      ov.linkedin_url,
      useAgencyBranding ? agency.linkedin_url : "",
      pro.linkedin_url
    );
    return isFilled(raw) ? normalizeHttpUrl(raw) : "";
  }, [ov.linkedin_url, useAgencyBranding, agency.linkedin_url, pro.linkedin_url]);

  const facebookUrl = useMemo(() => {
    const raw = pickFirstFilled(
      ov.facebook_url,
      useAgencyBranding ? agency.facebook_url : "",
      pro.facebook_url
    );
    return isFilled(raw) ? normalizeHttpUrl(raw) : "";
  }, [ov.facebook_url, useAgencyBranding, agency.facebook_url, pro.facebook_url]);

  const instagramUrl = useMemo(() => {
    const raw = pickFirstFilled(
      ov.instagram_url,
      useAgencyBranding ? agency.instagram_url : "",
      pro.instagram_url
    );
    return isFilled(raw) ? normalizeHttpUrl(raw) : "";
  }, [ov.instagram_url, useAgencyBranding, agency.instagram_url, pro.instagram_url]);

  const youtubeUrl = useMemo(() => {
    const raw = pickFirstFilled(
      ov.youtube_url,
      useAgencyBranding ? agency.youtube_url : "",
      pro.youtube_url
    );
    return isFilled(raw) ? normalizeHttpUrl(raw) : "";
  }, [ov.youtube_url, useAgencyBranding, agency.youtube_url, pro.youtube_url]);

  const tiktokUrl = useMemo(() => {
    const raw = pickFirstFilled(
      ov.tiktok_url,
      useAgencyBranding ? agency.tiktok_url : "",
      pro.tiktok_url
    );
    return isFilled(raw) ? normalizeHttpUrl(raw) : "";
  }, [ov.tiktok_url, useAgencyBranding, agency.tiktok_url, pro.tiktok_url]);

  const payload = useMemo(() => {
    return {
      identity: {
        displayName: resolvedFullName,
        functionLabel: resolvedRoleLabel,
        companyName: resolvedCompanyName,
        avatarUrl: "",
        logoUrl: resolvedLogo,
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
        scopeAreas: resolvedScopeAreas,
        shareUrl: "https://card.livingroom.immo/cvd/apercu",
        shareText: `Je te partage le profil de ${resolvedFullName}`,
        shareSubject: `Profil pro — ${resolvedFullName}`,
        shareBodyWithImage: `Je te partage le profil de ${resolvedFullName}\nhttps://card.livingroom.immo/cvd/apercu`,
        supportText: resolvedBio,
      },
      qr: {
        enabled: true,
        url: "https://card.livingroom.immo/cvd/apercu",
        fgColor: colors.qrFgColor,
        logoUrl: resolvedLogo || undefined,
        withLogo: false,
        size: 220,
      },
      ui: {
        isPublicDigitalCard: false,
        isAgencyMember: useAgencyBranding,
        showRecommendedBadge: false,
        showLeadCta: true,
        showListingsCta: true,
      },
    };
  }, [
    resolvedFullName,
    resolvedRoleLabel,
    resolvedCompanyName,
    resolvedLogo,
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
    resolvedScopeAreas,
    resolvedBio,
    useAgencyBranding,
  ]);

  return (
    <div className="flex flex-col items-center gap-6 w-full">
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
            checked={isDarkMode}
            onCheckedChange={setIsDarkMode}
          />
          <Label htmlFor="preview-theme" className="text-xs">
            Mode Sombre
          </Label>
        </div>
      </div>

      <div
        className={`
          relative transition-all duration-500 border-8 border-gray-800 rounded-[2.5rem] overflow-hidden shadow-2xl bg-white ring-1 ring-gray-900/5
          ${viewMode === "mobile" ? "w-[320px] min-h-[640px]" : "w-[420px] min-h-[640px] rounded-xl border-4"}
        `}
      >
        {viewMode === "mobile" && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-32 bg-gray-800 rounded-b-xl z-20" />
        )}

        <div
          className="w-full h-full overflow-y-auto scrollbar-hide flex flex-col relative p-3"
          style={{ backgroundColor: isDark ? "#0f172a" : "#ffffff" }}
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

      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
        {title}
      </p>
    </div>
  );
}