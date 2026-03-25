import React, { useState } from 'react';
import { supabase } from "../../../lib/customSupabaseClient";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Save, Link2, Linkedin, Facebook, Instagram, Youtube, Video } from "lucide-react";

export default function DirectorSocialLinksSection({ profile, setProfile, onRefetch }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    // Basic URL validation
    if (value && !value.startsWith('http')) {
      setErrors(prev => ({ ...prev, [field]: "L'URL doit commencer par http:// ou https://" }));
    } else {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleSave = async () => {
    const hasErrors = Object.values(errors).some(e => e !== null);
    if (hasErrors) {
      toast({ variant: "destructive", title: "Erreur", description: "Veuillez corriger les URLs invalides." });
      return;
    }

    setSaving(true);
    try {
      const updates = {
        linkedin_url: profile.linkedin_url,
        facebook_url: profile.facebook_url,
        instagram_url: profile.instagram_url,
        youtube_url: profile.youtube_url,
        tiktok_url: profile.tiktok_url,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('professionnels')
        .update(updates)
        .eq('id', profile.id);

      if (error) throw error;

      toast({ title: "Liens mis à jour", description: "Vos réseaux sociaux ont été enregistrés." });
      if (onRefetch) onRefetch();

    } catch (err) {
      console.error("Error saving socials:", err);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible d'enregistrer les liens." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-none shadow-none md:border md:shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Link2 className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <CardTitle className="text-xl">Réseaux Sociaux</CardTitle>
            <CardDescription>Ajoutez vos liens pour maximiser votre visibilité.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="linkedin" className="flex items-center gap-2">
              <Linkedin className="w-4 h-4 text-blue-600" /> LinkedIn
            </Label>
            <Input 
              id="linkedin" 
              value={profile.linkedin_url || ''} 
              onChange={e => handleChange('linkedin_url', e.target.value)} 
              placeholder="https://linkedin.com/in/..."
              className={errors.linkedin_url ? "border-red-500" : ""}
            />
            {errors.linkedin_url && <p className="text-xs text-red-500">{errors.linkedin_url}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="facebook" className="flex items-center gap-2">
              <Facebook className="w-4 h-4 text-blue-600" /> Facebook
            </Label>
            <Input 
              id="facebook" 
              value={profile.facebook_url || ''} 
              onChange={e => handleChange('facebook_url', e.target.value)} 
              placeholder="https://facebook.com/..."
              className={errors.facebook_url ? "border-red-500" : ""}
            />
            {errors.facebook_url && <p className="text-xs text-red-500">{errors.facebook_url}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="instagram" className="flex items-center gap-2">
              <Instagram className="w-4 h-4 text-pink-600" /> Instagram
            </Label>
            <Input 
              id="instagram" 
              value={profile.instagram_url || ''} 
              onChange={e => handleChange('instagram_url', e.target.value)} 
              placeholder="https://instagram.com/..."
              className={errors.instagram_url ? "border-red-500" : ""}
            />
            {errors.instagram_url && <p className="text-xs text-red-500">{errors.instagram_url}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="youtube" className="flex items-center gap-2">
              <Youtube className="w-4 h-4 text-red-600" /> YouTube
            </Label>
            <Input 
              id="youtube" 
              value={profile.youtube_url || ''} 
              onChange={e => handleChange('youtube_url', e.target.value)} 
              placeholder="https://youtube.com/..."
              className={errors.youtube_url ? "border-red-500" : ""}
            />
            {errors.youtube_url && <p className="text-xs text-red-500">{errors.youtube_url}</p>}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="tiktok" className="flex items-center gap-2">
              <Video className="w-4 h-4 text-black" /> TikTok
            </Label>
            <Input 
              id="tiktok" 
              value={profile.tiktok_url || ''} 
              onChange={e => handleChange('tiktok_url', e.target.value)} 
              placeholder="https://tiktok.com/@..."
              className={errors.tiktok_url ? "border-red-500" : ""}
            />
            {errors.tiktok_url && <p className="text-xs text-red-500">{errors.tiktok_url}</p>}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={saving} className="bg-brand-blue hover:bg-blue-700">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Enregistrer les liens
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}