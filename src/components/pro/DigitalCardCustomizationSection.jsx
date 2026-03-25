import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, RotateCcw, Droplet, Lock, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { COLOR_DEFAULTS, normalizeHexOrUndefined } from "@/utils/proHelpers";
import { supabase } from "@/lib/customSupabaseClient";
import { useToast } from "@/components/ui/use-toast";

const FULL_COLOR_DEFAULTS = {
  card_banner_color: COLOR_DEFAULTS.card_banner_color || "#22577A",
  card_text_color: COLOR_DEFAULTS.card_text_color || "#22577A",
  card_primary_button_color: COLOR_DEFAULTS.card_primary_button_color || "#F89223",
  card_secondary_button_color: COLOR_DEFAULTS.card_secondary_button_color || "#22577A",
  card_qr_fg_color: COLOR_DEFAULTS.card_qr_fg_color || "#005E9E",
  card_name_color: "#22577A",
  card_signature_color: "#22577A",
  card_company_name_color: "#22577A",
  card_support_text_color: "#22577A",
};

const ColorInput = ({ id, label, value, onChange, disabled }) => (
  <div className="space-y-2">
    <Label htmlFor={id} className="flex items-center gap-2 text-sm font-medium text-gray-700">
      <Droplet className="w-3 h-3 text-slate-400" /> {label}
    </Label>
    <div className="flex gap-2 items-center">
      <div
        className={`relative w-10 h-10 overflow-hidden rounded-md border shadow-sm ${
          disabled ? "opacity-50" : ""
        }`}
      >
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(id, e.target.value)}
          disabled={disabled}
          className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer p-0 border-0 disabled:cursor-not-allowed"
        />
      </div>
      <Input
        id={id}
        value={value || ""}
        onChange={(e) => onChange(id, e.target.value)}
        placeholder="#RRGGBB"
        disabled={disabled}
        className="font-mono text-sm uppercase"
        maxLength={7}
      />
    </div>
  </div>
);

function normalizeRole(value) {
  return String(value || "").toLowerCase().trim();
}

function isAgencyAttachedRole(role) {
  const r = normalizeRole(role);
  return r === "director" || r === "team_leader" || r === "agent_affiliate";
}

function buildColorsFromProfile(profile) {
  return {
    card_banner_color:
      normalizeHexOrUndefined(profile?.card_banner_color) ?? FULL_COLOR_DEFAULTS.card_banner_color,
    card_text_color:
      normalizeHexOrUndefined(profile?.card_text_color) ?? FULL_COLOR_DEFAULTS.card_text_color,
    card_primary_button_color:
      normalizeHexOrUndefined(profile?.card_primary_button_color) ??
      FULL_COLOR_DEFAULTS.card_primary_button_color,
    card_secondary_button_color:
      normalizeHexOrUndefined(profile?.card_secondary_button_color) ??
      FULL_COLOR_DEFAULTS.card_secondary_button_color,
    card_name_color:
      normalizeHexOrUndefined(profile?.card_name_color) ??
      normalizeHexOrUndefined(profile?.card_text_color) ??
      FULL_COLOR_DEFAULTS.card_name_color,
    card_signature_color:
      normalizeHexOrUndefined(profile?.card_signature_color) ??
      FULL_COLOR_DEFAULTS.card_signature_color,
    card_company_name_color:
      normalizeHexOrUndefined(profile?.card_company_name_color) ??
      FULL_COLOR_DEFAULTS.card_company_name_color,
    card_support_text_color:
      normalizeHexOrUndefined(profile?.card_support_text_color) ??
      FULL_COLOR_DEFAULTS.card_support_text_color,
    card_qr_fg_color:
      normalizeHexOrUndefined(profile?.card_qr_fg_color) ?? FULL_COLOR_DEFAULTS.card_qr_fg_color,
  };
}

