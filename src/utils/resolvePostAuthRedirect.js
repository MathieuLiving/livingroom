// src/utils/resolvePostAuthRedirect.js

/**
 * Calcule la redirection post-authentification.
 *
 * Priorité :
 * 1) Admin
 * 2) ?next interne sûr ET autorisé
 * 3) Rôle (professionnel / particulier)
 * 4) Fallback sûr (jamais "/")
 */

const norm = (v) => String(v ?? "").trim().toLowerCase();

const isSafeInternalPath = (p) =>
  typeof p === "string" &&
  p.startsWith("/") &&
  !p.startsWith("//") &&
  !p.includes("\\") &&
  !p.includes("\u0000");

const isAdminPath = (p) => /^\/admin\b/i.test(p);
const isProPath = (p) => /^\/professionnel\b/i.test(p) || /^\/agence\b/i.test(p) || /^\/pro-de-limmo\b/i.test(p);
const isParticulierPath = (p) => /^\/particulier\b/i.test(p);

// Évite les retours vers les flows publics CVD (ça déclenche des "pro introuvable")
const isCvdExternalEntry = (p) => {
  const s = String(p || "").toLowerCase();
  return s.startsWith("/cvd/") || s.includes("/cvd/") || s.includes("entry=external");
};

// Canonical defaults (doivent matcher App.jsx)
const DEFAULTS = {
  admin: "/admin-dashboard",
  pro: "/professionnel-dashboard",
  part: "/particulier/projets", // ✅ route stable chez toi
};

/**
 * Déduit un rôle "probable" via le next quand profile.role n'est pas encore dispo.
 * (cas très fréquent après signup + verify email)
 */
function inferRoleFromNext(next) {
  const n = String(next || "").toLowerCase();
  if (!n) return null;
  if (n.startsWith("/particulier")) return "particulier";
  if (n.startsWith("/dashboard-particulier") || n.startsWith("/particulier-dashboard")) return "particulier";
  if (n.startsWith("/professionnel") || n.startsWith("/pro-de-limmo") || n.startsWith("/agence")) return "professionnel";
  return null;
}

/**
 * Corrige les anciens chemins encore présents dans le projet.
 */
function normalizeLegacyNext(next, role) {
  const n = String(next || "");

  // Bloque CVD external
  if (isCvdExternalEntry(n)) {
    return role === "professionnel" ? DEFAULTS.pro : DEFAULTS.part;
  }

  // ✅ Remap legacy particulier
  if (
    n === "/dashboard-particulier" ||
    n.startsWith("/dashboard-particulier") ||
    n === "/particulier-dashboard" ||
    n.startsWith("/particulier-dashboard") ||
    n === "/particulier"
  ) {
    return DEFAULTS.part;
  }

  // ✅ Remap legacy pro
  if (n === "/professionnel" || n === "/pro-de-limmo") {
    return DEFAULTS.pro;
  }

  return n;
}

export function resolvePostAuthRedirect({ next, isAdmin, profile }) {
  const roleFromProfile = norm(profile?.role);
  const roleFromNext = inferRoleFromNext(next);

  // ✅ rôle effectif : profile si dispo, sinon hint via next
  const role = roleFromProfile || roleFromNext || "";

  // 1) ADMIN : priorité absolue
  if (isAdmin) {
    if (isSafeInternalPath(next)) return normalizeLegacyNext(next, "admin");
    return DEFAULTS.admin;
  }

  // 2) ?next= interne sûr ET autorisé selon le rôle
  if (isSafeInternalPath(next)) {
    const normalized = normalizeLegacyNext(next, role || roleFromNext || "");

    // Sécurité : jamais admin sans être admin
    if (isAdminPath(normalized)) return DEFAULTS.part;

    // Accès pro/agence réservé aux professionnels
    if (isProPath(normalized) && role !== "professionnel") return DEFAULTS.part;

    // Accès particulier réservé aux particuliers
    if (isParticulierPath(normalized) && role === "professionnel") return DEFAULTS.pro;

    // ✅ Si rôle particulier OU hint particulier => toujours /particulier/*
    if ((role === "particulier" || roleFromNext === "particulier") && !isParticulierPath(normalized)) {
      return DEFAULTS.part;
    }

    return normalized;
  }

  // 3) Redirection par rôle
  if (role === "professionnel") return DEFAULTS.pro;
  if (role === "particulier") return DEFAULTS.part;

  // 4) Fallback sûr : JAMAIS "/"
  return DEFAULTS.part;
}