// src/hooks/useCvdBack.js
import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getCvdSlug } from "@/utils/cvdHelpers";
import { useAuth } from "@/contexts/SupabaseAuthContext";

/**
 * useCvdBack(professional, options)
 * options:
 *  - fromCard: boolean         → revenir vers la carte digitale
 *  - fromPartnersList: boolean → revenir vers /nos-professionnels-partenaires
 */
export function useCvdBack(
  professional,
  { fromCard = false, fromPartnersList = false } = {}
) {
  const navigate = useNavigate();
  const { isSigningOut } = useAuth();

  // Construit l'URL de la carte de visite digitale
  const cvdUrl = useMemo(() => {
    if (!professional) return null;

    const rawUrl =
      professional.digital_card_livingroom_url ||
      professional.digital_card_livingpage_url ||
      professional.digital_card_url ||
      null;

    if (rawUrl) {
      if (rawUrl.startsWith("http")) return rawUrl;
      if (rawUrl.startsWith("/cvd/")) return rawUrl;
      return `/cvd/${rawUrl.replace(/^\/+/, "")}`;
    }

    const slug =
      typeof getCvdSlug === "function" ? getCvdSlug(professional) : null;
    if (slug) return `/cvd/${encodeURIComponent(slug)}`;

    return null;
  }, [professional]);

  const handleBack = useCallback(() => {
    // ✅ Pendant signOut, on évite toute navigation “bonus”
    if (isSigningOut) return;

    // 1) Cas : on vient explicitement de la carte digitale
    if (fromCard && cvdUrl) {
      // prefer assign pour garder un comportement navigation standard
      window.location.assign(cvdUrl);
      return;
    }

    // 2) Cas : on vient de la liste des pros
    if (fromPartnersList) {
      navigate("/nos-professionnels-partenaires", { replace: true });
      return;
    }

    // 3) Fallback : retourner vers la liste
    navigate("/nos-professionnels-partenaires", { replace: true });
  }, [fromCard, fromPartnersList, navigate, cvdUrl, isSigningOut]);

  return { handleBack, cvdUrl };
}