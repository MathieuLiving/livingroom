// src/components/RequireAdmin.jsx
import React, { useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../contexts/SupabaseAuthContext";

const FullscreenLoader = () => (
  <div className="fixed inset-0 bg-white bg-opacity-75 flex justify-center items-center z-50">
    <Loader2 className="h-12 w-12 animate-spin text-brand-blue" />
  </div>
);

const isTruthy = (v) => v === true;

/**
 * RequireAdmin
 *
 * Règles :
 * - utilisateur authentifié requis
 * - admin uniquement (source : table `administrator` via isAdmin dans le contexte)
 * - aucune requête Supabase ici
 *
 * Notes :
 * - Évite fallback="/": chez toi "/" peut déclencher des redirects (slug/cvd).
 * - Route "safe" pour non-admin connecté : /mon-espace
 */
const RequireAdmin = ({ children, fallback = "/mon-espace" }) => {
  const auth = useAuth();
  const location = useLocation();

  const next = useMemo(
    () => encodeURIComponent(location.pathname + location.search),
    [location.pathname, location.search]
  );

  // ✅ Support des 2 variantes de contexte (mais priorité à isAuthBusy)
  const busy =
    isTruthy(auth?.isAuthBusy) ||
    isTruthy(auth?.loading) ||
    isTruthy(auth?.profileLoading) ||
    isTruthy(auth?.isAdminLoading);

  const userId = auth?.user?.id || auth?.session?.user?.id || null;

  // 1) Loading
  if (busy) return <FullscreenLoader />;

  // 2) Non connecté -> login (on garde next)
  if (!userId) {
    return <Navigate to={`/connexion?next=${next}`} replace />;
  }

  // 3) Connecté mais pas admin -> sortie vers une route stable
  if (!isTruthy(auth?.isAdmin)) {
    return <Navigate to={fallback} replace />;
  }

  // 4) OK admin
  return children;
};

export default RequireAdmin;