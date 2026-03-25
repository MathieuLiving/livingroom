import React, { useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Save,
  Linkedin,
  Facebook,
  Instagram,
  Youtube,
  Video,
  Link2,
  Star,
  Lock,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function SocialLinksSection({
  profile,
  setProfile,
  saving,
  onSave,
  savingLocal,
  isDirty,
  isAgencyMember = false,
  agency = null,
}) {
  const { toast } = useToast();

  const agencyRole = String(profile?.agency_role || "").toLowerCase().trim();
  const isIndependent = !isAgencyMember || agencyRole === "agent";

  const getAgencyMode = useCallback(
    (key) => {
      const rawKey = String(key || "").trim();

      if (rawKey === "video_external_url") {
        const explicitMode =
          agency?.video_display_mode ??
          agency?.video_external_display_mode ??
          agency?.video_mode;

        if (
          explicitMode !== undefined &&
          explicitMode !== null &&
          String(explicitMode).trim() !== ""
        ) {
          const normalized = String(explicitMode).toLowerCase().trim();
          return normalized === "personal" ? "personal" : "agency";
        }
      }

      const modeKey = rawKey.replace("_url", "_display_mode");
      const mode = String(agency?.[modeKey] || "agency").toLowerCase().trim();
      return mode === "personal" ? "personal" : "agency";
    },
    [agency]
  );

  const showLockedToast = useCallback(
    (msg) => {
      toast({
        title: "Champ verrouillé",
        description: msg || "Cette information est gérée par votre agence.",
      });
    },
    [toast]
  );

  const handleProChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setProfile((prev) => ({ ...(prev || {}), [name]: value }));
    },
    [setProfile]
  );

  const socials = useMemo(
    () => [
      { key: "linkedin_url", label: "LinkedIn", icon: Linkedin, color: "text-blue-600" },
      { key: "facebook_url", label: "Facebook", icon: Facebook, color: "text-blue-700" },
      { key: "instagram_url", label: "Instagram", icon: Instagram, color: "text-pink-600" },
      { key: "youtube_url", label: "YouTube", icon: Youtube, color: "text-red-600" },
      { key: "tiktok_url", label: "TikTok", icon: Video, color: "text-black" },
    ],
    []
  );

  const others = useMemo(
    () => [
      {
        key: "appointment_url",
        label: "Prise de rendez-vous (Calendly...)",
        icon: Link2,
        scope: "personal",
      },
      {
        key: "customer_review_url",
        label: "Avis Clients (Google, etc.)",
        icon: Star,
        color: "text-amber-500",
        scope: "personal",
      },
      {
        key: "video_external_url",
        label: "Vidéo de présentation",
        icon: Video,
        color: "text-violet-600",
        scope: "video",
      },
      {
        key: "agency_website_url",
        label: "Site Web Agence",
        icon: Link2,
        scope: "agency_website",
      },
    ],
    []
  );

  const dirtyPersonal = isDirty ? !!isDirty() : false;
  const disabledAll = saving || savingLocal;

  const renderBadge = (text) => (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Lock className="w-3 h-3" />
      {text}
    </span>
  );

  const isSocialAgencyImposed = useCallback(
    (socialKey) => {
      if (!isAgencyMember) return false;
      return getAgencyMode(socialKey) === "agency";
    },
    [isAgencyMember, getAgencyMode]
  );

  const isVideoAgencyImposed = useMemo(() => {
    if (!isAgencyMember) return false;
    return getAgencyMode("video_external_url") === "agency";
  }, [isAgencyMember, getAgencyMode]);

  return (
    <div className="space-y-6">
      {isAgencyMember && (
        <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800">
          Certains réseaux, liens et éventuellement la vidéo sont définis par{" "}
          <span className="font-medium">l’agence</span>. Ici, vous ne modifiez que vos{" "}
          <span className="font-medium">éléments personnels</span>.
        </div>
      )}

      {isAgencyMember && agency?.lock_links && (
        <div className="bg-orange-50 p-3 rounded-md text-sm text-orange-800">
          Les liens agence sont <span className="font-medium">verrouillés</span> et ne sont pas
          modifiables depuis votre profil.
        </div>
      )}

      <div className="space-y-4">
        {socials.map((s) => {
          const Icon = s.icon;
          const imposedByAgency = isSocialAgencyImposed(s.key);

          const value = isAgencyMember
            ? imposedByAgency
              ? agency?.[s.key] || ""
              : profile?.[s.key] || ""
            : profile?.[s.key] || "";

          const isReadOnly = isAgencyMember && imposedByAgency;

          return (
            <div key={s.key} className="space-y-2">
              <Label htmlFor={s.key} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${s.color || "text-gray-500"}`} />
                  {s.label}
                </span>
                {isReadOnly ? renderBadge("affiché depuis l’agence") : null}
              </Label>

              <Input
                id={s.key}
                name={s.key}
                value={value}
                onChange={isReadOnly ? undefined : handleProChange}
                onClick={
                  isReadOnly
                    ? () =>
                        showLockedToast(
                          "Ce réseau est géré par l’agence. Modifiez-le dans l’espace Agence."
                        )
                    : undefined
                }
                readOnly={isReadOnly}
                className={isReadOnly ? "bg-slate-50 cursor-not-allowed" : ""}
                placeholder={`https://${s.label.toLowerCase()}.com/...`}
                disabled={disabledAll}
              />

              {isAgencyMember && !isReadOnly && (
                <p className="text-xs text-muted-foreground">
                  Ce réseau est en mode <span className="font-medium">personnel</span> : vous
                  pouvez enregistrer votre propre lien.
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="space-y-4 pt-4 border-t">
        {others.map((s) => {
          const Icon = s.icon;

          if (s.scope === "agency_website") {
            const locked = isAgencyMember;
            const value = isAgencyMember
              ? agency?.website_url || ""
              : profile?.agency_website_url || "";

            return (
              <div key={s.key} className="space-y-2">
                <Label htmlFor={s.key} className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${s.color || "text-gray-500"}`} />
                    {s.label}
                  </span>
                  {locked ? renderBadge("géré par l’agence") : null}
                </Label>

                <Input
                  id={s.key}
                  name={s.key}
                  value={value}
                  onChange={locked ? undefined : handleProChange}
                  onClick={
                    locked
                      ? () => showLockedToast("Le site web est géré par l’agence.")
                      : undefined
                  }
                  readOnly={locked}
                  className={locked ? "bg-slate-50 cursor-not-allowed" : ""}
                  placeholder="https://..."
                  disabled={disabledAll}
                />
              </div>
            );
          }

          if (s.scope === "video") {
            const locked = isAgencyMember && isVideoAgencyImposed;
            const value = locked
              ? agency?.video_external_url || agency?.video_url || ""
              : profile?.video_external_url || "";

            return (
              <div key={s.key} className="space-y-2">
                <Label htmlFor={s.key} className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${s.color || "text-gray-500"}`} />
                    {s.label}
                  </span>
                  {locked ? renderBadge("vidéo imposée par l’agence") : null}
                </Label>

                <Input
                  id={s.key}
                  name={s.key}
                  value={value}
                  onChange={locked ? undefined : handleProChange}
                  onClick={
                    locked
                      ? () =>
                          showLockedToast(
                            "La vidéo affichée sur votre carte est actuellement gérée par l’agence."
                          )
                      : undefined
                  }
                  readOnly={locked}
                  className={locked ? "bg-slate-50 cursor-not-allowed" : ""}
                  placeholder="https://youtube.com/... ou https://vimeo.com/..."
                  disabled={disabledAll}
                />

                <p className="text-xs text-muted-foreground">
                  Exemples : YouTube, Vimeo, Loom.
                  {isAgencyMember && !locked ? (
                    <>
                      {" "}
                      Votre agence a activé le mode{" "}
                      <span className="font-medium">vidéo personnelle</span>.
                    </>
                  ) : null}
                </p>
              </div>
            );
          }

          return (
            <div key={s.key} className="space-y-2">
              <Label htmlFor={s.key} className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${s.color || "text-gray-500"}`} />
                {s.label}
              </Label>

              <Input
                id={s.key}
                name={s.key}
                value={profile?.[s.key] || ""}
                onChange={handleProChange}
                placeholder="https://..."
                disabled={disabledAll}
              />
            </div>
          );
        })}
      </div>

      <div className="flex justify-end pt-2 gap-2 flex-wrap">
        <Button
          onClick={onSave}
          disabled={disabledAll || !dirtyPersonal}
          variant={isAgencyMember ? "outline" : "default"}
          className={!isAgencyMember ? "bg-brand-blue hover:bg-blue-700" : ""}
        >
          {savingLocal ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Enregistrer liens personnels
        </Button>
      </div>

      {isIndependent && (
        <p className="text-xs text-muted-foreground">
          Astuce : pour une cohérence parfaite, utilisez le même nom sur tous vos réseaux.
        </p>
      )}
    </div>
  );
}