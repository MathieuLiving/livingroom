// src/services/notifications.js
import { supabase } from "../../lib/customSupabaseClient";

/* ---------------------------------- helpers ---------------------------------- */

const norm = (v) => (v ?? "").toString().trim();
const normLower = (v) => norm(v).toLowerCase();

function ensureStartsWithSlash(path) {
  const p = norm(path);
  if (!p) return null;
  if (p.startsWith("http://") || p.startsWith("https://")) return p; // déjà full url
  return p.startsWith("/") ? p : `/${p}`;
}

function absoluteUrlIfNeeded(urlOrPath) {
  const v = norm(urlOrPath);
  if (!v) return null;
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  const p = ensureStartsWithSlash(v);
  try {
    return new URL(p, window.location.origin).toString();
  } catch {
    return p;
  }
}

/** Petite hash simple (idempotence event_key, sans lib) */
function djb2(str = "") {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i);
  return (h >>> 0).toString(16);
}

/** event_key stable + court */
function buildEventKey(prefix, parts = []) {
  const raw = [prefix, ...parts.map((p) => norm(p) || "x")].join("|");
  return `${prefix}_${djb2(raw)}`.slice(0, 120);
}

/* ---------------------------------- roles ---------------------------------- */

const normRole = (v) => normLower(v);

function roleFromCtaUrl(ctaUrlUser) {
  const u = normLower(ctaUrlUser);
  if (!u) return null;
  if (u.includes("/particulier")) return "particulier";
  if (u.includes("/professionnel") || u.includes("/pro")) return "professionnel";
  return null;
}

/**
 * Détermine le rôle "effectif" pour les templates, de façon déterministe :
 * 1) forceRole explicite (param)
 * 2) extraPayload.force_role / extraPayload.signup_role / extraPayload.user_role
 * 3) déduction via ctaUrlUser (si /particulier => particulier)
 * 4) identity.role (profiles puis metadata)
 */
function resolveEffectiveRole({ identityRole, ctaUrlUser, extraPayload, forceRole }) {
  const forced =
    normRole(forceRole) ||
    normRole(extraPayload?.force_role) ||
    normRole(extraPayload?.signup_role) ||
    normRole(extraPayload?.user_role);

  if (forced === "particulier") return "particulier";
  if (forced === "professionnel" || forced === "pro") return "professionnel";

  const byCta = roleFromCtaUrl(ctaUrlUser);
  if (byCta) return byCta;

  const r = normRole(identityRole);
  if (r === "professionnel" || r === "pro") return "professionnel";
  return "particulier";
}

/* ----------------------------- enqueue notification ----------------------------- */

/**
 * Invokes the 'notification-enqueue' Edge Function to queue a notification.
 *
 * ✅ Garde-fous:
 * - type obligatoire (sinon tu crées notification_type = null côté DB => spam / mauvais template)
 * - recipientEmail obligatoire
 * - event_key (idempotence) recommandé et généré si absent
 */
export async function enqueueNotification({
  type,
  recipientEmail,
  payload = {},
  subject = null,
  isAdmin = false,
  eventKey = null, // ✅ NEW
} = {}) {
  if (!supabase) {
    console.error("Supabase client not initialized");
    return { data: null, error: new Error("Supabase client not initialized") };
  }

  const safeType = norm(type);
  const safeRecipient = norm(recipientEmail);

  if (!safeType) throw new Error("MISSING_NOTIFICATION_TYPE");
  if (!safeRecipient) throw new Error("MISSING_RECIPIENT_EMAIL");

  const safeEventKey = norm(eventKey) || null;

  try {
    const { data, error } = await supabase.functions.invoke("notification-enqueue", {
      body: {
        type: safeType,
        recipient_email: safeRecipient,
        payload: payload ?? {},
        subject: subject ? String(subject) : null,
        is_admin: Boolean(isAdmin),
        event_key: safeEventKey,
      },
    });

    if (error) {
      console.error("Error invoking notification-enqueue:", error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error("Unexpected error enqueuing notification:", err);
    return { data: null, error: err };
  }
}

/* ------------------------------ identity resolution ------------------------------ */

/**
 * Source de vérité identité = public.profiles.
 * Fallback = auth.user_metadata (si profiles pas encore backfill/trigger).
 */
export async function getMyIdentity() {
  if (!supabase) {
    return { identity: null, error: new Error("Supabase client not initialized") };
  }

  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr) return { identity: null, error: authErr };

  const user = auth?.user || null;
  if (!user?.id) return { identity: null, error: new Error("NOT_AUTHENTICATED") };

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, role, first_name, last_name, phone, company_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profileError && profileRow) {
    return { identity: profileRow, error: null };
  }

  const meta = user.user_metadata || {};
  return {
    identity: {
      id: user.id,
      email: user.email || meta.email || null,
      role: meta.role || meta.user_type || "particulier",
      first_name: meta.first_name || null,
      last_name: meta.last_name || null,
      phone: meta.phone || null,
      company_name: meta.company_name || null,
    },
    error: null,
  };
}

/* ------------------------------ Signup + Welcome ------------------------------ */

