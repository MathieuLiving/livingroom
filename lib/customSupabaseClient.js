// lib/customSupabaseClient.js
import { createClient } from "@supabase/supabase-js";

/**
 * ✅ Client Supabase UNIQUE (racine /lib) — SINGLETON GARANTI
 * - Utilise VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY si dispo
 * - Fallback hardcodé si env absentes
 * - Injecte UNIQUEMENT `apikey` si absent (⚠️ ne touche jamais Authorization)
 *
 * ✅ Preview fix (app-preview.com):
 * - window.fetch est instable/patché => "TypeError: Failed to fetch"
 * - On FORCE XHR pour REST+STORAGE uniquement:
 *     - /rest/v1/*
 *     - /storage/v1/*
 *   ⚠️ On NE force PAS XHR pour /auth/v1/* (sinon 403 sur logout/refresh).
 *
 * ✅ FIX CRITIQUE:
 * - Certains endpoints Supabase répondent 204 No Content sur update/patch.
 * - Un status 204/205/304 ne peut PAS avoir de body => Response(null, init)
 *   (sinon: "Failed to construct 'Response': Response with null body status cannot have body")
 *
 * ✅ ROBUSTESSE PREVIEW:
 * - status=0 arrive parfois avec proxy/iframe => on renvoie une Response "network-ish" cohérente
 * - Timeout toujours appliqué même si un signal externe est fourni (compose signals)
 */

const FALLBACK_SUPABASE_URL = "https://ohddhnegsqvxhyohgsoi.supabase.co";
const FALLBACK_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oZGRobmVnc3F2eGh5b2hnc29pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5Njg4MDcsImV4cCI6MjA3MjU0NDgwN30.C_KwnZVRnMOKWyr9_rNIhfMq5NHLv1AimKH-UX7qVO0";

const ENV_SUPABASE_URL = String(import.meta?.env?.VITE_SUPABASE_URL || "").trim();
const ENV_SUPABASE_ANON_KEY = String(import.meta?.env?.VITE_SUPABASE_ANON_KEY || "").trim();

const SUPABASE_URL = ENV_SUPABASE_URL || FALLBACK_SUPABASE_URL;
const SUPABASE_ANON_KEY = ENV_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;

// ✅ timeout plus long en preview (réseau + proxy plus lents)
const TIMEOUT_MS = (() => {
  try {
    const host = String(globalThis?.location?.hostname || "");
    return host.includes("app-preview.com") ? 60000 : 15000;
  } catch {
    return 15000;
  }
})();

function isPreviewHost() {
  try {
    const host = String(globalThis?.location?.hostname || "");
    return host.includes("app-preview.com");
  } catch {
    return false;
  }
}

function isSupabaseUrl(url) {
  if (typeof url !== "string") return false;
  // ✅ support .supabase.co et supabase.in (si jamais tu migres)
  return url.includes(".supabase.co/") || url.includes(".supabase.in/");
}

// ✅ On force XHR uniquement pour REST / STORAGE (pas AUTH)
function shouldForceXhr(url) {
  if (!isPreviewHost()) return false;
  if (!isSupabaseUrl(url)) return false;
  if (url.includes("/auth/v1/")) return false; // ⚠️ critical: auth reste en fetch
  return url.includes("/rest/v1/") || url.includes("/storage/v1/");
}

function ensureApiKey(existingHeaders) {
  const headers = new Headers(existingHeaders || undefined);
  if (!headers.get("apikey")) headers.set("apikey", SUPABASE_ANON_KEY);
  return headers;
}

function mergeHeaders(input, initHeaders) {
  const merged = new Headers();

  if (input instanceof Request) {
    try {
      new Headers(input.headers).forEach((v, k) => merged.set(k, v));
    } catch {}
  }

  if (initHeaders) {
    try {
      new Headers(initHeaders).forEach((v, k) => merged.set(k, v));
    } catch {}
  }

  return merged;
}

function isAbortError(e) {
  const name = String(e?.name || "");
  const msg = String(e?.message || e || "").toLowerCase();
  return name === "AbortError" || msg.includes("aborted");
}

