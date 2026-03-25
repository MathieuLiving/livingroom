import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Camera, XCircle, Image as ImageIcon } from "lucide-react";

const PhotoSection = ({ photos, previews, handlePhotoChange, removePhoto }) => {
    if (photos === null || photos === undefined) {
        return null; 
    }

    return (
        <div className="space-y-3 pt-4 border-t">
            <Label className="flex items-center text-gray-700 font-medium"><Camera className="mr-2 h-5 w-5 text-brand-blue" />Photos (max 3)</Label>
            <div className="grid grid-cols-3 gap-4">
                {previews.map((preview, index) => (
                    <div key={index} className="relative">
                        <img src={preview} alt={`Aperçu ${index + 1}`} className="w-full h-24 object-cover rounded-md border" />
                        <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => removePhoto(index)}>
                            <XCircle className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                {photos.length < 3 && (
                    <Label htmlFor="photo-upload" className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-md cursor-pointer hover:bg-gray-50">
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                        <span className="text-xs text-gray-500 mt-1">Ajouter</span>
                    </Label>
                )}
            </div>
            <Input id="photo-upload" type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} className="hidden" disabled={photos.length >= 3} />
        </div>
    );
};

export default PhotoSection;