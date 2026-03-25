// src/pages/SupabaseDebugPage.jsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { supabase } from "@/lib/customSupabaseClient";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";

const REST_TEST_TABLE = "projects"; // adapte si besoin

function mask(str, opts = { showStart: 6, showEnd: 6 }) {
  if (!str || typeof str !== "string") return "";
  const { showStart, showEnd } = opts;
  if (str.length <= showStart + showEnd) return "•".repeat(Math.max(8, str.length));
  return (
    str.slice(0, showStart) +
    "•".repeat(str.length - showStart - showEnd) +
    str.slice(-showEnd)
  );
}

const isIgnorableFetchError = (error) => {
  if (!error) return false;
  const msg = String(error?.message || error).toLowerCase();
  return msg.includes("abort") || msg.includes("canceled") || msg.includes("cancelled");
};

const safeTrimUrl = (u) => String(u || "").trim().replace(/\/+$/, "");

const toErrString = (e) => {
  if (!e) return "";
  if (typeof e === "string") return e;
  return e?.message ? String(e.message) : JSON.stringify(e);
};

async function fetchWithTimeout(url, options = {}, ms = 8000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    const text = await res.text().catch(() => "");
    return { ok: res.ok, status: res.status, text, headers: Object.fromEntries(res.headers.entries()) };
  } finally {
    clearTimeout(t);
  }
}

