import React from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Home,
  Euro,
  Bed,
  Edit,
  Copy,
  Pause,
  Play,
  Trash2,
  Trees,
  Sun,
  Square,
  Waves,
  ArrowUpDown,
  Package,
  Car,
  Shield,
  Eye,
  Building2,
  Circle,
  CalendarDays,
  Search,
} from "lucide-react";

const DashboardProjectCard = ({
  project,
  type,
  onEdit,
  onDuplicate,
  onToggleStatus,
  onDelete,
  connectionStatus,
  connectionCount = 0,
  pendingCount = 0,
  approvedCount = 0,
}) => {
  const isPurchase = type === "achat";
  const isSuspended = project.status === "suspended";

  const statusLabel =
    project.status === "suspended"
      ? "Suspendu"
      : project.status === "pending_match"
        ? "En recherche"
        : "Actif";

  const city =
    project.city_choice_1 ||
    project.city ||
    project.ville ||
    "Localisation non précisée";

  const delay = project.delai || "Tout de suite";

  const title =
    project.title ||
    project.project_title ||
    project.titre ||
    (isPurchase ? "Recherche immobilière" : "Projet de vente");

  const propertyType = project.type_bien || "Appartement";

  const rawDate =
    project.created_at ||
    project.date_creation ||
    project.inserted_at ||
    project.updated_at;

  const formattedDate = rawDate
    ? new Date(rawDate).toLocaleDateString("fr-FR")
    : null;

  const priceValue = isPurchase
    ? project.budget_max
    : project.prix_demande || project.price;

  const surfaceValue = isPurchase
    ? [project.surface_min, project.surface_max].some((v) => v != null && v !== "")
      ? project.surface_min && project.surface_max
        ? `${project.surface_min} – ${project.surface_max} m²`
        : `≥ ${project.surface_min || project.surface_max} m²`
      : "Non précisée"
    : project.surface
      ? `${project.surface} m²`
      : "Non précisée";

  const bedroomValue = isPurchase
    ? (project.bedrooms_min ?? project.chambres_min) != null
      ? `${project.bedrooms_min ?? project.chambres_min}+ ch`
      : "Non précisé"
    : (project.bedrooms ?? project.chambres) != null
      ? `${project.bedrooms ?? project.chambres} ch`
      : "Non précisé";

  const priceLabel = isPurchase ? "Budget" : "Prix";
  const priceDisplay =
    priceValue != null
      ? `${Number(priceValue).toLocaleString("fr-FR")} €`
      : "Non précisé";

  const featureDefs = [
    { key: "has_garden", label: "Jardin", Icon: Trees },
    { key: "has_terrace", label: "Terrasse", Icon: Sun },
    { key: "has_balcony", label: "Balcon", Icon: Square },
    { key: "has_pool", label: "Piscine", Icon: Waves },
    { key: "has_elevator", label: "Ascenseur", Icon: ArrowUpDown },
    { key: "has_cellar", label: "Cave", Icon: Package },
    { key: "has_parking", label: "Parking", Icon: Car },
    { key: "has_caretaker", label: "Gardien", Icon: Shield },
    { key: "has_clear_view", label: "Vue dégagée", Icon: Eye },
  ];

  const enabledFeatures = featureDefs.filter((f) => !!project?.[f.key]);
  const isLastFloor = !!project?.is_last_floor;

  const images = [
    project.image_1_url,
    project.image_2_url,
    project.image_3_url,
  ].filter(Boolean);

  const description = project.description || "";

  const renderConnectionBadge = () => {
    if (!connectionCount) return null;

    if (approvedCount > 0) {
      return (
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
          <Circle className="h-3 w-3 fill-current text-emerald-500" />
          {approvedCount === 1
            ? "1 mise en relation approuvée"
            : `${approvedCount} mises en relation approuvées`}
        </div>
      );
    }

    if (pendingCount > 0 || connectionStatus === "pending") {
      return (
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700">
          <Circle className="h-3 w-3 fill-current text-amber-500" />
          {pendingCount <= 1 ? "1 demande reçue" : `${pendingCount} demandes reçues`}
        </div>
      );
    }

    return null;
  };

  const statItems = [
    {
      icon: Euro,
      value: priceDisplay,
      highlight: true,
      label: priceLabel,
    },
    {
      icon: Home,
      value: surfaceValue,
      label: "Surface",
    },
    {
      icon: Bed,
      value: bedroomValue,
      label: isPurchase ? "Chambres min" : "Chambres",
    },
  ];

  return (
    <Card className="h-full overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="space-y-4 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold uppercase tracking-wide text-slate-700">
              {isPurchase ? "Recherche" : "Vente"}
            </div>
            <span className="text-3xl leading-none text-slate-300">·</span>
            <Badge
              variant="outline"
              className="rounded-full border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700"
            >
              {propertyType}
            </Badge>
          </div>

          <Badge
            className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${
              isSuspended
                ? "border border-slate-200 bg-slate-100 text-slate-600"
                : "border border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {isSuspended ? (
              <>
                <Pause className="mr-1 h-3.5 w-3.5" />
                {statusLabel}
              </>
            ) : (
              <>
                <Circle className="mr-1 h-3.5 w-3.5 fill-current" />
                {statusLabel}
              </>
            )}
          </Badge>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white">
          <div className="p-5 sm:p-6">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-slate-500">
              {formattedDate && (
                <>
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4" />
                    <span>{formattedDate}</span>
                  </div>
                  <span>•</span>
                </>
              )}

              <Badge
                variant="outline"
                className="rounded-full border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-600"
              >
                {propertyType}
              </Badge>

              {isPurchase && (
                <div className="ml-auto inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
                  <Search className="h-4 w-4" />
                  Recherche
                </div>
              )}
            </div>

            <h3 className="line-clamp-2 text-2xl font-semibold leading-tight text-slate-900">
              {title}
            </h3>

            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-slate-600">
              <div className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span>{city}</span>
              </div>

              <div className="ml-auto text-right text-base italic text-slate-500">
                Délai : {delay}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              {statItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-base text-slate-700"
                >
                  <item.icon
                    className={`h-5 w-5 ${item.highlight ? "text-orange-500" : "text-slate-400"}`}
                  />
                  <span className={item.highlight ? "font-semibold" : "font-medium"}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            {(enabledFeatures.length > 0 || isLastFloor) && (
              <div className="mt-4 border-t border-dashed border-slate-200 pt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mr-1 text-sm font-semibold text-slate-700">
                    Critères
                  </span>

                  {enabledFeatures.map(({ key, label }) => (
                    <Badge
                      key={key}
                      variant="outline"
                      className="rounded-full border-slate-200 bg-white px-3 py-1 text-sm font-normal text-slate-700"
                    >
                      {label}
                    </Badge>
                  ))}

                  {isLastFloor && (
                    <Badge
                      variant="outline"
                      className="rounded-full border-slate-200 bg-white px-3 py-1 text-sm font-normal text-slate-700"
                    >
                      Dernier étage
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {type === "vente" && images.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {images.map((src, i) => (
              <div
                key={i}
                className="aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
              >
                <img
                  src={src}
                  alt={`photo ${i + 1}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}

        {description && (
          <p className="text-sm leading-6 text-slate-600 line-clamp-3">
            {description}
          </p>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {renderConnectionBadge()}
      </CardContent>

      <CardFooter className="flex-col items-start gap-3 border-t border-slate-100 pt-5">
        <div className="grid w-full grid-cols-2 gap-3 lg:grid-cols-4">
          <Button
            variant="outline"
            className="h-12 rounded-2xl border-slate-200 text-base font-semibold"
            onClick={() => onEdit?.(project, type)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Éditer
          </Button>

          <Button
            variant="outline"
            className="h-12 rounded-2xl border-slate-200 text-base font-semibold"
            onClick={() => onDuplicate?.(project, type)}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copier
          </Button>

          <Button
            variant="outline"
            className="h-12 rounded-2xl border-slate-200 text-base font-semibold"
            onClick={() => onToggleStatus?.(project, type)}
          >
            {isSuspended ? (
              <>
                <Play className="mr-2 h-4 w-4" />
                Réactiver
              </>
            ) : (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Suspendre
              </>
            )}
          </Button>

          <Button
            variant="destructive"
            className="h-12 rounded-2xl text-base font-semibold"
            onClick={() => onDelete?.(project, type)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default DashboardProjectCard;