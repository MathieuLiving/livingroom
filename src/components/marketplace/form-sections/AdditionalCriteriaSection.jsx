import React from 'react';
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ThumbsUp } from "lucide-react";

const otherCriteria = [
    { id: 'has_garden', label: 'Jardin' },
    { id: 'has_terrace', label: 'Terrasse' },
    { id: 'has_balcony', label: 'Balcon' },
    { id: 'has_pool', label: 'Piscine' },
    { id: 'has_elevator', label: 'Ascenseur' },
    { id: 'has_cellar', label: 'Cave' },
    { id: 'has_parking', label: 'Parking' },
    { id: 'has_caretaker', label: 'Gardien' },
    { id: 'has_clear_view', label: 'Vue dégagée' },
    { id: 'is_last_floor', label: 'Dernier étage' },
];

const AdditionalCriteriaSection = ({ formData, handleCheckboxChange }) => {
    return (
        <div className="space-y-3">
            <Label className="flex items-center text-gray-700 font-medium"><ThumbsUp className="mr-2 h-5 w-5 text-brand-blue" />Autres critères</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {otherCriteria.map(criterion => (
                    <div key={criterion.id} className="flex items-center space-x-2">
                        <Checkbox 
                            id={`agent-${criterion.id}`} 
                            name={criterion.id} 
                            checked={!!formData[criterion.id]} 
                            onCheckedChange={(checked) => handleCheckboxChange(criterion.id, checked)} 
                        />
                        <Label htmlFor={`agent-${criterion.id}`} className="text-sm font-normal cursor-pointer">{criterion.label}</Label>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdditionalCriteriaSection;