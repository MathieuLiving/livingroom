import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Quand un email Supabase pointe (par erreur) vers /auth/v1/verify sur le domaine FRONT,
 * React Router n'a pas de route => page blanche.
 * Cette page récupère la querystring (?token=...&type=recovery&redirect_to=...)
 * et renvoie vers /auth/callback qui sait traiter la session.
 */
export default function SupabaseVerifyRedirectPage() {
  const nav = useNavigate();
  const location = useLocation();

  useEffect(() => {
    nav(`/auth/callback${location.search}`, { replace: true });
  }, [nav, location.search]);

  return <div className="p-6">Redirection…</div>;
}