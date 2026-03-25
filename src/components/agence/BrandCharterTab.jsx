import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/customSupabaseClient";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Loader2,
  Save,
  RotateCcw,
  Lock,
  Unlock,
  Info,
  QrCode,
} from "lucide-react";
import { useAgencyPermissions } from "@/hooks/useAgencyPermissions";
import ColorPickerField from "./ColorPickerField";
import DigitalCardPreview from "./DigitalCardPreview";
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

const PREMIUM_CARD_TABLE = "premium_professionnel_cards";

const DEFAULT_COLORS = {
  card_banner_color: "#3b82f6",
  card_text_color: "#1e293b",
  card_primary_button_color: "#000000",
  card_secondary_button_color: "#ffffff",
  card_name_color: "#1e293b",
  card_signature_color: "#64748b",
  card_company_name_color: "#3b82f6",
  card_support_text_color: "#94a3b8",
  card_qr_fg_color: "#000000",
};

const pick = (...vals) => {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v;
  }
  return "";
};

const normalizeHex = (v) => {
  const s = String(v || "").trim();
  if (!s) return "";
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s)) return s.toUpperCase();
  return s;
};

const isUuid = (v) =>
  typeof v === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    String(v).trim()
  );

const normalizeUuidTextOrNull = (v) => {
  const s = String(v ?? "").trim();
  return isUuid(s) ? s : null;
};

function buildDefaultColors() {
  return { ...DEFAULT_COLORS };
}

function sanitizeColors(input = {}) {
  return {
    card_banner_color: normalizeHex(input.card_banner_color) || DEFAULT_COLORS.card_banner_color,
    card_text_color: normalizeHex(input.card_text_color) || DEFAULT_COLORS.card_text_color,
    card_primary_button_color:
      normalizeHex(input.card_primary_button_color) || DEFAULT_COLORS.card_primary_button_color,
    card_secondary_button_color:
      normalizeHex(input.card_secondary_button_color) || DEFAULT_COLORS.card_secondary_button_color,
    card_name_color: normalizeHex(input.card_name_color) || DEFAULT_COLORS.card_name_color,
    card_signature_color: normalizeHex(input.card_signature_color) || DEFAULT_COLORS.card_signature_color,
    card_company_name_color:
      normalizeHex(input.card_company_name_color) || DEFAULT_COLORS.card_company_name_color,
    card_support_text_color:
      normalizeHex(input.card_support_text_color) || DEFAULT_COLORS.card_support_text_color,
    card_qr_fg_color: normalizeHex(input.card_qr_fg_color) || DEFAULT_COLORS.card_qr_fg_color,
  };
}

