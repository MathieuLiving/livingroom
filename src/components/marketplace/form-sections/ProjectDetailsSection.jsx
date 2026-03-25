import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Euro, Home, BedDouble } from "lucide-react";
import { validateSelectValue } from "@/lib/utils.jsx";

const propertyTypes = [ 
    { value: "appartement", label: "Appartement" },
    { value: "maison_villa", label: "Maison / Villa" },
    { value: "loft_atelier_surface", label: "Loft / Atelier / Surface" },
    { value: "parking_box", label: "Parking / Box" },
    { value: "terrain", label: "Terrain" },
    { value: "autre", label: "Autre" },
];

const ProjectDetailsSection = ({ formData, handleSelectChange, handleChange }) => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="typeProjet">Type de projet *</Label>
                    <Select name="typeProjet" onValueChange={(value) => handleSelectChange("typeProjet", value)} value={validateSelectValue(formData.typeProjet)}>
                        <SelectTrigger><SelectValue placeholder="Sélectionnez..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="achat">Achat</SelectItem>
                            <SelectItem value="vente">Vente</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="typeBien">Type de bien *</Label>
                    <Select name="typeBien" onValueChange={(value) => handleSelectChange("typeBien", value)} value={validateSelectValue(formData.typeBien)}>
                        <SelectTrigger><SelectValue placeholder="Sélectionnez..." /></SelectTrigger>
                        <SelectContent>
                            {propertyTypes.map(pt => <SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {formData.typeProjet === 'achat' && (
                <>
                    <div className="space-y-1.5">
                        <Label htmlFor="budget_max" className="flex items-center"><Euro className="mr-2 h-4 w-4 text-gray-500" />Budget maximum *</Label>
                        <Input id="budget_max" name="budget_max" type="number" value={formData.budget_max || ''} onChange={handleChange} placeholder="Ex: 500000" required />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="surface_min" className="flex items-center"><Home className="mr-2 h-4 w-4 text-gray-500" />Superficie min (m²)</Label>
                            <Input id="surface_min" name="surface_min" type="number" value={formData.surface_min || ''} onChange={handleChange} placeholder="Ex: 70" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="surface_max" className="flex items-center"><Home className="mr-2 h-4 w-4 text-gray-500" />Superficie max (m²)</Label>
                            <Input id="surface_max" name="surface_max" type="number" value={formData.surface_max || ''} onChange={handleChange} placeholder="Ex: 100" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="bedrooms_min" className="flex items-center"><BedDouble className="mr-2 h-4 w-4 text-gray-500" />Chambres minimum</Label>
                        <Input id="bedrooms_min" name="bedrooms_min" type="number" value={formData.bedrooms_min || ''} onChange={handleChange} placeholder="Ex: 2" />
                    </div>
                </>
            )}

            {formData.typeProjet === 'vente' && (
                <>
                 <div className="space-y-1.5">
                    <Label htmlFor="prix_demande" className="flex items-center"><Euro className="mr-2 h-4 w-4 text-gray-500" />Prix demandé</Label>
                    <Input id="prix_demande" name="prix_demande" type="number" value={formData.prix_demande || ''} onChange={handleChange} placeholder="Ex: 450000" />
                 </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="surface" className="flex items-center"><Home className="mr-2 h-4 w-4 text-gray-500" />Superficie (m²)</Label>
                        <Input id="surface" name="surface" type="number" value={formData.surface || ''} onChange={handleChange} placeholder="Ex: 85" />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="bedrooms" className="flex items-center"><BedDouble className="mr-2 h-4 w-4 text-gray-500" />Nombre de chambres</Label>
                        <Input id="bedrooms" name="bedrooms" type="number" value={formData.bedrooms || ''} onChange={handleChange} placeholder="Ex: 3" />
                    </div>
                </div>
                </>
            )}
        </div>
    );
};

export default ProjectDetailsSection;