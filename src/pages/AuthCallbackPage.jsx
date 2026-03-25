// src/pages/AuthCallbackPage.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/customSupabaseClient";
import { Button } from "@/components/ui/button";
import { notifySignupAndWelcome } from "@/services/notifications";

/* --------------------------------- URL helpers -------------------------------- */

function getUrl() {
  try {
    return new URL(window.location.href);
  } catch {
    return null;
  }
}

function getSafeNext() {
  const url = getUrl();
  if (!url) return null;
  const next = url.searchParams.get("next");
  // next doit être un path interne
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return null;
}

function getFlowParam() {
  const url = getUrl();
  if (!url) return null;
  const flow = (url.searchParams.get("flow") || "").toString().trim().toLowerCase();
  if (flow === "particulier" || flow === "professionnel" || flow === "admin") return flow;
  return null;
}

function hasPkceCodeInUrl() {
  const url = getUrl();
  if (!url) return false;
  return Boolean(url.searchParams.get("code"));
}

function hasImplicitTokensInHash() {
  const h = window.location.hash || "";
  return h.includes("access_token=") || h.includes("refresh_token=");
}

function getOtpParamsFromQuery() {
  const url = getUrl();
  if (!url) return null;
  const token = url.searchParams.get("token");
  const type = url.searchParams.get("type");
  if (!token || !type) return null;
  return { token, type };
}

async function waitForSession({ timeoutMs = 12000, stepMs = 150 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.user?.id) return data.session;
    await new Promise((r) => setTimeout(r, stepMs));
  }
  return null;
}

function cleanUrlSensitiveParams() {
  try {
    const clean = new URL(window.location.href);
    [
      "code",
      "token",
      "type",
      "redirect_to",
      "access_token",
      "refresh_token",
      "expires_in",
      "expires_at",
      "provider_token",
      "provider_refresh_token",
    ].forEach((k) => clean.searchParams.delete(k));
    clean.hash = "";
    window.history.replaceState({}, "", clean.toString());
  } catch {
    // ignore
  }
}

function extractDraftIdFromNext(nextPath) {
  try {
    if (!nextPath) return null;
    const u = new URL(nextPath, window.location.origin);
    return u.searchParams.get("draft") || null;
  } catch {
    return null;
  }
}

function inferFlowFromNext(nextPath) {
  const n = String(nextPath || "");
  if (n.startsWith("/particulier")) return "particulier";
  if (n.startsWith("/professionnel")) return "professionnel";
  if (n.startsWith("/admin")) return "admin";
  return null;
}

function isCvdExternalEntry(pathOrUrl) {
  const s = String(pathOrUrl || "");
  // on refuse absolument le flow /cvd/ + entry=external
  return s.startsWith("/cvd/") || s.includes("/cvd/") || s.includes("entry=external");
}

/* ----------------------------- DB role (fallback) ----------------------------- */

async function fetchDbRole(userId) {
  try {
    const { data, error } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
    if (error) return null;
    const role = (data?.role || "").toString().trim().toLowerCase();
    if (role === "professionnel" || role === "pro") return "professionnel";
    if (role === "particulier") return "particulier";
    return null;
  } catch {
    return null;
  }
}

async function isAdmin(userId) {
  try {
    const { data, error } = await supabase.from("administrator").select("id").eq("id", userId).maybeSingle();
    if (error) return false;
    return !!data?.id;
  } catch {
    return false;
  }
}

/* ----------------------------- RPC helpers (server) ----------------------------- */

async function initParticulierAccount() {
  const { error } = await supabase.rpc("init_particulier_account");
  if (error) {
    console.error("[AuthCallback] init_particulier_account error:", error);
    throw error;
  }
}

async function finalizeDraftIfAny(draftId) {
  if (!draftId) return null;
  const { data, error } = await supabase.rpc("finalize_particulier_draft", { p_draft_id: draftId });
  if (error) {
    console.error("[AuthCallback] finalize_particulier_draft error:", error);
    // ne bloque pas la connexion
    return null;
  }
  return data ?? null;
}

/* ----------------------------- Notifications (once) ----------------------------- */

async function sendPostAuthNotificationsOnce({ flow, draftId, forceRole }) {
  const { data: s } = await supabase.auth.getSession();
  const userId = s?.session?.user?.id || null;
  const userEmail = s?.session?.user?.email || null;
  if (!userId) return;

  const key = `postauth_notifs_${flow || "unknown"}_${userId}`;
  try {
    if (sessionStorage.getItem(key) === "1") return;
    sessionStorage.setItem(key, "1");
  } catch {
    // ignore
  }

  // CTA user stable (pas de /cvd)
  const ctaUrlUser =
    flow === "particulier"
      ? (draftId ? `/particulier/projets?draft=${encodeURIComponent(draftId)}` : "/particulier/projets")
      : flow === "professionnel"
        ? "/professionnel-dashboard"
        : "/";

  const ctaUrlAdmin = "/admin-dashboard";

  const res = await notifySignupAndWelcome({
    adminEmail: "contact@livingpage.fr",
    ctaUrlUser,
    ctaUrlAdmin,
    forceRole: forceRole || null,
    extraPayload: {
      user_id: userId,
      email: userEmail,
      draft_id: draftId || null,
      created_from: "auth_callback",
    },
  });

  if (res?.error) console.error("[AuthCallback] notifySignupAndWelcome error:", res.error);
}