/**
 * Envoie:
 *  - admin: new_part_signup / new_pro_signup
 *  - user: welcome_particulier / welcome_professional
 *
 * ✅ Fix intégrés:
 * - type toujours défini
 * - event_key défini (idempotent)
 * - CTA normalisés (full URL si possible)
 * - payload admin complet (created_* + created_user_id + source/business_source)
 * - évite les confusions email admin vs email créé
 */
export async function notifySignupAndWelcome({
  adminEmail,
  ctaUrlUser = null,
  ctaUrlAdmin = null,
  extraPayload = {},
  forceRole = null,
} = {}) {
  const { identity, error } = await getMyIdentity();
  if (error) return { data: null, error };

  const effectiveRole = resolveEffectiveRole({
    identityRole: identity?.role,
    ctaUrlUser,
    extraPayload,
    forceRole,
  });

  const isPro = effectiveRole === "professionnel";

  const adminType = isPro ? "new_pro_signup" : "new_part_signup";
  const welcomeType = isPro ? "welcome_professional" : "welcome_particulier";

  const created_full_name = [identity.first_name, identity.last_name].filter(Boolean).join(" ").trim();

  // CTA par défaut cohérents
  const defaultUserCtaPath = isPro ? "/professionnel-dashboard" : "/particulier-dashboard";
  const defaultAdminCtaPath = "/admin-dashboard";

  // On préfère des URLs absolues pour les emails
  const userCta = absoluteUrlIfNeeded(ctaUrlUser || defaultUserCtaPath);
  const adminCta = absoluteUrlIfNeeded(ctaUrlAdmin || defaultAdminCtaPath);

  // IMPORTANT : adminEmail doit être défini, sinon trigger enforce_admin_recipient_email peut casser
  const safeAdminEmail = norm(adminEmail) || "contact@livingpage.fr";

  // ✅ SOURCE / BUSINESS SOURCE attendus par send-notifications (guard admin signup)
  const businessSource = isPro ? "professionnels" : "particuliers";

  // ✅ payload "created_*" + created_user_id => l’edge peut enrichir proprement
  const payload = {
    // clés attendues côté templates + edge (admin signup)
    created_user_id: identity.id,
    created_full_name: created_full_name || "—",
    created_email: identity.email || "—",
    created_phone: identity.phone || "—",
    created_company_name: identity.company_name || extraPayload.created_company_name || "—",

    // guard edge: allowAdminSignupRow() & enrichSignupInfo()
    source: businessSource,
    business_source: businessSource,

    // infos "session" / routing
    user_role: effectiveRole,
    user_id: identity.id,

    // CTA URLs (cohérent templates)
    cta_url: userCta,
    admin_cta_url: adminCta,

    // compat éventuels templates existants (legacy)
    cta_user_part: absoluteUrlIfNeeded("/particulier-dashboard"),
    cta_user_pro: absoluteUrlIfNeeded("/professionnel-dashboard"),
    cta_admin: adminCta,

    // templates welcome_* attendent souvent {{$first_name}}
    first_name: identity.first_name || "",

    // ✅ on merge en dernier pour laisser l’appelant ajouter des champs,
    // MAIS on empêche qu’il écrase created_email/created_user_id par erreur.
    ...extraPayload,
  };

  // 🔒 Empêche l’appelant de casser les champs critiques (vu tes logs: created_email = admin etc.)
  payload.created_user_id = identity.id;
  payload.created_email = identity.email || payload.created_email || "—";
  payload.source = businessSource;
  payload.business_source = businessSource;

  // ✅ event keys idempotents (unique index sur event_key)
  // Si tu veux autoriser plusieurs tests, tu peux inclure extraPayload.draft_id dans la clé.
  const draftId = norm(extraPayload?.draft_id) || "";
  const baseKeyParts = [identity.id, adminType, welcomeType, draftId].filter(Boolean);

  const eventKeyAdmin = buildEventKey("signup_admin", baseKeyParts);
  const eventKeyUser = buildEventKey("signup_user", baseKeyParts);

  // 1) Admin
  const adminRes = await enqueueNotification({
    type: adminType,
    recipientEmail: safeAdminEmail,
    subject: isPro ? "🆕 Nouveau professionnel inscrit sur LivingRoom" : "🆕 Nouveau particulier inscrit sur LivingRoom",
    payload: {
      ...payload,
      // ✅ template admin => CTA admin (jamais /cvd)
      cta_url: payload.admin_cta_url,
    },
    isAdmin: true,
    eventKey: eventKeyAdmin,
  });

  // 2) User welcome
  const userRes = await enqueueNotification({
    type: welcomeType,
    recipientEmail: identity.email,
    subject: "Bienvenue sur LivingRoom",
    payload: {
      ...payload,
      cta_url: payload.cta_url, // template user => CTA user
    },
    isAdmin: false,
    eventKey: eventKeyUser,
  });

  return {
    data: {
      admin: adminRes.data,
      user: userRes.data,
      types: { adminType, welcomeType },
      resolved: { role: effectiveRole, isPro, businessSource },
      event_keys: { admin: eventKeyAdmin, user: eventKeyUser },
      ctas: { user: userCta, admin: adminCta },
    },
    error: adminRes.error || userRes.error || null,
  };
}