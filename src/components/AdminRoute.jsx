import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/SupabaseAuthContext";
import { Loader2 } from "lucide-react";

export default function AdminRoute({ children }) {
  const { loading, user, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/connexion?role=professionnel&next=${next}`} replace />;
  }

  if (!isAdmin) return <Navigate to="/professionnel-dashboard" replace />;

  return children;
}