import React, { memo, useMemo } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, ExternalLink, MapPin, Building2 } from "lucide-react";
import { getAvatarUrl, getLogoUrl } from "@/utils/storageAssets";
import { getPremiumPublicCardUrl, getPublicCvdUrl } from "@/utils/cvdHelpers";

const normalizeText = (v) => String(v || "").trim();

const ProfessionnelPartnerCard = memo(({ professional }) => {
  const {
    first_name,
    last_name,
    company_name,
    effective_company_name,
    email,
    avatar_url,
    avatar_path,
    effective_logo_url,
    effective_logo_path,
    logo_url,
    logo_path,
    agency_id,
    scope_intervention_choice_1,
    premium_professionnel_card,
    card_slug,
    id,
    effective_card_url,
  } = professional || {};

  const fullName = [first_name, last_name].filter(Boolean).join(" ").trim();

  const initials = (
    ((first_name?.[0] || "") + (last_name?.[0] || "")).toUpperCase() || "LR"
  ).slice(0, 2);

  const displayCompanyName = useMemo(() => {
    return (
      normalizeText(effective_company_name) ||
      normalizeText(company_name) ||
      ""
    );
  }, [effective_company_name, company_name]);

  const companyInitials = useMemo(() => {
    if (!displayCompanyName) return "LR";
    return (
      displayCompanyName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((x) => x[0]?.toUpperCase() || "")
        .join("") || "LR"
    );
  }, [displayCompanyName]);

  const displayAvatar = useMemo(() => {
    return getAvatarUrl(avatar_path || avatar_url) || null;
  }, [avatar_path, avatar_url]);

  const displayLogo = useMemo(() => {
    const effectiveLogo = getLogoUrl(effective_logo_path || effective_logo_url);
    if (effectiveLogo) return effectiveLogo;

    if (agency_id) {
      return getLogoUrl(logo_url) || null;
    }

    return getLogoUrl(logo_path || logo_url) || null;
  }, [agency_id, effective_logo_path, effective_logo_url, logo_path, logo_url]);

  const cardUrl = useMemo(() => {
    if (normalizeText(effective_card_url)) return effective_card_url;

    const premiumUrl = getPremiumPublicCardUrl(
      {
        premium_professionnel_card,
      },
      {
        cvd: true,
        entry: "external",
        from: "partners-list",
      }
    );
    if (premiumUrl) return premiumUrl;

    return (
      getPublicCvdUrl(
        {
          id,
          card_slug: card_slug || null,
          premium_professionnel_card,
        },
        {
          cvd: true,
          entry: "external",
          from: "partners-list",
        }
      ) || null
    );
  }, [effective_card_url, premium_professionnel_card, id, card_slug]);

  const handleOpenCard = () => {
    if (!cardUrl) return;
    window.open(cardUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Card className="group relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-slate-50 via-white to-slate-50" />

      <div className="absolute right-5 top-5 z-20 flex h-14 w-14 items-center justify-center rounded-xl bg-white/90 shadow-sm ring-1 ring-slate-200 backdrop-blur">
        {displayLogo ? (
          <img
            src={displayLogo}
            alt={`Logo ${displayCompanyName || fullName}`}
            className="h-10 w-10 object-contain"
            loading="lazy"
          />
        ) : displayCompanyName ? (
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
            {companyInitials}
          </span>
        ) : (
          <Building2 className="h-5 w-5 text-slate-400" />
        )}
      </div>

      <CardContent className="relative flex h-full flex-col p-6">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4 mt-2">
            <div className="absolute inset-0 rounded-full bg-slate-200/40 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100" />
            <Avatar className="relative z-10 h-24 w-24 border-4 border-white shadow-md">
              <AvatarImage
                src={displayAvatar || ""}
                alt={fullName || "Professionnel"}
                loading="lazy"
                className="object-cover"
              />
              <AvatarFallback className="bg-slate-100 text-lg font-semibold text-slate-500">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="min-h-[94px] space-y-2">
            <h3
              className="max-w-[240px] line-clamp-2 text-xl font-bold leading-tight text-slate-900"
              title={fullName}
            >
              {fullName || "Professionnel"}
            </h3>

            {displayCompanyName && (
              <p
                className="max-w-[240px] line-clamp-2 text-sm font-semibold text-[#005E9E]"
                title={displayCompanyName}
              >
                {displayCompanyName}
              </p>
            )}

            {scope_intervention_choice_1 && (
              <div className="mx-auto flex max-w-[220px] items-center justify-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-xs text-slate-600">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="line-clamp-1">{scope_intervention_choice_1}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-3 border-t border-slate-100 pt-5">
          {email ? (
            <a
              href={`mailto:${email}`}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
            >
              <Mail className="h-4 w-4" />
              <span>Contacter</span>
            </a>
          ) : (
            <div className="h-[42px]" />
          )}

          <Button
            className="w-full rounded-xl bg-[#005E9E] text-white shadow-sm transition-all hover:bg-[#004C80] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleOpenCard}
            disabled={!cardUrl}
            title={!cardUrl ? "Carte non disponible" : "Voir la carte digitale"}
          >
            <span>Voir la carte</span>
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

ProfessionnelPartnerCard.displayName = "ProfessionnelPartnerCard";

export default ProfessionnelPartnerCard;