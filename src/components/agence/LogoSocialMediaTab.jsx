// src/components/agence/LogoSocialMediaTab.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/customSupabaseClient";
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
import {
  Loader2,
  Save,
  Upload,
  Video,
  Image as ImageIcon,
  Twitter,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Trash2,
  Eye,
  Lock,
  Unlock,
} from "lucide-react";
import PhotoUploader from "@/components/project/PhotoUploader";
import DigitalBusinessCardPreview from "./DigitalBusinessCardPreview";
import { useAgencyPermissions } from "@/hooks/useAgencyPermissions";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import AgencySocialNetworksForm from "@/components/agence/AgencySocialNetworksForm";

const SOCIAL_FIELDS = [
  { key: "linkedin", label: "LinkedIn", icon: Linkedin },
  { key: "facebook", label: "Facebook", icon: Facebook },
  { key: "instagram", label: "Instagram", icon: Instagram },
  { key: "twitter", label: "Twitter", icon: Twitter },
  { key: "tiktok", label: "TikTok", icon: Video },
  { key: "youtube", label: "YouTube", icon: Youtube },
];

const VIDEO_MODE = {
  AGENCY: "agency",
  PERSONAL: "personal",
};

const safeTrim = (v) => String(v ?? "").trim();

function isPublicUrlLike(v) {
  const s = safeTrim(v);
  if (!s) return true;
  return s.length < 2048;
}

function normalizeVideoPreferredSource(url) {
  const u = safeTrim(url);
  return u ? "url" : "none";
}

function normalizeVideoDisplayMode(value) {
  const v = safeTrim(value).toLowerCase();
  return v === VIDEO_MODE.AGENCY ? VIDEO_MODE.AGENCY : VIDEO_MODE.PERSONAL;
}

/**
 * Règles vidéo :
 * - Directeur :
 *   - renseigne la vidéo agence
 *   - choisit le mode :
 *       - agency   => tous voient la vidéo agence
 *       - personal => chaque pro peut mettre sa propre vidéo
 * - Team leader / agent_affiliate :
 *   - si mode = agency   => lecture seule
 *   - si mode = personal => modifient leur custom_video_url
 *
 * Logo :
 * - conservé avec la logique actuelle (enforce_logo)
 */
