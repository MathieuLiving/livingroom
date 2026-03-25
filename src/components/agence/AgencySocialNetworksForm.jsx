import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Save, Globe, Star, Lock, Shield } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const normalizeHttpUrl = (raw) => {
  const v = String(raw || "").trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  if (v.startsWith("//")) return `https:${v}`;
  return `https://${v}`;
};

export default function AgencySocialNetworksForm({
  agency,
  permissions,
  updateAgency,
  onAgencyUpdated,
}) {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    linkedin_url: "",
    linkedin_display_mode: "agency",

    facebook_url: "",
    facebook_display_mode: "agency",

    instagram_url: "",
    instagram_display_mode: "agency",

    youtube_url: "",
    youtube_display_mode: "agency",

    tiktok_url: "",
    tiktok_display_mode: "agency",

    customer_review_url: "",
    reviews_display_mode: "agency",

    lock_links: false,
    team_leader_can_edit_agency: false,
    agent_can_edit_agency: false,
  });

  const [isSaving, setIsSaving] = useState(false);

  const canEditAgency = !!permissions?.canEditAgency;
  const canEditLinks = !!permissions?.canEditLinks;

  const isReadOnly = useMemo(() => {
    return !canEditAgency || !canEditLinks;
  }, [canEditAgency, canEditLinks]);

  useEffect(() => {
    if (!agency) return;

    setFormData({
      linkedin_url: agency.linkedin_url || "",
      linkedin_display_mode: agency.linkedin_display_mode || "agency",

      facebook_url: agency.facebook_url || "",
      facebook_display_mode: agency.facebook_display_mode || "agency",

      instagram_url: agency.instagram_url || "",
      instagram_display_mode: agency.instagram_display_mode || "agency",

      youtube_url: agency.youtube_url || "",
      youtube_display_mode: agency.youtube_display_mode || "agency",

      tiktok_url: agency.tiktok_url || "",
      tiktok_display_mode: agency.tiktok_display_mode || "agency",

      customer_review_url: agency.customer_review_url || "",
      reviews_display_mode: agency.reviews_display_mode || "agency",

      lock_links: !!agency.lock_links,
      team_leader_can_edit_agency: !!agency.team_leader_can_edit_agency,
      agent_can_edit_agency: !!agency.agent_can_edit_agency,
    });
  }, [agency]);

  const setField = useCallback((name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleInputChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setField(name, value);
    },
    [setField]
  );

  const handleToggleChange = useCallback(
    (name, checked) => {
      setField(name, checked ? "agency" : "personal");
    },
    [setField]
  );

  const handleBooleanSwitch = useCallback(
    (name, checked) => {
      setField(name, !!checked);

      if (name === "lock_links" && checked) {
        setField("team_leader_can_edit_agency", false);
        setField("agent_can_edit_agency", false);
      }
    },
    [setField]
  );

  const handleSave = async (e) => {
    e.preventDefault();
    if (!agency?.id) return;

    if (isReadOnly) {
      toast({
        variant: "destructive",
        title: "Non autorisé",
        description: "Vos droits ne permettent pas de modifier les liens de l’agence.",
      });
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        linkedin_url: normalizeHttpUrl(formData.linkedin_url),
        linkedin_display_mode: formData.linkedin_display_mode || "agency",

        facebook_url: normalizeHttpUrl(formData.facebook_url),
        facebook_display_mode: formData.facebook_display_mode || "agency",

        instagram_url: normalizeHttpUrl(formData.instagram_url),
        instagram_display_mode: formData.instagram_display_mode || "agency",

        youtube_url: normalizeHttpUrl(formData.youtube_url),
        youtube_display_mode: formData.youtube_display_mode || "agency",

        tiktok_url: normalizeHttpUrl(formData.tiktok_url),
        tiktok_display_mode: formData.tiktok_display_mode || "agency",

        customer_review_url: normalizeHttpUrl(formData.customer_review_url),
        reviews_display_mode: formData.reviews_display_mode || "agency",

        lock_links: !!formData.lock_links,
        team_leader_can_edit_agency: !!formData.team_leader_can_edit_agency,
        agent_can_edit_agency: !!formData.agent_can_edit_agency,
      };

      if (typeof updateAgency !== "function") {
        throw new Error("updateAgency manquant (prop).");
      }

      const res = await updateAgency(payload);
      if (res?.error) throw res.error;

      onAgencyUpdated?.(payload);

      toast({
        title: "Enregistré",
        description: "Les liens et permissions de l’agence ont été mis à jour.",
      });
    } catch (err) {
      console.error("AgencySocialNetworksForm save error:", err);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err?.message || "Impossible d’enregistrer les liens.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!agency) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  const lockLinks = !!formData.lock_links;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Réseaux Sociaux
        </CardTitle>
        <CardDescription>
          Gérez les liens et les préférences d&apos;affichage sur les cartes de visite.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isReadOnly && (
          <Alert className="mb-6 bg-white border">
            <Lock className="h-4 w-4" />
            <AlertTitle>Lecture seule</AlertTitle>
            <AlertDescription>
              Vos droits ne permettent pas de modifier la configuration de l’agence.
            </AlertDescription>
          </Alert>
        )}

        {lockLinks && (
          <Alert className="mb-6 bg-white border">
            <Lock className="h-4 w-4" />
            <AlertTitle>Liens verrouillés (pour les membres)</AlertTitle>
            <AlertDescription>
              Les collaborateurs (Team Leader / Agents affiliés) ne pourront pas modifier les réseaux sociaux depuis leur
              profil. Le directeur garde la main dans l’espace Agence.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSave} className="space-y-8">
          <div className="border rounded-lg p-4 bg-slate-50/60 space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <Label className="text-base font-semibold">Éditabilité des réseaux (collaborateurs)</Label>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Verrouiller les liens</Label>
                <p className="text-xs text-muted-foreground">
                  Si activé, seuls les directeurs peuvent modifier les réseaux sociaux de l’agence.
                </p>
              </div>
              <Switch
                checked={!!formData.lock_links}
                onCheckedChange={(checked) => handleBooleanSwitch("lock_links", checked)}
                disabled={isReadOnly || isSaving}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Autoriser le Team Leader</Label>
                <p className="text-xs text-muted-foreground">
                  Permet au Team Leader de modifier les réseaux sociaux depuis son profil si les liens ne sont pas verrouillés.
                </p>
              </div>
              <Switch
                checked={!!formData.team_leader_can_edit_agency}
                onCheckedChange={(checked) => handleBooleanSwitch("team_leader_can_edit_agency", checked)}
                disabled={isReadOnly || isSaving || lockLinks}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Autoriser les Agents affiliés</Label>
                <p className="text-xs text-muted-foreground">
                  Permet aux agents affiliés de modifier les réseaux sociaux depuis leur profil si les liens ne sont pas verrouillés.
                </p>
              </div>
              <Switch
                checked={!!formData.agent_can_edit_agency}
                onCheckedChange={(checked) => handleBooleanSwitch("agent_can_edit_agency", checked)}
                disabled={isReadOnly || isSaving || lockLinks}
              />
            </div>
          </div>

          <SocialNetworkGroup
            label="LinkedIn"
            urlName="linkedin_url"
            modeName="linkedin_display_mode"
            urlValue={formData.linkedin_url}
            modeValue={formData.linkedin_display_mode}
            onChange={handleInputChange}
            onToggle={handleToggleChange}
            placeholder="https://linkedin.com/company/..."
            disabled={isReadOnly || isSaving}
          />

          <SocialNetworkGroup
            label="Facebook"
            urlName="facebook_url"
            modeName="facebook_display_mode"
            urlValue={formData.facebook_url}
            modeValue={formData.facebook_display_mode}
            onChange={handleInputChange}
            onToggle={handleToggleChange}
            placeholder="https://facebook.com/..."
            disabled={isReadOnly || isSaving}
          />

          <SocialNetworkGroup
            label="Instagram"
            urlName="instagram_url"
            modeName="instagram_display_mode"
            urlValue={formData.instagram_url}
            modeValue={formData.instagram_display_mode}
            onChange={handleInputChange}
            onToggle={handleToggleChange}
            placeholder="https://instagram.com/..."
            disabled={isReadOnly || isSaving}
          />

          <SocialNetworkGroup
            label="YouTube"
            urlName="youtube_url"
            modeName="youtube_display_mode"
            urlValue={formData.youtube_url}
            modeValue={formData.youtube_display_mode}
            onChange={handleInputChange}
            onToggle={handleToggleChange}
            placeholder="https://youtube.com/..."
            disabled={isReadOnly || isSaving}
          />

          <SocialNetworkGroup
            label="TikTok"
            urlName="tiktok_url"
            modeName="tiktok_display_mode"
            urlValue={formData.tiktok_url}
            modeValue={formData.tiktok_display_mode}
            onChange={handleInputChange}
            onToggle={handleToggleChange}
            placeholder="https://tiktok.com/@..."
            disabled={isReadOnly || isSaving}
          />

          <div className="border-t pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-5 w-5 text-amber-500" />
              <Label className="text-base font-semibold">Avis Clients</Label>
            </div>

            <SocialNetworkGroup
              label="Lien Avis Clients"
              urlName="customer_review_url"
              modeName="reviews_display_mode"
              urlValue={formData.customer_review_url}
              modeValue={formData.reviews_display_mode}
              onChange={handleInputChange}
              onToggle={handleToggleChange}
              placeholder="URL Google Reviews, Trustpilot..."
              helperText="Lien vers la plateforme d’avis de l’agence."
              hideLabel
              disabled={isReadOnly || isSaving}
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSaving || isReadOnly}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer les liens
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function SocialNetworkGroup({
  label,
  urlName,
  modeName,
  urlValue,
  modeValue,
  onChange,
  onToggle,
  placeholder,
  helperText,
  hideLabel,
  disabled,
}) {
  const isAgencyMode = modeValue === "agency";

  return (
    <div className="space-y-3">
      {!hideLabel && (
        <Label htmlFor={urlName} className="text-base font-medium">
          {label}
        </Label>
      )}

      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <div className="space-y-1">
          <Input
            id={urlName}
            name={urlName}
            value={urlValue || ""}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
          />
          {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}
        </div>

        <div className="flex flex-col justify-center min-w-[280px] bg-slate-50 p-3 rounded-md border">
          <div className="flex items-center justify-between mb-1">
            <Label htmlFor={modeName} className="text-sm font-medium cursor-pointer">
              Afficher le lien agence
            </Label>
            <Switch
              id={modeName}
              checked={isAgencyMode}
              onCheckedChange={(checked) => onToggle(modeName, checked)}
              disabled={disabled}
            />
          </div>

          <p className={`text-xs ${isAgencyMode ? "text-blue-600 font-medium" : "text-gray-500"}`}>
            {isAgencyMode ? "Tous les collaborateurs afficheront ce lien" : "Chacun peut indiquer son propre lien"}
          </p>
        </div>
      </div>
    </div>
  );
}