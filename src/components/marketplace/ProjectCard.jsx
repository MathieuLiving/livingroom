import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Briefcase,
  User as UserIcon,
  MapPin,
  TrendingDown,
  TrendingUp,
  Euro,
  Home,
  BedDouble,
  ExternalLink,
  Info,
  ThumbsUp,
  Send,
  CheckCircle,
  Share2,
  Check,
  Copy,
  Mail,
  MessageSquare,
  Linkedin,
  Facebook,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card.jsx";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog.jsx";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { useNavigate } from "react-router-dom";

/* ---------- Constantes & helpers ---------- */

const propertyTypeDisplay = (typeKey) => {
  const types = {
    appartement: "Appartement",
    maison_villa: "Maison / Villa",
    loft_atelier_surface: "Loft / Atelier / Surface",
    parking_box: "Parking / Box",
    terrain: "Terrain",
    autre: "Autre",
  };
  return types[typeKey] || typeKey;
};

const projectTypeDisplay = (typeKey) => {
  const types = { achat: "Recherche", vente: "Vente" };
  return types[typeKey] || typeKey;
};

const otherCriteriaList = [
  { id: "has_garden", label: "Jardin" },
  { id: "has_terrace", label: "Terrasse" },
  { id: "has_balcony", label: "Balcon" },
  { id: "has_pool", label: "Piscine" },
  { id: "has_elevator", label: "Ascenseur" },
  { id: "has_cellar", label: "Cave" },
  { id: "has_parking", label: "Parking" },
  { id: "has_caretaker", label: "Gardien" },
  { id: "has_clear_view", label: "Vue dégagée" },
  { id: "is_last_floor", label: "Dernier étage" },
];

const formatCurrency = (value) => {
  if (!value) return null;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
};

const DPEBadge = ({ label, value, type }) => {
  if (!value) return null;
  const letter = String(value).trim().toUpperCase();
  const colors = {
    A: "bg-green-600 text-white border-green-700",
    B: "bg-green-500 text-white border-green-600",
    C: "bg-green-400 text-white border-green-500",
    D: "bg-yellow-400 text-yellow-900 border-yellow-500",
    E: "bg-orange-400 text-white border-orange-500",
    F: "bg-red-400 text-white border-red-500",
    G: "bg-red-600 text-white border-red-700",
  };
  const defaultColor = "bg-slate-100 text-slate-700 border-slate-200";
  const colorClass = colors[letter] || defaultColor;

  return (
    <div className="flex items-center gap-1.5" title={label}>
      <div
        className={`flex items-center justify-center w-6 h-6 rounded font-bold text-xs border shadow-sm ${colorClass}`}
      >
        {letter}
      </div>
      <span className="text-[10px] sm:text-xs text-slate-500 font-medium">
        {type === "consumption" ? "DPE" : "GES"}
      </span>
    </div>
  );
};

/* ---------- Composant Place des projets ---------- */

