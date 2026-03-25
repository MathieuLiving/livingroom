import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/customSupabaseClient";
import { useToast } from "@/components/ui/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Loader2,
  Save,
  RotateCcw,
  Droplet,
  Palette,
  Lock,
  Unlock,
  Eye,
  Video,
  Link2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const DEFAULT_COLORS = {
  card_banner_color: "#22577A",
  card_text_color: "#FFFFFF",
  card_primary_button_color: "#F89223",
  card_secondary_button_color: "#22577A",
  card_qr_fg_color: "#005E9E",
  card_name_color: "#0F172A",
  card_signature_color: "#334155",
  card_company_name_color: "#64748B",
  card_support_text_color: "#1F2937",
};

const HEX6 = /^#([0-9a-fA-F]{6})$/;
const isHexColor = (v) => HEX6.test(String(v || "").trim());

const normalizeHex = (v) => {
  if (typeof v !== "string") return v;
  const t = v.trim();
  const short = /^#([0-9a-fA-F]{3})$/.exec(t);
  if (short) {
    const s = short[1];
    return `#${s[0]}${s[0]}${s[1]}${s[1]}${s[2]}${s[2]}`.toUpperCase();
  }
  return t.toUpperCase();
};

const normalizeUrlInput = (value) => String(value || "").trim();

function mergeAgencyColors(agency) {
  return Object.keys(DEFAULT_COLORS).reduce((acc, key) => {
    const raw = String(agency?.[key] || "");
    const normalized = normalizeHex(raw);
    acc[key] = isHexColor(normalized) ? normalized : DEFAULT_COLORS[key];
    return acc;
  }, {});
}

function pickAgencyId(agency) {
  return agency?.id || agency?.agency_id || null;
}

function getVideoModeFromAgency(agency) {
  const raw = agency?.video_display_mode ?? (agency?.enforce_video ? "agency" : "personal");
  const normalized = String(raw || "").toLowerCase().trim();
  return normalized === "personal" ? "personal" : "agency";
}

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
          value={isHexColor(value) ? value : "#000000"}
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
        spellCheck={false}
        autoComplete="off"
      />
    </div>
  </div>
);

