// src/utils/cvdContext.js

/**
 * Mode "flux carte/QR" => environnement neutre (pas de branding LR via Header/Footer).
 * Persisté en sessionStorage (disparaît à la fermeture de l'onglet).
 *
 * 🔒 Verrouillage total :
 * - Le mode neutre n'est déclenché QUE par les routes cartes/QR (cvd/carte-visite/livingroom).
 * - Les params (cvd=1 / entry=external) ne déclenchent plus rien à eux seuls.
 * - La propagation (withCvdContext) est BLOQUÉE sur les routes sensibles (ex: /agence-lead).
 */

const CVD_NEUTRAL_KEY = "lr_cvd_neutral_flow";

/**
 * Routes où on interdit totalement :
 * - déclenchement du mode neutre
 * - propagation des params cvd/entry
 */
const CVD_SENSITIVE_PREFIXES = [
  "/agence-lead",
  "/agence", // pages agence (pour éviter pollution)
  "/connexion",
  "/inscription",
  "/auth",
  "/auth/callback",
  "/auth/v1/verify",
  "/recuperation-mot-de-passe",
  "/confirmation",
  "/admin",
  "/admin-dashboard",
  "/supabase-debug",
];

function safeGetSessionItem(key) {
  try {
    if (typeof window === "undefined") return null;
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetSessionItem(key, value) {
  try {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function safeRemoveSessionItem(key) {
  try {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function isSensitivePath(pathname = "") {
  const p =
    pathname ||
    (typeof window !== "undefined" ? window.location.pathname : "") ||
    "";
  return CVD_SENSITIVE_PREFIXES.some((prefix) => p === prefix || p.startsWith(prefix + "/"));
}

/**
 * Détecte une entrée via une carte/QR.
 * 🔒 Verrouillé : uniquement via les routes "carte", jamais via query string.
 */
export function isCvdEntry(pathname = "", search = "") {
  // SSR safety
  const p =
    pathname ||
    (typeof window !== "undefined" ? window.location.pathname : "") ||
    "";

  // ✅ Ne jamais activer le mode neutre sur les routes sensibles
  if (isSensitivePath(p)) return false;

  // ✅ Seules les routes carte/QR déclenchent le mode neutre
  const isCardPath =
    p.startsWith("/cvd/") ||
    p.startsWith("/carte-visite-digitale/") ||
    p.startsWith("/livingroom/");

  return isCardPath;
}

/**
 * Lit l'état du flux neutre depuis sessionStorage.
 */
export function readCvdNeutralFlow() {
  return safeGetSessionItem(CVD_NEUTRAL_KEY) === "1";
}

/**
 * Écrit l'état du flux neutre dans sessionStorage.
 */
export function writeCvdNeutralFlow(on) {
  if (on) safeSetSessionItem(CVD_NEUTRAL_KEY, "1");
  else safeRemoveSessionItem(CVD_NEUTRAL_KEY);
}

/**
 * Règle globale :
 * - si on ENTRE via carte/QR => on active le flux neutre pour toute la session
 * - sinon => on conserve l'état session (si déjà activé)
 *
 * 🔒 Verrouillé : sur routes sensibles, on n'active jamais le neutre.
 */
export function getNeutralMode(pathname = "", search = "") {
  const p =
    pathname ||
    (typeof window !== "undefined" ? window.location.pathname : "") ||
    "";

  if (isSensitivePath(p)) return false;

  const enteredViaCard = isCvdEntry(pathname, search);
  if (enteredViaCard) {
    writeCvdNeutralFlow(true);
    return true;
  }
  return readCvdNeutralFlow();
}

/**
 * Propager le contexte "carte" sur des liens internes.
 * 🔒 Verrouillé : ne propage JAMAIS vers des routes sensibles.
 */
export function withCvdContext(url, currentSearch = "") {
  if (typeof window === "undefined") return url;

  const isAbsolute = /^https?:\/\//i.test(url);
  const base = isAbsolute
    ? url
    : `${window.location.origin}${url.startsWith("/") ? "" : "/"}${url}`;

  const u = new URL(base);

  // ✅ Bloque propagation vers routes sensibles
  if (isSensitivePath(u.pathname)) {
    // On renvoie l'URL d'origine (sans ajouter cvd/entry)
    return isAbsolute ? u.toString() : `${u.pathname}${u.search || ""}${u.hash || ""}`;
  }

  // ✅ Si on n'est pas en mode neutre, ne rien propager
  const currentlyNeutral = readCvdNeutralFlow();
  if (!currentlyNeutral) {
    return isAbsolute ? u.toString() : `${u.pathname}${u.search || ""}${u.hash || ""}`;
  }

  // Sinon, on propage un marqueur stable
  // (on ne lit plus "cvd" depuis la query ; on impose "1" si neutre)
  u.searchParams.set("cvd", "1");
  u.searchParams.set("entry", "external");

  // optionnel : conserver premium si présent sur l'URL courante
  try {
    const sp = new URLSearchParams(currentSearch || window.location.search || "");
    const premium = sp.get("premium");
    if (premium) u.searchParams.set("premium", premium);
  } catch {
    // ignore
  }

  return isAbsolute
    ? u.toString()
    : `${u.pathname}?${u.searchParams.toString()}${u.hash || ""}`;
}