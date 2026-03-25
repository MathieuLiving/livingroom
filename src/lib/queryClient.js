import { QueryClient } from "@tanstack/react-query";

/**
 * Détecte les erreurs réseau "bruit" (logout / preview / offline)
 */
const isNetworkNoiseError = (err) => {
  const msg = String(err?.message || err || "");
  const name = String(err?.name || "");
  return (
    name === "AbortError" ||
    msg.toLowerCase().includes("aborted") ||
    msg.includes("Failed to fetch") ||
    msg.toLowerCase().includes("networkerror") ||
    msg.toLowerCase().includes("load failed")
  );
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // ✅ réduit le bruit en environnement preview/offline
      retry: (failureCount, error) => {
        // pas de retry sur bruit réseau / abort
        if (isNetworkNoiseError(error)) return false;
        // sinon, 1 retry max comme tu avais
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,

      // ✅ optionnel : évite que des requêtes très vieilles refetchent au montage
      staleTime: 10_000,
      gcTime: 10 * 60 * 1000,
    },
    mutations: {
      retry: (failureCount, error) => {
        if (isNetworkNoiseError(error)) return false;
        return failureCount < 1;
      },
    },
  },
});

/**
 * ✅ À appeler au signOut pour stopper net React Query
 * - annule les requêtes en cours
 * - stop les refetchs
 * - flush le cache
 */
export const clearOnSignOut = async () => {
  try {
    // stoppe les refetch automatiques
    queryClient.getQueryCache().getAll().forEach((q) => {
      // pause = pas de refetch pendant un moment critique
      q.setState({ fetchStatus: "idle" });
    });

    // annule ce qui est en vol
    await queryClient.cancelQueries({ predicate: () => true });

    // enlève tout (queries + mutations)
    queryClient.clear();
  } catch {
    // noop
  }
};