export default function DigitalCardCustomizationSection({
  profile,
  setProfile,
  agency,
  saving,
  onSave,
  savingLocal,
  isDirty,
  onRefetch,
}) {
  const { toast } = useToast();
  const [localColors, setLocalColors] = useState(() => buildColorsFromProfile(null));
  const [qrSaving, setQrSaving] = useState(false);

  const role = useMemo(() => normalizeRole(profile?.agency_role), [profile?.agency_role]);
  const isAgencyManaged = useMemo(() => isAgencyAttachedRole(role), [role]);
  const isIndependent = role === "agent" || !role;

  useEffect(() => {
    setLocalColors(buildColorsFromProfile(profile));
  }, [profile]);

  const handleChange = useCallback(
    (id, value) => {
      setLocalColors((prev) => ({ ...prev, [id]: value }));
      setProfile((prev) => ({ ...(prev || {}), [id]: value }));
    },
    [setProfile]
  );

  const handleReset = useCallback(() => {
    const resetColors = { ...FULL_COLOR_DEFAULTS };
    setLocalColors(resetColors);
    setProfile((prev) => ({ ...(prev || {}), ...resetColors }));
  }, [setProfile]);

  const handleSave = useCallback(async () => {
    if (!onSave) return;
    await onSave();
  }, [onSave]);

  const handleQrToggle = useCallback(
    async (checked) => {
      if (!profile?.id || !isIndependent) return;

      setQrSaving(true);
      try {
        const { error } = await supabase
          .from("professionnels")
          .update({
            qr_code_with_logo: !!checked,
            updated_at: new Date().toISOString(),
          })
          .eq("id", profile.id);

        if (error) throw error;

        setProfile((prev) => ({ ...(prev || {}), qr_code_with_logo: !!checked }));

        toast({
          title: "Préférence enregistrée",
          description: `Le logo est maintenant ${checked ? "intégré" : "masqué"} sur votre QR Code.`,
        });

        if (onRefetch) {
          await onRefetch({ clearDirty: true });
        }
      } catch (error) {
        console.error("Error saving QR setting:", error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: error?.message || "Impossible d'enregistrer votre préférence.",
        });
        setProfile((prev) => ({ ...(prev || {}), qr_code_with_logo: !checked }));
      } finally {
        setQrSaving(false);
      }
    },
    [profile?.id, isIndependent, setProfile, toast, onRefetch]
  );

  const isLocked = useMemo(() => {
    if (!profile) return true;
    return isAgencyManaged;
  }, [profile, isAgencyManaged]);

  const dirty = isDirty ? isDirty() : false;

  const lockMessage = useMemo(() => {
    if (!profile) return "La personnalisation est indisponible.";
    if (isAgencyManaged) {
      return "La personnalisation est gérée par votre agence.";
    }
    if (agency?.colors_uniform) {
      return "L'agence applique une charte graphique uniforme.";
    }
    return "La personnalisation est verrouillée.";
  }, [profile, isAgencyManaged, agency]);

  const hasLogo = Boolean(profile?.logo_url);

  return (
    <div className="space-y-8">
      {isLocked && (
        <Alert className="bg-slate-50 border-slate-200">
          <Lock className="h-4 w-4 text-slate-500" />
          <AlertTitle>Personnalisation verrouillée</AlertTitle>
          <AlertDescription className="text-xs text-slate-500">
            {lockMessage}
          </AlertDescription>
        </Alert>
      )}

      {!isIndependent && agency?.qr_code_with_logo && (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertTitle>QR Code agence</AlertTitle>
          <AlertDescription className="text-xs text-blue-700">
            Le QR Code de votre carte utilisera la configuration définie par l’agence.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-slate-500 border-b pb-2">
            Couleurs Principales
          </h3>
          <ColorInput
            id="card_banner_color"
            label="Bannière (Fond haut)"
            value={localColors.card_banner_color}
            onChange={handleChange}
            disabled={isLocked}
          />
          <ColorInput
            id="card_text_color"
            label="Texte Principal"
            value={localColors.card_text_color}
            onChange={handleChange}
            disabled={isLocked}
          />
          <ColorInput
            id="card_primary_button_color"
            label="Bouton Principal"
            value={localColors.card_primary_button_color}
            onChange={handleChange}
            disabled={isLocked}
          />
          <ColorInput
            id="card_secondary_button_color"
            label="Bouton Secondaire"
            value={localColors.card_secondary_button_color}
            onChange={handleChange}
            disabled={isLocked}
          />
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-slate-500 border-b pb-2">
            Détails & Textes
          </h3>
          <ColorInput
            id="card_name_color"
            label="Nom & Prénom"
            value={localColors.card_name_color}
            onChange={handleChange}
            disabled={isLocked}
          />
          <ColorInput
            id="card_signature_color"
            label="Signature (Fonction)"
            value={localColors.card_signature_color}
            onChange={handleChange}
            disabled={isLocked}
          />
          <ColorInput
            id="card_company_name_color"
            label="Nom Entreprise"
            value={localColors.card_company_name_color}
            onChange={handleChange}
            disabled={isLocked}
          />
          <ColorInput
            id="card_support_text_color"
            label="Textes secondaires (Bio)"
            value={localColors.card_support_text_color}
            onChange={handleChange}
            disabled={isLocked}
          />
          <ColorInput
            id="card_qr_fg_color"
            label="QR Code (Couleur)"
            value={localColors.card_qr_fg_color}
            onChange={handleChange}
            disabled={isLocked}
          />
        </div>
      </div>

      {isIndependent && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="qr-logo-toggle" className="text-sm font-medium cursor-pointer">
                Intégrer mon logo dans le QR Code
              </Label>
              <p className="mt-1 text-xs text-slate-500">
                Cette option est disponible uniquement pour les agents autonomes.
              </p>
            </div>

            <Button
              type="button"
              variant={profile?.qr_code_with_logo ? "outline" : "default"}
              disabled={qrSaving || !hasLogo}
              onClick={() => handleQrToggle(!profile?.qr_code_with_logo)}
              className={
                profile?.qr_code_with_logo ? "" : "bg-brand-blue hover:bg-blue-700 text-white"
              }
            >
              {qrSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : profile?.qr_code_with_logo ? (
                "Retirer le logo"
              ) : (
                "Ajouter le logo"
              )}
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t">
        <Button
          variant="ghost"
          onClick={handleReset}
          disabled={isLocked || saving || savingLocal}
          className="text-slate-500"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Réinitialiser par défaut
        </Button>

        <Button
          onClick={handleSave}
          disabled={isLocked || saving || savingLocal || !dirty}
          className="bg-brand-blue hover:bg-blue-700 w-full sm:w-auto"
        >
          {saving || savingLocal ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Enregistrer le design
        </Button>
      </div>
    </div>
  );
}