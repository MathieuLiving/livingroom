import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

import {
  MapPin,
  Euro,
  Ruler,
  Image as ImageIcon,
  Trees,
  Sun,
  Waves,
  Boxes,
  ParkingSquare,
  Shield,
  Eye,
  Building2,
  ArrowUpDown,
  PanelTop,
} from "lucide-react";

const nf = new Intl.NumberFormat("fr-FR");

function parseSnapshot(snap) {
  if (!snap) return null;
  try {
    if (typeof snap === "string") return JSON.parse(snap);
    if (typeof snap === "object") return snap;
  } catch { }
  return null;
}

/**
 * Lit les champs avec priorité:
 * 1) snapshot
 * 2) ui_* (vue enrichie)
 * 3) p_* (vue enrichie)
 */
function getValue(connection, keys = []) {
  const snap = parseSnapshot(connection?.project_snapshot) || connection?.project_snapshot || {};
  for (const key of keys) {
    if (snap && snap[key] != null && snap[key] !== "") return snap[key];

    const uiKey = `ui_${key}`;
    if (connection?.[uiKey] != null && connection?.[uiKey] !== "") return connection[uiKey];

    const pKey = `p_${key}`;
    if (connection?.[pKey] != null && connection?.[pKey] !== "") return connection[pKey];
  }
  return null;
}

export default function ProjectDetailsModal({ open, onOpenChange, connection }) {
  const typeProjet = getValue(connection, ["type_projet", "project_type"]);
  const typeBien = getValue(connection, ["type_bien", "property_type"]);
  const prixDemande = getValue(connection, ["prix_demande", "budget", "budget_max"]);
  const surface = getValue(connection, ["surface", "surface_max"]);
  const city = getValue(connection, ["city", "location", "ui_location"]);
  const quartier = getValue(connection, ["quartier", "ui_quartier"]);
  const description = getValue(connection, ["description", "ui_description"]);

  const features = [
    { key: "has_garden", label: "Jardin", Icon: Trees },
    { key: "has_terrace", label: "Terrasse", Icon: Sun },
    { key: "has_balcony", label: "Balcon", Icon: PanelTop },
    { key: "has_pool", label: "Piscine", Icon: Waves },
    { key: "has_elevator", label: "Ascenseur", Icon: ArrowUpDown },
    { key: "has_cellar", label: "Cave", Icon: Boxes },
    { key: "has_parking", label: "Parking", Icon: ParkingSquare },
    { key: "has_caretaker", label: "Gardien", Icon: Shield },
    { key: "has_clear_view", label: "Vue dégagée", Icon: Eye },
    { key: "is_last_floor", label: "Dernier étage", Icon: Building2 },
  ];

  const activeFeatures = features.filter(({ key }) => {
    const val = getValue(connection, [key]);
    return val === true || val === "true" || val === 1 || val === "1";
  });

  const photos = [
    getValue(connection, ["image_1_url"]),
    getValue(connection, ["image_2_url"]),
    getValue(connection, ["image_3_url"]),
  ].filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Détails du projet</DialogTitle>
          <DialogDescription>
            Informations détaillées sur le projet lié à cette connexion.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2 mb-4">
          {typeProjet && (
            <Badge variant="secondary" className="capitalize">
              {typeProjet}
            </Badge>
          )}
          {typeBien && (
            <Badge variant="outline" className="capitalize">
              {typeBien}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {prixDemande && (
            <div className="flex items-center text-sm">
              <Euro className="h-4 w-4 mr-2" />
              Prix demandé :{" "}
              <strong className="ml-1">{nf.format(Number(prixDemande))} €</strong>
            </div>
          )}

          {surface && (
            <div className="flex items-center text-sm">
              <Ruler className="h-4 w-4 mr-2" />
              Surface : <strong className="ml-1">{surface} m²</strong>
            </div>
          )}

          {(city || quartier) && (
            <div className="flex items-center text-sm col-span-2">
              <MapPin className="h-4 w-4 mr-2" />
              {city || "Localisation"}
              {quartier ? ` — ${quartier}` : ""}
            </div>
          )}
        </div>

        {description && (
          <div className="mb-6">
            <div className="text-sm font-medium mb-1">Description :</div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{description}</p>
          </div>
        )}

        <div className="mb-6">
          <div className="text-sm font-medium mb-2">Caractéristiques :</div>
          {activeFeatures.length > 0 ? (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activeFeatures.map(({ key, label, Icon }) => (
                <li key={key} className="flex items-center text-sm text-foreground">
                  <Icon className="h-4 w-4 mr-2" />
                  {label}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-xs text-muted-foreground">Aucune caractéristique indiquée.</div>
          )}
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm font-medium mb-2">
            <ImageIcon className="h-4 w-4" /> Photos
          </div>

          {photos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((url, i) => (
                <div key={i} className="aspect-video overflow-hidden rounded-lg border bg-muted">
                  <img
                    src={url}
                    alt={`Photo projet ${i + 1}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">Aucune photo disponible.</div>
          )}
        </div>

        {!description && activeFeatures.length === 0 && photos.length === 0 && (
          <div className="mt-4">
            <div className="text-sm font-medium">Critères :</div>
            <div className="text-sm text-muted-foreground">Aucun critère spécifique mentionné.</div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}