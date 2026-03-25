// src/pages/AuthPage.jsx
import React, { useEffect, useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

import AuthForm from "@/components/auth/AuthForm";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { resolvePostAuthRedirect } from "@/utils/resolvePostAuthRedirect";

/* -----------------------------
   Helpers
----------------------------- */

const norm = (v) => String(v ?? "").trim().toLowerCase();

const isSafeInternalPath = (p) =>
  typeof p === "string" &&
  p.startsWith("/") &&
  !p.startsWith("//") &&
  !p.includes("\\") &&
  !p.includes("\u0000");

// Évite les retours vers les flows publics CVD (ça déclenche des "pro introuvable")
const isCvdExternalEntry = (p) => {
  const s = String(p || "").toLowerCase();
  return s.startsWith("/cvd/") || s.includes("/cvd/") || s.includes("entry=external");
};

// Defaults CANONIQUES (doivent matcher App.jsx)
const DEFAULTS = {
  pro: "/professionnel-dashboard",
  part: "/particulier/projets",
};

/**
 * ⚠️ CRITIQUE
 * - AuthCallback détecte le flow "particulier" UNIQUEMENT via "/particulier/..."
 * - Donc on ne doit JAMAIS renvoyer "/dashboard-particulier" ici.
 */
function normalizeNextForAuth(role, nextParam) {
  const r = norm(role);

  // 1) next fourni et safe ?
  if (isSafeInternalPath(nextParam)) {
    const lower = String(nextParam).toLowerCase();

    // Bloque CVD external (open flow public)
    if (isCvdExternalEntry(lower)) {
      return r === "professionnel" ? DEFAULTS.pro : DEFAULTS.part;
    }

    // --- Remap legacy particulier ---
    if (r === "particulier") {
      if (
        lower === "/dashboard-particulier" ||
        lower.startsWith("/dashboard-particulier") ||
        lower === "/particulier-dashboard" ||
        lower.startsWith("/particulier-dashboard") ||
        lower === "/particulier"
      ) {
        return DEFAULTS.part;
      }

      // Force un chemin /particulier/*
      if (!lower.startsWith("/particulier")) {
        return DEFAULTS.part;
      }

      return nextParam;
    }

    // --- Pro ---
    if (r === "professionnel") {
      // Optionnel : remap legacy pro
      if (lower === "/professionnel" || lower === "/pro-de-limmo") {
        return DEFAULTS.pro;
      }
      return nextParam;
    }

    return nextParam;
  }

  // 2) fallback sûr
  return r === "professionnel" ? DEFAULTS.pro : DEFAULTS.part;
}

/* -----------------------------
   Page
----------------------------- */

const AuthPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const { isAuthBusy, session, isAdmin, profile } = useAuth();

  const role = useMemo(() => {
    const p = norm(params.get("role"));
    return p === "professionnel" ? "professionnel" : "particulier";
  }, [params]);

  /**
   * ✅ NEXT NORMALISÉ
   * - garanti compatible avec AuthCallback
   * - empêche tout retour vers /dashboard-particulier
   * - bloque /cvd/...entry=external
   */
  const next = useMemo(() => {
    return normalizeNextForAuth(role, params.get("next"));
  }, [params, role]);

  const initialTab = useMemo(() => {
    if (location.pathname === "/inscription") return "register";

    const tab = norm(params.get("tab"));
    if (tab === "register" || tab === "login") return tab;

    return "login";
  }, [location.pathname, params]);

  /**
   * Redirect post-auth (login classique)
   * - AuthCallback gère déjà le cas signup / email-confirm
   */
  useEffect(() => {
    if (isAuthBusy) return;
    if (!session) return;

    const target = resolvePostAuthRedirect({
      next,
      isAdmin,
      profile,
    });

    // Évite les boucles
    const current = location.pathname + location.search;
    if (target && target !== current) {
      navigate(target, { replace: true });
    }
  }, [
    isAuthBusy,
    session,
    next,
    isAdmin,
    profile,
    navigate,
    location.pathname,
    location.search,
  ]);

  if (isAuthBusy && session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-grow flex items-center justify-center p-4">
        <AuthForm userType={role} initialTab={initialTab} next={next} />
      </main>
      <Footer />
    </div>
  );
};

export default AuthPage;