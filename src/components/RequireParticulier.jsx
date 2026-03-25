// src/components/RequireParticulier.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../contexts/SupabaseAuthContext";

const norm = (v) => String(v ?? "").trim().toLowerCase();

export default function RequireParticulier({
  children,
  fallback = "/dashboard-particulier",
}) {
  const location = useLocation();
  const { isAuthBusy, user, userType, isAdmin } = useAuth();

  // 1) Auth loading or data fetching
  if (isAuthBusy) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-blue" />
      </div>
    );
  }

  // 2) Not logged in -> go to /connexion (NOT /auth), keep next
  if (!user?.id) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/connexion?role=particulier&next=${next}`} replace />;
  }

  // 3) Admin should never be here
  if (isAdmin) {
    return <Navigate to="/admin-dashboard" replace />;
  }

  // 4) Wrong role -> redirect to correct space (avoid /mon-espace here)
  const t = norm(userType);
  if (t !== "particulier") {
    // If user is pro, send to pro dashboard. Otherwise send to home.
    if (t === "professionnel" || t === "pro") {
      return <Navigate to="/professionnel-dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  // 5) Access granted
  return children ?? <Navigate to={fallback} replace />;
}