/* -------------------------------------------
   ✅ Compose signals (caller + timeout)
-------------------------------------------- */
function anySignal(signals) {
  const list = (signals || []).filter(Boolean);
  if (list.length === 0) return undefined;
  if (list.length === 1) return list[0];

  // Modern browsers
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.any === "function") {
    return AbortSignal.any(list);
  }

  // Fallback: manual bridge
  const controller = new AbortController();
  const onAbort = () => controller.abort("abort-any");
  list.forEach((s) => {
    if (s.aborted) controller.abort("abort-any");
    else s.addEventListener("abort", onAbort, { once: true });
  });
  return controller.signal;
}

/* -------------------------------------------
   Utils: build a Response safely
   - 204/205/304 MUST NOT have a body
-------------------------------------------- */
function buildSafeResponse(body, init, method = "GET") {
  const status = Number(init?.status || 0);
  const statusText = init?.statusText || "";
  const headers = init?.headers || undefined;

  // status 0 = souvent "network/proxy/blocked" en XHR
  // -> on renvoie une Response 0 sans body
  if (status === 0) {
    return new Response(null, { status: 0, statusText: statusText || "Network Error", headers });
  }

  // HEAD + No content statuses => no body
  const noBody =
    method === "HEAD" || status === 204 || status === 205 || status === 304;

  if (noBody) {
    return new Response(null, { status, statusText, headers });
  }

  return new Response(body ?? null, { status, statusText, headers });
}

/* -------------------------------------------
   XHR transport (Response-compatible)
-------------------------------------------- */
function xhrFetch(url, init = {}) {
  const method = String(init.method || "GET").toUpperCase();
  const headers = new Headers(init.headers || undefined);
  const body = init.body;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    try {
      xhr.open(method, url, true);
    } catch (e) {
      reject(e);
      return;
    }

    // ✅ universel REST + storage
    xhr.responseType = "arraybuffer";
    xhr.withCredentials = false;

    headers.forEach((v, k) => {
      try {
        xhr.setRequestHeader(k, v);
      } catch {}
    });

    const signal = init.signal;
    const onAbort = () => {
      try {
        xhr.abort();
      } catch {}
      reject(new DOMException("Aborted", "AbortError"));
    };

    if (signal) {
      if (signal.aborted) return onAbort();
      signal.addEventListener("abort", onAbort, { once: true });
    }

    xhr.onload = () => {
      try {
        const raw = xhr.getAllResponseHeaders?.() || "";
        const respHeaders = new Headers();

        raw
          .trim()
          .split(/[\r\n]+/)
          .filter(Boolean)
          .forEach((line) => {
            const idx = line.indexOf(":");
            if (idx <= 0) return;
            const key = line.slice(0, idx).trim();
            const value = line.slice(idx + 1).trim();
            if (key) respHeaders.append(key, value);
          });

        const status = xhr.status || 0;

        const resp = buildSafeResponse(
          xhr.response,
          {
            status,
            statusText: xhr.statusText || "",
            headers: respHeaders,
          },
          method
        );

        resolve(resp);
      } catch (e) {
        reject(e);
      } finally {
        if (signal) signal.removeEventListener("abort", onAbort);
      }
    };

    xhr.onerror = () => {
      if (signal) signal.removeEventListener("abort", onAbort);
      reject(new TypeError("XHR network error"));
    };

    xhr.ontimeout = () => {
      if (signal) signal.removeEventListener("abort", onAbort);
      reject(new TypeError("XHR timeout"));
    };

    xhr.timeout = TIMEOUT_MS;

    try {
      xhr.send(body ?? null);
    } catch (e) {
      if (signal) signal.removeEventListener("abort", onAbort);
      reject(e);
    }
  });
}

