import React, { useMemo, useRef, memo, useCallback } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Crown,
  Copy,
  ExternalLink,
  Download,
  QrCode as QrCodeIcon,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "../ui/use-toast";
import { isValidHex, COLOR_DEFAULTS } from "../../utils/proHelpers";
import { getLogoUrl } from "@/utils/storageAssets";
import QRCodeGenerator from "../QRCodeGenerator";

const ATTACHED_ROLES = new Set(["director", "team_leader", "agent_affiliate"]);
const CARD_SITE_URL = "https://card.livingroom.immo";

const pickHexOr = (v, fallback) => (isValidHex(v) ? v : fallback);
const isFilled = (v) =>
  v !== undefined && v !== null && String(v).trim() !== "";
const normalizeRole = (value) => String(value || "").toLowerCase().trim();
const isAgencyAttachedRole = (role) => ATTACHED_ROLES.has(normalizeRole(role));
const normalizeSlug = (value) => String(value || "").trim();

const normalizePremiumUrl = (rawUrl) => {
  const raw = String(rawUrl || "").trim();
  if (!raw) return "";

  try {
    const u = new URL(raw);
    u.hash = "";
    u.search = "";
    return u.toString();
  } catch {
    return raw;
  }
};

const buildQrTrackingUrl = (cardSlug) => {
  const safeSlug = normalizeSlug(cardSlug);
  if (!safeSlug) return "";
  return `${CARD_SITE_URL}/qr/${encodeURIComponent(safeSlug)}`;
};

const copyWithExecCommandFallback = (text) => {
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
};

