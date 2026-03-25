import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Search } from 'lucide-react';

const propertyTypes = [
  { value: "appartement", label: "Appartement" },
  { value: "maison_villa", label: "Maison / Villa" },
  { value: "loft_atelier_surface", label: "Loft / Atelier / Surface" },
  { value: "parking_box", label: "Parking / Box" },
  { value: "terrain", label: "Terrain" },
  { value: "autre", label: "Autre" },
];

const projectTypes = [
  { value: "achat", label: "Achat" },
  { value: "vente", label: "Vente" },
];

// IMPORTANT: valeurs alignées avec ProjectsBoard: 'particulier' | 'professionnel'
const sourceTypes = [
  { value: "particulier", label: "Particulier" },
  { value: "professionnel", label: "Professionnel" },
];

const MarketplaceFilters = ({ filters, onFilterChange, showSourceFilter = false }) => {
  const handleInputChange = (e) => {
    onFilterChange({ ...(filters || {}), searchTerm: e.target.value });
  };

  const handleSelectChange = (name, value) => {
    onFilterChange({ ...(filters || {}), [name]: value });
  };

  return (
    <Card className="mb-8 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Filter className="mr-2 h-5 w-5 text-brand-blue" />
          Filtrer les projets
        </CardTitle>
      </CardHeader>

      <CardContent
        className={`grid grid-cols-1 md:grid-cols-2 ${showSourceFilter ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}
      >
        {/* Recherche */}
        <div className="md:col-span-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Rechercher (ville, quartier, titre)…"
            aria-label="Rechercher un projet"
            value={filters?.searchTerm || ''}
            onChange={handleInputChange}
            className="pl-10"
          />
        </div>

        {/* Type de projet */}
        <Select
          value={filters?.projectType || 'all'}
          onValueChange={(value) => handleSelectChange('projectType', value)}
        >
          <SelectTrigger aria-label="Filtrer par type de projet">
            <SelectValue placeholder="Type de projet" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les projets</SelectItem>
            {projectTypes.map((pt) => (
              <SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Type de bien */}
        <Select
          value={filters?.propertyType || 'all'}
          onValueChange={(value) => handleSelectChange('propertyType', value)}
        >
          <SelectTrigger aria-label="Filtrer par type de bien">
            <SelectValue placeholder="Type de bien" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types de biens</SelectItem>
            {propertyTypes.map((pt) => (
              <SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Origine (Particulier / Professionnel) */}
        {showSourceFilter && (
          <Select
            value={filters?.sourceType || 'all'}
            onValueChange={(value) => handleSelectChange('sourceType', value)}
          >
            <SelectTrigger aria-label="Filtrer par origine">
              <SelectValue placeholder="Particuliers & Professionnels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Particuliers et Professionnels</SelectItem>
              {sourceTypes.map((st) => (
                <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </CardContent>
    </Card>
  );
};

export default MarketplaceFilters;