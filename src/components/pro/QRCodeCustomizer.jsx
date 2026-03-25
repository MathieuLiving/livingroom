import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/customSupabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { getPublicCvdUrl } from "@/utils/cvdHelpers";
import QRCodeGenerator from "../QRCodeGenerator";

import {
  Loader2,
  Download,
  Save,
  RefreshCw,
  Lock,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

import { Switch } from "@/components/ui/switch";

const DEFAULT_FG = "#005E9E";
const CARD_SITE_URL = "https://card.livingroom.immo";

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || "").replace(/\/+$/, "");
const PUBLIC_STORAGE_BASE = SUPABASE_URL ? `${SUPABASE_URL}/storage/v1/object/public` : "";

const normalizeHex = (v) => {
  const s = String(v || "").trim();
  if (!s) return "";
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s)) return s.toUpperCase();
  return s;
};

const normalizeSlug = (value) => String(value || "").trim();

const buildQrTrackingUrlFromSlug = (slug) => {
  const safeSlug = normalizeSlug(slug);
  if (!safeSlug) return "";
  return `${CARD_SITE_URL}/qr/${encodeURIComponent(safeSlug)}`;
};

function isAgencyMember(profile) {
  return !!profile?.agency_id;
}

function publicUrlFrom(bucket, path) {
  const p = String(path || "").trim();
  if (!p || !PUBLIC_STORAGE_BASE) return "";
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
  return `${PUBLIC_STORAGE_BASE}/${bucket}/${p}`;
}

async function resolveProfessionnelIdentity(profile) {
  const profileId = String(profile?.id || "").trim();
  const profileUserId = String(profile?.user_id || "").trim();

  if (profileId && profileUserId) {
    return {
      professionnelId: profileId,
      userId: profileUserId,
    };
  }

  if (!profileId) {
    return {
      professionnelId: null,
      userId: null,
    };
  }

  const byId = await supabase
    .from("professionnels")
    .select("id,user_id,card_slug")
    .eq("id", profileId)
    .maybeSingle();

  if (!byId.error && byId.data) {
    return {
      professionnelId: String(byId.data.id || "").trim() || profileId,
      userId: String(byId.data.user_id || "").trim() || profileUserId || profileId,
      cardSlug: String(byId.data.card_slug || "").trim(),
    };
  }

  const byUser = await supabase
    .from("professionnels")
    .select("id,user_id,card_slug")
    .eq("user_id", profileId)
    .maybeSingle();

  if (!byUser.error && byUser.data) {
    return {
      professionnelId: String(byUser.data.id || "").trim() || profileId,
      userId: String(byUser.data.user_id || "").trim() || profileUserId || profileId,
      cardSlug: String(byUser.data.card_slug || "").trim(),
    };
  }

  return {
    professionnelId: profileId || null,
    userId: profileUserId || profileId || null,
    cardSlug: String(profile?.card_slug || "").trim(),
  };
}