const ProjectCard = ({
  project,
  onConnect,
  onConnectionRequest,
  hasRequested,
  isConnected,
  hideOwnership = false,
  hideRoleIcon = false,
  standalone = false,
  compact = false,
  hideFooterCta = false,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  const tx = (project.transaction_type || project.type_projet || "").toLowerCase();

  /* Origine : pro / particulier */
  const isPro =
    project.project_origin === "professionnel" ||
    project.role === "professionnel" ||
    project.isPro ||
    project.is_professional ||
    project.isProfessional ||
    project.source === "professionnel";

  const SourceIcon = isPro ? Briefcase : UserIcon;
  const sourceLabel = isPro ? "Professionnel" : "Particulier";

  /* Propriétaire du projet ? */
  const isOwner =
    user?.id &&
    (user.id === project.particulier_id ||
      user.id === project.professionnel_id ||
      user.id === project.owner_id);

  /* Contact : bouton “Contacter” */
  const handleContactClick = () => {
    if (typeof onConnect === "function") {
      onConnect(project);
      return;
    }
    if (typeof onConnectionRequest === "function") {
      onConnectionRequest(project);
      return;
    }
    navigate("/contact-project-gate", {
      state: { projectId: project.id, project },
    });
  };

  /* ---------------- SHARE (best UX) ---------------- */

  const [openShare, setOpenShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyingRef = useRef(false);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined" || !project?.slug) return "";
    return `${window.location.origin}/projet_immo/${project.slug}`;
  }, [project?.slug]);

  const canShare = Boolean(shareUrl);

  const shareTitle = project?.project_title || project?.title || "Projet immobilier";
  const shareText = "Découvrir ce projet sur LivingRoom";

  const encodedUrl = encodeURIComponent(shareUrl);

  const copyLink = useCallback(async () => {
    if (!shareUrl || copyingRef.current) return;
    copyingRef.current = true;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      } else {
        window.prompt("Copiez ce lien :", shareUrl);
      }
    } catch {
      window.prompt("Copiez ce lien :", shareUrl);
    } finally {
      window.setTimeout(() => {
        copyingRef.current = false;
      }, 350);
    }
  }, [shareUrl]);

  const handleShareClick = useCallback(async () => {
    if (!shareUrl) return;

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        if (err?.name === "AbortError") return;
        console.warn("[ProjectCard] navigator.share failed → fallback modal", err);
      }
    }

    setOpenShare(true);
  }, [shareUrl, shareTitle, shareText]);

  /* ---------------- Display data ---------------- */

  const projectCriteria = otherCriteriaList.filter((criterion) => project[criterion.id]);

  let locations = [];
  if (Array.isArray(project.locations)) {
    locations = [...project.locations];
  } else if (project.location && Array.isArray(project.location.choices)) {
    locations = [...project.location.choices];
  }

  if (tx === "achat") {
    for (let i = 1; i <= 5; i++) {
      const city = project[`city_choice_${i}`];
      const quartier = project[`quartier_choice_${i}`];
      if (city || quartier) {
        locations.push({ city, quartier });
      }
    }
  } else {
    if (locations.length === 0 && project.city_choice_1) {
      locations.push({
        city: project.city_choice_1,
        quartier: project.quartier_choice_1,
      });
    } else if (locations.length === 0 && project.location && project.location.city) {
      locations.push(project.location);
    }
  }

  const locationDisplay = locations
    .map((l) => {
      const city = l.city || l.ville;
      const dist = l.quartier || l.district;
      return dist ? `${city} (${dist})` : city;
    })
    .filter(Boolean)
    .join(", ");

  const images = (
    project.images ||
    [project.image_1_url, project.image_2_url, project.image_3_url].filter(Boolean)
  ).slice(0, compact ? 2 : 4);

  const createdAt = project.created_at
    ? new Date(project.created_at).toLocaleDateString("fr-FR")
    : null;

  const priceValue =
    tx === "achat" ? formatCurrency(project.budget_max) : formatCurrency(project.prix_demande);

  const title = project.project_title || project.title || "Projet sans titre";
  const descriptionText = project.configuration || project.description;

  let surfaceLabel = null;
  if (tx === "achat") {
    const min = project.surface_min;
    const max = project.surface_max;
    if (min && max) surfaceLabel = `${min} – ${max} m²`;
    else if (min && !max) surfaceLabel = `≥ ${min} m²`;
    else if (!min && max) surfaceLabel = `≤ ${max} m²`;
  } else if (project.surface) {
    surfaceLabel = `${project.surface} m²`;
  }

  let bedroomsLabel = null;
  if (tx === "achat") {
    const min = project.bedrooms_min;
    if (min) bedroomsLabel = `${min}+ ch`;
  } else if (project.bedrooms) {
    bedroomsLabel = `${project.bedrooms} ch`;
  }

  const adLink =
    project.property_ad_link || project.pro_property_ad_link || project.part_property_ad_link;

  const matchScore = typeof project.match_score === "number" ? project.match_score : null;
  const isBestMatch = project.is_best_match || (matchScore !== null && matchScore >= 90);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Card
      ref={cardRef}
      className={[
        "overflow-hidden flex flex-col h-full",
        compact
          ? "border border-slate-200 rounded-xl bg-white shadow-sm hover:shadow-md"
          : "border border-slate-200 rounded-2xl bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.08)]",
        "transition-shadow duration-200",
        isVisible ? "lr-card-enter-visible" : "lr-card-enter",
        isBestMatch ? "ring-1 ring-emerald-200 ring-offset-2" : "",
      ].join(" ")}
    >
      {/* HEADER */}
      <CardHeader
        className={
          compact
            ? "p-3 pb-2 bg-slate-50/50 border-b border-slate-100"
            : "p-3 pb-2 sm:p-4 sm:pb-3 bg-slate-50/60 border-b border-slate-100"
        }
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] sm:text-xs text-slate-600">
              {!hideRoleIcon && (
                <span
                  className={[
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-medium",
                    isPro
                      ? "bg-blue-50 text-blue-700 border-blue-100"
                      : "bg-emerald-50 text-emerald-700 border-emerald-100",
                  ].join(" ")}
                >
                  <SourceIcon className="h-3 w-3" />
                  {sourceLabel}
                </span>
              )}

              {createdAt && (
                <>
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                  <span>{createdAt}</span>
                </>
              )}

              {project.type_bien && (
                <>
                  <span className="h-1 w-1 rounded-full bg-slate-300 hidden sm:inline" />
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {propertyTypeDisplay(project.type_bien)}
                  </span>
                </>
              )}
            </div>

            <CardTitle
              className={
                compact
                  ? "text-base font-semibold leading-snug text-slate-900"
                  : "text-sm sm:text-base font-semibold leading-tight text-slate-900"
              }
            >
              {title}
            </CardTitle>

            {locationDisplay && (
              <CardDescription className="mt-0.5 text-[11px] sm:text-xs text-slate-600 flex gap-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400 mt-[2px]" />
                <span className="leading-snug">{locationDisplay}</span>
              </CardDescription>
            )}
          </div>

          <div className="shrink-0 flex flex-row items-center gap-1">
            <Badge
              variant="outline"
              className={[
                "inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] sm:text-xs border-transparent",
                tx === "vente" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700",
              ].join(" ")}
            >
              {tx === "vente" ? (
                <TrendingDown className="h-3 w-3" />
              ) : (
                <TrendingUp className="h-3 w-3" />
              )}
              {projectTypeDisplay(tx)}
            </Badge>

            {canShare && (
              <button
                type="button"
                onClick={handleShareClick}
                title="Partager ce projet"
                aria-label="Partager ce projet"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
              >
                <Share2 className="h-4 w-4" />
              </button>
            )}

            <Dialog open={openShare} onOpenChange={setOpenShare}>
              <DialogTrigger asChild>
                <span className="hidden" />
              </DialogTrigger>
              <DialogContent className="sm:max-w-[520px]">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">Partager ce projet</h3>
                    <p className="text-sm text-slate-500">
                      Choisissez comment partager ce projet immobilier.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={shareUrl}
                      className="flex-1 rounded-md border bg-slate-100 px-3 py-2 text-sm"
                    />
                    <Button variant="outline" size="icon" onClick={copyLink} title="Copier le lien">
                      {copied ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Button asChild variant="outline">
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        WhatsApp
                      </a>
                    </Button>

                    <Button asChild variant="outline">
                      <a
                        href={`mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(
                          `${shareText}\n${shareUrl}`
                        )}`}
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Email
                      </a>
                    </Button>

                    <Button asChild variant="outline">
                      <a
                        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Linkedin className="mr-2 h-4 w-4" />
                        LinkedIn
                      </a>
                    </Button>

                    <Button asChild variant="outline">
                      <a
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Facebook className="mr-2 h-4 w-4" />
                        Facebook
                      </a>
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {project.delai && (
          <div className="flex justify-end">
            <span className="text-[10px] sm:text-[11px] text-slate-500 italic">
              Délai : {project.delai}
            </span>
          </div>
        )}
      </CardHeader>

      {/* CONTENT */}
      <CardContent className={compact ? "p-3 space-y-3 flex-grow text-sm" : "p-3 sm:p-4 space-y-3 flex-grow text-xs sm:text-sm"}>
        {images.length > 0 && !compact && (
          <div className="mb-1.5">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {images.map((src, idx) => (
                <Dialog key={idx}>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="relative aspect-video rounded-md overflow-hidden border border-slate-100 bg-slate-100 w-full hover:opacity-90 transition-opacity"
                    >
                      <img
                        src={src}
                        alt={`Projet ${idx + 1}`}
                        className="object-cover w-full h-full"
                        loading="lazy"
                        decoding="async"
                        width="320"
                        height="180"
                      />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-black/90 border-none">
                    <img
                      src={src}
                      alt={`Agrandissement ${idx + 1}`}
                      className="w-full h-auto max-h-[85vh] object-contain mx-auto"
                      loading="lazy"
                      decoding="async"
                    />
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          </div>
        )}

        {(priceValue || surfaceLabel || bedroomsLabel) && (
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:text-xs text-slate-700">
            {priceValue && (
              <span className="inline-flex items-center gap-1 font-semibold">
                <Euro className="h-3.5 w-3.5 text-amber-600" />
                {priceValue}
              </span>
            )}

            {surfaceLabel && (
              <span className="inline-flex items-center gap-1">
                <Home className="h-3.5 w-3.5 text-slate-400" />
                {surfaceLabel}
              </span>
            )}

            {bedroomsLabel && (
              <span className="inline-flex items-center gap-1">
                <BedDouble className="h-3.5 w-3.5 text-slate-400" />
                {bedroomsLabel}
              </span>
            )}
          </div>
        )}

        {(project.energy_consumption || project.co2_emission) && !compact && (
          <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] sm:text-xs border-t border-dashed border-slate-100 pt-2">
            <DPEBadge label="Consommation énergétique" value={project.energy_consumption} type="consumption" />
            <DPEBadge label="Émissions de gaz à effet de serre" value={project.co2_emission} type="emission" />
          </div>
        )}

        {projectCriteria.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-dashed border-slate-100 pt-2">
            <div className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-slate-700">
              <ThumbsUp className="h-3.5 w-3.5" />
              <span>Critères</span>
            </div>
            {projectCriteria.slice(0, compact ? 4 : projectCriteria.length).map((c) => (
              <Badge
                key={c.id}
                variant="outline"
                className="text-[10px] font-normal bg-slate-50 text-slate-700 border-slate-200"
              >
                {c.label}
              </Badge>
            ))}
          </div>
        )}

        {adLink && !compact && (
          <div className="pt-1">
            <a
              href={adLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-blue-600 hover:text-blue-700 hover:underline font-medium"
            >
              <ExternalLink className="h-3 w-3" />
              Voir l&apos;annonce
            </a>
          </div>
        )}

        {descriptionText && !compact && (
          <Accordion type="single" collapsible className="w-full mt-1">
            <AccordionItem value="description" className="border-none">
              <div className="flex justify-end">
                <AccordionTrigger className="w-auto gap-1 rounded-full px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-100">
                  <Info className="h-4 w-4" />
                  <span>Description</span>
                </AccordionTrigger>
              </div>

              <AccordionContent className="px-0 pt-2 pb-1 text-xs text-slate-700">
                <p className="text-[11px] sm:text-[13px] leading-relaxed whitespace-pre-line">
                  {descriptionText}
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>

      {!hideFooterCta && (
        <CardFooter className="px-3 py-2.5 sm:px-4 sm:py-3 bg-slate-50/70 border-t border-slate-100">
          {isOwner && !hideOwnership ? (
            <Button variant="outline" disabled className="w-full opacity-70 text-xs sm:text-sm">
              C&apos;est votre projet
            </Button>
          ) : isConnected ? (
            <Button
              variant="outline"
              disabled
              className="w-full bg-emerald-50 border-emerald-200 text-emerald-700 opacity-100 text-xs sm:text-sm"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Déjà connecté
            </Button>
          ) : hasRequested ? (
            <Button
              variant="outline"
              disabled
              className="w-full bg-amber-50 border-amber-200 text-amber-700 opacity-100 text-xs sm:text-sm"
            >
              <Send className="mr-2 h-4 w-4" />
              Demande envoyée
            </Button>
          ) : (
            <Button
              onClick={handleContactClick}
              className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white shadow-sm transition-all hover:shadow-md text-sm sm:text-base"
            >
              <Send className="mr-2 h-4 w-4" />
              Contacter
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default ProjectCard;