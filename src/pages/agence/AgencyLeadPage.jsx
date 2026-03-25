// src/pages/AgencyLeadPage.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/customSupabaseClient";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  Loader2,
  Mail,
  Shield,
  ShieldCheck,
  Crown,
  RefreshCw,
  KeyRound,
  Eye,
  EyeOff,
  UserCheck,
} from "lucide-react";

function roleLabel(role) {
  switch ((role || "").toLowerCase()) {
    case "director":
      return "Directeur";
    case "team_leader":
      return "Chef d'équipe";
    case "agent":
      return "Agent";
    default:
      return role || "—";
  }
}

function RoleIcon({ role, className }) {
  switch ((role || "").toLowerCase()) {
    case "director":
      return <Crown className={className} />;
    case "team_leader":
      return <ShieldCheck className={className} />;
    case "agent":
      return <Shield className={className} />;
    default:
      return <Shield className={className} />;
  }
}

function isExpired(expiresAt) {
  if (!expiresAt) return false;
  const t = new Date(expiresAt).getTime();
  return Number.isFinite(t) ? t < Date.now() : false;
}

/**
 * Convertit les erreurs d'Edge Functions en message lisible.
 */
function edgeErrorMessage(error, data) {
  // si l'edge renvoie { ok:false, error:"..." }
  if (data && typeof data === "object" && data.error) return String(data.error);

  const msg = error?.message ? String(error.message) : "";
  const status = error?.context?.status;

  if (status === 401)
    return "Non authentifié. (Normal si la fonction exige une connexion.)";
  if (status === 403)
    return "Accès refusé. (Cette action est réservée au directeur.)";
  if (status === 404) return "Fonction introuvable ou route incorrecte.";
  if (status) return `Erreur serveur (HTTP ${status}).`;

  return msg || "Erreur inconnue (Edge function).";
}

// Clé unique pour conserver le token malgré les redirections
const INVITE_TOKEN_KEY = "agency_invite_token";

// fallback redirect robuste : évite d'envoyer un utilisateur "indépendant" sur un espace agence
function computeFallbackRedirect(inviteRole) {
  const r = String(inviteRole || "").toLowerCase();
  if (r === "agent" || r === "team_leader") return "/agence/agents";
  if (r === "director") return "/agence/dashboard";
  return "/professionnel-dashboard";
}