const CardDistributionTools = memo(function CardDistributionTools({
  profile,
  agency,
  saving,
  proId,
}) {
  const { toast } = useToast();
  const qrWrapRef = useRef(null);

  const agencyRole = useMemo(
    () => normalizeRole(profile?.agency_role || "agent"),
    [profile?.agency_role]
  );

  const isAgencyMember = useMemo(
    () => isAgencyAttachedRole(agencyRole),
    [agencyRole]
  );

  const isIndependentAgent = useMemo(
    () => agencyRole === "agent" || !isAgencyMember,
    [agencyRole, isAgencyMember]
  );

  const isDirector = agencyRole === "director";
  const isUniform = !!agency?.colors_uniform;
  const allowCustomization = !!profile?.allow_card_customization;

  const isLockedByAgency = useMemo(() => {
    if (!isAgencyMember) return false;
    if (isUniform) return true;
    if (isDirector) return false;
    return !allowCustomization;
  }, [isAgencyMember, isUniform, isDirector, allowCustomization]);

  const qrFgColor = useMemo(() => {
    const profileColor = pickHexOr(
      profile?.card_qr_fg_color,
      COLOR_DEFAULTS.card_qr_fg_color || "#000000"
    );

    const agencyColor = pickHexOr(
      agency?.card_qr_fg_color || profile?.agency_card_qr_fg_color,
      profileColor
    );

    if (isIndependentAgent) return profileColor;
    if (isUniform) return agencyColor;
    if (isLockedByAgency) return agencyColor;
    return profileColor;
  }, [
    profile?.card_qr_fg_color,
    profile?.agency_card_qr_fg_color,
    agency?.card_qr_fg_color,
    isIndependentAgent,
    isUniform,
    isLockedByAgency,
  ]);

  const premiumCardUrl = useMemo(() => {
    return normalizePremiumUrl(profile?.premium_professionnel_card);
  }, [profile?.premium_professionnel_card]);

  const cardSlug = useMemo(() => {
    return normalizeSlug(profile?.card_slug);
  }, [profile?.card_slug]);

  const qrValue = useMemo(() => {
    return buildQrTrackingUrl(cardSlug);
  }, [cardSlug]);

  const isPremiumPublic = useMemo(() => {
    return isFilled(profile?.premium_professionnel_card);
  }, [profile?.premium_professionnel_card]);

  const wantsQrLogo = useMemo(() => {
    if (isAgencyMember) {
      return !!(agency?.qr_code_with_logo ?? profile?.agency_qr_code_with_logo);
    }
    return !!(profile?.own_qr_code_with_logo ?? profile?.qr_code_with_logo);
  }, [
    isAgencyMember,
    agency?.qr_code_with_logo,
    profile?.agency_qr_code_with_logo,
    profile?.own_qr_code_with_logo,
    profile?.qr_code_with_logo,
  ]);

  const rawLogoSource = useMemo(() => {
    if (isAgencyMember) {
      return (
        agency?.logo_url ||
        agency?.logo_storage_path ||
        profile?.agency_logo_url ||
        profile?.agency_logo_path ||
        profile?.effective_logo_url ||
        profile?.effective_logo_path ||
        ""
      );
    }

    return (
      profile?.own_logo_url ||
      profile?.own_logo_path ||
      profile?.logo_url ||
      profile?.logo_path ||
      profile?.effective_logo_url ||
      profile?.effective_logo_path ||
      ""
    );
  }, [
    isAgencyMember,
    agency?.logo_url,
    agency?.logo_storage_path,
    profile?.agency_logo_url,
    profile?.agency_logo_path,
    profile?.effective_logo_url,
    profile?.effective_logo_path,
    profile?.own_logo_url,
    profile?.own_logo_path,
    profile?.logo_url,
    profile?.logo_path,
  ]);

  const resolvedLogoUrl = useMemo(() => {
    return getLogoUrl(rawLogoSource) || "";
  }, [rawLogoSource]);

  const qrLogoUrl = useMemo(() => {
    if (!wantsQrLogo) return undefined;
    if (!isPremiumPublic) return undefined;
    if (!isFilled(resolvedLogoUrl)) return undefined;
    return resolvedLogoUrl;
  }, [wantsQrLogo, isPremiumPublic, resolvedLogoUrl]);

  const qrEcLevel = useMemo(() => (qrLogoUrl ? "H" : "M"), [qrLogoUrl]);

  const targetProId = String(proId || profile?.id || "").trim();

  const copy = useCallback(
    async (text) => {
      if (!text) return;

      try {
        if (window.isSecureContext && navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
          toast({
            title: "Copié",
            description: "Lien premium copié dans le presse-papiers.",
          });
          return;
        }

        const ok = copyWithExecCommandFallback(text);
        if (ok) {
          toast({
            title: "Copié",
            description: "Lien premium copié dans le presse-papiers.",
          });
          return;
        }

        throw new Error("clipboard_unavailable");
      } catch {
        const ok = copyWithExecCommandFallback(text);
        if (ok) {
          toast({
            title: "Copié",
            description: "Lien premium copié dans le presse-papiers.",
          });
          return;
        }

        toast({
          variant: "destructive",
          title: "Copie impossible",
          description: "Copiez manuellement le lien affiché.",
        });
      }
    },
    [toast]
  );

  const downloadQrPng = useCallback(async () => {
    const canvas = qrWrapRef.current?.querySelector("canvas");

    if (!canvas) {
      toast({
        variant: "destructive",
        title: "QR non prêt",
        description: "Impossible de récupérer le canvas du QR Code.",
      });
      return;
    }

    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `qr-${targetProId || "pro"}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [targetProId, toast]);

  const qrColorMessage = useMemo(() => {
    if (isIndependentAgent) {
      return "Couleur choisie par l’agent indépendant.";
    }
    if (isUniform) {
      return "Charte uniforme : couleur imposée par l’agence pour toute l’équipe.";
    }
    if (isLockedByAgency) {
      return "Couleur imposée par l’agence.";
    }
    if (isDirector) {
      return "Couleur choisie par le directeur.";
    }
    return "Couleur héritée de votre configuration actuelle.";
  }, [isIndependentAgent, isUniform, isLockedByAgency, isDirector]);

  const qrLogoMessage = useMemo(() => {
    if (!wantsQrLogo) return "désactivé";
    if (!isPremiumPublic) return "désactivé (lien premium manquant)";
    if (!qrLogoUrl) return "activé mais logo introuvable";
    return isAgencyMember ? "activé (logo agence)" : "activé (logo personnel)";
  }, [wantsQrLogo, isPremiumPublic, qrLogoUrl, isAgencyMember]);

  if (!premiumCardUrl) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Lien premium manquant</p>
            <p className="mt-1 text-sm">
              Cette section utilise uniquement la valeur du champ{" "}
              <code>premium_professionnel_card</code>. Renseignez ce lien pour
              activer l’ouverture publique et le QR code.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3 rounded-xl border bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <p className="flex items-center gap-2 font-semibold">
              <Crown className="h-4 w-4 text-brand-orange" />
              Lien Carte (Premium)
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={saving}
            onClick={() => copy(premiumCardUrl)}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copier
          </Button>
        </div>

        <Input readOnly value={premiumCardUrl} className="bg-gray-50" />

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={saving}
            onClick={() => {
              window.open(premiumCardUrl, "_blank", "noopener,noreferrer");
            }}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Ouvrir
          </Button>

          <Button
            variant="secondary"
            size="sm"
            disabled={saving || !qrValue}
            onClick={downloadQrPng}
          >
            <Download className="mr-2 h-4 w-4" />
            Télécharger QR
          </Button>
        </div>

        <div className="mt-4 flex flex-col gap-6 rounded-xl border bg-white p-4 md:flex-row md:items-start">
          <div className="flex flex-col items-center space-y-2 md:items-start">
            <p className="flex items-center gap-2 font-semibold">
              <QrCodeIcon className="h-4 w-4" />
              QR Code
            </p>

            <p className="text-xs text-slate-600">{qrColorMessage}</p>

            <p className="text-[11px] text-muted-foreground">
              Logo dans le QR : {qrLogoMessage}
            </p>

            <div
              ref={qrWrapRef}
              className="w-fit rounded-xl border bg-white p-3 shadow-sm"
            >
              <QRCodeGenerator
                url={qrValue || premiumCardUrl}
                size={200}
                quietZone={10}
                fgColor={qrFgColor}
                logoUrl={qrLogoUrl}
                withLogo={Boolean(qrLogoUrl)}
                ecLevel={qrEcLevel}
              />
            </div>
          </div>

          <div className="w-full flex-1 space-y-3">
            <p className="font-semibold">Bonnes pratiques de diffusion</p>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              Utilisez le lien premium dans vos emails, SMS, WhatsApp et
              signatures mail.
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              Utilisez le QR code sur vos cartes papier, vitrines, flyers et
              documents commerciaux.
            </div>

            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-[11px] text-emerald-800">
              ✅ Le lien public utilise l’URL canonique de la carte. Le QR code
              utilise une route dédiée de tracking puis redirige vers la carte
              publique.
            </div>
          </div>
        </div>

        <div className="space-y-1 pt-2 text-[11px] text-muted-foreground">
          <div className="break-all">
            <span className="font-medium">URL premium effective :</span>{" "}
            {premiumCardUrl}
          </div>

          {qrValue && (
            <div className="break-all">
              <span className="font-medium">URL QR de tracking :</span>{" "}
              {qrValue}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default CardDistributionTools;