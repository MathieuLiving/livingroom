import React from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, PlusCircle, XCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const LocationSection = ({ formData, setFormData, locationHook }) => {
    const { toast } = useToast();
    const safeLocations = Array.isArray(formData.locations) ? formData.locations : [];

    const {
        citySuggestions,
        activeLocationIndex,
        handleLocationInputChange,
        handleCitySelect,
    } = locationHook;
    
    const addLocation = () => {
        if (safeLocations.length < 5) {
            setFormData(prev => ({
                ...prev,
                locations: [...safeLocations, { id: Date.now(), city: '', quartier: '', department: '', region: '' }]
            }));
        } else {
            toast({ variant: "default", title: "Limite atteinte", description: "Vous ne pouvez ajouter que 5 localisations." });
        }
    };

    const removeLocation = (id) => {
        if (safeLocations.length > 1) {
            setFormData(prev => ({ ...prev, locations: safeLocations.filter(loc => loc.id !== id) }));
        } else {
            toast({ variant: "destructive", title: "Action impossible", description: "Vous devez spécifier au moins une localisation." });
        }
    };
    
    return (
        <div className="space-y-3">
            <Label className="flex items-center text-gray-700 font-medium"><MapPin className="mr-2 h-5 w-5 text-brand-blue" />Localisation(s) *</Label>
            {safeLocations.map((loc, index) => (
              <div key={loc.id} className="relative p-4 border rounded-lg space-y-4 bg-gray-50/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Label htmlFor={`city-${loc.id}`}>Ville*</Label>
                    <Input
                      id={`city-${loc.id}`}
                      value={loc.city || ''}
                      onChange={(e) => handleLocationInputChange(index, 'city', e.target.value)}
                      placeholder="ex: Paris"
                      autoComplete="off"
                    />
                    {activeLocationIndex === index && citySuggestions.length > 0 && (
                      <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-48 overflow-y-auto">
                        {citySuggestions.map((suggestion, i) => (
                          <li
                            key={i}
                            onClick={() => handleCitySelect(index, suggestion)}
                            className="p-2 hover:bg-gray-100 cursor-pointer"
                          >
                            {suggestion.city} ({suggestion.department})
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <Label htmlFor={`quartier-${loc.id}`}>Quartier</Label>
                    <Input
                      id={`quartier-${loc.id}`}
                      value={loc.quartier || ''}
                      onChange={(e) => handleLocationInputChange(index, 'quartier', e.target.value)}
                      placeholder="ex: Le Marais (optionnel)"
                    />
                  </div>
                </div>

                {safeLocations.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeLocation(loc.id)} className="absolute top-1 right-1 h-6 w-6 text-red-500 hover:bg-red-100">
                    <XCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {safeLocations.length < 5 && (
                <Button type="button" variant="outline" onClick={addLocation} className="w-full border-brand-orange text-brand-orange hover:bg-orange-50">
                    <PlusCircle className="mr-2 h-4 w-4" /> Ajouter une localisation
                </Button>
            )}
        </div>
    );
};

export default LocationSection;