function buildInitialColors({
  isIndependent,
  isDirector,
  isFreeCustomizationColors,
  agency,
  professionnel,
}) {
  if (isIndependent) {
    const pro = professionnel || {};
    return sanitizeColors({
      card_banner_color: pick(pro.card_banner_color, DEFAULT_COLORS.card_banner_color),
      card_text_color: pick(pro.card_text_color, DEFAULT_COLORS.card_text_color),
      card_primary_button_color: pick(
        pro.card_primary_button_color,
        DEFAULT_COLORS.card_primary_button_color
      ),
      card_secondary_button_color: pick(
        pro.card_secondary_button_color,
        DEFAULT_COLORS.card_secondary_button_color
      ),
      card_name_color: pick(pro.card_name_color, DEFAULT_COLORS.card_name_color),
      card_signature_color: pick(pro.card_signature_color, DEFAULT_COLORS.card_signature_color),
      card_company_name_color: pick(
        pro.card_company_name_color,
        DEFAULT_COLORS.card_company_name_color
      ),
      card_support_text_color: pick(
        pro.card_support_text_color,
        DEFAULT_COLORS.card_support_text_color
      ),
      card_qr_fg_color: pick(pro.card_qr_fg_color, DEFAULT_COLORS.card_qr_fg_color),
    });
  }

  if (isDirector) {
    return sanitizeColors({
      card_banner_color: pick(agency?.card_banner_color, DEFAULT_COLORS.card_banner_color),
      card_text_color: pick(agency?.card_text_color, DEFAULT_COLORS.card_text_color),
      card_primary_button_color: pick(
        agency?.card_primary_button_color,
        DEFAULT_COLORS.card_primary_button_color
      ),
      card_secondary_button_color: pick(
        agency?.card_secondary_button_color,
        DEFAULT_COLORS.card_secondary_button_color
      ),
      card_name_color: pick(agency?.card_name_color, DEFAULT_COLORS.card_name_color),
      card_signature_color: pick(
        agency?.card_signature_color,
        DEFAULT_COLORS.card_signature_color
      ),
      card_company_name_color: pick(
        agency?.card_company_name_color,
        DEFAULT_COLORS.card_company_name_color
      ),
      card_support_text_color: pick(
        agency?.card_support_text_color,
        DEFAULT_COLORS.card_support_text_color
      ),
      card_qr_fg_color: pick(agency?.card_qr_fg_color, DEFAULT_COLORS.card_qr_fg_color),
    });
  }

  if (isFreeCustomizationColors) {
    const custom = professionnel?.custom_brand_colors || {};
    return sanitizeColors({
      card_banner_color: pick(
        custom.card_banner_color,
        agency?.card_banner_color,
        DEFAULT_COLORS.card_banner_color
      ),
      card_text_color: pick(
        custom.card_text_color,
        agency?.card_text_color,
        DEFAULT_COLORS.card_text_color
      ),
      card_primary_button_color: pick(
        custom.card_primary_button_color,
        agency?.card_primary_button_color,
        DEFAULT_COLORS.card_primary_button_color
      ),
      card_secondary_button_color: pick(
        custom.card_secondary_button_color,
        agency?.card_secondary_button_color,
        DEFAULT_COLORS.card_secondary_button_color
      ),
      card_name_color: pick(
        custom.card_name_color,
        agency?.card_name_color,
        DEFAULT_COLORS.card_name_color
      ),
      card_signature_color: pick(
        custom.card_signature_color,
        agency?.card_signature_color,
        DEFAULT_COLORS.card_signature_color
      ),
      card_company_name_color: pick(
        custom.card_company_name_color,
        agency?.card_company_name_color,
        DEFAULT_COLORS.card_company_name_color
      ),
      card_support_text_color: pick(
        custom.card_support_text_color,
        agency?.card_support_text_color,
        DEFAULT_COLORS.card_support_text_color
      ),
      card_qr_fg_color: pick(
        custom.card_qr_fg_color,
        agency?.card_qr_fg_color,
        DEFAULT_COLORS.card_qr_fg_color
      ),
    });
  }

  return sanitizeColors({
    card_banner_color: pick(agency?.card_banner_color, DEFAULT_COLORS.card_banner_color),
    card_text_color: pick(agency?.card_text_color, DEFAULT_COLORS.card_text_color),
    card_primary_button_color: pick(
      agency?.card_primary_button_color,
      DEFAULT_COLORS.card_primary_button_color
    ),
    card_secondary_button_color: pick(
      agency?.card_secondary_button_color,
      DEFAULT_COLORS.card_secondary_button_color
    ),
    card_name_color: pick(agency?.card_name_color, DEFAULT_COLORS.card_name_color),
    card_signature_color: pick(
      agency?.card_signature_color,
      DEFAULT_COLORS.card_signature_color
    ),
    card_company_name_color: pick(
      agency?.card_company_name_color,
      DEFAULT_COLORS.card_company_name_color
    ),
    card_support_text_color: pick(
      agency?.card_support_text_color,
      DEFAULT_COLORS.card_support_text_color
    ),
    card_qr_fg_color: pick(agency?.card_qr_fg_color, DEFAULT_COLORS.card_qr_fg_color),
  });
}

function buildInitFingerprint({
  safeAgencyId,
  professionnel,
  agency,
  isIndependent,
  isDirector,
  isFreeCustomizationColors,
}) {
  return JSON.stringify({
    safeAgencyId: safeAgencyId || null,
    proId: professionnel?.id || null,
    proUpdatedAt: professionnel?.updated_at || null,
    agencyUpdatedAt: agency?.updated_at || null,
    premiumCardId: professionnel?.premium_professionnel_card || null,
    isIndependent,
    isDirector,
    isFreeCustomizationColors,
    qr_code_with_logo: !!agency?.qr_code_with_logo,
    agencyColors: agency
      ? {
          card_banner_color: agency.card_banner_color ?? null,
          card_text_color: agency.card_text_color ?? null,
          card_primary_button_color: agency.card_primary_button_color ?? null,
          card_secondary_button_color: agency.card_secondary_button_color ?? null,
          card_name_color: agency.card_name_color ?? null,
          card_signature_color: agency.card_signature_color ?? null,
          card_company_name_color: agency.card_company_name_color ?? null,
          card_support_text_color: agency.card_support_text_color ?? null,
          card_qr_fg_color: agency.card_qr_fg_color ?? null,
        }
      : null,
    proColors: professionnel
      ? {
          card_banner_color: professionnel.card_banner_color ?? null,
          card_text_color: professionnel.card_text_color ?? null,
          card_primary_button_color: professionnel.card_primary_button_color ?? null,
          card_secondary_button_color: professionnel.card_secondary_button_color ?? null,
          card_name_color: professionnel.card_name_color ?? null,
          card_signature_color: professionnel.card_signature_color ?? null,
          card_company_name_color: professionnel.card_company_name_color ?? null,
          card_support_text_color: professionnel.card_support_text_color ?? null,
          card_qr_fg_color: professionnel.card_qr_fg_color ?? null,
          custom_brand_colors: professionnel.custom_brand_colors ?? null,
        }
      : null,
  });
}

