import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../../lib/customSupabaseClient";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2, Save, Palette, RotateCcw, Droplet } from "lucide-react";

const DEFAULTS = {
  card_banner_color: "#22577A",
  card_text_color: "#22577A",
  card_primary_button_color: "#F89223",
  card_secondary_button_color: "#22577A",
  card_qr_fg_color: "#005E9E",
  card_name_color: "#22577A",
  card_signature_color: "#22577A",
  card_company_name_color: "#22577A",
  card_support_text_color: "#22577A",
};

const COLOR_KEYS = [
  "card_banner_color",
  "card_text_color",
  "card_primary_button_color",
  "card_secondary_button_color",
  "card_qr_fg_color",
  "card_name_color",
  "card_signature_color",
  "card_company_name_color",
  "card_support_text_color",
];

const HEX_REGEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

const normalizeHex = (value, fallback = "") => {
  const s = String(value || "").trim();
  if (!s) return fallback;
  return HEX_REGEX.test(s) ? s.toUpperCase() : fallback;
};

const sanitizeColorPayload = (source = {}) => ({
  card_banner_color: normalizeHex(source.card_banner_color, DEFAULTS.card_banner_color),
  card_text_color: normalizeHex(source.card_text_color, DEFAULTS.card_text_color),
  card_primary_button_color: normalizeHex(
    source.card_primary_button_color,
    DEFAULTS.card_primary_button_color
  ),
  card_secondary_button_color: normalizeHex(
    source.card_secondary_button_color,
    DEFAULTS.card_secondary_button_color
  ),
  card_qr_fg_color: normalizeHex(source.card_qr_fg_color, DEFAULTS.card_qr_fg_color),
  card_name_color: normalizeHex(source.card_name_color, DEFAULTS.card_name_color),
  card_signature_color: normalizeHex(
    source.card_signature_color,
    DEFAULTS.card_signature_color
  ),
  card_company_name_color: normalizeHex(
    source.card_company_name_color,
    DEFAULTS.card_company_name_color
  ),
  card_support_text_color: normalizeHex(
    source.card_support_text_color,
    DEFAULTS.card_support_text_color
  ),
});

const readColorsFromProfile = (profile = {}) =>
  sanitizeColorPayload({
    card_banner_color:
      profile?.agency_card_banner_color ??
      profile?.effective_card_banner_color ??
      profile?.card_banner_color,

    card_text_color:
      profile?.agency_card_text_color ??
      profile?.effective_card_text_color ??
      profile?.card_text_color,

    card_primary_button_color:
      profile?.agency_card_primary_button_color ??
      profile?.effective_card_primary_button_color ??
      profile?.card_primary_button_color,

    card_secondary_button_color:
      profile?.agency_card_secondary_button_color ??
      profile?.effective_card_secondary_button_color ??
      profile?.card_secondary_button_color,

    card_qr_fg_color:
      profile?.agency_card_qr_fg_color ??
      profile?.effective_card_qr_fg_color ??
      profile?.card_qr_fg_color,

    card_name_color:
      profile?.agency_card_name_color ??
      profile?.effective_card_name_color ??
      profile?.card_name_color,

    card_signature_color:
      profile?.agency_card_signature_color ??
      profile?.effective_card_signature_color ??
      profile?.card_signature_color,

    card_company_name_color:
      profile?.agency_card_company_name_color ??
      profile?.effective_card_company_name_color ??
      profile?.card_company_name_color,

    card_support_text_color:
      profile?.agency_card_support_text_color ??
      profile?.effective_card_support_text_color ??
      profile?.card_support_text_color,
  });

const areSameColors = (a = {}, b = {}) =>
  COLOR_KEYS.every((key) => String(a?.[key] || "") === String(b?.[key] || ""));

const ColorInput = ({ id, label, value, onChange, disabled = false }) => (
  <div className="space-y-2">
    <Label htmlFor={id} className="flex items-center gap-2 text-sm font-medium">
      <Droplet className="w-3 h-3 text-slate-400" /> {label}
    </Label>

    <div className="flex gap-2 items-center">
      <div
        className={`relative w-10 h-10 overflow-hidden rounded-md border shadow-sm ${
          disabled ? "opacity-60" : ""
        }`}
      >
        <input
          type="color"
          value={normalizeHex(value, "#000000")}
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
        className="font-mono text-sm uppercase"
        maxLength={7}
        disabled={disabled}
      />
    </div>
  </div>
);