export default function AgencyLeadPage() {
  const { search } = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  // 1) token depuis query
  const tokenFromQuery = useMemo(() => {
    const sp = new URLSearchParams(search);
    return sp.get("token") || "";
  }, [search]);

  // 2) token effectif = query || sessionStorage
  const token = useMemo(() => {
    try {
      return tokenFromQuery || sessionStorage.getItem(INVITE_TOKEN_KEY) || "";
    } catch {
      return tokenFromQuery || "";
    }
  }, [tokenFromQuery]);

  // 3) persiste le token quand il existe dans l’URL (avant toute redirection)
  useEffect(() => {
    if (!tokenFromQuery) return;
    try {
      sessionStorage.setItem(INVITE_TOKEN_KEY, tokenFromQuery);
    } catch {
      // ignore
    }
  }, [tokenFromQuery]);

  const [loading, setLoading] = useState(true);
  const [previewError, setPreviewError] = useState(null);
  const [invite, setInvite] = useState(null);

  // Form
  const [email, setEmail] = useState("");
  const [oneTimeCode, setOneTimeCode] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  // Dans ta fonction agency-invite-info : on a one_time_code_expires_at / used_at
  const otpExpired = useMemo(() => {
    const exp = invite?.one_time_code_expires_at;
    const used = invite?.one_time_code_used_at;
    if (used) return false;
    return exp ? isExpired(exp) : false;
  }, [invite?.one_time_code_expires_at, invite?.one_time_code_used_at]);

  const otpExpiresTxt = useMemo(() => {
    return invite?.one_time_code_expires_at
      ? new Date(invite.one_time_code_expires_at).toLocaleString()
      : null;
  }, [invite?.one_time_code_expires_at]);

  const loadInfo = useCallback(async () => {
    setLoading(true);
    setPreviewError(null);
    setInvite(null);

    try {
      if (!token) throw new Error("Lien invalide : token manquant.");

      const res = await supabase.functions.invoke("agency-invite-info", {
        body: { token },
      });

      // IMPORTANT: si erreur, on garde res.data pour message utile
      if (res.error) {
        const err = res.error;
        err.__edgeData = res.data;
        throw err;
      }

      const data = res.data;

      if (!data?.ok) throw new Error(data?.error || "Invitation introuvable.");

      const inv = data?.invite || data?.data || data?.invitation || null;
      if (!inv) throw new Error("Invitation introuvable (réponse inattendue).");

      setInvite(inv);

      // pré-remplir l’email
      const invEmail = String(inv?.email || "").trim().toLowerCase();
      if (invEmail) setEmail(invEmail);
    } catch (e) {
      console.error("agency-invite-info error:", e);
      const msg = edgeErrorMessage(e, e?.__edgeData);
      setPreviewError(msg || "Impossible de charger l’invitation.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadInfo();
  }, [loadInfo]);

  const handleResend = async () => {
    const cleanEmail = String(email || "").trim().toLowerCase();

    if (!token) {
      toast({
        title: "Lien invalide",
        description: "Token manquant.",
        variant: "destructive",
      });
      return;
    }
    if (!cleanEmail) {
      toast({
        title: "Email requis",
        description: "Renseignez votre email avant de renvoyer.",
        variant: "destructive",
      });
      return;
    }

    setResending(true);
    try {
      const res = await supabase.functions.invoke("agency-invite-resend", {
        body: { token, email: cleanEmail },
      });

      if (res.error) {
        const err = res.error;
        err.__edgeData = res.data;
        throw err;
      }

      if (!res.data?.ok)
        throw new Error(res.data?.error || "Impossible de renvoyer le code.");

      toast({
        title: "Code renvoyé",
        description: "Un nouvel email vient d’être envoyé (avec un nouveau code).",
      });

      await loadInfo();
    } catch (e) {
      console.error("resend error:", e);
      const msg = edgeErrorMessage(e, e?.__edgeData);

      if (
        String(msg).includes("directeur") ||
        e?.context?.status === 401 ||
        e?.context?.status === 403
      ) {
        toast({
          title: "Renvoyer le code",
          description:
            "Cette action est réservée au directeur. Demandez au directeur d’agence de cliquer sur “Envoyer” depuis son espace.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur",
          description: msg || "Impossible de renvoyer le code.",
          variant: "destructive",
        });
      }
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async () => {
    const cleanEmail = String(email || "").trim().toLowerCase();
    const code = String(oneTimeCode || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "");

    if (!token) {
      toast({
        title: "Lien invalide",
        description:
          "Token manquant (le lien a peut-être été redirigé). Ouvrez le lien d’invitation depuis l’email, ou rafraîchissez la page.",
        variant: "destructive",
      });
      return;
    }
    if (!cleanEmail) {
      toast({
        title: "Email requis",
        description: "Veuillez renseigner votre email.",
        variant: "destructive",
      });
      return;
    }
    if (!code) {
      toast({
        title: "Code requis",
        description: "Veuillez renseigner le code reçu par email.",
        variant: "destructive",
      });
      return;
    }
    if (!password || password.length < 8) {
      toast({
        title: "Mot de passe invalide",
        description: "Le mot de passe doit contenir au moins 8 caractères.",
        variant: "destructive",
      });
      return;
    }
    if (password !== password2) {
      toast({
        title: "Confirmation",
        description: "Les mots de passe ne correspondent pas.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await supabase.functions.invoke(
        "agency-invite-accept-password",
        {
          body: {
            token,
            email: cleanEmail,
            one_time_code: code,
            password,
          },
        }
      );

      if (res.error) {
        const err = res.error;
        err.__edgeData = res.data;
        throw err;
      }

      const data = res.data;
      if (!data?.ok)
        throw new Error(data?.error || "Impossible de valider l’invitation.");

      // Option A : la fonction renvoie une session
      if (data?.session?.access_token && data?.session?.refresh_token) {
        const { error: sessErr } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        if (sessErr) throw sessErr;
      } else {
        // Option B : login standard
        const { error: signErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (signErr) throw signErr;
      }

      // ✅ Nettoie le token persistant après succès
      try {
        sessionStorage.removeItem(INVITE_TOKEN_KEY);
      } catch {
        // ignore
      }

      toast({
        title: "Bienvenue !",
        description: "Votre compte est activé et vous êtes connecté.",
      });

      // ✅ Redirect : si l'edge renvoie une route => on l'utilise.
      // Sinon fallback intelligent basé sur le rôle de l'invitation.
      const fallbackRedirect = computeFallbackRedirect(invite?.role);
      const redirect =
        typeof data?.redirect_path === "string" &&
        data.redirect_path.startsWith("/")
          ? data.redirect_path
          : fallbackRedirect;

      navigate(redirect, { replace: true });
    } catch (e) {
      console.error("agency-invite-accept-password error:", e);

      const msg = edgeErrorMessage(e, e?.__edgeData);

      toast({
        title: "Erreur",
        description: msg || "Impossible de valider le code.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Chargement de votre invitation…
        </div>
      </div>
    );
  }

  if (previewError) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <Card className="w-full max-w-xl">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <div className="font-semibold">Accès impossible</div>
            </div>
            <p className="text-sm text-muted-foreground">{previewError}</p>
            <div className="flex gap-2">
              <Button onClick={loadInfo} variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Réessayer
              </Button>
              <Button onClick={() => navigate("/", { replace: true })}>
                Retour
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const role = invite?.role || "";
  const inviteEmail = String(invite?.email || "").trim().toLowerCase();
  const showOtpBadge = Boolean(otpExpiresTxt);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-2xl overflow-hidden">
        <CardContent className="p-0">
          {/* Header */}
          <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="text-xl font-bold text-gray-900">
                  Rejoindre votre agence
                </div>
                <div className="text-sm text-muted-foreground">
                  Renseignez le code reçu par email puis choisissez votre mot de
                  passe.
                </div>
              </div>

              <Badge variant="outline" className="gap-1.5 bg-white/70">
                <RoleIcon role={role} className="h-3.5 w-3.5" />
                {roleLabel(role)}
              </Badge>
            </div>

            {showOtpBadge && (
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span
                  className={`px-2 py-1 rounded-md border ${
                    otpExpired
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : "border-slate-200 bg-white/70"
                  }`}
                >
                  Code {otpExpired ? "expiré" : "valable"} jusqu’au{" "}
                  {otpExpiresTxt}
                </span>
              </div>
            )}
          </div>

          {/* Form */}
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <div className="relative">
                  <Mail className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    className="pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    autoComplete="email"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Normalement pré-rempli. Il doit correspondre à l’invitation.
                  {inviteEmail ? ` (${inviteEmail})` : ""}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Code à usage unique</Label>
                <div className="relative">
                  <KeyRound className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    className="pl-9 tracking-widest uppercase"
                    value={oneTimeCode}
                    onChange={(e) => setOneTimeCode(e.target.value)}
                    placeholder="EX: 634CA5"
                    autoComplete="one-time-code"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 gap-2"
                    onClick={handleResend}
                    disabled={resending}
                  >
                    {resending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Renvoyer un code
                  </Button>
                </div>
              </div>
            </div>

            {otpExpired && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Votre code est expiré. Cliquez sur <b>“Renvoyer un code”</b>{" "}
                pour recevoir un nouveau code.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Au moins 8 caractères"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground"
                    aria-label={showPwd ? "Masquer" : "Afficher"}
                  >
                    {showPwd ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Confirmer le mot de passe</Label>
                <Input
                  type={showPwd ? "text" : "password"}
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  placeholder="Répétez le mot de passe"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                En validant, vous activez votre accès à l’espace agence.
              </p>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={loadInfo}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Actualiser
                </Button>

                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="gap-2"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserCheck className="h-4 w-4" />
                  )}
                  Activer mon accès
                </Button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground pt-1">
              Si vous n’avez pas reçu le code : vérifiez les spams. Sinon,
              demandez au directeur de renvoyer l’invitation depuis son espace.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}