async function saveIndependentPremiumColors(professionnel, safeColors, nowIso) {
  const professionnelId = String(professionnel?.id || "").trim();
  const premiumCardId = normalizeUuidTextOrNull(professionnel?.premium_professionnel_card);

  if (!professionnelId) {
    throw new Error("Profil professionnel introuvable.");
  }

  if (!premiumCardId) {
    throw new Error(
      "Aucune carte premium liée à ce profil. Les couleurs des indépendants doivent être enregistrées dans premium_professionnel_cards."
    );
  }

  const { data: premiumRow, error: premiumCheckError } = await supabase
    .from(PREMIUM_CARD_TABLE)
    .select("id, professionnel_id")
    .eq("id", premiumCardId)
    .maybeSingle();

  if (premiumCheckError) throw premiumCheckError;

  if (!premiumRow?.id) {
    throw new Error("Carte premium introuvable.");
  }

  if (String(premiumRow.professionnel_id || "") !== professionnelId) {
    throw new Error("Carte premium incohérente avec le profil professionnel.");
  }

  const { error: updateError } = await supabase
    .from(PREMIUM_CARD_TABLE)
    .update({
      ...safeColors,
      updated_at: nowIso,
    })
    .eq("id", premiumCardId);

  if (updateError) throw updateError;
}