export default function DirectorCardCustomizationSection({
  profile,
  setProfile,
  onRefetch,
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const agencyId = useMemo(
    () => String(profile?.agency_id || "").trim() || null,
    [profile?.agency_id]
  );

  const profileColors = useMemo(() => readColorsFromProfile(profile), [
    profile?.agency_id,
    profile?.agency_updated_at,
    profile?.updated_at,

    profile?.card_banner_color,
    profile?.card_text_color,
    profile?.card_primary_button_color,
    profile?.card_secondary_button_color,
    profile?.card_qr_fg_color,
    profile?.card_name_color,
    profile?.card_signature_color,
    profile?.card_company_name_color,
    profile?.card_support_text_color,

    profile?.agency_card_banner_color,
    profile?.agency_card_text_color,
    profile?.agency_card_primary_button_color,
    profile?.agency_card_secondary_button_color,
    profile?.agency_card_qr_fg_color,
    profile?.agency_card_name_color,
    profile?.agency_card_signature_color,
    profile?.agency_card_company_name_color,
    profile?.agency_card_support_text_color,

    profile?.effective_card_banner_color,
    profile?.effective_card_text_color,
    profile?.effective_card_primary_button_color,
    profile?.effective_card_secondary_button_color,
    profile?.effective_card_qr_fg_color,
    profile?.effective_card_name_color,
    profile?.effective_card_signature_color,
    profile?.effective_card_company_name_color,
    profile?.effective_card_support_text_color,
  ]);

  const [localColors, setLocalColors] = useState(profileColors);
  const [lastSavedColors, setLastSavedColors] = useState(profileColors);

  const lastServerFingerprintRef = useRef(JSON.stringify(profileColors));
  const lastAgencyIdRef = useRef(agencyId);

  useEffect(() => {
    const nextFingerprint = JSON.stringify(profileColors);
    const agencyChanged = lastAgencyIdRef.current !== agencyId;
    const serverChanged = nextFingerprint !== lastServerFingerprintRef.current;

    if (!agencyChanged && !serverChanged) return;
    if (saving) return;

    lastAgencyIdRef.current = agencyId;
    lastServerFingerprintRef.current = nextFingerprint;

    setLocalColors(profileColors);
    setLastSavedColors(profileColors);
  }, [agencyId, profileColors, saving]);

  const isDirty = useMemo(() => {
    return !areSameColors(localColors, lastSavedColors);
  }, [localColors, lastSavedColors]);

  const handleChange = useCallback((field, value) => {
    setLocalColors((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleReset = useCallback(() => {
    setLocalColors(DEFAULTS);
    toast({
      description: "Couleurs réinitialisées (cliquez sur Enregistrer pour valider).",
    });
  }, [toast]);

  const pushSavedColorsToProfile = useCallback(
    (colors, updatedAt = null) => {
      if (typeof setProfile !== "function") return;

      setProfile((prev) => {
        const next = { ...(prev || {}) };

        COLOR_KEYS.forEach((key) => {
          next[key] = colors[key];
          next[`agency_${key}`] = colors[key];
        });

        if (updatedAt) {
          next.agency_updated_at = updatedAt;
        }

        return next;
      });
    },
    [setProfile]
  );

  const handleSave = useCallback(async () => {
    if (!agencyId) {
      toast({
        variant: "destructive",
        title: "Agence introuvable",
        description:
          "Impossible d’enregistrer la charte graphique : aucun agency_id n’est lié à ce profil.",
      });
      return;
    }

    const sanitized = sanitizeColorPayload(localColors);

    const updates = {
      ...sanitized,
      updated_at: new Date().toISOString(),
    };

    setSaving(true);

    try {
      const { data, error } = await supabase
        .from("agencies")
        .update(updates)
        .eq("id", agencyId)
        .select(
          `
          id,
          updated_at,
          card_banner_color,
          card_text_color,
          card_primary_button_color,
          card_secondary_button_color,
          card_qr_fg_color,
          card_name_color,
          card_signature_color,
          card_company_name_color,
          card_support_text_color
        `
        )
        .single();

      if (error) throw error;

      const savedColors = sanitizeColorPayload(data || updates);
      const savedUpdatedAt = data?.updated_at || updates.updated_at;

      pushSavedColorsToProfile(savedColors, savedUpdatedAt);
      setLocalColors(savedColors);
      setLastSavedColors(savedColors);
      lastServerFingerprintRef.current = JSON.stringify(savedColors);

      toast({
        title: "Design mis à jour",
        description: "Les couleurs de l’agence ont été enregistrées.",
      });

      if (typeof onRefetch === "function") {
        try {
          await onRefetch({ force: true, clearDirty: true });
        } catch {
          try {
            await onRefetch(true);
          } catch {
            try {
              await onRefetch();
            } catch {
              // no-op
            }
          }
        }
      }
    } catch (err) {
      console.error("Error saving agency colors:", err);

      toast({
        variant: "destructive",
        title: "Erreur",
        description: err?.message || "Impossible d'enregistrer les couleurs.",
      });
    } finally {
      setSaving(false);
    }
  }, [agencyId, localColors, onRefetch, pushSavedColorsToProfile, toast]);

  return (
    <Card className="border-none shadow-none md:border md:shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Palette className="w-5 h-5 text-purple-600" />
          </div>

          <div>
            <CardTitle className="text-xl">Personnalisation Carte</CardTitle>
            <CardDescription>
              Définissez l&apos;identité visuelle de la carte digitale de l’agence.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
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
              disabled={saving}
            />
            <ColorInput
              id="card_text_color"
              label="Texte Principal"
              value={localColors.card_text_color}
              onChange={handleChange}
              disabled={saving}
            />
            <ColorInput
              id="card_primary_button_color"
              label="Bouton Principal"
              value={localColors.card_primary_button_color}
              onChange={handleChange}
              disabled={saving}
            />
            <ColorInput
              id="card_secondary_button_color"
              label="Bouton Secondaire"
              value={localColors.card_secondary_button_color}
              onChange={handleChange}
              disabled={saving}
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
              disabled={saving}
            />
            <ColorInput
              id="card_signature_color"
              label="Signature (Fonction)"
              value={localColors.card_signature_color}
              onChange={handleChange}
              disabled={saving}
            />
            <ColorInput
              id="card_company_name_color"
              label="Nom Entreprise"
              value={localColors.card_company_name_color}
              onChange={handleChange}
              disabled={saving}
            />
            <ColorInput
              id="card_support_text_color"
              label="Textes secondaires (Bio)"
              value={localColors.card_support_text_color}
              onChange={handleChange}
              disabled={saving}
            />
            <ColorInput
              id="card_qr_fg_color"
              label="QR Code (Premier plan)"
              value={localColors.card_qr_fg_color}
              onChange={handleChange}
              disabled={saving}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t">
          <Button
            variant="ghost"
            onClick={handleReset}
            className="text-slate-500"
            disabled={saving}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Réinitialiser par défaut
          </Button>

          <Button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="bg-brand-blue hover:bg-blue-700 w-full sm:w-auto"
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Enregistrer le design
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}