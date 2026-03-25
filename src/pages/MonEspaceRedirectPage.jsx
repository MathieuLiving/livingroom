// src/pages/MonEspaceRedirectPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/lib/customSupabaseClient";
import { Loader2 } from "lucide-react";

const norm = (v) => String(v ?? "").trim().toLowerCase();

// ✅ ROUTES alignées avec TON App.jsx
const ROUTES = {
  admin: "/admin-dashboard",
  particulier: "/dashboard-particulier",
  proDefault: "/professionnel-dashboard",
  agencyDirector: "/agence/dashboard",
  agencyTeamLeader: "/agence/team-leader",
};

const PRO_EFFECTIVE_VIEW = "professionnel_profile_effective_v2";

export default function MonEspaceRedirectPage() {
  const { isAuthBusy, session, isAdmin, profile, userType, profileLoading } = useAuth();
  const location = useLocation();

  const [to, setTo] = useState(null);
  const ranForUidRef = useRef(null);

  const computedType = useMemo(() => norm(userType || profile?.role), [userType, profile?.role]);

  useEffect(() => {
    if (isAuthBusy || profileLoading) return;

    // Pas connecté => login
    if (!session) {
      const next = encodeURIComponent(location.pathname + location.search);
      setTo(`/connexion?next=${next}`);
      return;
    }

    // Admin => admin
    if (isAdmin) {
      setTo(ROUTES.admin);
      return;
    }

    const uid = session?.user?.id || null;
    if (!uid) {
      setTo(ROUTES.proDefault);
      return;
    }

    // Evite re-run en boucle
    if (ranForUidRef.current === uid && to) return;
    ranForUidRef.current = uid;

    // Pro / Professionnel
    if (computedType === "professionnel" || computedType === "pro") {
      (async () => {
        try {
          // ✅ 1) PRIORITÉ: view effective (déjà filtrée par auth.uid())
          // IMPORTANT: PAS de .eq(...)
          const { data: vData, error: vErr } = await supabase
            .from(PRO_EFFECTIVE_VIEW)
            .select("professionnel_id, me_user_id, agency_id, me_agency_role")
            .maybeSingle();

          if (vErr) {
            console.warn("[MonEspaceRedirectPage] view error:", vErr);
          }

          if (vData) {
            const role = norm(vData?.me_agency_role);

            if (role === "director") {
              setTo(ROUTES.agencyDirector);
              return;
            }
            if (role === "team_leader") {
              setTo(ROUTES.agencyTeamLeader);
              return;
            }

            // agent d'agence (role === "agent") -> on l'envoie sur dashboard pro
            setTo(ROUTES.proDefault);
            return;
          }

          // ✅ 2) FALLBACK: table professionnels (agents "classiques" hors agence)
          const { data: pData, error: pErr } = await supabase
            .from("professionnels")
            .select("agency_role, agency_id")
            .eq("user_id", uid)
            .maybeSingle();

          if (pErr) {
            console.error("[MonEspaceRedirectPage] fallback professionnels error:", pErr);
            setTo(ROUTES.proDefault);
            return;
          }

          const role2 = norm(pData?.agency_role);

          if (role2 === "director") {
            setTo(ROUTES.agencyDirector);
            return;
          }
          if (role2 === "team_leader") {
            setTo(ROUTES.agencyTeamLeader);
            return;
          }

          setTo(ROUTES.proDefault);
        } catch (e) {
          console.error("[MonEspaceRedirectPage] exception:", e);
          setTo(ROUTES.proDefault);
        }
      })();

      return;
    }

    // Particulier
    setTo(ROUTES.particulier);
  }, [
    isAuthBusy,
    profileLoading,
    session,
    isAdmin,
    computedType,
    location.pathname,
    location.search,
    to,
  ]);

  if (isAuthBusy || profileLoading || !to) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Redirection vers votre espace…</span>
        </div>
      </div>
    );
  }

  return <Navigate to={to} replace state={{ from: location }} />;
}