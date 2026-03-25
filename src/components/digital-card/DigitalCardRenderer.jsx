import React, { memo, useCallback, useMemo, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  User,
  Mail,
  Phone,
  MessageSquare,
  CalendarDays,
  Linkedin,
  Facebook,
  Instagram,
  Youtube,
  Video,
  Globe,
  Star,
  Share2,
  PlayCircle,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Link as LinkIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import FeaturedProjectsSection from "@/components/showcase/FeaturedProjectsSection";

const isFilled = (v) =>
  v !== undefined && v !== null && String(v).trim() !== "";

const ContactIcons = memo(function ContactIcons({
  emailHref,
  phoneHref,
  whatsAppHref,
  appointmentHref,
  rounded = true,
}) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {phoneHref && (
        <Button
          asChild
          size="icon"
          variant="outline"
          className={`${rounded ? "rounded-full" : ""} h-12 w-12 border-blue-100 bg-blue-50 text-blue-600 shadow-sm hover:bg-blue-100 hover:text-blue-700`}
          title="Appeler"
        >
          <a href={phoneHref}>
            <Phone className="h-5 w-5" />
          </a>
        </Button>
      )}

      {whatsAppHref && (
        <Button
          asChild
          size="icon"
          variant="outline"
          className={`${rounded ? "rounded-full" : ""} h-12 w-12 border-green-100 bg-green-50 text-green-600 shadow-sm hover:bg-green-100 hover:text-green-700`}
          title="WhatsApp"
        >
          <a href={whatsAppHref} target="_blank" rel="noopener noreferrer">
            <MessageSquare className="h-5 w-5 rotate-180" />
          </a>
        </Button>
      )}

      {emailHref && (
        <Button
          asChild
          size="icon"
          variant="outline"
          className={`${rounded ? "rounded-full" : ""} h-12 w-12 border-slate-200 bg-slate-50 text-slate-600 shadow-sm hover:bg-slate-100 hover:text-blue-700`}
          title="Envoyer un email"
        >
          <a href={emailHref}>
            <Mail className="h-5 w-5" />
          </a>
        </Button>
      )}

      {appointmentHref && (
        <Button
          asChild
          size="icon"
          variant="outline"
          className={`${rounded ? "rounded-full" : ""} h-12 w-12 border-purple-100 bg-purple-50 text-purple-600 shadow-sm hover:bg-purple-100 hover:text-purple-700`}
          title="Prendre rendez-vous"
        >
          <a href={appointmentHref} target="_blank" rel="noopener noreferrer">
            <CalendarDays className="h-5 w-5" />
          </a>
        </Button>
      )}
    </div>
  );
});

