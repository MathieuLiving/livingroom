import React, { memo, useCallback } from "react";
import {
  Briefcase,
  MapPin,
  TrendingDown,
  TrendingUp,
  Euro,
  Home,
  BedDouble,
  ExternalLink,
  Info,
  ThumbsUp,
  Mail,
  Phone,
  MessageSquare,
  Video,
  ArrowUpRight,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

/* ---------- Constants & Helpers ---------- */
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

const getVisioUrl = (pro) => pro?.appointment_url || null;

const makeMailto = (p, pro) => {
  const title = p.project_title || p.title || "Projet";
  const subject = `Demande au sujet de "${title}"`;
  const body = [
    "Bonjour,",
    `Je vous contacte au sujet du projet suivant : ${title}`,
    "",
    "Je vous remercie de me recontacter.",
    "",
    "Cordialement,",
  ].join("\n");
  const to = pro?.email || "";
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

/* ---------- DPE / GES Badge ---------- */
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
        className={`flex items-center justify-center w-7 h-7 rounded font-bold text-xs border shadow-sm ${colorClass}`}
      >
        {letter}
      </div>
      <span className="text-[10px] sm:text-xs text-slate-500 font-medium">
        {type === "consumption" ? "DPE" : "GES"}
      </span>
    </div>
  );
};

