import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/customSupabaseClient";

const CvdQrRedirectPage = () => {
  const { slug } = useParams();

  useEffect(() => {
    let isMounted = true;

    const trackAndRedirect = async () => {
      const normalizedSlug = slug ? slug.trim() : "";

      if (!normalizedSlug) {
        window.location.replace("https://card.livingroom.immo/nos-professionnels-partenaires");
        return;
      }

      try {
        // Track the QR scan via Supabase RPC
        await supabase.rpc("increment_card_metric", {
          p_slug: normalizedSlug,
          p_metric: "qr"
        });
      } catch (error) {
        console.error("Failed to track QR scan:", error);
      } finally {
        // Always redirect, even if tracking fails
        if (isMounted) {
          window.location.replace(`https://card.livingroom.immo/cvd/${normalizedSlug}`);
        }
      }
    };

    trackAndRedirect();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
      <p className="text-lg font-medium text-slate-700">Redirection vers la carte…</p>
    </div>
  );
};

export default CvdQrRedirectPage;