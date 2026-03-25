import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/customSupabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  Upload,
  Trash2,
  Image as ImageIcon,
  Save,
  Video,
  Link2,
  Lock,
  QrCode,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

/**
 * Buckets exacts
 */
const AGENCY_ASSETS_BUCKET = "agency-assets";
const AGENCY_VIDEOS_BUCKET = "AGENCY-VIDEOS";

const MAX_VIDEO_BYTES = 80 * 1024 * 1024;
const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

const isFilled = (v) => v !== undefined && v !== null && String(v).trim() !== "";
const safeTrim = (v) => String(v ?? "").trim();

const normalizeHttpUrl = (raw) => {
  const v = String(raw || "").trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  if (v.startsWith("//")) return `https:${v}`;
  return `https://${v}`;
};

const withCacheBuster = (url) => {
  if (!url) return "";
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${Date.now()}`;
};

function safeExtFromFile(file, fallback = "png") {
  const name = String(file?.name || "");
  const parts = name.split(".");
  const ext = (parts[parts.length - 1] || "").toLowerCase();
  return ext && ext.length <= 8 ? ext : fallback;
}

function validateImage(file) {
  if (!file) return { ok: true };
  if (file.size > 5 * 1024 * 1024) {
    return { ok: false, message: "Fichier trop volumineux (max 5Mo)." };
  }
  const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!validTypes.includes(file.type)) {
    return { ok: false, message: "Format invalide. Utilisez JPG, PNG, WEBP ou GIF." };
  }
  return { ok: true };
}

function validateVideo(file) {
  if (!file) return { ok: true };
  if (!ALLOWED_VIDEO_TYPES.has(file.type)) {
    return { ok: false, message: "Format vidéo non supporté. Utilisez MP4, WebM ou MOV." };
  }
  if (file.size > MAX_VIDEO_BYTES) {
    return {
      ok: false,
      message: `Vidéo trop lourde. Maximum ${Math.round(MAX_VIDEO_BYTES / (1024 * 1024))}MB.`,
    };
  }
  return { ok: true };
}

function toReadableStorageError(error, bucketName) {
  const rawMessage = String(error?.message || error || "");
  const msg = rawMessage.toLowerCase();

  if (msg.includes("bucket not found")) {
    return `Bucket introuvable : "${bucketName}". Vérifiez le nom exact du bucket côté Supabase Storage.`;
  }

  if (msg.includes("mime") || msg.includes("content type")) {
    return "Le type de fichier n’est pas autorisé par la configuration du bucket.";
  }

  if (
    msg.includes("row-level security") ||
    msg.includes("permission") ||
    msg.includes("not allowed")
  ) {
    return "Vous n’avez pas les droits nécessaires pour envoyer ce fichier dans ce bucket.";
  }

  if (msg.includes("payload too large") || msg.includes("entity too large")) {
    return "Le fichier dépasse la taille autorisée par le bucket Supabase.";
  }

  return rawMessage || "Une erreur Storage est survenue.";
}

function getPublicUrlOrThrow(bucket, path) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  const publicUrl = data?.publicUrl || "";
  if (!publicUrl) {
    throw new Error(`URL publique introuvable pour le bucket "${bucket}".`);
  }
  return publicUrl;
}

function extractStoragePathFromPublicUrl(publicUrl, bucketName) {
  try {
    if (!publicUrl || !bucketName) return "";
    const url = new URL(publicUrl);
    const marker = `/storage/v1/object/public/${bucketName}/`;
    const idx = url.pathname.indexOf(marker);
    if (idx === -1) return "";
    const encodedPath = url.pathname.slice(idx + marker.length);
    return decodeURIComponent(encodedPath || "");
  } catch {
    return "";
  }
}

async function removeStorageObjectIfAny(bucket, path) {
  const cleaned = safeTrim(path);
  if (!cleaned) return;

  const { error } = await supabase.storage.from(bucket).remove([cleaned]);

  if (error) {
    const msg = String(error?.message || "").toLowerCase();
    if (
      msg.includes("not found") ||
      msg.includes("no such object") ||
      msg.includes("the resource was not found")
    ) {
      return;
    }
    throw new Error(toReadableStorageError(error, bucket));
  }
}

const MediaUploader = ({
  title,
  description,
  currentUrl,
  fallbackIcon: FallbackIcon,
  accept,
  kind = "image",
  rounded = false,
  onSaveFile,
  onClearRemote,
  loading,
  disabled,
  extraContent,
}) => {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [mediaError, setMediaError] = useState(false);
  const fileInputRef = useRef(null);

  const displayUrl = previewUrl || currentUrl || "";

  useEffect(() => {
    setMediaError(false);
  }, [currentUrl, previewUrl]);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = kind === "video" ? validateVideo(file) : validateImage(file);
    if (!validation.ok) {
      toast({
        variant: "destructive",
        title: "Fichier invalide",
        description: validation.message,
      });
      e.target.value = "";
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl((prev) => {
      if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return objectUrl;
    });
    setSelectedFile(file);
    setMediaError(false);
  };

  const handleClearLocal = () => {
    setSelectedFile(null);
    setPreviewUrl((prev) => {
      if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
    setMediaError(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSaveClick = async () => {
    if (!selectedFile) return;
    const ok = await onSaveFile?.(selectedFile);
    if (ok) handleClearLocal();
  };

  return (
    <div className="flex flex-col sm:flex-row gap-6 items-start border p-4 rounded-lg bg-gray-50/50">
      <div className="flex-shrink-0">
        <div
          className={`relative border-2 border-dashed border-gray-200 bg-white flex items-center justify-center overflow-hidden ${
            rounded ? "rounded-full w-24 h-24" : "rounded-lg w-32 h-24"
          } ${disabled ? "opacity-60" : ""}`}
        >
          {displayUrl && !mediaError ? (
            kind === "video" ? (
              <video
                src={displayUrl}
                className="w-full h-full object-cover"
                muted
                playsInline
                onError={() => setMediaError(true)}
              />
            ) : (
              <img
                src={displayUrl}
                alt={title}
                className={`w-full h-full object-cover ${
                  title.toLowerCase().includes("logo") ? "object-contain p-1" : ""
                }`}
                onError={() => setMediaError(true)}
              />
            )
          ) : (
            <FallbackIcon className="w-8 h-8 text-gray-300" />
          )}
        </div>
      </div>

      <div className="flex-1 space-y-3 w-full">
        <div>
          <Label className="text-base font-semibold">{title}</Label>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
          {!!currentUrl && mediaError && !previewUrl && (
            <p className="text-xs text-orange-600 mt-2">
              Le média est enregistré mais son aperçu n’a pas pu être chargé. Vérifiez le bucket,
              les policies de lecture et l’URL publique côté Supabase.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept={accept}
            onChange={handleFileSelect}
            disabled={loading || disabled}
          />

          {!selectedFile ? (
            <div className="flex gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || disabled}
              >
                <Upload className="w-4 h-4 mr-2" />
                Choisir un fichier
              </Button>

              {isFilled(currentUrl) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClearRemote}
                  disabled={loading || disabled}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleSaveClick}
                disabled={loading || disabled}
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
                onClick={handleClearLocal}
                disabled={loading || disabled}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                title="Annuler"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {selectedFile && !loading && (
          <p className="text-xs text-amber-600">
            N&apos;oubliez pas de cliquer sur &quot;Enregistrer&quot; pour valider votre modification.
          </p>
        )}

        {extraContent}
      </div>
    </div>
  );
};

export default function AgencySettingsForm({ agency, permissions, updateAgency, onAgencyUpdated }) {
  const { toast } = useToast();

  const canEditAgency = !!permissions?.canEditAgency;
  const canEditLinks = !!permissions?.canEditLinks;

  const [saving, setSaving] = useState(false);
  const [savingQrLogo, setSavingQrLogo] = useState(false);

  const [name, setName] = useState("");
  const [networkName, setNetworkName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [estimationUrl, setEstimationUrl] = useState("");

  const [videoPreferred, setVideoPreferred] = useState("storage");
  const [videoExternalUrl, setVideoExternalUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoStoragePath, setVideoStoragePath] = useState("");

  const [logoStoragePath, setLogoStoragePath] = useState("");
  const [liveLogoUrl, setLiveLogoUrl] = useState("");
  const [agencyQrWithLogo, setAgencyQrWithLogo] = useState(false);

  const serverSnapshot = useMemo(
    () =>
      JSON.stringify({
        id: agency?.id || agency?.agency_id || null,
        name: agency?.name || "",
        network_name: agency?.network_name || "",
        website_url: agency?.website_url || "",
        estimation_tool_url: agency?.estimation_tool_url || "",
        video_preferred_source: agency?.video_preferred_source || "storage",
        video_external_url: agency?.video_external_url || "",
        video_url: agency?.video_url || "",
        video_storage_path: agency?.video_storage_path || "",
        logo_storage_path:
          agency?.logo_storage_path ||
          extractStoragePathFromPublicUrl(agency?.logo_url || "", AGENCY_ASSETS_BUCKET) ||
          "",
        logo_url: agency?.logo_url || "",
        qr_code_with_logo: !!agency?.qr_code_with_logo,
        updated_at: agency?.updated_at || null,
      }),
    [
      agency?.id,
      agency?.agency_id,
      agency?.name,
      agency?.network_name,
      agency?.website_url,
      agency?.estimation_tool_url,
      agency?.video_preferred_source,
      agency?.video_external_url,
      agency?.video_url,
      agency?.video_storage_path,
      agency?.logo_storage_path,
      agency?.logo_url,
      agency?.qr_code_with_logo,
      agency?.updated_at,
    ]
  );

  const lastHydratedSnapshotRef = useRef("");

  useEffect(() => {
    if (!agency?.id && !agency?.agency_id) return;
    if (saving || savingQrLogo) return;
    if (lastHydratedSnapshotRef.current === serverSnapshot) return;

    lastHydratedSnapshotRef.current = serverSnapshot;

    setName(agency?.name || "");
    setNetworkName(agency?.network_name || "");
    setWebsiteUrl(agency?.website_url || "");
    setEstimationUrl(agency?.estimation_tool_url || "");
    setVideoPreferred(agency?.video_preferred_source || "storage");
    setVideoExternalUrl(agency?.video_external_url || "");
    setVideoUrl(agency?.video_url || "");
    setVideoStoragePath(agency?.video_storage_path || "");
    setLogoStoragePath(
      agency?.logo_storage_path ||
        extractStoragePathFromPublicUrl(agency?.logo_url || "", AGENCY_ASSETS_BUCKET) ||
        ""
    );
    setLiveLogoUrl(agency?.logo_url ? withCacheBuster(agency.logo_url) : "");
    setAgencyQrWithLogo(!!agency?.qr_code_with_logo);
  }, [agency, serverSnapshot, saving, savingQrLogo]);

  const resolvedVideoPreview = useMemo(() => {
    if (videoPreferred === "external") return normalizeHttpUrl(videoExternalUrl);
    return videoUrl ? withCacheBuster(videoUrl) : "";
  }, [videoPreferred, videoExternalUrl, videoUrl]);

  const commitAgencyUpdate = async (updates) => {
    if (typeof updateAgency !== "function") {
      throw new Error("updateAgency manquant (prop).");
    }
    const res = await updateAgency(updates, { toastOnSuccess: false });
    if (res?.error) throw res.error;
    onAgencyUpdated?.(updates);
    return res;
  };

  const handleToggleAgencyQrLogo = async (enabled) => {
    if (!agency?.id || !canEditAgency) return;

    setSavingQrLogo(true);
    try {
      await commitAgencyUpdate({
        qr_code_with_logo: !!enabled,
      });

      setAgencyQrWithLogo(!!enabled);

      toast({
        title: enabled ? "Logo activé dans les QR codes" : "Logo retiré des QR codes",
        description: enabled
          ? "Le logo de l’agence sera intégré à tous les QR codes de l’équipe."
          : "Le logo ne sera plus intégré aux QR codes de l’équipe.",
      });
    } catch (e) {
      console.error("[AgencySettingsForm] handleToggleAgencyQrLogo error:", e);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: e?.message || "Impossible de mettre à jour ce réglage.",
      });
    } finally {
      setSavingQrLogo(false);
    }
  };

  const handleSaveLogo = async (file) => {
    if (!agency?.id || !canEditAgency) return false;

    setSaving(true);
    try {
      const ext = safeExtFromFile(file, "png");
      const path = `agency/${agency.id}/branding/logo.${ext}`;

      const previousPath =
        safeTrim(logoStoragePath) ||
        extractStoragePathFromPublicUrl(agency?.logo_url || "", AGENCY_ASSETS_BUCKET) ||
        "";

      if (previousPath && previousPath !== path) {
        await removeStorageObjectIfAny(AGENCY_ASSETS_BUCKET, previousPath);
      }

      const { error: uploadError } = await supabase.storage
        .from(AGENCY_ASSETS_BUCKET)
        .upload(path, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        throw new Error(toReadableStorageError(uploadError, AGENCY_ASSETS_BUCKET));
      }

      const publicUrl = getPublicUrlOrThrow(AGENCY_ASSETS_BUCKET, path);

      await commitAgencyUpdate({
        logo_url: publicUrl,
        logo_storage_path: path,
      });

      setLogoStoragePath(path);
      setLiveLogoUrl(withCacheBuster(publicUrl));

      toast({
        title: "Succès",
        description: "Logo enregistré avec succès.",
      });

      return true;
    } catch (e) {
      console.error("[AgencySettingsForm] handleSaveLogo error:", e);
      toast({
        variant: "destructive",
        title: "Erreur logo",
        description: e?.message || "Impossible d’enregistrer le logo.",
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!agency?.id || !canEditAgency) return;

    setSaving(true);
    try {
      const previousPath =
        safeTrim(logoStoragePath) ||
        extractStoragePathFromPublicUrl(agency?.logo_url || "", AGENCY_ASSETS_BUCKET) ||
        "";

      if (previousPath) {
        await removeStorageObjectIfAny(AGENCY_ASSETS_BUCKET, previousPath);
      }

      await commitAgencyUpdate({
        logo_url: null,
        logo_storage_path: null,
      });

      setLogoStoragePath("");
      setLiveLogoUrl("");
      setAgencyQrWithLogo(false);

      toast({ title: "Logo supprimé" });
    } catch (e) {
      console.error("[AgencySettingsForm] handleRemoveLogo error:", e);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: e?.message || "Impossible de supprimer le logo.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveVideoFile = async (file) => {
    if (!agency?.id || !canEditAgency) return false;

    setSaving(true);
    try {
      const ext = safeExtFromFile(file, "mp4");
      const path = `agency/${agency.id}/branding/video.${ext}`;

      const previousPath = safeTrim(videoStoragePath);
      if (previousPath && previousPath !== path) {
        await removeStorageObjectIfAny(AGENCY_VIDEOS_BUCKET, previousPath);
      }

      const { error: uploadError } = await supabase.storage
        .from(AGENCY_VIDEOS_BUCKET)
        .upload(path, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        throw new Error(toReadableStorageError(uploadError, AGENCY_VIDEOS_BUCKET));
      }

      const publicUrl = getPublicUrlOrThrow(AGENCY_VIDEOS_BUCKET, path);

      const updates = {
        video_preferred_source: "storage",
        video_url: publicUrl,
        video_storage_path: path,
        video_external_url: null,
      };

      await commitAgencyUpdate(updates);

      setVideoPreferred("storage");
      setVideoUrl(publicUrl || "");
      setVideoStoragePath(path || "");
      setVideoExternalUrl("");

      toast({
        title: "Succès",
        description: "Vidéo enregistrée avec succès.",
      });

      return true;
    } catch (e) {
      console.error("[AgencySettingsForm] handleSaveVideoFile error:", e);
      toast({
        variant: "destructive",
        title: "Erreur vidéo",
        description: e?.message || "Impossible d’enregistrer la vidéo.",
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveVideo = async () => {
    if (!agency?.id || !canEditAgency) return;

    setSaving(true);
    try {
      const previousPath = safeTrim(videoStoragePath);
      if (previousPath) {
        await removeStorageObjectIfAny(AGENCY_VIDEOS_BUCKET, previousPath);
      }

      await commitAgencyUpdate({
        video_preferred_source: "storage",
        video_url: null,
        video_storage_path: null,
        video_external_url: null,
      });

      setVideoPreferred("storage");
      setVideoUrl("");
      setVideoStoragePath("");
      setVideoExternalUrl("");

      toast({ title: "Vidéo supprimée" });
    } catch (e) {
      console.error("[AgencySettingsForm] handleRemoveVideo error:", e);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: e?.message || "Impossible de supprimer la vidéo.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveExternalVideo = async () => {
    if (!agency?.id || !canEditAgency) return;

    const normalized = normalizeHttpUrl(videoExternalUrl);
    if (!isFilled(normalized)) {
      toast({
        variant: "destructive",
        title: "Lien invalide",
        description: "Veuillez coller un lien vidéo.",
      });
      return;
    }

    setSaving(true);
    try {
      const previousPath = safeTrim(videoStoragePath);
      if (previousPath) {
        await removeStorageObjectIfAny(AGENCY_VIDEOS_BUCKET, previousPath);
      }

      const updates = {
        video_preferred_source: "external",
        video_external_url: normalized,
        video_url: null,
        video_storage_path: null,
      };

      await commitAgencyUpdate(updates);

      setVideoPreferred("external");
      setVideoExternalUrl(normalized);
      setVideoUrl("");
      setVideoStoragePath("");

      toast({
        title: "Succès",
        description: "Lien vidéo enregistré avec succès.",
      });
    } catch (e) {
      console.error("[AgencySettingsForm] handleSaveExternalVideo error:", e);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: e?.message || "Impossible d’enregistrer le lien vidéo.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveIdentity = async (e) => {
    e.preventDefault();
    if (!agency?.id || !canEditAgency) return;

    setSaving(true);
    try {
      const updates = {
        name: safeTrim(name) || null,
        network_name: safeTrim(networkName) || null,
        website_url: canEditLinks ? safeTrim(websiteUrl) || null : agency.website_url ?? null,
        estimation_tool_url: canEditLinks
          ? safeTrim(estimationUrl) || null
          : agency.estimation_tool_url ?? null,
      };

      await commitAgencyUpdate(updates);

      toast({
        title: "Enregistré",
        description: "Les informations de l’agence ont été mises à jour.",
      });
    } catch (e2) {
      console.error("[AgencySettingsForm] handleSaveIdentity error:", e2);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: e2?.message || "Impossible d’enregistrer.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!agency) {
    return (
      <Card>
        <CardContent className="p-10 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Informations générales</CardTitle>
        <CardDescription>
          Configurez l'identité de votre agence visible sur le réseau.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {!canEditAgency && (
          <Alert className="bg-white border">
            <Lock className="h-4 w-4" />
            <AlertTitle>Lecture seule</AlertTitle>
            <AlertDescription>
              Vous n’avez pas les droits pour modifier la configuration de l’agence.
            </AlertDescription>
          </Alert>
        )}

        {!canEditLinks && canEditAgency && (
          <Alert className="bg-white border">
            <Lock className="h-4 w-4" />
            <AlertTitle>Liens verrouillés</AlertTitle>
            <AlertDescription>
              Les liens (site, estimation, réseaux) sont verrouillés pour votre agence.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSaveIdentity} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nom de l&apos;agence <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={!canEditAgency || saving}
                placeholder="Ex: Agence Immo Paris 15"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="network_name">Réseau (Franchise / Groupement)</Label>
              <Input
                id="network_name"
                value={networkName}
                onChange={(e) => setNetworkName(e.target.value)}
                disabled={!canEditAgency || saving}
                placeholder="Ex: Orpi, Century 21, IAD..."
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="website_url">Site Web</Label>
              <Input
                id="website_url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                disabled={!canEditAgency || !canEditLinks || saving}
                placeholder="https://www.mon-agence.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimation_tool_url">Outil d&apos;estimation (URL)</Label>
              <Input
                id="estimation_tool_url"
                value={estimationUrl}
                onChange={(e) => setEstimationUrl(e.target.value)}
                disabled={!canEditAgency || !canEditLinks || saving}
                placeholder="https://www.mon-agence.com/estimation"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t">
            <Button
              type="submit"
              disabled={!canEditAgency || saving}
              className="w-full md:w-auto bg-brand-blue hover:bg-brand-blue/90"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer les modifications
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="pt-2">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="h-5 w-5 text-brand-blue" />
            <h3 className="text-lg font-semibold">Logo & Vidéo</h3>
          </div>

          <div className="space-y-6">
            <MediaUploader
              title="Logo de l'agence"
              description="Ce logo sera affiché sur la carte digitale des membres (selon la charte)."
              currentUrl={liveLogoUrl || agency?.logo_url || ""}
              fallbackIcon={ImageIcon}
              accept="image/jpeg,image/png,image/webp,image/gif"
              kind="image"
              rounded={false}
              onSaveFile={handleSaveLogo}
              onClearRemote={handleRemoveLogo}
              loading={saving}
              disabled={!canEditAgency}
              extraContent={
                <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <QrCode className="w-4 h-4" />
                        QR Codes de l’équipe
                      </div>
                      <p className="mt-1 text-xs text-slate-600">
                        Utiliser le logo de l’agence au centre de tous les QR codes des membres.
                      </p>
                    </div>

                    <Button
                      type="button"
                      onClick={() => handleToggleAgencyQrLogo(!agencyQrWithLogo)}
                      disabled={
                        savingQrLogo ||
                        !canEditAgency ||
                        !isFilled(liveLogoUrl || agency?.logo_url || "")
                      }
                      variant={agencyQrWithLogo ? "outline" : "default"}
                      className={agencyQrWithLogo ? "" : "bg-brand-blue hover:bg-blue-700 text-white"}
                    >
                      {savingQrLogo ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enregistrement...
                        </>
                      ) : (
                        <>
                          <QrCode className="mr-2 h-4 w-4" />
                          {agencyQrWithLogo
                            ? "Retirer le logo des QR codes"
                            : "Intégrer ce logo à tous les QR codes de l’équipe"}
                        </>
                      )}
                    </Button>
                  </div>

                  {!isFilled(liveLogoUrl || agency?.logo_url || "") && (
                    <p className="mt-2 text-xs text-slate-500">
                      Ajoutez d’abord un logo d’agence pour activer cette option.
                    </p>
                  )}
                </div>
              }
            />
          </div>
        </div>

        <div className="pt-2">
          <div className="flex items-center gap-2 mb-4">
            <Video className="h-5 w-5 text-brand-blue" />
            <h3 className="text-lg font-semibold">Vidéo</h3>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              type="button"
              variant={videoPreferred === "storage" ? "default" : "outline"}
              onClick={() => setVideoPreferred("storage")}
              disabled={!canEditAgency || saving}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload (Storage)
            </Button>

            <Button
              type="button"
              variant={videoPreferred === "external" ? "default" : "outline"}
              onClick={() => setVideoPreferred("external")}
              disabled={!canEditAgency || saving}
            >
              <Link2 className="mr-2 h-4 w-4" />
              Lien vidéo
            </Button>

            {(isFilled(agency?.video_url) || isFilled(agency?.video_external_url)) && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleRemoveVideo}
                disabled={!canEditAgency || saving}
                className="text-red-500 hover:bg-red-50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </Button>
            )}
          </div>

          {videoPreferred === "external" ? (
            <div className="space-y-3 border p-4 rounded-lg bg-gray-50/50">
              <div className="space-y-2">
                <Label htmlFor="video_external_url">Lien vidéo</Label>
                <Input
                  id="video_external_url"
                  value={videoExternalUrl}
                  onChange={(e) => setVideoExternalUrl(e.target.value)}
                  disabled={!canEditAgency || saving}
                  placeholder="https://www.youtube.com/watch?v=... ou https://.../video.mp4"
                />
                <p className="text-xs text-muted-foreground">
                  Astuce : colle un lien complet (https://...). Un MP4 direct marche toujours.
                </p>
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={handleSaveExternalVideo}
                  disabled={!canEditAgency || saving}
                  className="bg-brand-blue hover:bg-blue-700"
                >
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Enregistrer
                </Button>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Aperçu
                </div>
                {isFilled(resolvedVideoPreview) ? (
                  <video
                    src={resolvedVideoPreview}
                    controls
                    className="w-full rounded-md border bg-black"
                  />
                ) : (
                  <div className="w-full rounded-md border p-4 text-sm text-muted-foreground">
                    Aucune vidéo pour le moment.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <MediaUploader
                title="Vidéo de l'agence"
                description={`Formats : MP4 / WebM / MOV — max ${Math.round(
                  MAX_VIDEO_BYTES / (1024 * 1024)
                )}MB.`}
                currentUrl={agency?.video_url ? withCacheBuster(agency.video_url) : ""}
                fallbackIcon={Video}
                accept="video/mp4,video/webm,video/quicktime"
                kind="video"
                rounded={false}
                onSaveFile={handleSaveVideoFile}
                onClearRemote={handleRemoveVideo}
                loading={saving}
                disabled={!canEditAgency}
              />

              {isFilled(videoStoragePath) && (
                <p className="text-[11px] text-muted-foreground break-all">
                  Storage path : {videoStoragePath}
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}