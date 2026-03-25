import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/customSupabaseClient";

/**
 * Route publique appelée par le QR Code et/ou par les liens partagés.
 * - Cherche le professionnel par id OU card_slug
 * - Incrémente card_qr_scans (scan)
 * - Redirige vers premium_professionnel_card
 *
 * Route à ajouter : /go/pro/:slugOrId
 */
export default function ProPremiumRedirectPage() {
  const { slugOrId } = useParams();

  useEffect(() => {
    let alive = true;

    const run = async () => {
      try {
        if (!slugOrId) return;

        // 1) trouver le pro (id OU card_slug)
        let pro = null;

        // Essai id direct
        const { data: byId } = await supabase
          .from("professionnels")
          .select("id, premium_professionnel_card, card_slug")
          .eq("id", slugOrId)
          .maybeSingle();

        if (byId?.id) pro = byId;

        // Sinon par slug
        if (!pro) {
          const { data: bySlug } = await supabase
            .from("professionnels")
            .select("id, premium_professionnel_card, card_slug")
            .eq("card_slug", slugOrId)
            .maybeSingle();
          if (bySlug?.id) pro = bySlug;
        }

        const target = (pro?.premium_professionnel_card || "").trim();
        if (!pro?.id || !target) return;

        // 2) incrémenter le compteur "scan"
        // NOTE: si RLS bloque l'update public, il faudra passer par une Edge Function.
        await supabase
          .from("professionnels")
          .update({ card_qr_scans: (pro.card_qr_scans ?? 0) + 1 }) // fallback si select étendu
          .eq("id", pro.id);

        // 3) redirect
        if (alive) window.location.replace(target);
      } catch (e) {
        console.error(e);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [slugOrId]);

  return <div style={{ padding: 24 }}>Redirection en cours…</div>;
}