export default function BrandCharterTab({ agencyId }) {
  const { toast } = useToast();

  const {
    loading: permLoading,
    isDirector,
    isIndependent,
    isInAgency,
    agency,
    professionnel,
    canModifyColors,
    isFreeCustomizationColors,
    colorsMessage,
    refetch,
  } = useAgencyPermissions(agencyId);

  const [saving, setSaving] = useState(false);
  const [pendingUniformToggle, setPendingUniformToggle] = useState(false);
  const [colors, setColors] = useState(buildDefaultColors());
  const [agencyQrWithLogo, setAgencyQrWithLogo] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const lastInitRef = useRef("");

  const safeAgencyId = useMemo(() => agency?.id || agencyId || null, [agency?.id, agencyId]);

  const initFingerprint = useMemo(
    () =>
      buildInitFingerprint({
        safeAgencyId,
        professionnel,
        agency,
        isIndependent,
        isDirector,
        isFreeCustomizationColors,
      }),
    [
      safeAgencyId,
      professionnel,
      agency,
      isIndependent,
      isDirector,
      isFreeCustomizationColors,
    ]
  );

  useEffect(() => {
    if (permLoading) return;
    if (isInAgency && !agency) return;
    if (isDirty) return;
    if (lastInitRef.current === initFingerprint) return;

    const initialColors = buildInitialColors({
      isIndependent,
      isDirector,
      isFreeCustomizationColors,
      agency,
      professionnel,
    });

    setColors(initialColors);
    setAgencyQrWithLogo(!!agency?.qr_code_with_logo);
    lastInitRef.current = initFingerprint;
  }, [
    permLoading,
    isInAgency,
    agency,
    professionnel,
    isIndependent,
    isDirector,
    isFreeCustomizationColors,
    initFingerprint,
    isDirty,
  ]);

  const handleColorChange = (key, value) => {
    setColors((prev) =>
      sanitizeColors({
        ...prev,
        [key]: value,
      })
    );
    setIsDirty(true);
  };

  const handleQrToggle = (checked) => {
    setAgencyQrWithLogo(!!checked);
    setIsDirty(true);
  };

  const handleReset = () => {
    if (isIndependent) {
      setColors(buildDefaultColors());
      setIsDirty(true);
      return;
    }

    if (isDirector) {
      setColors(buildDefaultColors());
      setAgencyQrWithLogo(false);
      setIsDirty(true);
      return;
    }

    const initialColors = buildInitialColors({
      isIndependent,
      isDirector,
      isFreeCustomizationColors,
      agency,
      professionnel,
    });

    setColors(initialColors);
    setIsDirty(true);
  };

  const confirmUniformToggle = async (targetUniformState) => {
    if (!safeAgencyId) return;

    try {
      const { error } = await supabase
        .from("agencies")
        .update({
          colors_uniform: !!targetUniformState,
          updated_at: new Date().toISOString(),
        })
        .eq("id", safeAgencyId);

      if (error) throw error;

      toast({
        title: targetUniformState
          ? "Charte uniforme activée"
          : "Personnalisation libre activée",
        description: targetUniformState
          ? "Tous les membres utilisent instantanément les couleurs de l'agence."
          : "Les membres peuvent personnaliser leurs couleurs selon leurs droits.",
      });

      setPendingUniformToggle(false);
      setIsDirty(false);
      await refetch?.();
    } catch (err) {
      console.error("[BrandCharterTab] confirmUniformToggle error:", err);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de modifier le mode de charte.",
      });
      setPendingUniformToggle(false);
    }
  };

  const handleToggleChange = (checkedFree) => {
    if (!safeAgencyId) return;

    if (!checkedFree) {
      setPendingUniformToggle(true);
      return;
    }

    confirmUniformToggle(false);
  };

  const handleSave = async () => {
    if (isIndependent && !professionnel?.id) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Profil professionnel introuvable.",
      });
      return;
    }

    if (!isIndependent && isDirector && !safeAgencyId) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Agence introuvable.",
      });
      return;
    }

    setSaving(true);

    try {
      const nowIso = new Date().toISOString();
      const safeColors = sanitizeColors(colors);

      if (isIndependent) {
        await saveIndependentPremiumColors(professionnel, safeColors, nowIso);

        setIsDirty(false);
        toast({
          title: "Sauvegardé",
          description: "Vos couleurs ont été mises à jour.",
        });
        await refetch?.();
        return;
      }

      if (isDirector) {
        const { error } = await supabase
          .from("agencies")
          .update({
            ...safeColors,
            qr_code_with_logo: !!agencyQrWithLogo,
            updated_at: nowIso,
          })
          .eq("id", safeAgencyId);

        if (error) throw error;

        setIsDirty(false);
        toast({
          title: "Sauvegardé",
          description: "La charte graphique et le réglage QR Code de l’agence ont été mis à jour.",
        });
        await refetch?.();
        return;
      }

      const { error } = await supabase
        .from("professionnels")
        .update({
          custom_brand_colors: safeColors,
          updated_at: nowIso,
        })
        .eq("id", professionnel.id);

      if (error) throw error;

      setIsDirty(false);
      toast({
        title: "Sauvegardé",
        description: "Vos préférences de couleurs ont été enregistrées.",
      });
      await refetch?.();
    } catch (err) {
      console.error("[BrandCharterTab] handleSave error:", err);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err?.message || "Impossible d'enregistrer la charte graphique.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (permLoading) {
    return (
      <div className="p-16 flex justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-brand-blue" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-in fade-in duration-500 pb-16">
      <div className="xl:col-span-7 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Charte Graphique</h3>
              <p className="text-sm text-gray-500 mt-1">
                Personnalisez l&apos;identité visuelle de votre carte.
              </p>
            </div>

            {isDirector && !!safeAgencyId && (
              <div
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-full border transition-all ${
                  isFreeCustomizationColors
                    ? "bg-blue-50 border-blue-200"
                    : "bg-gray-100 border-gray-200"
                }`}
              >
                <Switch
                  id="free-colors"
                  checked={!!isFreeCustomizationColors}
                  onCheckedChange={handleToggleChange}
                  className="data-[state=checked]:bg-brand-blue"
                />
                <Label
                  htmlFor="free-colors"
                  className="text-sm font-medium cursor-pointer select-none flex items-center gap-2"
                >
                  {isFreeCustomizationColors ? (
                    <span className="text-brand-blue flex items-center gap-1">
                      <Unlock className="w-3 h-3" />
                      Personnalisation libre
                    </span>
                  ) : (
                    <span className="text-gray-600 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Charte uniforme
                    </span>
                  )}
                </Label>
              </div>
            )}
          </div>

          <div
            className={`mt-4 p-4 rounded-lg flex items-start gap-3 text-sm ${
              isFreeCustomizationColors ? "bg-blue-50 text-blue-800" : "bg-gray-50 text-gray-600"
            }`}
          >
            <Info className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{colorsMessage}</p>
          </div>

          {isDirty && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Vous avez des modifications non enregistrées.
            </div>
          )}
        </div>

        {isDirector && !!safeAgencyId && (
          <Card className="shadow-md border-0 ring-1 ring-slate-100">
            <CardHeader className="pb-4 border-b border-slate-50">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <QrCode className="w-4 h-4" />
                QR Code de l&apos;équipe
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-4 border rounded-lg p-4">
                <div className="space-y-1">
                  <Label htmlFor="agency-qr-logo" className="text-sm font-medium cursor-pointer">
                    Intégrer le logo de l&apos;agence dans le QR Code
                  </Label>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Si cette option est activée, tous les membres de l&apos;agence utiliseront
                    le logo de l&apos;agence dans leur QR Code.
                  </p>
                </div>

                <Switch
                  id="agency-qr-logo"
                  checked={!!agencyQrWithLogo}
                  onCheckedChange={handleQrToggle}
                  className="data-[state=checked]:bg-brand-blue"
                />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card
            className={`shadow-md border-0 ring-1 ring-slate-100 ${
              !canModifyColors ? "opacity-70 grayscale-[0.2]" : ""
            }`}
          >
            <CardHeader className="pb-4 border-b border-slate-50">
              <CardTitle className="text-base font-semibold">Couleurs Principales</CardTitle>
            </CardHeader>

            <CardContent className="pt-6 space-y-1">
              <ColorPickerField
                label="Bannière"
                value={colors.card_banner_color}
                onChange={(v) => handleColorChange("card_banner_color", v)}
                disabled={!canModifyColors}
              />
              <ColorPickerField
                label="Texte Principal"
                value={colors.card_text_color}
                onChange={(v) => handleColorChange("card_text_color", v)}
                disabled={!canModifyColors}
              />
              <ColorPickerField
                label="Bouton Principal"
                value={colors.card_primary_button_color}
                onChange={(v) => handleColorChange("card_primary_button_color", v)}
                disabled={!canModifyColors}
              />
              <ColorPickerField
                label="Bouton Secondaire"
                value={colors.card_secondary_button_color}
                onChange={(v) => handleColorChange("card_secondary_button_color", v)}
                disabled={!canModifyColors}
              />
            </CardContent>
          </Card>

          <Card
            className={`shadow-md border-0 ring-1 ring-slate-100 ${
              !canModifyColors ? "opacity-70 grayscale-[0.2]" : ""
            }`}
          >
            <CardHeader className="pb-4 border-b border-slate-50">
              <CardTitle className="text-base font-semibold">Détails & Textes</CardTitle>
            </CardHeader>

            <CardContent className="pt-6 space-y-1">
              <ColorPickerField
                label="Nom & Prénom"
                value={colors.card_name_color}
                onChange={(v) => handleColorChange("card_name_color", v)}
                disabled={!canModifyColors}
              />
              <ColorPickerField
                label="Signature (Rôle)"
                value={colors.card_signature_color}
                onChange={(v) => handleColorChange("card_signature_color", v)}
                disabled={!canModifyColors}
              />
              <ColorPickerField
                label="Nom Entreprise"
                value={colors.card_company_name_color}
                onChange={(v) => handleColorChange("card_company_name_color", v)}
                disabled={!canModifyColors}
              />
              <ColorPickerField
                label="Textes secondaires"
                value={colors.card_support_text_color}
                onChange={(v) => handleColorChange("card_support_text_color", v)}
                disabled={!canModifyColors}
              />
              <ColorPickerField
                label="QR Code"
                value={colors.card_qr_fg_color}
                onChange={(v) => handleColorChange("card_qr_fg_color", v)}
                disabled={!canModifyColors}
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6 border-t border-slate-100">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={saving}
            className="text-slate-600 hover:text-slate-900 border-slate-200"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Réinitialiser
          </Button>

          <Button
            onClick={handleSave}
            disabled={saving || (!isDirty && !isIndependent)}
            className="bg-brand-blue hover:bg-blue-700 text-white min-w-[220px] shadow-lg shadow-blue-900/20"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}

            {isIndependent
              ? "Enregistrer mes couleurs"
              : isDirector
              ? "Enregistrer pour l'agence"
              : "Enregistrer mes préférences"}
          </Button>
        </div>
      </div>

      <div className="xl:col-span-5">
        <div className="sticky top-8">
          <DigitalCardPreview
            agencyData={{
              ...(agency || {}),
              ...colors,
              qr_code_with_logo: !!agencyQrWithLogo,
            }}
            proData={professionnel}
            overrides={colors}
          />
        </div>
      </div>

      <AlertDialog
        open={pendingUniformToggle === true}
        onOpenChange={() => setPendingUniformToggle(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activer la charte uniforme ?</AlertDialogTitle>
            <AlertDialogDescription>
              En activant la charte uniforme, <strong>tous les membres de l&apos;équipe</strong>
              utiliseront instantanément les couleurs définies par l&apos;agence. Leurs
              personnalisations existantes seront masquées.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmUniformToggle(true)}
              className="bg-brand-blue"
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}