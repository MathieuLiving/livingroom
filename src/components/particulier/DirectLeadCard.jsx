import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin, CalendarDays, Home, Euro, Maximize2, Bed,
  Trees, Sun, Square, Waves, ArrowUpDown, Package, Car, Shield, Eye, Building, ArrowUp
} from "lucide-react";

const InfoRow = ({ icon: Icon, label, value }) => {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
};

const DirectLeadCard = ({ lead }) => {
  const isAchat = lead.project_type === 'achat';
  const title = lead.project_title || (isAchat ? "Projet d'achat" : "Projet de vente");

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
    { key: "is_last_floor", label: "Dernier étage", Icon: Building },
  ];
  const enabledFeatures = featureDefs.filter(f => !!lead?.[f.key]);

  return (
    <Card className="h-full w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
            <CardTitle className="text-lg text-brand-blue">{title}</CardTitle>
            <Badge variant={isAchat ? 'default' : 'secondary'}>{isAchat ? 'Achat' : 'Vente'}</Badge>
        </div>
        <CardDescription>{new Date(lead.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <InfoRow icon={MapPin} label="Ville" value={lead.city_choice_1} />
        <InfoRow icon={CalendarDays} label="Délai" value={lead.delai} />
        <InfoRow icon={Home} label="Type de bien" value={lead.type_bien} />
        
        {isAchat ? (
          <>
            <InfoRow icon={Euro} label="Budget max" value={lead.budget_max ? `${lead.budget_max.toLocaleString('fr-FR')} €` : null} />
            <InfoRow icon={Maximize2} label="Surface min" value={lead.surface_min ? `${lead.surface_min} m²` : null} />
            <InfoRow icon={Bed} label="Chambres min" value={lead.bedrooms_min ? `${lead.bedrooms_min}` : null} />
          </>
        ) : (
          <>
            <InfoRow icon={Euro} label="Prix demandé" value={lead.prix_demande ? `${lead.prix_demande.toLocaleString('fr-FR')} €` : null} />
            <InfoRow icon={Maximize2} label="Surface" value={lead.surface ? `${lead.surface} m²` : null} />
          </>
        )}

        {enabledFeatures.length > 0 && (
          <div className="pt-2">
            <p className="text-sm font-medium mb-2">Caractéristiques :</p>
            <div className="flex flex-wrap gap-2">
              {enabledFeatures.map(({ key, label, Icon }) => (
                <Badge key={key} variant="outline" className="flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {lead.description && (
          <div className="pt-2">
            <p className="text-sm font-medium mb-1">Message / Description :</p>
            <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-md border">{lead.description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DirectLeadCard;