export default function QRCodeCustomizer({ profile, onUpdate }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [resolvedCardSlug, setResolvedCardSlug] = useState(
    String(profile?.card_slug || "").trim()
  );

  const agency = profile?.agency || null;

  const memberOfAgency = isAgencyMember(profile);
  const isIndependent = !memberOfAgency;

  // seuls les indépendants modifient le QR depuis leur profil
  const canEditQrHere = isIndependent;

  const inheritedAgencyWithLogo =
    !!profile?.agency_qr_code_with_logo || !!agency?.qr_code_with_logo;

  const personalWithLogo =
    typeof profile?.qr_code_with_logo === "boolean"
      ? !!profile.qr_code_with_logo
      : !!profile?.own_qr_code_with_logo;

  const effectiveProfileQrColor =
    normalizeHex(profile?.card_qr_fg_color) || DEFAULT_FG;

  const [fgColor, setFgColor] = useState(effectiveProfileQrColor);

  const [withLogo, setWithLogo] = useState(
    memberOfAgency ? inheritedAgencyWithLogo : personalWithLogo
  );

  useEffect(() => {
    setFgColor(normalizeHex(profile?.card_qr_fg_color) || DEFAULT_FG);

    setWithLogo(
      memberOfAgency ? inheritedAgencyWithLogo : personalWithLogo
    );
  }, [
    profile?.card_qr_fg_color,
    profile?.qr_code_with_logo,
    profile?.own_qr_code_with_logo,
    profile?.agency_qr_code_with_logo,
    agency?.qr_code_with_logo,
    memberOfAgency,
    inheritedAgencyWithLogo,
    personalWithLogo,
  ]);

  useEffect(() => {
    setResolvedCardSlug(String(profile?.card_slug || "").trim());
  }, [profile?.card_slug]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (String(profile?.card_slug || "").trim()) return;

      try {
        const identity = await resolveProfessionnelIdentity(profile);
        const fetchedSlug = String(identity?.cardSlug || "").trim();

        if (!cancelled && fetchedSlug) {
          setResolvedCardSlug(fetchedSlug);
        }
      } catch (error) {
        console.error("QRCodeCustomizer resolve card slug error:", error);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [profile]);

  const canvasId = "professional-qr-customizer";

  const publicUrlBase = useMemo(
    () => String(getPublicCvdUrl(profile) || "").trim(),
    [profile]
  );

  const qrTargetUrl = useMemo(
    () => buildQrTrackingUrlFromSlug(resolvedCardSlug),
    [resolvedCardSlug]
  );

  const effectiveWithLogo = memberOfAgency
    ? inheritedAgencyWithLogo
    : !!withLogo;

  const effectiveFgColor = normalizeHex(fgColor) || DEFAULT_FG;

  const handleColorChange = (e) => {
    setFgColor(e.target.value);
  };

  const handleSave = async () => {
    if (!profile?.id || !canEditQrHere) return;

    setLoading(true);

    try {
      const identity = await resolveProfessionnelIdentity(profile);
      const professionnelId = identity?.professionnelId;
      const fetchedSlug = String(identity?.cardSlug || "").trim();

      if (!professionnelId) {
        throw new Error("Identifiant professionnel introuvable.");
      }

      if (fetchedSlug && fetchedSlug !== resolvedCardSlug) {
        setResolvedCardSlug(fetchedSlug);
      }

      const nowIso = new Date().toISOString();

      const proPayload = {
        card_qr_fg_color: effectiveFgColor,
        qr_code_with_logo: !!withLogo,
        updated_at: nowIso,
      };

      const updById = await supabase
        .from("professionnels")
        .update(proPayload)
        .eq("id", professionnelId);

      if (updById.error) throw updById.error;

      toast({
        title: "Paramètres enregistrés",
        description: "Le QR Code a été mis à jour.",
      });

      onUpdate?.();
    } catch (err) {
      console.error("QRCodeCustomizer save error:", err);

      toast({
        variant: "destructive",
        title: "Erreur",
        description: err?.message || "Impossible d’enregistrer les paramètres.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof canvas.toBlob !== "function") return;

    const link = document.createElement("a");
    link.download = `QR_LivingRoom_${profile?.last_name || "Pro"}.png`;

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      },
      "image/png",
      1.0
    );
  };

  const resetChanges = () => {
    setFgColor(normalizeHex(profile?.card_qr_fg_color) || DEFAULT_FG);
    setWithLogo(memberOfAgency ? inheritedAgencyWithLogo : personalWithLogo);
    toast({ description: "Modifications annulées." });
  };

  const hasChanges =
    effectiveFgColor !== (normalizeHex(profile?.card_qr_fg_color) || DEFAULT_FG) ||
    (canEditQrHere && withLogo !== personalWithLogo);

  const logoUrl = memberOfAgency
    ? String(profile?.agency_logo_url || agency?.logo_url || "").trim()
    : String(
        profile?.logo_url ||
          publicUrlFrom("public-logos", profile?.logo_path) ||
          ""
      ).trim();

  const showMissingLogoWarning =
    isIndependent && effectiveWithLogo && !logoUrl;

  const showMissingSlugWarning = !resolvedCardSlug;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-5 space-y-6">
        {!canEditQrHere && (
          <Alert className="bg-slate-50 border-slate-200">
            <Lock className="h-4 w-4 text-slate-500" />
            <AlertTitle>Paramètres verrouillés</AlertTitle>
            <AlertDescription className="text-xs text-slate-500">
              Le QR code et le logo intégré sont gérés par votre agence.
            </AlertDescription>
          </Alert>
        )}

        {showMissingLogoWarning && (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertTitle>Logo manquant</AlertTitle>
            <AlertDescription className="text-xs text-amber-700">
              Vous avez activé l’intégration du logo, mais aucun logo personnel n’est enregistré sur votre profil.
            </AlertDescription>
          </Alert>
        )}

        {showMissingSlugWarning && (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertTitle>Slug de carte manquant</AlertTitle>
            <AlertDescription className="text-xs text-amber-700">
              Impossible de générer l’URL QR de tracking tant que le slug de la carte n’est pas disponible.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Personnalisation</CardTitle>
            <CardDescription>
              Optimisé pour une lecture rapide par tous les smartphones.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Couleur du QR Code</Label>

              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  value={effectiveFgColor}
                  onChange={handleColorChange}
                  disabled={!canEditQrHere}
                />

                <Input
                  value={fgColor}
                  onChange={handleColorChange}
                  className="font-mono uppercase"
                  disabled={!canEditQrHere}
                />
              </div>
            </div>

            {canEditQrHere ? (
              <div className="flex justify-between border p-3 rounded-lg">
                <div>
                  <Label>Inclure mon logo</Label>
                  <p className="text-xs text-muted-foreground">
                    Logo au centre du QR Code
                  </p>
                </div>

                <Switch
                  checked={withLogo}
                  onCheckedChange={setWithLogo}
                />
              </div>
            ) : (
              <div className="flex justify-between border p-3 rounded-lg opacity-80">
                <div>
                  <Label className="flex gap-2">
                    <Lock className="w-4 h-4" />
                    Logo agence
                  </Label>

                  <p className="text-xs text-muted-foreground">
                    Paramètre défini par l’agence.
                  </p>
                </div>

                <Switch
                  checked={effectiveWithLogo}
                  disabled
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>URL publique de la carte</Label>
              <Input value={publicUrlBase || "URL indisponible"} readOnly />
            </div>

            <div className="space-y-2">
              <Label>URL QR de tracking</Label>
              <Input value={qrTargetUrl || "URL QR indisponible"} readOnly />
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={handleSave}
                disabled={!canEditQrHere || !hasChanges || loading}
                className="flex-1"
              >
                {loading ? (
                  <Loader2 className="animate-spin w-4 h-4 mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Enregistrer
              </Button>

              {hasChanges && (
                <Button
                  variant="ghost"
                  onClick={resetChanges}
                  disabled={loading}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-7">
        <Card>
          <CardHeader>
            <CardTitle>Aperçu</CardTitle>
            <CardDescription>
              QR Code prêt pour impression.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col items-center gap-8">
            <QRCodeGenerator
              id={canvasId}
              url={qrTargetUrl || publicUrlBase}
              fgColor={effectiveFgColor}
              size={400}
              quietZone={40}
              logoUrl={effectiveWithLogo ? logoUrl || undefined : undefined}
              ecLevel={effectiveWithLogo ? "H" : "M"}
            />

            <Button
              onClick={handleDownload}
              size="lg"
              disabled={!qrTargetUrl && !publicUrlBase}
            >
              <Download className="w-5 h-5 mr-2" />
              Télécharger PNG HD
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}