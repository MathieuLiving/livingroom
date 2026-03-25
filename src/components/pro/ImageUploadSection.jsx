// src/components/pro/ImageUploadSection.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Upload, Trash2, Image as ImageIcon, Save, Lock } from "lucide-react";
import { getAvatarUrl, getLogoUrl } from "@/utils/storageAssets";
import { supabase } from "@/lib/customSupabaseClient";

function normalizeRole(value) {
  return String(value || "").toLowerCase().trim();
}

/**
 * Règle métier validée :
 * - director / team_leader / agent_affiliate = rattachés à une agence
 * - agent = autonome / indépendant
 */
function isAgencyAttachedRole(role) {
  const r = normalizeRole(role);
  return r === "director" || r === "team_leader" || r === "agent_affiliate";
}

const ImageUploader = ({
  title,
  description,
  currentImage,
  fallbackIcon: FallbackIcon,
  onSave,
  loading,
  type = "avatar",
  isRounded = true,
  disabled = false,
  lockedHint = null,
  extraActions = null,
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const clearLocalSelection = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });

    setSelectedFile(file);
  }, []);

  const handleClear = useCallback(() => {
    clearLocalSelection();
  }, [clearLocalSelection]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!loading && !selectedFile) return;
    if (!loading) return;
  }, [loading, selectedFile]);

  const handleSaveClick = useCallback(async () => {
    if (!selectedFile || typeof onSave !== "function") return;

    try {
      await onSave(selectedFile);
      clearLocalSelection();
    } catch {
      // le toast d’erreur est géré dans le parent
    }
  }, [selectedFile, onSave, clearLocalSelection]);

  const displayUrl = previewUrl || currentImage;

  return (
    <div className="flex flex-col sm:flex-row gap-6 items-start border p-4 rounded-lg bg-gray-50/50">
      <div className="flex-shrink-0">
        <div
          className={`relative border-2 border-dashed border-gray-200 bg-white flex items-center justify-center overflow-hidden ${isRounded ? "rounded-full w-24 h-24" : "rounded-lg w-32 h-24"
            }`}
        >
          {displayUrl ? (
            <img
              src={displayUrl}
              alt={title}
              className={`w-full h-full object-cover ${type === "logo" ? "object-contain p-1" : ""}`}
            />
          ) : (
            <FallbackIcon className="w-8 h-8 text-gray-300" />
          )}

          {disabled && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <Lock className="w-5 h-5 text-gray-500" />
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-3 w-full">
        <div>
          <Label className="text-base font-semibold">{title}</Label>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
          {disabled && lockedHint && (
            <p className="text-xs text-muted-foreground mt-2">{lockedHint}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileSelect}
            disabled={loading || disabled}
          />

          {disabled ? (
            <Button type="button" variant="outline" size="sm" disabled>
              <Lock className="w-4 h-4 mr-2" />
              Modifiable par l’agence
            </Button>
          ) : !selectedFile ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              <Upload className="w-4 h-4 mr-2" />
              Choisir une image
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleSaveClick}
                disabled={loading}
                className="bg-brand-blue text-white hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                disabled={loading}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}

          {extraActions}
        </div>

        {selectedFile && !loading && !disabled && (
          <p className="text-xs text-amber-600">
            N&apos;oubliez pas de cliquer sur &quot;Enregistrer&quot; pour valider votre modification.
          </p>
        )}
      </div>
    </div>
  );
};

const ImageUploadSection = ({
  profile,
  onUploadPhoto,
  onUploadLogo,
  photoLoading,
  logoLoading,
  canEditLogo = true,
  isAgencyMember = false,
  agency = null,
  onProfileUpdate,
}) => {
  const { toast } = useToast();
  const [isLogoInQR, setIsLogoInQR] = useState(false);
  const [qrSaving, setQrSaving] = useState(false);

  const role = useMemo(() => normalizeRole(profile?.agency_role), [profile?.agency_role]);

  /**
   * Sécurité métier :
   * - agent = autonome
   * - director / team_leader / agent_affiliate = rattachés agence
   */
  const isIndependentAgent = useMemo(() => {
    if (role === "agent") return true;
    if (isAgencyAttachedRole(role)) return false;
    return !isAgencyMember;
  }, [role, isAgencyMember]);

  const isAgencyManaged = useMemo(() => !isIndependentAgent, [isIndependentAgent]);

  useEffect(() => {
    setIsLogoInQR(Boolean(profile?.qr_code_with_logo));
  }, [profile?.qr_code_with_logo, profile?.updated_at]);

  const currentAvatar = useMemo(() => {
    return getAvatarUrl(profile?.avatar_path || profile?.avatar_url);
  }, [profile?.avatar_path, profile?.avatar_url]);

  /**
   * Logo effectif :
   * - agent autonome => logo perso
   * - directeur / team leader / agent_affiliate => logo agence
   */
  const currentLogo = useMemo(() => {
    if (isAgencyManaged) {
      return getLogoUrl(
        agency?.logo_url ||
        agency?.logo_storage_path ||
        agency?.logo_path
      );
    }

    return getLogoUrl(profile?.logo_path || profile?.logo_url);
  }, [
    isAgencyManaged,
    agency?.logo_url,
    agency?.logo_storage_path,
    agency?.logo_path,
    profile?.logo_path,
    profile?.logo_url,
  ]);

  const hasLogo = Boolean(currentLogo);

  const refreshAfterQrSave = useCallback(async () => {
    if (typeof onProfileUpdate !== "function") return;

    try {
      await onProfileUpdate({ clearDirty: true, force: true });
      return;
    } catch {
      //
    }

    try {
      await onProfileUpdate(true);
      return;
    } catch {
      //
    }

    try {
      await onProfileUpdate();
    } catch {
      //
    }
  }, [onProfileUpdate]);

  const handleQrToggle = useCallback(
    async (checked) => {
      if (!profile?.id || !isIndependentAgent || qrSaving) return;

      const nextValue = !!checked;
      const previousValue = Boolean(isLogoInQR);

      setIsLogoInQR(nextValue);
      setQrSaving(true);

      try {
        const { error } = await supabase
          .from("professionnels")
          .update({
            qr_code_with_logo: nextValue,
            updated_at: new Date().toISOString(),
          })
          .eq("id", profile.id);

        if (error) throw error;

        await refreshAfterQrSave();

        toast({
          title: "Préférence enregistrée",
          description: nextValue
            ? "Le logo est maintenant intégré au QR Code."
            : "Le logo a été retiré du QR Code.",
        });
      } catch (error) {
        console.error("Error saving QR setting:", error);
        setIsLogoInQR(previousValue);

        toast({
          variant: "destructive",
          title: "Erreur",
          description: error?.message || "Impossible d'enregistrer votre préférence.",
        });
      } finally {
        setQrSaving(false);
      }
    },
    [profile?.id, isIndependentAgent, qrSaving, isLogoInQR, refreshAfterQrSave, toast]
  );

  const logoExtraActions = useMemo(() => {
    if (isIndependentAgent) {
      return (
        <div className="flex items-center gap-3 ml-0 sm:ml-2 sm:pl-4 sm:border-l border-gray-200 mt-2 sm:mt-0 py-1 transition-all">
          {hasLogo ? (
            <>
              <Switch
                id={`qr-logo-toggle-${profile?.id || "pro"}`}
                checked={isLogoInQR}
                onCheckedChange={handleQrToggle}
                disabled={qrSaving || logoLoading}
              />
              <Label
                htmlFor={`qr-logo-toggle-${profile?.id || "pro"}`}
                className={`text-sm flex items-center gap-2 cursor-pointer transition-colors ${isLogoInQR ? "text-brand-blue font-medium" : "text-gray-600"
                  }`}
              >
                Intégrer ce logo au QR Code
                {qrSaving && <Loader2 className="w-3 h-3 animate-spin text-brand-blue" />}
              </Label>
            </>
          ) : (
            <span className="text-sm text-gray-400 italic">Aucun logo disponible</span>
          )}
        </div>
      );
    }

    return (
      <div className="ml-0 sm:ml-2 sm:pl-4 sm:border-l border-gray-200 mt-2 sm:mt-0 py-1">
        <span className="text-sm text-gray-500 italic">
          Le logo du QR Code est géré par l’agence.
        </span>
      </div>
    );
  }, [isIndependentAgent, hasLogo, isLogoInQR, handleQrToggle, qrSaving, logoLoading, profile?.id]);

  return (
    <div className="space-y-6">
      <ImageUploader
        title="Photo de profil"
        description="Cette photo sera affichée sur votre carte de visite et votre profil public."
        currentImage={currentAvatar}
        fallbackIcon={ImageIcon}
        onSave={onUploadPhoto}
        loading={photoLoading}
        type="avatar"
        isRounded
        disabled={false}
      />

      <ImageUploader
        title={isAgencyManaged ? "Logo de l’agence" : "Logo de l'entreprise"}
        description={
          isAgencyManaged
            ? "Le logo est défini au niveau de l’agence et partagé par tous les profils rattachés."
            : "Le logo de votre entreprise (recommandé pour les cartes Premium)."
        }
        currentImage={currentLogo}
        fallbackIcon={ImageIcon}
        onSave={onUploadLogo}
        loading={logoLoading}
        type="logo"
        isRounded={false}
        disabled={!canEditLogo || isAgencyManaged}
        lockedHint={
          isAgencyManaged
            ? "Pour modifier le logo, demandez au directeur de le mettre à jour dans l’espace Agence."
            : null
        }
        extraActions={logoExtraActions}
      />
    </div>
  );
};

export default ImageUploadSection;