/* -------------------------------------------
   Patch window.fetch en preview (Supabase REST/STORAGE seulement)
-------------------------------------------- */
function patchGlobalFetchForSupabaseInPreview() {
  if (!isPreviewHost()) return;

  try {
    if (globalThis.__LR_FETCH_PATCHED_FOR_SUPABASE__) return;

    const originalFetch = globalThis.fetch?.bind(globalThis);
    if (typeof originalFetch !== "function") return;

    globalThis.__LR_ORIGINAL_FETCH__ = originalFetch;

    globalThis.fetch = async (input, init = {}) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof Request
          ? input.url
          : String(input?.url || "");

      // ✅ on ne détourne QUE rest/storage (jamais auth)
      if (!shouldForceXhr(url)) {
        return originalFetch(input, init);
      }

      const merged = mergeHeaders(input, init?.headers);
      const headers = ensureApiKey(merged);

      const method = String(init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();

      // ✅ compose signal: caller + (pas de timeout ici, car global fetch n’en gère pas)
      const signal = init?.signal;
      const body = init?.body;

      return xhrFetch(url, { method, headers, body, signal });
    };

    globalThis.__LR_FETCH_PATCHED_FOR_SUPABASE__ = true;

    // eslint-disable-next-line no-console
    console.info("[Supabase Preview] window.fetch patched for REST/STORAGE only (XHR). Auth stays fetch.");
  } catch {
    // ignore
  }
}
patchGlobalFetchForSupabaseInPreview();

/* -------------------------------------------
   Debug init (une seule fois)
-------------------------------------------- */
let didLog = false;
function debugLogOnce() {
  if (didLog) return;
  didLog = true;

  try {
    const key = SUPABASE_ANON_KEY || "";
    const safeKey = key.length > 16 ? `${key.slice(0, 8)}…${key.slice(-6)}` : `len=${key.length}`;

    // eslint-disable-next-line no-console
    console.info("[Supabase Init]", {
      url: SUPABASE_URL,
      usingEnvUrl: Boolean(ENV_SUPABASE_URL),
      usingEnvKey: Boolean(ENV_SUPABASE_ANON_KEY),
      anonKey: safeKey,
      transport: isPreviewHost()
        ? "XHR for REST/STORAGE (preview) + fetch for AUTH"
        : "fetch",
      timeoutMs: TIMEOUT_MS,
      singletonKey: "__LR_SUPABASE_SINGLETON__",
    });
  } catch {}
}

/* -------------------------------------------
   ✅ SINGLETON GARANTI
-------------------------------------------- */
const SINGLETON_KEY = "__LR_SUPABASE_SINGLETON__";

function getOrCreateSupabaseSingleton() {
  if (globalThis?.[SINGLETON_KEY]) return globalThis[SINGLETON_KEY];

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      fetch: async (input, init = {}) => {
        debugLogOnce();

        const url =
          typeof input === "string"
            ? input
            : input instanceof Request
            ? input.url
            : String(input?.url || "");

        const method = String(init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();

        // ✅ timeout local + compose avec signal externe
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort("timeout"), TIMEOUT_MS);

        try {
          const merged = mergeHeaders(input, init.headers);
          const headers = ensureApiKey(merged);

          const signal = anySignal([init?.signal, controller.signal]);

          // ✅ En preview : XHR seulement pour REST/STORAGE (auth reste fetch)
          if (shouldForceXhr(url)) {
            return await xhrFetch(url, { method, headers, body: init?.body, signal });
          }

          // ✅ Sinon fetch normal (y compris /auth/v1/*)
          if (input instanceof Request) {
            const req = new Request(input, { ...(init || {}), headers, signal });
            return await globalThis.fetch(req);
          }

          return await globalThis.fetch(input, { ...(init || {}), headers, signal });
        } catch (e) {
          if (isAbortError(e)) throw e;

          // eslint-disable-next-line no-console
          console.error("[Supabase transport error]", {
            url,
            method,
            name: e?.name,
            message: String(e?.message || e || ""),
          });
          throw e;
        } finally {
          clearTimeout(t);
        }
      },
    },

    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  globalThis[SINGLETON_KEY] = client;
  return client;
}

export const supabase = getOrCreateSupabaseSingleton();
export default supabase;

export const isIgnorableFetchError = (error) => {
  if (!error) return false;
  const msg = String(error.message || error).toLowerCase();
  const name = String(error.name || "");
  return (
    name === "AbortError" ||
    msg.includes("abort") ||
    msg.includes("canceled") ||
    msg.includes("cancelled") ||
    msg.includes("timeout")
  );
};