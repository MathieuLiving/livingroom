import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Euro, Home, BedDouble, Calendar } from 'lucide-react';

// Helper to format currency
const formatCurrency = (value) => {
  if (!value) return "N/C";
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
};

const ProjectVignette = ({ project }) => {
  if (!project) return null;

  const isBuying = project.type_projet === 'achat';
  const typeLabel = isBuying ? 'Achat' : 'Vente';
  const priceLabel = isBuying ? 'Budget max' : 'Prix demandé';
  const priceValue = isBuying ? project.budget_max : project.prix_demande;
  
  // Location display logic handling multiple potential location fields from different data sources (views/tables)
  const location = project.location_label 
    || project.city_choice_1 
    || project.city 
    || (project.locations && project.locations.length > 0 ? project.locations[0].city : null)
    || "Localisation inconnue";

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow border-slate-200">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-semibold text-brand-blue line-clamp-1" title={project.title || project.project_title}>
            {project.title || project.project_title || "Projet sans titre"}
          </h4>
          <Badge variant={isBuying ? "default" : "secondary"} className="ml-2 shrink-0">
            {typeLabel}
          </Badge>
        </div>

        <div className="space-y-1.5 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <Home className="h-3.5 w-3.5 text-slate-400" />
            <span className="capitalize">{project.type_bien || project.property_type || "Type inconnu"}</span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            <span className="line-clamp-1">{location}</span>
          </div>

          <div className="flex items-center gap-2">
            <Euro className="h-3.5 w-3.5 text-slate-400" />
            <span>{priceLabel}: <strong>{formatCurrency(priceValue)}</strong></span>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
             {project.surface && (
                <span className="flex items-center gap-1">
                   <span className="font-medium">{project.surface}</span> m²
                </span>
             )}
             {(project.bedrooms || project.bedrooms_min) && (
                <span className="flex items-center gap-1">
                   <BedDouble className="h-3 w-3" /> 
                   {project.bedrooms || project.bedrooms_min} ch.
                </span>
             )}
             {project.delai && (
                <span className="flex items-center gap-1 ml-auto">
                   <Calendar className="h-3 w-3" /> {project.delai}
                </span>
             )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectVignette;