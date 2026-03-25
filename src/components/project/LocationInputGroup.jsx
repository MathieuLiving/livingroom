import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X, Plus } from 'lucide-react';
import CityAutocomplete from './CityAutocomplete'; // Assuming this exists or needs to be created/imported
import NeighborhoodAutocomplete from './NeighborhoodAutocomplete'; // Assuming this exists

const LocationInputGroup = ({
  locations,
  onChange,
  onAdd,
  onRemove,
  maxLocations = 5,
  showLabels = true
}) => {
  
  const updateLocation = (index, updates) => {
    const newLocations = [...locations];
    newLocations[index] = { ...newLocations[index], ...updates };
    onChange(newLocations);
  };

  return (
    <div className="space-y-4">
      {showLabels && (
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Localisation(s)</Label>
          {locations.length < maxLocations && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAdd}
              className="gap-2"
            >
              <Plus className="h-4 w-4" /> Ajouter
            </Button>
          )}
        </div>
      )}

      {locations.map((loc, index) => (
        <div key={loc.id || index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-3 border rounded-lg bg-gray-50/50">
          
          {/* Ville */}
          <div className="md:col-span-5 w-full">
            <Label className="text-xs text-gray-500 mb-1 block">Ville {index + 1}</Label>
            <CityAutocomplete
              value={loc.city}
              onSelect={(cityData) => {
                updateLocation(index, {
                  city: cityData.name,
                  ville_uid: cityData.uid,
                  // Reset quartier on city change
                  quartier: '',
                  quartier_uid: null
                });
              }}
              placeholder="Ex: Paris"
            />
          </div>

          {/* Quartier */}
          <div className="md:col-span-5 w-full">
            <Label className="text-xs text-gray-500 mb-1 block">Quartier (optionnel)</Label>
            <NeighborhoodAutocomplete
              cityUid={loc.ville_uid}
              value={loc.quartier}
              onSelect={(qData) => {
                updateLocation(index, {
                  quartier: qData.name,
                  quartier_uid: qData.uid
                });
              }}
              disabled={!loc.ville_uid}
              placeholder={loc.ville_uid ? "Ex: Le Marais" : "Sélectionnez une ville d'abord"}
            />
          </div>

          {/* Remove Button */}
          <div className="md:col-span-2 flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onRemove(index)}
              disabled={locations.length === 1}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              title="Supprimer cette localisation"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

LocationInputGroup.propTypes = {
  locations: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  maxLocations: PropTypes.number,
  showLabels: PropTypes.bool
};

export default LocationInputGroup;