function DigitalCardRendererComponent({
  payload,
  origin,
  onOpenLeadForm,
  onOpenListings,
  onOpenFeatured,
  onOpenFeaturedProject,
  onCopyLink,
  onNativeShare,
}) {
  const { toast } = useToast();

  const [openShare, setOpenShare] = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);

  const identity = payload?.identity || {};
  const theme = payload?.theme || {};
  const contact = payload?.contact || {};
  const social = payload?.social || {};
  const content = payload?.content || {};
  const ui = payload?.ui || {};

  const displayName = identity?.displayName || "Professionnel";
  const functionLabel = identity?.functionLabel || "Professionnel Immobilier";
  const companyName = identity?.companyName || "";
  const avatarUrl = identity?.avatarUrl || "";
  const logoUrl = identity?.logoUrl || "";
  const initialsText = identity?.initialsText || "";

  const bannerColor = theme?.bannerColor || "#22577A";
  const textColor = theme?.textColor || "#22577A";
  const primaryButtonColor = theme?.primaryButtonColor || "#F89223";
  const secondaryButtonColor = theme?.secondaryButtonColor || "#22577A";
  const nameColor = theme?.nameColor || textColor;
  const signatureColor = theme?.signatureColor || secondaryButtonColor;
  const companyNameColor = theme?.companyNameColor || "#6b7280";
  const supportTextColor = theme?.supportTextColor || "#334155";

  const emailHref = contact?.emailHref;
  const phoneHref = contact?.phoneHref;
  const whatsAppHref = contact?.whatsAppHref;
  const appointmentHref = contact?.appointmentHref;

  const hasAnyContact = Boolean(
    emailHref || phoneHref || whatsAppHref || appointmentHref
  );

  const scopeAreas = Array.isArray(content?.scopeAreas)
    ? content.scopeAreas
    : [];
  const shareUrl = content?.shareUrl || "";
  const shareText = content?.shareText || "";
  const shareSubject = content?.shareSubject || "";
  const supportText = content?.supportText || "";
  const leadUrl = content?.leadUrl || "";
  const listingsUrl = content?.listingsUrl || "";
  const videoUrl = content?.videoUrl || "";
  const featuredUrl = content?.featuredOpportunitiesUrl || "";
  const professionnelId = content?.professionnelId || "";
  const featuredProjectsPreview = Array.isArray(content?.featuredProjectsPreview)
    ? content.featuredProjectsPreview
    : null;

  const linkedinUrl = social?.linkedinUrl || "";
  const facebookUrl = social?.facebookUrl || "";
  const instagramUrl = social?.instagramUrl || "";
  const youtubeUrl = social?.youtubeUrl || "";
  const tiktokUrl = social?.tiktokUrl || "";
  const agencyWebsiteUrl = social?.agencyWebsiteUrl || "";
  const customerReviewUrl = social?.customerReviewUrl || "";

  const anySocial = [
    linkedinUrl,
    facebookUrl,
    instagramUrl,
    youtubeUrl,
    tiktokUrl,
    agencyWebsiteUrl,
    customerReviewUrl,
  ].some(isFilled);

  const isAgencyMember = ui?.isAgencyMember === true;
  const showRecommendedBadge = ui?.showRecommendedBadge === true;
  const showLeadCta = ui?.showLeadCta !== false;
  const showListingsCta = ui?.showListingsCta !== false;
  const showVideoCta = ui?.showVideoCta !== false;
  const showFeaturedProjectsPreview =
    ui?.showFeaturedProjectsPreview !== false;

  const canOpenLead =
    typeof onOpenLeadForm === "function" || isFilled(leadUrl);
  const canOpenListings =
    typeof onOpenListings === "function" || isFilled(listingsUrl);
  const canOpenVideo = isFilled(videoUrl);
  const canOpenFeatured =
    typeof onOpenFeatured === "function" || isFilled(featuredUrl);

  const hasLongBio = useMemo(
    () => String(supportText || "").trim().length > 140,
    [supportText]
  );

  const copyToClipboard = useCallback(
    async (text) => {
      if (!text) return;

      if (typeof onCopyLink === "function") {
        await onCopyLink(text);
        return;
      }

      try {
        await navigator.clipboard.writeText(text);
        toast({
          title: "Lien copié",
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
    [onCopyLink, toast]
  );

  const handleShareButtonClick = useCallback(async () => {
    if (!isFilled(shareUrl)) {
      toast({
        variant: "destructive",
        title: "Lien indisponible",
        description: "Impossible de générer le lien de partage.",
      });
      return;
    }

    try {
      if (typeof onNativeShare === "function") {
        const handled = await onNativeShare({
          title: shareSubject,
          text: shareText,
          url: shareUrl,
        });
        if (handled) return;
      }

      if (navigator.share) {
        await navigator.share({
          title: shareSubject,
          text: shareText,
          url: shareUrl,
        });
        return;
      }
    } catch {
      // ignore
    }

    setOpenShare(true);
  }, [onNativeShare, shareUrl, shareSubject, shareText, toast]);

  const handleLeadClick = useCallback(() => {
    if (typeof onOpenLeadForm === "function") {
      onOpenLeadForm();
      return;
    }
    if (isFilled(leadUrl) && typeof window !== "undefined") {
      window.location.assign(leadUrl);
    }
  }, [onOpenLeadForm, leadUrl]);

  const handleListingsClick = useCallback(() => {
    if (typeof onOpenListings === "function") {
      onOpenListings();
      return;
    }
    if (isFilled(listingsUrl) && typeof window !== "undefined") {
      window.location.assign(listingsUrl);
    }
  }, [onOpenListings, listingsUrl]);

  const handleFeaturedClick = useCallback(() => {
    if (typeof onOpenFeatured === "function") {
      onOpenFeatured();
      return;
    }
    if (isFilled(featuredUrl) && typeof window !== "undefined") {
      window.location.assign(featuredUrl);
    }
  }, [featuredUrl, onOpenFeatured]);

  const handleFeaturedProjectClick = useCallback(
    (project) => {
      if (typeof onOpenFeaturedProject === "function") {
        onOpenFeaturedProject(project);
        return;
      }
      if (isFilled(featuredUrl) && typeof window !== "undefined") {
        window.location.assign(featuredUrl);
      }
    },
    [featuredUrl, onOpenFeaturedProject]
  );

  const handleVideoClick = useCallback(() => {
    if (!isFilled(videoUrl) || typeof window === "undefined") return;
    window.open(videoUrl, "_blank", "noopener,noreferrer");
  }, [videoUrl]);

  const shareOnFacebook = useCallback(() => {
    if (!shareUrl || typeof window === "undefined") return;
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        shareUrl
      )}`,
      "_blank",
      "noopener,noreferrer"
    );
  }, [shareUrl]);

  const shareOnLinkedIn = useCallback(() => {
    if (!shareUrl || typeof window === "undefined") return;
    const url = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(
      shareUrl
    )}&title=${encodeURIComponent(
      shareSubject
    )}&summary=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, [shareUrl, shareSubject, shareText]);

  const shareByEmail = useCallback(() => {
    if (!shareUrl || typeof window === "undefined") return;
    const subject = encodeURIComponent(
      shareSubject || "Carte de visite digitale"
    );
    const body = encodeURIComponent(`${shareText}\n\n${shareUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }, [shareUrl, shareSubject, shareText]);

  const shareBySms = useCallback(() => {
    if (!shareUrl || typeof window === "undefined") return;
    const body = encodeURIComponent(`${shareText} ${shareUrl}`);
    window.location.href = `sms:?body=${body}`;
  }, [shareUrl, shareText]);

  const shareByWhatsApp = useCallback(() => {
    if (!shareUrl || typeof window === "undefined") return;
    const text = encodeURIComponent(`${shareText}\n${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  }, [shareUrl, shareText]);

  const socialButtons = useMemo(
    () =>
      [
        linkedinUrl
          ? {
              key: "linkedin",
              href: linkedinUrl,
              title: "LinkedIn",
              icon: <Linkedin className="h-5 w-5" />,
            }
          : null,
        facebookUrl
          ? {
              key: "facebook",
              href: facebookUrl,
              title: "Facebook",
              icon: <Facebook className="h-5 w-5" />,
            }
          : null,
        instagramUrl
          ? {
              key: "instagram",
              href: instagramUrl,
              title: "Instagram",
              icon: <Instagram className="h-5 w-5" />,
            }
          : null,
        youtubeUrl
          ? {
              key: "youtube",
              href: youtubeUrl,
              title: "YouTube",
              icon: <Youtube className="h-5 w-5" />,
            }
          : null,
        tiktokUrl
          ? {
              key: "tiktok",
              href: tiktokUrl,
              title: "TikTok",
              icon: <Video className="h-5 w-5" />,
            }
          : null,
        agencyWebsiteUrl
          ? {
              key: "website",
              href: agencyWebsiteUrl,
              title: "Site web",
              icon: <Globe className="h-5 w-5" />,
            }
          : null,
        customerReviewUrl
          ? {
              key: "reviews",
              href: customerReviewUrl,
              title: "Avis clients",
              icon: <Star className="h-5 w-5" />,
            }
          : null,
      ].filter(Boolean),
    [
      linkedinUrl,
      facebookUrl,
      instagramUrl,
      youtubeUrl,
      tiktokUrl,
      agencyWebsiteUrl,
      customerReviewUrl,
    ]
  );

  if (!payload) return null;

  return (
    <Card
      className="mx-auto flex w-full max-w-[430px] flex-col overflow-hidden rounded-[28px] border bg-white shadow-md transition-all"
      style={{ borderColor: bannerColor }}
    >
      <CardHeader
        className="relative overflow-hidden p-0"
        style={{ backgroundColor: bannerColor }}
      >
        <div className="h-[220px]" />

        <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-gradient-to-b from-white/5 to-black/5" />

        <div className="absolute left-4 right-4 top-4 z-20 flex items-start justify-between">
          <div className="h-11 w-11" />

          {isFilled(logoUrl) ? (
            <div className="flex h-[56px] w-[104px] items-center justify-center rounded-2xl border border-white/60 bg-white/95 p-2 shadow-md backdrop-blur">
              <img
                loading="lazy"
                src={logoUrl}
                alt="Logo"
                className="max-h-full max-w-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          ) : (
            <div className="h-[56px] w-[104px]" />
          )}
        </div>

        <div className="absolute inset-x-0 top-8 z-10 flex justify-center">
          <Avatar className="h-36 w-36 border-4 border-white bg-slate-100 shadow-2xl">
            <AvatarImage
              loading="lazy"
              src={avatarUrl || undefined}
              alt={displayName}
              className="object-cover object-center"
              onError={(e) => {
                e.currentTarget.src = "";
              }}
            />
            <AvatarFallback
              className="bg-slate-300 text-4xl"
              style={{ color: bannerColor }}
            >
              {initialsText || <User />}
            </AvatarFallback>
          </Avatar>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col px-5 pb-6 pt-8">
        <div className="relative text-center">
          <button
            type="button"
            onClick={handleShareButtonClick}
            disabled={!isFilled(shareUrl)}
            title="Partager cette carte"
            className="absolute right-0 top-0 inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-brand-blue disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Share2 className="h-5 w-5" />
          </button>

          <CardTitle
            className="px-12 text-[32px] font-bold leading-tight tracking-tight"
            style={{ color: nameColor }}
          >
            {displayName}
          </CardTitle>

          <CardDescription
            className="mt-2 text-[16px] font-medium leading-snug"
            style={{ color: signatureColor }}
          >
            {functionLabel}
          </CardDescription>

          {isFilled(companyName) && (
            <CardDescription
              className="mt-2 text-[14px] font-medium"
              style={{ color: companyNameColor }}
            >
              {companyName}
            </CardDescription>
          )}

          {showRecommendedBadge && (
            <div className="mt-3 flex justify-center">
              <span className="inline-flex items-center rounded-full border border-[#EC782B33] bg-[#EC782B0D] px-2.5 py-1 text-[11px] font-semibold text-[#EC782B]">
                <Star className="mr-1 h-3 w-3 fill-[#EC782B] text-[#EC782B]" />
                Professionnel recommandé
              </span>
            </div>
          )}
        </div>

        {scopeAreas.length > 0 && (
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-center">
              <MapPin className="mr-1 h-3.5 w-3.5 text-gray-500" />
              <span
                className="text-xs font-semibold"
                style={{ color: textColor }}
              >
                Zones d&apos;intervention
              </span>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {scopeAreas.slice(0, 3).map((area, index) => (
                <span
                  key={`${area}-${index}`}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700"
                  title={area}
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
        )}

        {hasAnyContact && (
          <div className="mt-6">
            <ContactIcons
              emailHref={isFilled(emailHref) ? emailHref : undefined}
              phoneHref={isFilled(phoneHref) ? phoneHref : undefined}
              whatsAppHref={whatsAppHref}
              appointmentHref={
                isFilled(appointmentHref) ? appointmentHref : undefined
              }
            />
          </div>
        )}

        <div className="mt-6 space-y-3">
          {showLeadCta && (
            <Button
              onClick={handleLeadClick}
              className="h-[52px] min-h-[52px] w-full rounded-xl text-[16px] font-semibold text-white shadow-md"
              disabled={!canOpenLead}
              style={{ backgroundColor: primaryButtonColor }}
            >
              Parlez-moi de votre projet...
            </Button>
          )}

          {showFeaturedProjectsPreview &&
            isFilled(professionnelId) && (
              <FeaturedProjectsSection
                professionnelId={professionnelId}
                accentColor={primaryButtonColor}
                secondaryColor={secondaryButtonColor}
                initialProjects={featuredProjectsPreview}
                onOpenAll={handleFeaturedClick}
                onOpenProject={handleFeaturedProjectClick}
              />
            )}

          {showListingsCta && (
            <Button
              variant="outline"
              onClick={handleListingsClick}
              className="h-[52px] min-h-[52px] w-full rounded-xl text-[16px] font-semibold shadow-sm"
              disabled={!canOpenListings}
              style={{
                borderColor: secondaryButtonColor,
                color: secondaryButtonColor,
              }}
            >
              Voir mes recherches et ventes de biens
            </Button>
          )}

          {showVideoCta && canOpenVideo && (
            <Button
              variant="ghost"
              onClick={handleVideoClick}
              className="h-11 w-full rounded-xl font-medium text-slate-700 hover:bg-slate-50"
            >
              <PlayCircle className="mr-2 h-4 w-4" />
              Voir ma vidéo de présentation
            </Button>
          )}
        </div>

        {(anySocial ||
          isFilled(agencyWebsiteUrl) ||
          isFilled(customerReviewUrl)) && (
          <div className="mt-5">
            <div className="flex flex-wrap justify-center gap-2">
              {socialButtons.map((item) => (
                <Button
                  key={item.key}
                  asChild
                  size="icon"
                  variant="outline"
                  className="h-10 w-10 rounded-full"
                  title={item.title}
                >
                  <a href={item.href} target="_blank" rel="noopener noreferrer">
                    {item.icon}
                  </a>
                </Button>
              ))}
            </div>

            {isAgencyMember && (
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                Réseaux sociaux affichés selon la configuration de l’agence.
              </p>
            )}
          </div>
        )}

        <Dialog open={openShare} onOpenChange={setOpenShare}>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle>Partager cette carte</DialogTitle>
              <DialogDescription>
                Choisissez le canal le plus simple pour envoyer ce profil.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Button
                  variant="outline"
                  className="h-12 justify-start"
                  onClick={shareByEmail}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Email
                </Button>

                <Button
                  variant="outline"
                  className="h-12 justify-start"
                  onClick={shareBySms}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  SMS
                </Button>

                <Button
                  variant="outline"
                  className="h-12 justify-start"
                  onClick={shareByWhatsApp}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  WhatsApp
                </Button>

                <Button
                  variant="outline"
                  className="h-12 justify-start"
                  onClick={shareOnFacebook}
                >
                  <Facebook className="mr-2 h-4 w-4" />
                  Facebook
                </Button>

                <Button
                  variant="outline"
                  className="h-12 justify-start"
                  onClick={shareOnLinkedIn}
                >
                  <Linkedin className="mr-2 h-4 w-4" />
                  LinkedIn
                </Button>

                <Button
                  variant="outline"
                  className="h-12 justify-start"
                  onClick={() => copyToClipboard(shareUrl)}
                >
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Copier le lien
                </Button>
              </div>

              <div className="rounded-xl border bg-slate-50 p-4">
                <p className="mb-2 text-xs font-medium text-slate-500">
                  Lien à partager
                </p>
                <p className="break-all text-sm text-slate-800">{shareUrl}</p>
              </div>

              <div className="rounded-xl border bg-white p-4">
                <p className="mb-2 text-xs font-medium text-slate-500">
                  Message suggéré
                </p>
                <p className="whitespace-pre-wrap text-sm text-slate-800">
                  {shareText}
                  {"\n"}
                  {shareUrl}
                </p>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setOpenShare(false)}>
                  Fermer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {isFilled(supportText) && (
          <div className="mt-6 border-t pt-4">
            <button
              type="button"
              onClick={() => setBioExpanded((prev) => !prev)}
              className="flex w-full items-center justify-between text-sm font-medium text-slate-700"
            >
              <span>Présentation</span>
              {bioExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {bioExpanded && (
              <div className="mt-3 px-1">
                <p
                  className="text-center text-[13px] leading-6"
                  style={{ color: supportTextColor }}
                >
                  {supportText}
                </p>
              </div>
            )}

            {!bioExpanded && hasLongBio && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Cliquez pour en savoir plus sur moi
              </p>
            )}

            {!bioExpanded && !hasLongBio && (
              <div className="mt-3 px-1">
                <p
                  className="text-center text-[13px] leading-6"
                  style={{ color: supportTextColor }}
                >
                  {supportText}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const DigitalCardRenderer = memo(DigitalCardRendererComponent);

export default DigitalCardRenderer;