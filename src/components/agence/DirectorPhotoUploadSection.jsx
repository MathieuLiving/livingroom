// src/components/agence/DirectorPhotoUploadSection.jsx
import React, { useState, useCallback } from "react";
import { supabase } from "@/lib/customSupabaseClient";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Image as ImageIcon } from "lucide-react";
import ImageUploadSection from "@/components/pro/ImageUploadSection";

// ✅ RLS-safe uploads (paths based on auth.uid())
import { uploadMyAvatarFile, uploadMyLogoFile } from "@/utils/uploadUserAssetsToSupabase";

const validateImageFile = (file) => {
  if (!file) throw new Error("Aucun fichier fourni.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Fichier trop volumineux (max 5Mo).");

  const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!validTypes.includes(file.type)) {
    throw new Error("Format invalide. Utilisez JPG, PNG, WEBP ou GIF.");
  }
};

export default function DirectorPhotoUploadSection({ profile, setProfile, onRefetch }) {
  const { toast } = useToast();
  const [photoLoading, setPhotoLoading] = useState(false);
  const [logoLoading, setLogoLoading] = useState(false);

  const handleUpload = useCallback(
    async (file, type) => {
      if (!file) return;

      const isLogo = type === "logo";
      const setLoading = isLogo ? setLogoLoading : setPhotoLoading;

      setLoading(true);

      try {
        // 1) Validation
        validateImageFile(file);

        // 2) auth.uid()
        const { data: authRes, error: authErr } = await supabase.auth.getUser();
        if (authErr) throw authErr;

        const userId = authRes?.user?.id;
        if (!userId) throw new Error("Utilisateur non authentifié.");

        // 3) Upload (RLS-safe)
        const { path } = isLogo ? await uploadMyLogoFile(file) : await uploadMyAvatarFile(file);

        // 4) Update DB (RLS-safe) — always by user_id = auth.uid()
        const updates = isLogo
          ? { logo_path: path, logo_url: null, updated_at: new Date().toISOString() }
          : { avatar_path: path, avatar_url: null, updated_at: new Date().toISOString() };

        const { error: dbError } = await supabase
          .from("professionnels")
          .update(updates)
          .eq("user_id", userId);

        if (dbError) throw dbError;

        // 5) Optimistic local state update
        if (setProfile) {
          setProfile((prev) => ({ ...(prev || {}), ...(updates || {}) }));
        }

        toast({
          title: "Succès",
          description: `${isLogo ? "Logo" : "Photo"} enregistrée avec succès !`,
        });

        // 6) Refetch profile (optional)
        if (onRefetch) await onRefetch();
      } catch (error) {
        console.error(`[DirectorPhotoUploadSection] upload ${type} error:`, error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: error?.message || "Une erreur est survenue lors du téléchargement.",
        });
      } finally {
        setLoading(false);
      }
    },
    [onRefetch, setProfile, toast]
  );

  return (
    <Card className="border-none shadow-none md:border md:shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <ImageIcon className="w-5 h-5 text-brand-orange" />
          </div>
          <div>
            <CardTitle className="text-xl">Photo & Branding</CardTitle>
            <CardDescription>Gérez votre photo de profil et le logo de votre entreprise.</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ImageUploadSection
          profile={profile}
          onUploadPhoto={(file) => handleUpload(file, "photo")}
          onUploadLogo={(file) => handleUpload(file, "logo")}
          photoLoading={photoLoading}
          logoLoading={logoLoading}
        />
      </CardContent>
    </Card>
  );
}