const ShowcaseProjectCard = memo(
  ({
    project,
    professional,
    onOpenProject,
    clickable = false,
    showOpenHint = false,
  }) => {
    const tx = (project.transaction_type || project.type_projet || "").toLowerCase();
    const SourceIcon = Briefcase;
    const sourceLabel = "Professionnel";

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
      project.images || [project.image_1_url, project.image_2_url, project.image_3_url].filter(Boolean)
    ).slice(0, 4);

    const createdAt = project.created_at
      ? new Date(project.created_at).toLocaleDateString("fr-FR")
      : null;

    const priceValue =
      tx === "achat"
        ? formatCurrency(project.budget_max)
        : formatCurrency(project.prix_demande);

    const title = project.project_title || project.title || "Projet sans titre";
    const descriptionText = project.configuration || project.description;

    let surfaceLabel = null;
    if (tx === "achat") {
      const min = project.surface_min;
      const max = project.surface_max;
      if (min && max) {
        surfaceLabel = `${min} – ${max} m²`;
      } else if (min && !max) {
        surfaceLabel = `≥ ${min} m²`;
      } else if (!min && max) {
        surfaceLabel = `≤ ${max} m²`;
      }
    } else if (project.surface) {
      surfaceLabel = `${project.surface} m²`;
    }

    let bedroomsLabel = null;
    if (tx === "achat") {
      const min = project.bedrooms_min;
      if (min) {
        bedroomsLabel = `${min}+ ch`;
      }
    } else if (project.bedrooms) {
      bedroomsLabel = `${project.bedrooms} ch`;
    }

    const adLink =
      project.property_ad_link ||
      project.pro_property_ad_link ||
      project.part_property_ad_link;
    const visioUrl = getVisioUrl(professional);

    const handleOpenProject = useCallback(() => {
      if (typeof onOpenProject === "function") {
        onOpenProject(project);
      }
    }, [onOpenProject, project]);

    const isProjectClickable = clickable && typeof onOpenProject === "function";

    const cardInteractiveProps = isProjectClickable
      ? {
          role: "button",
          tabIndex: 0,
          onClick: handleOpenProject,
          onKeyDown: (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleOpenProject();
            }
          },
        }
      : {};

    return (
      <Card
        {...cardInteractiveProps}
        className={[
          "overflow-hidden flex flex-col h-full",
          "border border-slate-200 rounded-2xl bg-white",
          "shadow-[0_2px_8px_rgba(15,23,42,0.04)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.08)]",
          "transition-shadow duration-200",
          isProjectClickable ? "cursor-pointer" : "",
        ].join(" ")}
      >
        {/* HEADER */}
        <CardHeader className="p-3 pb-2 sm:p-4 sm:pb-3 bg-slate-50/60 border-b border-slate-100">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] sm:text-xs text-slate-600">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-medium bg-blue-50 text-blue-700 border-blue-100">
                  <SourceIcon className="h-3 w-3" />
                  {sourceLabel}
                </span>

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

              <CardTitle className="text-sm sm:text-base font-semibold leading-tight text-slate-900">
                {title}
              </CardTitle>

              {locationDisplay && (
                <CardDescription className="mt-0.5 text-[11px] sm:text-xs text-slate-600 flex gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 mt-[2px]" />
                  <span className="leading-snug">{locationDisplay}</span>
                </CardDescription>
              )}

              {isProjectClickable && showOpenHint && (
                <div className="pt-1">
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                    Ouvrir le détail
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              )}
            </div>

            <div className="shrink-0 flex flex-row sm:flex-col items-end gap-1 sm:items-end sm:text-right">
              <Badge
                variant="outline"
                className={[
                  "inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] sm:text-xs border-transparent",
                  tx === "vente"
                    ? "bg-red-50 text-red-700"
                    : "bg-emerald-50 text-emerald-700",
                ].join(" ")}
              >
                {tx === "vente" ? (
                  <TrendingDown className="h-3 w-3" />
                ) : (
                  <TrendingUp className="h-3 w-3" />
                )}
                {projectTypeDisplay(tx)}
              </Badge>

              {project.delai && (
                <span className="text-[10px] sm:text-[11px] text-slate-500 italic">
                  Délai : {project.delai}
                </span>
              )}
            </div>
          </div>
        </CardHeader>

        {/* CONTENT */}
        <CardContent className="p-3 sm:p-4 space-y-3 flex-grow text-xs sm:text-sm">
          {images.length > 0 && (
            <div className="mb-1.5">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {images.map((src, idx) => (
                  <Dialog key={idx}>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        onClick={(e) => e.stopPropagation()}
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

          {(project.energy_consumption || project.co2_emission) && (
            <div className="flex items-center gap-3 pt-2 mt-2 border-t border-dashed border-slate-100">
              <DPEBadge
                label="Consommation énergétique"
                value={project.energy_consumption}
                type="consumption"
              />
              <DPEBadge
                label="Émissions de gaz à effet de serre"
                value={project.co2_emission}
                type="emission"
              />
            </div>
          )}

          {projectCriteria.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <div className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-slate-700">
                <ThumbsUp className="h-3.5 w-3.5" />
                <span>Critères</span>
              </div>
              {projectCriteria.map((c) => (
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

          {adLink && (
            <div className="pt-1">
              <a
                href={adLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-blue-600 hover:text-blue-700 hover:underline font-medium"
              >
                <ExternalLink className="h-3 w-3" />
                Voir l'annonce
              </a>
            </div>
          )}

          {descriptionText && (
            <Accordion type="single" collapsible className="w-full mt-1">
              <AccordionItem value="description" className="border-none">
                <div className="flex justify-end">
                  <AccordionTrigger
                    onClick={(e) => e.stopPropagation()}
                    className="w-auto gap-1 rounded-full px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-100"
                  >
                    <Info className="h-4 w-4" />
                    <span className="hidden sm:inline">Description</span>
                    <span className="sm:hidden">Description</span>
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

        {/* FOOTER Actions */}
        <CardFooter className="p-2 sm:p-3 bg-slate-50/70 border-t border-slate-100 grid grid-cols-4 gap-2">
          <Button
            variant="outline"
            asChild
            className="h-9 w-full px-0 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
            title="Envoyer un email"
            onClick={(e) => e.stopPropagation()}
          >
            <a href={makeMailto(project, professional)}>
              <Mail className="h-4 w-4" />
            </a>
          </Button>

          <Button
            variant="outline"
            asChild
            className="h-9 w-full px-0 hover:bg-green-50 hover:text-green-600 hover:border-green-200 disabled:opacity-50"
            title="Appeler"
            disabled={!professional?.phone}
            onClick={(e) => e.stopPropagation()}
          >
            <a href={professional?.phone ? `tel:${professional.phone}` : undefined}>
              <Phone className="h-4 w-4" />
            </a>
          </Button>

          <Button
            variant="outline"
            asChild
            className="h-9 w-full px-0 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 disabled:opacity-50"
            title="Envoyer un SMS"
            disabled={!professional?.phone}
            onClick={(e) => e.stopPropagation()}
          >
            <a href={professional?.phone ? `sms:${professional.phone}` : undefined}>
              <MessageSquare className="h-4 w-4" />
            </a>
          </Button>

          <Button
            variant="outline"
            asChild
            className="h-9 w-full px-0 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 disabled:opacity-50"
            title="Visioconférence"
            disabled={!visioUrl}
            onClick={(e) => e.stopPropagation()}
          >
            {visioUrl ? (
              <a href={visioUrl} target="_blank" rel="noopener noreferrer">
                <Video className="h-4 w-4" />
              </a>
            ) : (
              <span className="cursor-not-allowed opacity-50">
                <Video className="h-4 w-4" />
              </span>
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  }
);

ShowcaseProjectCard.displayName = "ShowcaseProjectCard";

export default ShowcaseProjectCard;