// src/components/RequirePro.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../contexts/SupabaseAuthContext";

const FullscreenLoader = ({ label = "Chargement…" }) => (
  <div className="fixed inset-0 bg-white bg-opacity-75 flex flex-col gap-3 justify-center items-center z-50">
    <Loader2 className="h-12 w-12 animate-spin text-brand-blue" />
    <div className="text-xs text-gray-500">{label}</div>
  </div>
);

const norm = (v) => String(v ?? "").trim().toLowerCase();

const DEFAULT_ROLE_PRIORITY = {
  director: 3,
  team_leader: 2,
  agent: 1,
};

/**
 * RequirePro
 * Source de vérité: SupabaseAuthContext
 *
 * ✅ Règle métier:
 * - Pro "AGENCE" uniquement si proIsAgency === true (donc agency_id non-null)
 * - Sinon pro "INDEPENDANT"
 *
 * modes:
 * - mode="pro"    -> tout pro passe (indépendant ou agence)
 * - mode="agency" -> uniquement pro en agence + role valide
 */
const RequirePro = ({
  children,
  fallback = "/professionnel-dashboard",
  mode = "pro", // "pro" | "agency"
  allowRoles = ["director", "team_leader", "agent"],
  requireActive = true,
  allowAdmin = true,
  requireAgentHasLeader = true,

  // Anti-stuck pour éviter “page figée”
  stuckMs = 6000,
}) => {
  const {
    isAuthBusy,
    user,
    isAdmin,
    userType, // attendu: "professionnel" | "particulier" | "admin" ...
    pro,
    proRole, // ✅ null si indépendant
    proIsAgency,
    proIsIndependent,
  } = useAuth();

  const location = useLocation();

  const next = useMemo(
    () => encodeURIComponent(location.pathname + location.search),
    [location.pathname, location.search]
  );

  const debugAuth = useMemo(() => {
    try {
      return new URLSearchParams(location.search).get("debugAuth") === "1";
    } catch {
      return false;
    }
  }, [location.search]);

  // Anti-stuck: si isAuthBusy dure trop longtemps, on stoppe le loader
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    setStuck(false);
    const t = setTimeout(() => setStuck(true), stuckMs);
    return () => clearTimeout(t);
  }, [stuckMs, location.pathname, location.search]);

  const role = norm(userType);
  const isProUserType = role === "professionnel" || role === "pro";

  const allowSet = useMemo(() => {
    const arr = Array.isArray(allowRoles) ? allowRoles : [allowRoles];
    return new Set(arr.map(norm).filter(Boolean));
  }, [allowRoles]);

  const agencyRole = norm(proRole); // ✅ null si indépendant

  // 1) Loading guard (mais pas infini)
  if (isAuthBusy && !stuck) {
    return <FullscreenLoader label="Connexion en cours…" />;
  }

  if (debugAuth) {
    // eslint-disable-next-line no-console
    console.log("[RequirePro debug]", {
      stuck,
      isAuthBusy,
      userId: user?.id,
      isAdmin,
      userType,
      proId: pro?.id,
      proIsAgency,
      proIsIndependent,
      proRole,
      mode,
      path: location.pathname,
    });
  }

  // 2) Not logged -> login pro
  if (!user?.id) {
    return <Navigate to={`/connexion?role=professionnel&next=${next}`} replace />;
  }

  // 3) Admin bypass
  if (allowAdmin && isAdmin) return children;

  // 4) Must be pro (sinon espace particulier)
  if (!isProUserType) {
    return <Navigate to="/dashboard-particulier" replace />;
  }

  // 5) Pro row must exist
  // Si on est stuck, on évite de spinner -> on redirige fallback
  if (!pro?.id) {
    if (!stuck) return <FullscreenLoader label="Chargement de votre profil pro…" />;
    return <Navigate to={fallback} replace />;
  }

  // 6) Optional active checks
  if (requireActive) {
    if (pro.is_active === false) return <Navigate to={fallback} replace />;
    if (pro.is_archived === true) return <Navigate to={fallback} replace />;
  }

  // ---- Mode "pro" ----
  // ✅ Tous les pros (indépendant OU agence) sont autorisés
  if (mode === "pro") return children;

  // ---- Mode "agency" ----
  // ✅ Doit être en agence
  if (!proIsAgency) return <Navigate to={fallback} replace />;

  // ✅ proRole doit exister (et être autorisé) — rappel: proRole est NULL si indépendant
  if (!agencyRole) return <Navigate to={fallback} replace />;
  if (!allowSet.has(agencyRole)) return <Navigate to={fallback} replace />;

  // ✅ agent doit avoir team_leader_id (uniquement en mode agency)
  if (requireAgentHasLeader && agencyRole === "agent") {
    if (!pro.team_leader_id) return <Navigate to={fallback} replace />;
  }

  return children;
};

export function pickBestAgencyRole(roles = [], priority = DEFAULT_ROLE_PRIORITY) {
  const list = (Array.isArray(roles) ? roles : [roles]).map(norm).filter(Boolean);
  if (!list.length) return null;
  return list
    .slice()
    .sort((a, b) => (priority[b] || 0) - (priority[a] || 0))[0];
}

export default RequirePro;