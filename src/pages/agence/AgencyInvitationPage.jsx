// src/pages/agence/AgencyInvitationPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/lib/customSupabaseClient";

import { Loader2, AlertCircle, Building2, RefreshCw, Lock, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

function roleLabel(role) {
  const r = String(role || "agent").toLowerCase();
  if (r === "team_leader") return "Chef d’équipe";
  if (r === "agent") return "Agent";
  if (r === "director") return "Directeur";
  return "Collaborateur";
}

function fmtDateTime(d) {
  if (!d) return null;
  try {
    const dt = new Date(d);
    return dt.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return null;
  }
}

export default function AgencyInvitationPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [initialLoading, setInitialLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [invite, setInvite] = useState(null); // { id, agency_id, agency_name, email, role, one_time_code_expires_at, ... }
  const [error, setError] = useState(null);

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");

  const codeExpiresLabel = useMemo(() => {
    const dt = fmtDateTime(invite?.one_time_code_expires_at);
    return dt ? `Code valable jusqu’au ${dt}` : null;
  }, [invite?.one_time_code_expires_at]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setInitialLoading(true);
      setError(null);

      if (!token) {
        setError("Token d'invitation manquant.");
        setInitialLoading(false);
        return;
      }

      try {
        const { data, error: fnErr } = await supabase.functions.invoke("agency-invite-info", {
          body: { token },
        });

        if (fnErr) throw fnErr;

        if (!data?.ok) {
          throw new Error(data?.error || "Invitation introuvable ou expirée.");
        }

        const inv = data.invite;
        if (!mounted) return;

        setInvite(inv);
        setEmail(inv?.email || "");
      } catch (e) {
        if (!mounted) return;
        setInvite(null);
        setError(e?.message || "Invitation introuvable ou expirée.");
      } finally {
        if (mounted) setInitialLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [token]);

  const canSubmit = useMemo(() => {
    if (!invite?.id) return false;
    if (!email || email.trim().toLowerCase() !== String(invite.email || "").trim().toLowerCase()) return false;
    if (!/^\d{6}$/.test(code)) return false;
    if (!pwd || pwd.length < 8) return false;
    if (pwd !== pwd2) return false;
    return true;
  }, [invite?.id, invite?.email, email, code, pwd, pwd2]);

  const onResend = async () => {
    if (!invite?.id) return;
    setActionLoading(true);
    setError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("agency-invite-resend", {
        body: { invite_id: invite.id },
      });
      if (fnErr) throw fnErr;
      if (!data?.ok) throw new Error(data?.error || "Impossible de renvoyer le code.");

      // refresh info to update expires_at
      const info = await supabase.functions.invoke("agency-invite-info", { body: { token } });
      if (!info.error && info.data?.ok) {
        setInvite(info.data.invite);
      }
    } catch (e) {
      setError(e?.message || "Impossible de renvoyer le code.");
    } finally {
      setActionLoading(false);
    }
  };

  const onActivate = async () => {
    if (!invite?.id) return;
    setActionLoading(true);
    setError(null);

    try {
      const { data, error: fnErr } = await supabase.functions.invoke("agency-invite-accept-password", {
        body: {
          token,
          one_time_code: code,
          password: pwd,
        },
      });

      if (fnErr) throw fnErr;
      if (!data?.ok) throw new Error(data?.error || "Erreur serveur.");

      // ✅ Optionnel : on peut connecter automatiquement l'utilisateur s'il choisit
      // Ici on redirige simplement vers /auth (ou ton route de login) avec email prérempli.
      navigate("/auth", { state: { email } });
    } catch (e) {
      setError(e?.message || "Erreur serveur (500).");
    } finally {
      setActionLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Helmet>
          <title>Invitation Agence | LivingRoom</title>
        </Helmet>
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Invitation invalide</h2>
            <p className="text-gray-600">{error}</p>
            <Button className="mt-6" onClick={() => navigate("/")}>
              Retour à l’accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <Helmet>
        <title>Invitation Agence | LivingRoom</title>
      </Helmet>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Building2 className="h-8 w-8 text-brand-blue" />
          <div className="text-lg font-semibold text-gray-900">LivingRoom</div>
        </div>

        <Card className="border-0 shadow-lg">
          <CardContent className="pt-8 pb-8 px-8">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Rejoindre votre agence</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Renseignez le code reçu par email puis choisissez votre mot de passe.
                </p>
              </div>

              <Badge variant="secondary" className="shrink-0">
                {roleLabel(invite?.role)}
              </Badge>
            </div>

            {codeExpiresLabel && (
              <div className="mt-4">
                <Badge variant="outline">{codeExpiresLabel}</Badge>
              </div>
            )}

            {error && (
              <Alert variant="destructive" className="mt-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemple.com"
                  autoComplete="email"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Normalement pré-rempli. Il doit correspondre à l’invitation ({invite?.email}).
                </p>
              </div>

              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Code à usage unique</label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
                  placeholder="123456"
                  inputMode="numeric"
                />

                <div className="mt-3 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onResend}
                    disabled={actionLoading || !invite?.id}
                    className="gap-2"
                  >
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Renvoyer un code
                  </Button>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nouveau mot de passe</label>
                <Input
                  type="password"
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  placeholder="Minimum 8 caractères"
                  autoComplete="new-password"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirmer le mot de passe</label>
                <Input
                  type="password"
                  value={pwd2}
                  onChange={(e) => setPwd2(e.target.value)}
                  placeholder="Répétez le mot de passe"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <p className="text-xs text-muted-foreground">
                En validant, vous activez votre accès à l’espace agence.
              </p>

              <Button
                onClick={onActivate}
                disabled={!canSubmit || actionLoading}
                className="bg-brand-blue hover:bg-blue-700 gap-2"
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                Activer mon accès <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-6 text-xs text-muted-foreground">
              Si vous n’avez pas reçu le code : vérifiez les spams. Sinon, demandez au directeur de renvoyer l’invitation depuis son espace.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}