const SupabaseDebugPage = () => {
  const { user, session, loading, signOut, isAdmin, isSigningOut } = useAuth();

  const envUrlRaw = import.meta.env.VITE_SUPABASE_URL ?? "";
  const envKeyRaw = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";
  const url = useMemo(() => safeTrimUrl(envUrlRaw), [envUrlRaw]);
  const apikey = useMemo(() => String(envKeyRaw || ""), [envKeyRaw]);

  const [diagnostics, setDiagnostics] = useState({
    env: null, // { ok, error? }
    authHealth: null, // { ok, status, error?, hint? }
    restPing: null, // { ok, status, error?, hint? }
    restTableHead: null, // { ok, status, error?, hint? }
    sdkSession: null, // { ok, error?, hasSession }
  });

  const [rpcTests, setRpcTests] = useState({
    uid: null,
    agency_me: null,
    director_list_agency_invitations: null,
  });

  const mountedRef = useRef(true);
  const runIdRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      runIdRef.current += 1;
    };
  }, []);

  const envStatus = useMemo(() => {
    const envOk = !!url && apikey.length > 50 && url.startsWith("https://");
    let error = null;
    if (!url) error = "VITE_SUPABASE_URL est vide (souvent le cas en preview si les ENV ne sont pas injectées).";
    else if (!url.startsWith("https://")) error = "VITE_SUPABASE_URL doit commencer par https://";
    else if (!apikey) error = "VITE_SUPABASE_ANON_KEY est vide.";
    else if (apikey.length <= 50) error = "VITE_SUPABASE_ANON_KEY semble trop courte (clé invalide ou tronquée).";
    return { ok: envOk, error };
  }, [url, apikey]);

  const runDiagnostics = useCallback(async () => {
    if (isSigningOut) return;

    const runId = ++runIdRef.current;

    const next = {
      env: envStatus.ok ? { ok: true } : { ok: false, error: envStatus.error },
      authHealth: null,
      restPing: null,
      restTableHead: null,
      sdkSession: null,
    };

    // 1) AUTH health (sans apikey)
    try {
      if (!url) {
        next.authHealth = { ok: false, status: 0, error: "URL Supabase vide", hint: "Vérifie les ENV du preview" };
      } else {
        const r = await fetchWithTimeout(`${url}/auth/v1/health`, { method: "GET", mode: "cors" }, 8000);
        next.authHealth = {
          ok: r.ok,
          status: r.status,
          error: r.ok ? null : `HTTP ${r.status}`,
          hint: r.ok ? null : (r.text ? r.text.slice(0, 200) : null),
        };
      }
    } catch (e) {
      if (isSigningOut || isIgnorableFetchError(e)) return;
      next.authHealth = {
        ok: false,
        status: 0,
        error: toErrString(e),
        hint:
          "Si c'est 'Failed to fetch', c'est réseau/CORS/ENV (pas RLS). Vérifie aussi que fetch n'est pas patché.",
      };
    }

    // 2) REST ping (avec apikey) -> permet de diagnostiquer CORS + reachability
    try {
      if (!envStatus.ok) {
        next.restPing = { ok: false, status: 0, error: "ENV missing/invalid", hint: envStatus.error };
      } else {
        const r = await fetchWithTimeout(
          `${url}/rest/v1/`,
          {
            method: "GET",
            mode: "cors",
            headers: {
              apikey,
              Authorization: `Bearer ${apikey}`,
            },
          },
          8000
        );

        // Sur /rest/v1/, Supabase renvoie souvent 404/401 selon config — ce qui nous intéresse ici c'est :
        // - est-ce que la requête sort et revient ? (donc pas "Failed to fetch")
        next.restPing = {
          ok: r.status > 0, // si on a un status, le réseau fonctionne
          status: r.status,
          error: r.status > 0 ? null : "No status",
          hint:
            r.status === 0
              ? "Pas de réponse: typiquement CORS/réseau"
              : r.text
              ? r.text.slice(0, 200)
              : "Réponse reçue (réseau OK)",
        };
      }
    } catch (e) {
      if (isSigningOut || isIgnorableFetchError(e)) return;
      next.restPing = {
        ok: false,
        status: 0,
        error: toErrString(e),
        hint:
          "Failed to fetch ici = navigateur n'arrive pas à joindre Supabase (ENV vide, CORS origin, DNS, blocage, fetch wrapper).",
      };
    }

    // 3) REST table HEAD (avec apikey) -> plus proche de ce que fait supabase-js
    try {
      if (!envStatus.ok) {
        next.restTableHead = { ok: false, status: 0, error: "ENV missing/invalid", hint: envStatus.error };
      } else {
        const r = await fetchWithTimeout(
          `${url}/rest/v1/${encodeURIComponent(REST_TEST_TABLE)}?select=id`,
          {
            method: "GET",
            mode: "cors",
            headers: {
              apikey,
              Authorization: `Bearer ${apikey}`,
              Prefer: "count=exact",
            },
          },
          8000
        );

        // Si RLS bloque, tu auras un JSON d'erreur avec status 401/403/404.
        // Si c'est "Failed to fetch", status 0.
        next.restTableHead = {
          ok: r.ok,
          status: r.status,
          error: r.ok ? null : `HTTP ${r.status}`,
          hint: r.text ? r.text.slice(0, 300) : null,
        };
      }
    } catch (e) {
      if (isSigningOut || isIgnorableFetchError(e)) return;
      next.restTableHead = { ok: false, status: 0, error: toErrString(e), hint: "Network/CORS probable" };
    }

    // 4) SDK session
    try {
      const { data, error } = await supabase.auth.getSession();
      next.sdkSession = { ok: !error, error: error?.message || null, hasSession: !!data?.session };
    } catch (e) {
      if (isSigningOut || isIgnorableFetchError(e)) return;
      next.sdkSession = { ok: false, error: toErrString(e), hasSession: false };
    }

    // 5) RPC tests — UNIQUEMENT si session présente
    try {
      const { data: sessData } = await supabase.auth.getSession();
      const uid = sessData?.session?.user?.id || null;

      if (!uid) {
        setRpcTests({
          uid: null,
          agency_me: { ok: false, rows: 0, error: "No session (connecte-toi d'abord)", sample: null },
          director_list_agency_invitations: { ok: false, rows: 0, error: "No session", sample: null },
        });
      } else {
        const { data: meData, error: meErr } = await supabase.rpc("agency_me");
        const { data: invData, error: invErr } = await supabase.rpc("director_list_agency_invitations");

        const meRows = Array.isArray(meData) ? meData : [];
        const invRows = Array.isArray(invData) ? invData : [];

        if (!mountedRef.current || isSigningOut || runId !== runIdRef.current) return;

        setRpcTests({
          uid,
          agency_me: {
            ok: !meErr,
            rows: meRows.length,
            error: meErr?.message || null,
            sample: meRows[0] || null,
          },
          director_list_agency_invitations: {
            ok: !invErr,
            rows: invRows.length,
            error: invErr?.message || null,
            sample: invRows[0] || null,
          },
        });
      }
    } catch (e) {
      if (!mountedRef.current || isSigningOut || runId !== runIdRef.current) return;
      setRpcTests({
        uid: null,
        agency_me: { ok: false, rows: 0, error: toErrString(e), sample: null },
        director_list_agency_invitations: { ok: false, rows: 0, error: toErrString(e), sample: null },
      });
    }

    if (!mountedRef.current || isSigningOut || runId !== runIdRef.current) return;
    setDiagnostics(next);
  }, [envStatus, isSigningOut, url, apikey]);

  useEffect(() => {
    runDiagnostics();
  }, [runDiagnostics]);

  const badge = (pass) =>
    pass ? (
      <span className="inline-block px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs ml-2">
        OK
      </span>
    ) : (
      <span className="inline-block px-2 py-0.5 rounded bg-red-100 text-red-700 text-xs ml-2">
        FAIL
      </span>
    );

  // OPTIONNEL : réserver la page à l’admin
  if (user && isAdmin === false) {
    return (
      <div className="container mx-auto p-6">
        <SEO title="Debug" description="Page technique" noindex nofollow />
        <h1 className="text-2xl font-bold">Accès refusé</h1>
        <p className="text-slate-600 mt-2">Cette page est réservée à l’administration.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <SEO title="Debug Supabase" description="Page technique de diagnostic. Ne pas indexer." noindex nofollow />

      <h1 className="text-2xl font-bold">Supabase Debug</h1>

      <section>
        <h2 className="text-xl font-semibold mb-2">
          Environment Variables {diagnostics.env ? badge(!!diagnostics.env.ok) : null}
        </h2>

        <div className="bg-gray-50 border rounded p-3 text-sm space-y-1">
          <div>
            <b>VITE_SUPABASE_URL:</b> {url || <i>(vide)</i>}
          </div>
          <div>
            <b>VITE_SUPABASE_ANON_KEY:</b> {apikey ? mask(apikey) : <i>(vide)</i>}
          </div>
          {diagnostics.env?.error ? (
            <div className="mt-2 text-red-700 text-xs">
              <b>ENV issue:</b> {diagnostics.env.error}
            </div>
          ) : null}
        </div>

        <div className="text-xs text-slate-500 mt-2">
          REST test table: <b>{REST_TEST_TABLE}</b>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Diagnostics réseau</h2>

        <div className="bg-white border rounded p-3 text-sm">
          <div className="font-medium">
            Auth health (/auth/v1/health) {diagnostics.authHealth ? badge(!!diagnostics.authHealth.ok) : null}
          </div>
          {diagnostics.authHealth && (
            <div className="text-gray-700 mt-1">
              Status: {diagnostics.authHealth.status}
              {diagnostics.authHealth.error ? ` — ${diagnostics.authHealth.error}` : ""}
              {diagnostics.authHealth.hint ? (
                <div className="text-xs text-slate-500 mt-1">{diagnostics.authHealth.hint}</div>
              ) : null}
            </div>
          )}
        </div>

        <div className="bg-white border rounded p-3 text-sm">
          <div className="font-medium">
            REST ping (/rest/v1/) {diagnostics.restPing ? badge(!!diagnostics.restPing.ok) : null}
          </div>
          {diagnostics.restPing && (
            <div className="text-gray-700 mt-1">
              Status: {diagnostics.restPing.status}
              {diagnostics.restPing.error ? ` — ${diagnostics.restPing.error}` : ""}
              {diagnostics.restPing.hint ? (
                <div className="text-xs text-slate-500 mt-1">{diagnostics.restPing.hint}</div>
              ) : null}
            </div>
          )}
        </div>

        <div className="bg-white border rounded p-3 text-sm">
          <div className="font-medium">
            REST table check (/rest/v1/{REST_TEST_TABLE}?select=id){" "}
            {diagnostics.restTableHead ? badge(!!diagnostics.restTableHead.ok) : null}
          </div>
          {diagnostics.restTableHead && (
            <div className="text-gray-700 mt-1">
              Status: {diagnostics.restTableHead.status}
              {diagnostics.restTableHead.error ? ` — ${diagnostics.restTableHead.error}` : ""}
              {diagnostics.restTableHead.hint ? (
                <div className="text-xs text-slate-500 mt-1 whitespace-pre-wrap">
                  {diagnostics.restTableHead.hint}
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="bg-white border rounded p-3 text-sm">
          <div className="font-medium">
            SDK session {diagnostics.sdkSession ? badge(!!diagnostics.sdkSession.ok) : null}
          </div>
          {diagnostics.sdkSession && (
            <div className="text-gray-700 mt-1">
              Has session: {String(!!diagnostics.sdkSession.hasSession)}
              {diagnostics.sdkSession.error ? ` — ${diagnostics.sdkSession.error}` : ""}
            </div>
          )}
        </div>

        <div className="bg-white border rounded p-3 text-sm">
          <div className="font-medium">RPC tests</div>
          <div className="text-gray-700 mt-1">
            uid (session): <b>{rpcTests.uid || "—"}</b>
          </div>

          <div className="mt-2">
            <div>
              agency_me {rpcTests.agency_me ? badge(!!rpcTests.agency_me.ok) : null}
            </div>
            {rpcTests.agency_me && (
              <div className="text-gray-700">
                rows: {rpcTests.agency_me.rows}
                {rpcTests.agency_me.error ? ` — ${rpcTests.agency_me.error}` : ""}
              </div>
            )}
            {rpcTests.agency_me?.sample ? (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-slate-600">sample (agency_me)</summary>
                <pre className="bg-gray-50 border rounded p-2 text-xs overflow-auto mt-2">
                  {JSON.stringify(rpcTests.agency_me.sample, null, 2)}
                </pre>
              </details>
            ) : null}
          </div>

          <div className="mt-2">
            <div>
              director_list_agency_invitations{" "}
              {rpcTests.director_list_agency_invitations
                ? badge(!!rpcTests.director_list_agency_invitations.ok)
                : null}
            </div>
            {rpcTests.director_list_agency_invitations && (
              <div className="text-gray-700">
                rows: {rpcTests.director_list_agency_invitations.rows}
                {rpcTests.director_list_agency_invitations.error
                  ? ` — ${rpcTests.director_list_agency_invitations.error}`
                  : ""}
              </div>
            )}
            {rpcTests.director_list_agency_invitations?.sample ? (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-slate-600">sample (director_list_agency_invitations)</summary>
                <pre className="bg-gray-50 border rounded p-2 text-xs overflow-auto mt-2">
                  {JSON.stringify(rpcTests.director_list_agency_invitations.sample, null, 2)}
                </pre>
              </details>
            ) : null}
          </div>
        </div>

        <Button onClick={runDiagnostics} className="mt-2" disabled={isSigningOut}>
          Re-run diagnostics
        </Button>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Auth Context State</h2>
        <div className="text-sm">Loading: {String(loading)}</div>

        <div className="grid md:grid-cols-2 gap-3 mt-2">
          <div>
            <div className="font-medium">User</div>
            <pre className="bg-gray-50 border rounded p-2 text-xs overflow-auto">
              {JSON.stringify(user ?? null, null, 2)}
            </pre>
          </div>
          <div>
            <div className="font-medium">Session</div>
            <pre className="bg-gray-50 border rounded p-2 text-xs overflow-auto">
              {JSON.stringify(session ?? null, null, 2)}
            </pre>
          </div>
        </div>

        {user && (
          <Button onClick={signOut} variant="destructive" className="mt-3">
            Sign Out
          </Button>
        )}
      </section>
    </div>
  );
};

export default SupabaseDebugPage;