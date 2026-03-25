import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Calendar, Eye, User, Tv } from "lucide-react";
import { validateSelectValue } from "@/lib/utils.jsx";

const SubmissionSection = ({ formData, handleChange, handleSelectChange, handleVisibilityChange }) => {
    const visibilityOptions = [
        { id: 'public', label: 'Place des projets (visible par les particuliers et les professionnels)', icon: <User className="mr-2 h-4 w-4 text-green-600"/> },
        { id: 'inter_agent', label: 'Marché inter-pro (visible uniquement par les autres professionnels)', icon: <User className="mr-2 h-4 w-4 text-blue-600"/> },
        { id: 'showcase', label: 'Présenter avec ma carte de visite digitale', icon: <Tv className="mr-2 h-4 w-4 text-orange-500"/> },
    ];
    
    return (
        <div className="space-y-6 pt-6 border-t">
            <div className="space-y-1.5">
                <Label htmlFor="configuration" className="flex items-center"><Settings className="mr-2 h-4 w-4 text-gray-500" />Description libre</Label>
                <Textarea id="configuration" name="configuration" value={formData?.configuration || ''} onChange={handleChange} placeholder="Ex: Idéal investisseur, fort potentiel..." rows={3} />
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="delai" className="flex items-center"><Calendar className="mr-2 h-4 w-4 text-gray-500" />Délai souhaité *</Label>
                <Select name="delai" onValueChange={(value) => handleSelectChange("delai", value)} value={validateSelectValue(formData?.delai)}>
                    <SelectTrigger><SelectValue placeholder="Sélectionnez..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="<3 mois">Moins de 3 mois</SelectItem>
                        <SelectItem value="3-6 mois">3 à 6 mois</SelectItem>
                        <SelectItem value=">6 mois">Plus de 6 mois</SelectItem>
                        <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-3 pt-4 border-t">
                <Label className="flex items-center text-gray-700 font-medium"><Eye className="mr-2 h-5 w-5 text-brand-blue" />Visibilité du projet *</Label>
                <div className="space-y-2">
                    {visibilityOptions.map(option => (
                         <div key={option.id} className="flex items-center space-x-2">
                            <Checkbox 
                                id={`visibility_${option.id}`} 
                                checked={formData?.visibility?.includes(option.id) || false} 
                                onCheckedChange={() => handleVisibilityChange(option.id)} 
                            />
                            <Label htmlFor={`visibility_${option.id}`} className="font-normal cursor-pointer flex items-center">
                                {option.icon}{option.label}
                            </Label>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SubmissionSection;