import { useEffect } from "react";

/**
 * Verrouille le bouton "retour" (mobile) et persiste des query params (ex: kiosk=1).
 *
 * @param {Object} options
 * @param {boolean} options.enabled - Active le verrouillage.
 * @param {Record<string,string>} [options.persistQuery] - Paires clé/valeur à forcer dans l'URL.
 */
export default function useKioskBackLock({ enabled, persistQuery = { kiosk: "1" } }) {
  useEffect(() => {
    if (!enabled) return;

    const onPop = (e) => {
      e?.preventDefault?.();
      // Reste sur la page courante même si l’utilisateur appuie sur "retour"
      window.history.go(1);
    };

    // Ajoute une frame d'historique pour neutraliser le back (-1)
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", onPop);

    // Persiste les query params demandés
    try {
      const url = new URL(window.location.href);
      let changed = false;
      Object.entries(persistQuery || {}).forEach(([k, v]) => {
        if (url.searchParams.get(k) !== String(v)) {
          url.searchParams.set(k, String(v));
          changed = true;
        }
      });
      if (changed) window.history.replaceState(null, "", url.toString());
    } catch {
      /* no-op */
    }

    return () => window.removeEventListener("popstate", onPop);
  }, [enabled, JSON.stringify(persistQuery)]);
}