export default function LogoSocialMediaTab({ agencyId }) {
  const { toast } = useToast();
  const {
    loading: permLoading,
    isDirector,
    isIndependent,
    agency,
    professionnel,
    canModifyLogo,
    canModifyVideo,
    refetch,
  } = useAgencyPermissions(agencyId);

  const [saving, setSaving] = useState(false);

  const [logoFile, setLogoFile] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [formData, setFormData] = useState({});
  const [enforceLogo, setEnforceLogo] = useState(false);
  const [videoDisplayMode, setVideoDisplayMode] = useState(VIDEO_MODE.PERSONAL);

  const [showEnforceConfirm, setShowEnforceConfirm] = useState(null); // "logo" | "video_mode" | null
  const videoInputRef = useRef(null);

  const effectiveAgencyId = useMemo(() => {
    return agency?.id || agencyId || null;
  }, [agency?.id, agencyId]);

  const hasAgencyContext = useMemo(() => {
    return !isIndependent && !!effectiveAgencyId;
  }, [isIndependent, effectiveAgencyId]);

  const isAgencyVideoMode = useMemo(() => {
    return videoDisplayMode === VIDEO_MODE.AGENCY;
  }, [videoDisplayMode]);

  useEffect(() => {
    if (permLoading) return;

    if (isIndependent) {
      const pro = professionnel || {};
      const effectiveLogo = safeTrim(pro.logo_url);
      const effectiveVideo = safeTrim(
        pro.video_external_url || pro.video_url || pro.custom_video_url
      );

      setEnforceLogo(false);
      setVideoDisplayMode(VIDEO_MODE.PERSONAL);
      setLogoFile(effectiveLogo ? [effectiveLogo] : []);
      setVideoFile(null);

      setFormData({
        linkedin_url: pro.linkedin_url || "",
        facebook_url: pro.facebook_url || "",
        instagram_url: pro.instagram_url || "",
        twitter_url: pro.twitter_url || "",
        tiktok_url: pro.tiktok_url || "",
        youtube_url: pro.youtube_url || "",
        video_url: effectiveVideo || null,
      });

      return;
    }

    if (!agency) return;

    const normalizedMode = normalizeVideoDisplayMode(agency.video_display_mode);

    setEnforceLogo(!!agency.enforce_logo);
    setVideoDisplayMode(normalizedMode);

    let effectiveLogo = "";
    if (isDirector || agency.enforce_logo) {
      effectiveLogo = safeTrim(agency.logo_url);
    } else {
      effectiveLogo =
        safeTrim(professionnel?.custom_logo_url) || safeTrim(agency.logo_url);
    }
    setLogoFile(effectiveLogo ? [effectiveLogo] : []);

    let effectiveVideo = "";
    if (isDirector || normalizedMode === VIDEO_MODE.AGENCY) {
      effectiveVideo = safeTrim(agency.video_external_url || agency.video_url);
    } else {
      effectiveVideo =
        safeTrim(professionnel?.custom_video_url) ||
        safeTrim(professionnel?.video_external_url) ||
        safeTrim(professionnel?.video_url) ||
        safeTrim(agency.video_external_url || agency.video_url);
    }

    setFormData({
      video_url: effectiveVideo || null,
    });

    setVideoFile(null);
  }, [permLoading, isIndependent, agency, professionnel, isDirector]);

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...(prev || {}), [key]: value }));
  };

  const handleEnforceLogoToggle = (checked) => {
    if (checked) setShowEnforceConfirm("logo");
    else setEnforceLogo(false);
  };

  const handleVideoModeToggle = (checked) => {
    if (checked) {
      setShowEnforceConfirm("video_mode");
      return;
    }
    setVideoDisplayMode(VIDEO_MODE.PERSONAL);
  };

  const confirmDialogAction = () => {
    if (showEnforceConfirm === "logo") {
      setEnforceLogo(true);
    }
    if (showEnforceConfirm === "video_mode") {
      setVideoDisplayMode(VIDEO_MODE.AGENCY);
    }
    setShowEnforceConfirm(null);
  };

  const canSaveAnything = useMemo(() => {
    if (isIndependent) return true;
    if (isDirector) return true;
    return !!canModifyLogo || !!canModifyVideo;
  }, [isIndependent, isDirector, canModifyLogo, canModifyVideo]);

  const socialFormPermissions = useMemo(() => {
    return {
      canEditAgency: !!isDirector,
      canEditLinks: !!isDirector,
    };
  }, [isDirector]);

  const updateAgency = useMemo(() => {
    return async (updates) => {
      if (!effectiveAgencyId) {
        return { error: new Error("Agence introuvable.") };
      }

      const nowIso = new Date().toISOString();

      const { error } = await supabase
        .from("agencies")
        .update({ ...(updates || {}), updated_at: nowIso })
        .eq("id", effectiveAgencyId);

      if (!error) {
        try {
          await refetch();
        } catch (e) {
          console.warn(
            "[LogoSocialMediaTab] refetch after updateAgency failed:",
            e
          );
        }
      }

      return { error };
    };
  }, [effectiveAgencyId, refetch]);

  const handleSave = async () => {
    if (!professionnel?.id && isIndependent) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Profil professionnel introuvable.",
      });
      return;
    }

    if (!isIndependent && !effectiveAgencyId) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Agence introuvable.",
      });
      return;
    }

    setSaving(true);

    try {
      if (isIndependent) {
        for (const f of SOCIAL_FIELDS) {
          const val = formData?.[`${f.key}_url`];
          if (!isPublicUrlLike(val)) {
            toast({
              variant: "destructive",
              title: "Lien invalide",
              description: `Le lien ${f.label} semble invalide (trop long).`,
            });
            setSaving(false);
            return;
          }
        }
      }

      let finalLogoUrl = logoFile.length > 0 ? logoFile[0] : null;

      if (finalLogoUrl instanceof File) {
        const file = finalLogoUrl;
        const ext = file.name.split(".").pop();
        const bucket = "agency-assets";
        const prefix =
          isDirector && hasAgencyContext
            ? `agency/${effectiveAgencyId}`
            : `pro/${professionnel.id}`;
        const path = `${prefix}/logo-${Date.now()}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from(bucket)
          .upload(path, file, { upsert: true });

        if (upErr) throw upErr;

        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        finalLogoUrl = data?.publicUrl || null;
      }

      let finalVideoUrl = videoFile ? null : formData?.video_url;

      if (videoFile) {
        const file = videoFile;
        const ext = file.name.split(".").pop();
        const bucket = "agency-videos";
        const prefix =
          isDirector && hasAgencyContext
            ? `agency/${effectiveAgencyId}`
            : `pro/${professionnel.id}`;
        const path = `${prefix}/video-${Date.now()}.${ext}`;

        const { error: vidErr } = await supabase.storage
          .from(bucket)
          .upload(path, file, { upsert: true });

        if (vidErr) throw vidErr;

        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        finalVideoUrl = data?.publicUrl || null;
      } else if (formData?.video_url === null) {
        finalVideoUrl = null;
      }

      const nowIso = new Date().toISOString();

      if (isIndependent) {
        const proPayload = {
          logo_url: finalLogoUrl,
          video_external_url: finalVideoUrl,
          video_url: finalVideoUrl,
          video_preferred_source: normalizeVideoPreferredSource(finalVideoUrl),

          linkedin_url: safeTrim(formData?.linkedin_url) || null,
          facebook_url: safeTrim(formData?.facebook_url) || null,
          instagram_url: safeTrim(formData?.instagram_url) || null,
          twitter_url: safeTrim(formData?.twitter_url) || null,
          tiktok_url: safeTrim(formData?.tiktok_url) || null,
          youtube_url: safeTrim(formData?.youtube_url) || null,

          updated_at: nowIso,
        };

        const { error } = await supabase
          .from("professionnels")
          .update(proPayload)
          .eq("id", professionnel.id);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Vos médias et réseaux sociaux ont été enregistrés.",
        });

        setVideoFile(null);
        await refetch();
        return;
      }

      if (isDirector) {
        const normalizedMode = normalizeVideoDisplayMode(videoDisplayMode);

        const updates = {
          logo_url: finalLogoUrl,
          video_url: finalVideoUrl,
          video_external_url: finalVideoUrl,
          video_preferred_source: normalizeVideoPreferredSource(finalVideoUrl),
          video_display_mode: normalizedMode,
          enforce_logo: !!enforceLogo,
          enforce_video: normalizedMode === VIDEO_MODE.AGENCY,
          updated_at: nowIso,
        };

        const { error } = await supabase
          .from("agencies")
          .update(updates)
          .eq("id", effectiveAgencyId);

        if (error) throw error;

        toast({
          title: "Succès",
          description:
            updates.video_display_mode === VIDEO_MODE.AGENCY
              ? "Logo et vidéo agence mis à jour. La vidéo agence s’appliquera à tous les collaborateurs."
              : "Logo et vidéo agence mis à jour. Chaque collaborateur peut conserver sa propre vidéo.",
        });
      } else {
        const proUpdates = { updated_at: nowIso };

        if (canModifyLogo) {
          proUpdates.custom_logo_url = finalLogoUrl;
        }

        if (canModifyVideo && !isAgencyVideoMode) {
          proUpdates.custom_video_url = finalVideoUrl;
          proUpdates.video_external_url = finalVideoUrl;
          proUpdates.video_url = finalVideoUrl;
          proUpdates.video_preferred_source =
            normalizeVideoPreferredSource(finalVideoUrl);
        }

        const { error } = await supabase
          .from("professionnels")
          .update(proUpdates)
          .eq("id", professionnel.id);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Vos médias personnels ont été enregistrés.",
        });
      }

      setVideoFile(null);
      await refetch();
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err?.message || "Échec de l'enregistrement.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (permLoading) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-in fade-in duration-500">
      <div className="xl:col-span-7 space-y-8">
        <Card className={!canModifyLogo && !isIndependent ? "opacity-90" : ""}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-brand-blue" />
                <CardTitle>Logo</CardTitle>
              </div>

              {!isIndependent && isDirector && !!effectiveAgencyId && (
                <div
                  className={`flex items-center space-x-2 px-3 py-1 rounded border ${
                    enforceLogo
                      ? "bg-orange-50 border-orange-200"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <Switch
                    id="enforce-logo"
                    checked={enforceLogo}
                    onCheckedChange={handleEnforceLogoToggle}
                    className="data-[state=checked]:bg-orange-500 h-4 w-8"
                  />
                  <Label htmlFor="enforce-logo" className="text-xs cursor-pointer">
                    {enforceLogo ? (
                      <Lock className="w-3 h-3 text-orange-600" />
                    ) : (
                      <Unlock className="w-3 h-3 text-slate-400" />
                    )}
                  </Label>
                </div>
              )}
            </div>
            <CardDescription>Logo affiché sur la carte.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {!canModifyLogo && !isIndependent && (
              <Alert className="bg-slate-50 border-slate-200 py-2">
                <Lock className="h-3 w-3 text-slate-500" />
                <AlertDescription className="text-xs text-slate-500 ml-2">
                  Le logo est défini par l&apos;agence.
                </AlertDescription>
              </Alert>
            )}

            <div
              className={
                !canModifyLogo && !isIndependent
                  ? "pointer-events-none grayscale"
                  : ""
              }
            >
              <PhotoUploader photos={logoFile} setPhotos={setLogoFile} max={1} />
            </div>
          </CardContent>
        </Card>

        <Card className={!canModifyVideo && !isIndependent ? "opacity-90" : ""}>
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-brand-blue" />
                <CardTitle>Vidéo</CardTitle>
              </div>

              {!isIndependent && isDirector && !!effectiveAgencyId && (
                <div
                  className={`flex items-center space-x-2 px-3 py-1 rounded border ${
                    isAgencyVideoMode
                      ? "bg-orange-50 border-orange-200"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <Switch
                    id="video-display-mode"
                    checked={isAgencyVideoMode}
                    onCheckedChange={handleVideoModeToggle}
                    className="data-[state=checked]:bg-orange-500 h-4 w-8"
                  />
                  <Label
                    htmlFor="video-display-mode"
                    className="text-xs cursor-pointer flex items-center gap-2"
                  >
                    {isAgencyVideoMode ? (
                      <>
                        <Lock className="w-3 h-3 text-orange-600" />
                        Vidéo agence pour tous
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3 h-3 text-slate-400" />
                        Vidéo personnelle autorisée
                      </>
                    )}
                  </Label>
                </div>
              )}
            </div>

            <CardDescription>
              {!isIndependent && isDirector
                ? "Définissez la vidéo agence et choisissez si elle s’applique à toute l’équipe ou si chaque professionnel peut utiliser sa propre vidéo."
                : "Vidéo de présentation (MP4/WebM)."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {!isIndependent && isDirector && (
              <Alert className="bg-blue-50 border-blue-200 py-2">
                <AlertDescription className="text-xs text-blue-800">
                  {isAgencyVideoMode
                    ? "Mode actuel : la vidéo agence sera affichée sur toutes les cartes des collaborateurs."
                    : "Mode actuel : chaque collaborateur peut enregistrer sa propre vidéo depuis son profil."}
                </AlertDescription>
              </Alert>
            )}

            {!canModifyVideo && !isIndependent && (
              <Alert className="bg-slate-50 border-slate-200 py-2">
                <Lock className="h-3 w-3 text-slate-500" />
                <AlertDescription className="text-xs text-slate-500 ml-2">
                  La vidéo est définie par l&apos;agence.
                </AlertDescription>
              </Alert>
            )}

            <div
              className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center bg-slate-50 min-h-[160px] ${
                !canModifyVideo && !isIndependent
                  ? "pointer-events-none grayscale"
                  : ""
              }`}
            >
              {formData?.video_url || videoFile ? (
                <div className="w-full text-center relative group">
                  <video
                    src={videoFile ? URL.createObjectURL(videoFile) : formData.video_url}
                    className="w-full h-32 object-cover rounded bg-black mb-2"
                    controls
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      setVideoFile(null);
                      handleChange("video_url", null);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    {videoFile ? `Fichier: ${videoFile.name}` : "Vidéo actuelle"}
                  </p>
                </div>
              ) : (
                <div className="text-center p-4">
                  <Video className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 mb-2">MP4, WebM</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={!canModifyVideo && !isIndependent}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Uploader
                  </Button>
                </div>
              )}

              <input
                type="file"
                ref={videoInputRef}
                className="hidden"
                accept="video/mp4,video/webm"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
              />
            </div>
          </CardContent>
        </Card>

        {isIndependent ? (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Twitter className="w-5 h-5 text-blue-400" />
                <CardTitle>Réseaux Sociaux</CardTitle>
              </div>
              <CardDescription>
                Liens vers vos profils sociaux (indépendant).
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {SOCIAL_FIELDS.map((net) => {
                const Icon = net.icon;
                return (
                  <div key={net.key} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs text-muted-foreground uppercase">
                        {net.label}
                      </Label>
                      <Input
                        placeholder={`https://${net.key}.com/...`}
                        value={formData?.[`${net.key}_url`] || ""}
                        onChange={(e) =>
                          handleChange(`${net.key}_url`, e.target.value)
                        }
                        className="h-9"
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ) : (
          <AgencySocialNetworksForm
            agency={agency}
            permissions={socialFormPermissions}
            updateAgency={updateAgency}
            onAgencyUpdated={() => refetch()}
          />
        )}

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving || !canSaveAnything}
            size="lg"
            className="bg-brand-blue hover:bg-blue-700 w-full md:w-auto"
          >
            {saving ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Save className="mr-2 h-5 w-5" />
            )}
            Enregistrer les modifications
          </Button>
        </div>
      </div>

      <div className="xl:col-span-5">
        <div className="sticky top-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Eye className="w-5 h-5 text-brand-blue" />
              Aperçu Carte
            </h3>
            <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full font-medium">
              Live Update
            </span>
          </div>

          <DigitalBusinessCardPreview
            agencyData={{
              ...(agency || {}),
              video_display_mode: videoDisplayMode,
              video_url:
                !isIndependent && isDirector
                  ? formData?.video_url || agency?.video_url || null
                  : agency?.video_url,
              video_external_url:
                !isIndependent && isDirector
                  ? formData?.video_url || agency?.video_external_url || null
                  : agency?.video_external_url,
            }}
            proData={professionnel}
            enforcement={{
              logo: enforceLogo,
              video: isAgencyVideoMode,
            }}
            previewOverrides={{
              logo:
                logoFile.length > 0 && logoFile[0] instanceof File
                  ? URL.createObjectURL(logoFile[0])
                  : logoFile[0] || null,
            }}
          />
        </div>
      </div>

      <AlertDialog
        open={!!showEnforceConfirm}
        onOpenChange={() => setShowEnforceConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {showEnforceConfirm === "logo"
                ? "Confirmer le verrouillage du logo"
                : "Confirmer le mode vidéo agence"}
            </AlertDialogTitle>

            <AlertDialogDescription>
              {showEnforceConfirm === "logo" ? (
                <>
                  En activant cette option, le <strong>logo agence</strong>{" "}
                  s&apos;appliquera à <strong>tous</strong> les membres de
                  l&apos;équipe. Ils ne pourront plus utiliser leur propre version.
                </>
              ) : (
                <>
                  En activant cette option, la <strong>vidéo agence</strong>{" "}
                  s&apos;affichera sur <strong>toutes</strong> les cartes des
                  collaborateurs. Ils ne pourront plus utiliser leur propre vidéo
                  tant que ce mode restera actif.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDialogAction}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}