/* ------------------------------------ Page ------------------------------------ */

export default function AuthCallbackPage() {
  const nav = useNavigate();
  const [state, setState] = useState({ loading: true, error: null });

  // anti double-run (StrictMode)
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    let alive = true;

    async function run() {
      try {
        const otpAtStart = getOtpParamsFromQuery();
        const otpType = otpAtStart?.type || null;

        // capture avant nettoyage
        const safeNext = getSafeNext();
        const flowFromNext = inferFlowFromNext(safeNext);
        const flowFromParam = getFlowParam();
        const draftId = extractDraftIdFromNext(safeNext);

        const initial = await supabase.auth.getSession();
        let session = initial?.data?.session ?? null;

        // 1) OTP verify
        if (!session && otpAtStart?.token && otpAtStart?.type) {
          const { data, error } = await supabase.auth.verifyOtp({
            type: otpAtStart.type,
            token_hash: otpAtStart.token,
          });
          if (error) throw error;
          session = data?.session ?? null;
        }

        // 2) PKCE
        if (!session && hasPkceCodeInUrl()) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (error) throw error;
          session = data?.session ?? null;
        }

        // 3) implicit
        if (!session && hasImplicitTokensInHash()) {
          if (typeof supabase.auth.getSessionFromUrl === "function") {
            const { data, error } = await supabase.auth.getSessionFromUrl({ storeSession: true });
            if (error) throw error;
            session = data?.session ?? null;
          }
        }

        // 4) wait fallback
        if (!session) session = await waitForSession();

        if (!session?.user?.id) {
          throw new Error("Session introuvable après confirmation. Lien expiré/déjà utilisé ?");
        }

        // stop re-exec on refresh
        cleanUrlSensitiveParams();

        // recovery flow
        if (otpType === "recovery") {
          nav("/recuperation-mot-de-passe", { replace: true });
          return;
        }

        const userId = session.user.id;

        // flow final : param > next > db
        let flow = flowFromParam || flowFromNext || null;

        // bloque next toxique /cvd
        const badNext = isCvdExternalEntry(safeNext);

        // Si pas de flow explicite, on lit la DB
        if (!flow) {
          const admin = await isAdmin(userId);
          if (admin) flow = "admin";
          else flow = (await fetchDbRole(userId)) || null;
        }

        // ✅ FLOW PARTICULIER : route stable + init + draft
        if (flow === "particulier") {
          await initParticulierAccount();
          await finalizeDraftIfAny(draftId);

          await sendPostAuthNotificationsOnce({
            flow: "particulier",
            draftId,
            forceRole: "particulier",
          });

          if (draftId) {
            nav(`/particulier/projets?draft=${encodeURIComponent(draftId)}`, { replace: true });
          } else {
            nav("/particulier/projets", { replace: true });
          }
          return;
        }

        // ✅ FLOW PRO/ADMIN : si next safe et pas /cvd, on le suit
        if (safeNext && !badNext) {
          nav(safeNext, { replace: true });
          return;
        }

        // fallback safe
        if (flow === "admin") {
          nav("/admin-dashboard", { replace: true });
          return;
        }
        if (flow === "professionnel") {
          nav("/professionnel-dashboard", { replace: true });
          return;
        }

        // dernier fallback : évite /cvd quoi qu'il arrive
        nav("/connexion?reason=role_unknown", { replace: true });
      } catch (e) {
        console.error("[AuthCallback] fatal error:", e);
        if (alive) setState({ loading: false, error: e?.message || String(e) });
      } finally {
        if (alive) setState((s) => ({ ...s, loading: false }));
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [nav]);

  if (state.loading) return <div className="p-6">Connexion en cours…</div>;

  if (state.error) {
    return (
      <div className="p-6 space-y-3">
        <div className="font-semibold">Erreur de connexion :</div>
        <pre className="bg-gray-50 p-3 rounded border text-sm whitespace-pre-wrap">{state.error}</pre>
        <div className="flex gap-2">
          <Button onClick={() => nav("/connexion", { replace: true })}>Se connecter</Button>
          <Button variant="outline" onClick={() => nav("/recuperation-mot-de-passe", { replace: true })}>
            Renvoyer un lien
          </Button>
        </div>
      </div>
    );
  }

  return null;
}