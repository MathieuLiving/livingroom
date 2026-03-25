// src/pages/AgencyFinalizePage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/lib/customSupabaseClient";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Building2,
  ArrowRight,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

function safeParseJSON(str) {
  try {
    return str ? JSON.parse(str) : null;
  } catch {
    return null;
  }
}

function getInviteTokenFromSearch(search) {
  const params = new URLSearchParams(search || "");
  return (
    params.get("invite_token") ||
    params.get("token") ||
    params.get("invitation_token") ||
    ""
  ).trim();
}

function readLS(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function removeLS(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

const isAlreadyConfigured = (err, data) => {
  const msg = String(err?.message || "").toLowerCase();
  return (
    msg.includes("already") ||
    msg.includes("exists") ||
    msg.includes("duplicate") ||
    data?.status === "already_exists" ||
    data?.status === "already_configured"
  );
};

const AgencyFinalizePage = () => {
  const { user, refreshProfile, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState(
    "Finalisation de l'installation de votre agence..."
  );

  // ✅ StrictMode-safe: empêcher double exécution du flow
  const hasRunRef = useRef(false);

  // ✅ Draft lu au runtime (pas figé)
  const draftData = useMemo(() => {
    const raw = readLS("agency_creation_draft");
    return safeParseJSON(raw) || {};
  }, []);

  // ✅ invite token robuste
  const inviteToken = useMemo(() => {
    const fromQuery = getInviteTokenFromSearch(location.search);
    const fromLS = (readLS("agency_invite_token") || "").trim();
    const fromDraft = String(draftData?.invite_token || "").trim();
    return fromQuery || fromLS || fromDraft || "";
  }, [location.search, draftData]);

  // ✅ source de vérité: token présent => invite
  const flow = useMemo(
    () => (inviteToken ? "invite" : "director"),
    [inviteToken]
  );

  useEffect(() => {
    let cancelled = false;

    const finalize = async () => {
      // ✅ attendre auth stable
      if (!session || !user?.id) return;

      // ✅ éviter double run
      if (hasRunRef.current) return;
      hasRunRef.current = true;

      try {
        // ----------------------------
        // FLOW 1 : INVITATION MEMBRE
        // ----------------------------
        if (flow === "invite") {
          if (!inviteToken) {
            throw new Error(
              "Invitation introuvable. Merci de repasser par le lien d’invitation envoyé par votre agence."
            );
          }

          setStatus("loading");
          setMessage("Validation de votre invitation et rattachement à l’agence...");

          const { data, error } = await supabase.rpc("accept_agency_invitation", {
            p_token: inviteToken,
          });

          if (error) throw error;

          if (cancelled) return;

          setStatus("success");
          setMessage("Vous avez rejoint l’agence avec succès !");

          // cleanup local
          removeLS("agency_creation_draft");
          removeLS("agency_invite_token");

          // refresh identity (important)
          try {
            await refreshProfile?.();
          } catch {
            // ignore
          }

          toast({
            title: "Invitation acceptée !",
            description: "Votre compte est maintenant rattaché à l’agence.",
            duration: 5000,
          });

          return;
        }

        // --------------------------------
        // FLOW 2 : CREATION AGENCE DIRECTEUR
        // --------------------------------
        setStatus("loading");
        setMessage("Création et configuration de votre agence...");

        const { data, error } = await supabase.functions.invoke("agency-bootstrap", {
          body: {
            user_id: user.id,
            email: user.email || null,
            user_metadata: user.user_metadata || {},
            draft_data: draftData || {},
          },
        });

        if (error && !isAlreadyConfigured(error, data)) {
          throw error;
        }

        if (cancelled) return;

        setStatus("success");
        setMessage("Votre agence a été configurée avec succès !");

        removeLS("agency_creation_draft");

        try {
          await refreshProfile?.();
        } catch {
          // ignore
        }

        toast({
          title: "Agence créée !",
          description: "Bienvenue sur votre espace agence.",
          duration: 5000,
        });
      } catch (err) {
        console.error("[AgencyFinalizePage] finalize error:", err);
        if (cancelled) return;
        setStatus("error");
        setMessage(
          err?.message || "Une erreur est survenue lors de la finalisation."
        );

        // ✅ autoriser retry (sinon hasRunRef bloque)
        hasRunRef.current = false;
      }
    };

    // ✅ petit délai UX, mais pas bloquant
    const t = setTimeout(finalize, 400);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [session, user?.id, user?.email, user?.user_metadata, flow, inviteToken, draftData, refreshProfile, toast]);

  const handleContinue = async () => {
    try {
      await refreshProfile?.();
    } catch {
      // ignore
    }

    if (flow === "invite") {
      navigate("/professionnel-dashboard", { replace: true });
    } else {
      navigate("/agence/agents", { replace: true });
    }
  };

  const handleRetry = () => {
    // ✅ on relance le flow sans recharger toute la page
    setStatus("loading");
    setMessage("Nouvelle tentative de finalisation...");
    hasRunRef.current = false;
    // re-trigger effect by nudging location? simplest: reload
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Helmet>
        <title>Finalisation Agence | LivingRoom.immo</title>
      </Helmet>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="h-12 w-12 bg-brand-orange rounded-xl flex items-center justify-center">
            <Building2 className="h-6 w-6 text-white" />
          </div>
        </div>

        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          {flow === "invite"
            ? "Finalisation de votre inscription"
            : "Configuration de votre Agence"}
        </h2>

        {flow === "invite" && (
          <p className="mt-2 text-center text-sm text-gray-600">
            Nous rattachons votre compte à l’agence…
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10"
        >
          <div className="flex flex-col items-center text-center space-y-6">
            {status === "loading" && (
              <>
                <Loader2 className="h-16 w-16 text-brand-blue animate-spin" />
                <p className="text-lg text-gray-600 font-medium">{message}</p>
                <p className="text-sm text-gray-400">
                  Cela ne devrait prendre que quelques secondes...
                </p>
              </>
            )}

            {status === "success" && (
              <>
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-lg text-gray-900 font-medium">{message}</p>
                <Button
                  onClick={handleContinue}
                  className="w-full bg-brand-blue hover:bg-blue-700"
                >
                  Continuer <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            )}

            {status === "error" && (
              <>
                <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
                <p className="text-lg text-red-600 font-medium">Oups !</p>
                <p className="text-sm text-gray-600">{message}</p>
                <div className="flex gap-4 w-full">
                  <Button
                    variant="outline"
                    onClick={() => navigate("/contact")}
                    className="flex-1"
                  >
                    Contacter le support
                  </Button>
                  <Button onClick={handleRetry} className="flex-1">
                    Réessayer
                  </Button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AgencyFinalizePage;