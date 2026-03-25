import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "../../../lib/customSupabaseClient";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save } from "lucide-react";
import PhotoUploader from "@/components/project/PhotoUploader";
import { useToast } from "@/components/ui/use-toast";

function safeTrim(value) {
  return String(value ?? "").trim();
}

function safeExtFromFile(file, fallback = "png") {
  const name = String(file?.name || "");
  const parts = name.split(".");
  const ext = (parts[parts.length - 1] || "").toLowerCase();
  return ext && ext.length <= 8 ? ext : fallback;
}

export default function DirectorProfileForm() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    professionnal_presentation: "",
    avatar_url: "",
    linkedin_url: "",
    appointment_url: "",
    customer_review_url: "",
  });

  const [avatarFile, setAvatarFile] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("professionnels")
        .select(
          `
          id,
          user_id,
          first_name,
          last_name,
          phone,
          professionnal_presentation,
          avatar_url,
          linkedin_url,
          appointment_url,
          customer_review_url
        `
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      const row = data || {};

      setFormData({
        first_name: row.first_name || "",
        last_name: row.last_name || "",
        phone: row.phone || "",
        professionnal_presentation: row.professionnal_presentation || "",
        avatar_url: row.avatar_url || "",
        linkedin_url: row.linkedin_url || "",
        appointment_url: row.appointment_url || "",
        customer_review_url: row.customer_review_url || "",
      });

      setAvatarFile(row.avatar_url ? [row.avatar_url] : []);
    } catch (err) {
      console.error("DirectorProfileForm fetchProfile error:", err);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err?.message || "Impossible de charger le profil directeur.",
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [user?.id, fetchProfile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user?.id) return;

    setIsSaving(true);

    try {
      let uploadedAvatarUrl = formData.avatar_url || null;

      if (avatarFile.length > 0 && avatarFile[0] instanceof File) {
        const file = avatarFile[0];
        const fileExt = safeExtFromFile(file, "png");
        const filePath = `avatars/${user.id}/avatar-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("professional-assets")
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("professional-assets").getPublicUrl(filePath);

        uploadedAvatarUrl = publicUrl || null;
      } else if (avatarFile.length === 0) {
        uploadedAvatarUrl = null;
      }

      // ✅ PAYLOAD STRICTEMENT PERSONNEL
      // Ne jamais envoyer ici de champs branding agence
      const payload = {
        first_name: safeTrim(formData.first_name) || null,
        last_name: safeTrim(formData.last_name) || null,
        phone: safeTrim(formData.phone) || null,
        professionnal_presentation: safeTrim(formData.professionnal_presentation) || null,
        avatar_url: uploadedAvatarUrl,
        linkedin_url: safeTrim(formData.linkedin_url) || null,
        appointment_url: safeTrim(formData.appointment_url) || null,
        customer_review_url: safeTrim(formData.customer_review_url) || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("professionnels")
        .update(payload)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Profil mis à jour",
        description: "Les informations personnelles du directeur ont été enregistrées.",
      });

      await fetchProfile();
    } catch (err) {
      console.error("DirectorProfileForm handleSave error:", err);
      toast({
        variant: "destructive",
        title: "Erreur lors de la sauvegarde",
        description: err?.message || "Impossible d’enregistrer le profil directeur.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mon Profil Directeur</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/3">
              <Label className="mb-2 block">Photo de profil</Label>
              <PhotoUploader photos={avatarFile} setPhotos={setAvatarFile} max={1} />
            </div>

            <div className="w-full md:w-2/3 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Prénom</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">Nom</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="professionnal_presentation">Bio / Présentation</Label>
                <Textarea
                  id="professionnal_presentation"
                  name="professionnal_presentation"
                  value={formData.professionnal_presentation}
                  onChange={handleInputChange}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin_url">Profil LinkedIn</Label>
                <Input
                  id="linkedin_url"
                  name="linkedin_url"
                  value={formData.linkedin_url}
                  onChange={handleInputChange}
                  placeholder="https://www.linkedin.com/in/..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="appointment_url">Lien prise de rendez-vous</Label>
                <Input
                  id="appointment_url"
                  name="appointment_url"
                  value={formData.appointment_url}
                  onChange={handleInputChange}
                  placeholder="https://calendly.com/..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer_review_url">Lien avis client</Label>
                <Input
                  id="customer_review_url"
                  name="customer_review_url"
                  value={formData.customer_review_url}
                  onChange={handleInputChange}
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}