export default function AgencyColorsToggle({
  agency,
  permissions,
  updateAgency,
  onAgencyUpdated,
}) {
  const { toast } = useToast();

  const canEditColors = !!permissions?.canEditColors;
  const lockColors = !!permissions?.lockColors;
  const isDirector = !!permissions?.isDirector;

  const [colors, setColors] = useState(DEFAULT_COLORS);
  const [colorsUniform, setColorsUniform] = useState(false);

  const [videoMode, setVideoMode] = useState("agency");
  const [agencyVideoUrl, setAgencyVideoUrl] = useState("");

  const [lastSavedColors, setLastSavedColors] = useState(DEFAULT_COLORS);
  const [lastSavedUniform, setLastSavedUniform] = useState(false);
  const [lastSavedVideoMode, setLastSavedVideoMode] = useState("agency");
  const [lastSavedAgencyVideoUrl, setLastSavedAgencyVideoUrl] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [confirmUniformOn, setConfirmUniformOn] = useState(false);

  const loading = !agency;
  const agencyId = useMemo(() => pickAgencyId(agency), [agency]);

  const serverState = useMemo(() => {
    if (!agency) {
      return {
        colors: DEFAULT_COLORS,
        colorsUniform: false,
        videoMode: "agency",
        agencyVideoUrl: "",
      };
    }

    return {
      colors: mergeAgencyColors(agency),
      colorsUniform: !!agency.colors_uniform,
      videoMode: getVideoModeFromAgency(agency),
      agencyVideoUrl: normalizeUrlInput(agency?.video_external_url || agency?.video_url),
    };
  }, [
    agency?.id,
    agency?.agency_id,
    agency?.updated_at,
    agency?.colors_uniform,
    agency?.card_banner_color,
    agency?.card_text_color,
    agency?.card_primary_button_color,
    agency?.card_secondary_button_color,
    agency?.card_qr_fg_color,
    agency?.card_name_color,
    agency?.card_signature_color,
    agency?.card_company_name_color,
    agency?.card_support_text_color,
    agency?.video_display_mode,
    agency?.enforce_video,
    agency?.video_external_url,
    agency?.video_url,
  ]);

  const hydratedAgencyIdRef = useRef(null);
  const lastServerFingerprintRef = useRef(JSON.stringify(serverState));

  useEffect(() => {
    if (!agencyId) return;
    if (isSaving) return;

    const nextFingerprint = JSON.stringify(serverState);
    const agencyChanged = hydratedAgencyIdRef.current !== agencyId;
    const serverChanged = nextFingerprint !== lastServerFingerprintRef.current;

    if (!agencyChanged && !serverChanged) return;

    hydratedAgencyIdRef.current = agencyId;
    lastServerFingerprintRef.current = nextFingerprint;

    setColors(serverState.colors);
    setColorsUniform(serverState.colorsUniform);
    setVideoMode(serverState.videoMode);
    setAgencyVideoUrl(serverState.agencyVideoUrl);

    setLastSavedColors(serverState.colors);
    setLastSavedUniform(serverState.colorsUniform);
    setLastSavedVideoMode(serverState.videoMode);
    setLastSavedAgencyVideoUrl(serverState.agencyVideoUrl);
  }, [agencyId, serverState, isSaving]);

  const isLockedUi = useMemo(() => !canEditColors || lockColors, [canEditColors, lockColors]);

  const hasInvalidColors = useMemo(
    () => !Object.values(colors).every((v) => isHexColor(v)),
    [colors]
  );

  const dirty = useMemo(() => {
    const uniformChanged = colorsUniform !== lastSavedUniform;
    const colorsChanged = Object.keys(DEFAULT_COLORS).some(
      (k) => colors[k] !== lastSavedColors[k]
    );
    const videoModeChanged = videoMode !== lastSavedVideoMode;
    const videoUrlChanged =
      normalizeUrlInput(agencyVideoUrl) !== normalizeUrlInput(lastSavedAgencyVideoUrl);

    return uniformChanged || colorsChanged || videoModeChanged || videoUrlChanged;
  }, [
    colors,
    colorsUniform,
    lastSavedColors,
    lastSavedUniform,
    videoMode,
    lastSavedVideoMode,
    agencyVideoUrl,
    lastSavedAgencyVideoUrl,
  ]);

  const handleColorChange = useCallback((name, value) => {
    setColors((prev) => ({ ...prev, [name]: normalizeHex(value) }));
  }, []);

  const handleResetDefaults = useCallback(() => {
    setColors(DEFAULT_COLORS);
    toast({
      title: "Réinitialisé",
      description: "Les couleurs ont été remises par défaut.",
    });
  }, [toast]);

  const fallbackUpdateAgency = useCallback(
    async (updates) => {
      const currentAgencyId = pickAgencyId(agency);
      if (!currentAgencyId) throw new Error("Agency id manquant.");

      const { error } = await supabase.from("agencies").update(updates).eq("id", currentAgencyId);

      if (error) throw error;
      return { error: null };
    },
    [agency]
  );

  const doSave = useCallback(async () => {
    if (!agencyId) return;

    if (isLockedUi) {
      toast({
        title: "Personnalisation verrouillée",
        description: lockColors
          ? "Les couleurs sont verrouillées pour cette agence."
          : "Vos droits ne permettent pas de modifier la charte.",
        variant: "destructive",
      });
      return;
    }

    if (hasInvalidColors) {
      toast({
        title: "Couleurs invalides",
        description: "Veuillez saisir des couleurs au format #RRGGBB.",
        variant: "destructive",
      });
      return;
    }

    const uniformChanged = colorsUniform !== lastSavedUniform;
    const colorsChanged = Object.keys(DEFAULT_COLORS).some(
      (k) => colors[k] !== lastSavedColors[k]
    );
    const videoModeChanged = videoMode !== lastSavedVideoMode;
    const videoUrlChanged =
      normalizeUrlInput(agencyVideoUrl) !== normalizeUrlInput(lastSavedAgencyVideoUrl);

    const normalizedAgencyVideoUrl = normalizeUrlInput(agencyVideoUrl);

    const updates = {
      ...(uniformChanged ? { colors_uniform: !!colorsUniform } : {}),
      ...(colorsChanged ? { ...colors } : {}),
      ...(videoModeChanged || videoUrlChanged
        ? {
            video_display_mode: videoMode,
            enforce_video: videoMode === "agency",
            video_external_url: normalizedAgencyVideoUrl || null,
          }
        : {}),
      updated_at: new Date().toISOString(),
    };

    if (Object.keys(updates).length === 1 && "updated_at" in updates) {
      toast({ title: "Aucun changement", description: "Rien à enregistrer." });
      return;
    }

    setIsSaving(true);

    try {
      const res = updateAgency
        ? await updateAgency(updates, { toastOnSuccess: false })
        : await fallbackUpdateAgency(updates);

      if (res?.error) throw res.error;

      onAgencyUpdated?.(updates);

      setLastSavedColors(colors);
      setLastSavedUniform(colorsUniform);
      setLastSavedVideoMode(videoMode);
      setLastSavedAgencyVideoUrl(normalizedAgencyVideoUrl);

      lastServerFingerprintRef.current = JSON.stringify({
        colors,
        colorsUniform,
        videoMode,
        agencyVideoUrl: normalizedAgencyVideoUrl,
      });

      toast({
        title: "Enregistré",
        description:
          videoMode === "agency"
            ? "Charte et vidéo agence enregistrées. Tous les collaborateurs utiliseront la vidéo de l’agence."
            : "Charte enregistrée. Les collaborateurs peuvent utiliser leur propre vidéo.",
      });
    } catch (e) {
      console.error("AgencyColorsToggle save error:", e);
      toast({
        title: "Erreur",
        description: e?.message || "Impossible d’enregistrer la charte.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [
    agencyId,
    isLockedUi,
    lockColors,
    hasInvalidColors,
    colors,
    colorsUniform,
    lastSavedUniform,
    lastSavedColors,
    videoMode,
    lastSavedVideoMode,
    agencyVideoUrl,
    lastSavedAgencyVideoUrl,
    updateAgency,
    fallbackUpdateAgency,
    onAgencyUpdated,
    toast,
  ]);

  const onToggleUniform = useCallback(
    (checked) => {
      if (isLockedUi || isSaving) return;

      if (checked) {
        setConfirmUniformOn(true);
        return;
      }

      setColorsUniform(false);
    },
    [isLockedUi, isSaving]
  );

  const confirmUniform = useCallback(() => {
    setColors((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(DEFAULT_COLORS)) {
        const v = normalizeHex(String(next[k] || ""));
        next[k] = isHexColor(v) ? v : DEFAULT_COLORS[k];
      }
      return next;
    });

    setColorsUniform(true);
    setConfirmUniformOn(false);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-brand-blue" />
          Personnalisation Carte Digitale
        </CardTitle>
        <CardDescription>
          Définissez la charte graphique de l’agence et la logique vidéo appliquée aux collaborateurs.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {(lockColors || !canEditColors) && (
          <Alert className="bg-slate-50 border-slate-200">
            <Lock className="h-4 w-4 text-slate-500" />
            <AlertTitle>Personnalisation verrouillée</AlertTitle>
            <AlertDescription className="text-xs text-slate-500">
              {lockColors
                ? "Les couleurs de l’agence sont verrouillées."
                : "Vos droits ne permettent pas de modifier la charte graphique."}
            </AlertDescription>
          </Alert>
        )}

        {isDirector && (
          <div className="flex items-center justify-between rounded-lg border p-4 bg-gray-50/50">
            <div className="space-y-0.5">
              <Label className="text-base font-semibold">Mode uniforme</Label>
              <p className="text-sm text-gray-500">
                {colorsUniform
                  ? "Uniforme : toute l’équipe utilisera ces couleurs."
                  : "Non uniforme : chaque pro garde ses couleurs."}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                {colorsUniform ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                {colorsUniform ? "Uniforme" : "Libre"}
              </div>
              <Switch
                checked={colorsUniform}
                onCheckedChange={onToggleUniform}
                disabled={isLockedUi || isSaving}
              />
            </div>
          </div>
        )}

        {isDirector && (
          <Card className="border border-slate-200 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Video className="h-4 w-4 text-brand-blue" />
                Vidéo de présentation des collaborateurs
              </CardTitle>
              <CardDescription>
                Choisissez si tous les collaborateurs affichent la même vidéo agence ou s’ils peuvent renseigner leur propre vidéo.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="flex items-center justify-between rounded-lg border p-4 bg-slate-50/70">
                <div className="space-y-1">
                  <Label className="text-sm font-semibold">
                    Utiliser une vidéo agence commune
                  </Label>
                  <p className="text-xs text-slate-500">
                    Activé : tous les directeurs, team leaders et agents affiliés affichent la vidéo de l’agence.
                    Désactivé : chaque professionnel peut renseigner sa propre vidéo.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    {videoMode === "agency" ? (
                      <>
                        <Lock className="h-3 w-3" />
                        Vidéo agence
                      </>
                    ) : (
                      <>
                        <Unlock className="h-3 w-3" />
                        Vidéo personnelle
                      </>
                    )}
                  </div>

                  <Switch
                    checked={videoMode === "agency"}
                    onCheckedChange={(checked) => setVideoMode(checked ? "agency" : "personal")}
                    disabled={isLockedUi || isSaving}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="agency_video_external_url"
                  className="flex items-center gap-2 text-sm font-medium text-gray-700"
                >
                  <Link2 className="w-3.5 h-3.5 text-slate-400" />
                  URL de la vidéo agence
                </Label>

                <Input
                  id="agency_video_external_url"
                  value={agencyVideoUrl}
                  onChange={(e) => setAgencyVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/... ou https://vimeo.com/..."
                  disabled={isLockedUi || isSaving}
                />

                <p className="text-xs text-muted-foreground">
                  Cette URL sera utilisée uniquement si le mode <span className="font-medium">vidéo agence</span> est activé.
                </p>
              </div>

              {videoMode === "agency" && !normalizeUrlInput(agencyVideoUrl) && (
                <Alert className="bg-amber-50 border-amber-200">
                  <Video className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-800">Vidéo agence non renseignée</AlertTitle>
                  <AlertDescription className="text-xs text-amber-700">
                    Le mode vidéo agence est activé, mais aucune URL vidéo n’est encore définie.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-slate-500 border-b pb-2">
                  Couleurs Principales
                </h3>

                <ColorInput
                  id="card_banner_color"
                  label="Bannière (Fond haut)"
                  value={colors.card_banner_color}
                  onChange={handleColorChange}
                  disabled={isLockedUi || isSaving}
                />
                <ColorInput
                  id="card_text_color"
                  label="Texte Principal"
                  value={colors.card_text_color}
                  onChange={handleColorChange}
                  disabled={isLockedUi || isSaving}
                />
                <ColorInput
                  id="card_primary_button_color"
                  label="Bouton Principal"
                  value={colors.card_primary_button_color}
                  onChange={handleColorChange}
                  disabled={isLockedUi || isSaving}
                />
                <ColorInput
                  id="card_secondary_button_color"
                  label="Bouton Secondaire"
                  value={colors.card_secondary_button_color}
                  onChange={handleColorChange}
                  disabled={isLockedUi || isSaving}
                />
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-slate-500 border-b pb-2">
                  Détails & Textes
                </h3>

                <ColorInput
                  id="card_name_color"
                  label="Nom & Prénom"
                  value={colors.card_name_color}
                  onChange={handleColorChange}
                  disabled={isLockedUi || isSaving}
                />
                <ColorInput
                  id="card_signature_color"
                  label="Signature (Fonction)"
                  value={colors.card_signature_color}
                  onChange={handleColorChange}
                  disabled={isLockedUi || isSaving}
                />
                <ColorInput
                  id="card_company_name_color"
                  label="Nom Entreprise"
                  value={colors.card_company_name_color}
                  onChange={handleColorChange}
                  disabled={isLockedUi || isSaving}
                />
                <ColorInput
                  id="card_support_text_color"
                  label="Textes secondaires (Bio)"
                  value={colors.card_support_text_color}
                  onChange={handleColorChange}
                  disabled={isLockedUi || isSaving}
                />
                <ColorInput
                  id="card_qr_fg_color"
                  label="QR Code (Premier plan)"
                  value={colors.card_qr_fg_color}
                  onChange={handleColorChange}
                  disabled={isLockedUi || isSaving}
                />
              </div>
            </div>

            {hasInvalidColors && (
              <p className="text-xs text-amber-600">
                Certaines valeurs ne sont pas valides. Utilisez le format{" "}
                <span className="font-mono">#RRGGBB</span>.
              </p>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t">
              <Button
                variant="ghost"
                onClick={handleResetDefaults}
                disabled={isLockedUi || isSaving}
                className="text-slate-500"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Réinitialiser par défaut
              </Button>

              <Button
                onClick={doSave}
                disabled={isLockedUi || isSaving || !dirty || hasInvalidColors}
                className="bg-brand-blue hover:bg-blue-700 w-full sm:w-auto"
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Enregistrer le design
              </Button>
            </div>
          </div>

          <div className="lg:sticky lg:top-24 self-start space-y-3">
            <div className="flex items-center gap-2 font-semibold text-gray-900">
              <Eye className="h-4 w-4" />
              Prévisualisation (carte)
            </div>
            <CardPreview
              agency={agency}
              colors={colors}
              uniform={colorsUniform}
              videoMode={videoMode}
              agencyVideoUrl={agencyVideoUrl}
            />
          </div>
        </div>

        <AlertDialog open={confirmUniformOn} onOpenChange={setConfirmUniformOn}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Activer le mode uniforme ?</AlertDialogTitle>
              <AlertDialogDescription>
                En activant le mode uniforme, <strong>tous les membres</strong> utiliseront
                instantanément les couleurs de l’agence. Leurs personnalisations seront masquées.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmUniform}
                className="bg-brand-blue hover:bg-brand-blue/90"
              >
                Confirmer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

function CardPreview({ agency, colors, uniform, videoMode, agencyVideoUrl }) {
  const agencyName = agency?.name || "Votre Agence";
  const network = agency?.network_name || "";
  const logoUrl = agency?.logo_url || "";

  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      <div
        style={{ backgroundColor: colors.card_banner_color, color: colors.card_text_color }}
        className="px-5 py-4"
      >
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo agence"
              className="h-11 w-11 rounded-lg bg-white/90 object-contain p-1"
            />
          ) : (
            <div className="h-11 w-11 rounded-lg bg-white/20" />
          )}

          <div className="min-w-0">
            <div className="text-xs opacity-90">Carte (aperçu)</div>
            <div className="font-semibold truncate">{agencyName}</div>
            {network ? <div className="text-xs opacity-90 truncate">{network}</div> : null}
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="space-y-1">
          <div className="text-lg font-bold" style={{ color: colors.card_name_color }}>
            Prénom Nom
          </div>
          <div className="text-sm" style={{ color: colors.card_signature_color }}>
            Conseiller immobilier
          </div>
          <div className="text-sm" style={{ color: colors.card_company_name_color }}>
            {agencyName}
          </div>
          <div className="text-sm" style={{ color: colors.card_support_text_color }}>
            Une courte description de profil apparaît ici (bio).
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="w-full rounded-xl py-2 text-sm font-semibold"
            style={{ backgroundColor: colors.card_primary_button_color, color: "#fff" }}
          >
            Bouton principal
          </button>

          <button
            type="button"
            className="w-full rounded-xl py-2 text-sm font-semibold border"
            style={{
              backgroundColor: "transparent",
              borderColor: colors.card_secondary_button_color,
              color: colors.card_secondary_button_color,
            }}
          >
            Bouton secondaire
          </button>
        </div>

        <div className="rounded-xl border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {uniform ? "Uniforme activé" : "Non uniforme"}
            </div>
            <div
              className="h-8 w-8 rounded-md border"
              title="QR (aperçu)"
              style={{
                borderColor: colors.card_qr_fg_color,
                background: "linear-gradient(135deg, rgba(0,0,0,0.04), rgba(0,0,0,0.02))",
              }}
            />
          </div>

          <div className="text-xs text-muted-foreground">
            {videoMode === "agency"
              ? agencyVideoUrl
                ? "Vidéo agence commune activée."
                : "Vidéo agence commune activée, mais URL non renseignée."
              : "Chaque collaborateur peut utiliser sa propre vidéo."}
          </div>
        </div>
      </div>
    </div>
  );
}