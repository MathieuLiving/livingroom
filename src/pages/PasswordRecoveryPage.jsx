// src/pages/PasswordRecoveryPage.jsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Mail, Loader2, CheckCircle, Lock, Eye, EyeOff } from "lucide-react";
import SEO from "@/components/SEO";
import { supabase } from "@/lib/customSupabaseClient";
import { useNavigate, useLocation } from "react-router-dom";

function hasImplicitTokensInHash() {
  const h = window.location.hash || "";
  return h.includes("access_token=") || h.includes("refresh_token=");
}

function cleanUrlSensitiveParams() {
  try {
    const clean = new URL(window.location.href);
    [
      "code",
      "token",
      "type",
      "access_token",
      "refresh_token",
      "expires_in",
      "expires_at",
      "provider_token",
      "provider_refresh_token",
      "error",
      "error_description",
    ].forEach((k) => clean.searchParams.delete(k));
    clean.hash = "";
    window.history.replaceState({}, "", clean.toString());
  } catch {
    // ignore
  }
}

export default function PasswordRecoveryPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * ✅ Objectif:
   * - Normalement, le lien email redirige vers /auth/callback?next=/recuperation-mot-de-passe
   *   => la session est déjà créée quand on arrive ici.
   * - On supporte aussi les vieux liens qui atterrissent directement ici avec hash tokens.
   */
  useEffect(() => {
    let alive = true;

    const syncResetMode = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const err = params.get("error");
        const errDesc = params.get("error_description");
        if (err) {
          toast({
            variant: "destructive",
            title: "Erreur de lien",
            description:
              errDesc ||
              "Le lien de réinitialisation est invalide ou expiré.",
          });
          return;
        }

        // 1) Si on a des tokens dans le hash (flow implicite legacy), on finalise la session depuis l'URL
        if (hasImplicitTokensInHash() && typeof supabase.auth.getSessionFromUrl === "function") {
          const { error } = await supabase.auth.getSessionFromUrl({ storeSession: true });
          if (error) {
            toast({
              variant: "destructive",
              title: "Lien invalide",
              description:
                error.message ||
                "Le lien est invalide/expiré. Merci de demander un nouveau lien.",
            });
          }
          // Que ça marche ou non, on nettoie l’URL pour éviter les refresh bizarres
          cleanUrlSensitiveParams();
        }

        // 2) On lit la session actuelle
        const { data } = await supabase.auth.getSession();
        if (!alive) return;

        setIsResetMode(Boolean(data?.session?.user?.id));
      } catch (e) {
        if (!alive) return;
        setIsResetMode(false);
      }
    };

    // Initial check
    syncResetMode();

    // Et on écoute les changements d'auth (utile si la session arrive juste après une redirection)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      setIsResetMode(Boolean(session?.user?.id));
    });

    return () => {
      alive = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, [location.search, toast]);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLoading(true);

    // ✅ Recommandé: passer par /auth/callback (ton handler est robuste)
    const redirectTo = `${window.location.origin}/auth/callback?next=/recuperation-mot-de-passe`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description:
          error.message || "Impossible d'envoyer l'email de réinitialisation.",
      });
    } else {
      setIsSubmitted(true);
    }
    setLoading(false);
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas.",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Mot de passe trop court",
        description: "Le mot de passe doit contenir au moins 6 caractères.",
      });
      return;
    }

    setLoading(true);

    try {
      const { data } = await supabase.auth.getSession();
      if (!data?.session?.user?.id) {
        throw new Error(
          "Session de réinitialisation introuvable. Réessaie avec un nouveau lien."
        );
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast({
        title: "Succès !",
        description: "Votre mot de passe a été mis à jour. Redirection…",
      });

      // Optionnel: on peut déconnecter après reset, mais ce n’est pas obligatoire
      // await supabase.auth.signOut();

      setTimeout(() => {
        navigate("/connexion", { replace: true });
      }, 1200);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description:
          error.message || "Impossible de mettre à jour le mot de passe.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="Récupération de mot de passe"
        description="Récupérez l'accès à votre compte LivingRoom.immo en réinitialisant votre mot de passe."
      />
      <div className="container mx-auto px-4 py-16 flex justify-center items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-brand-blue">
                {isResetMode ? "Nouveau mot de passe" : "Mot de passe oublié ?"}
              </CardTitle>
              <CardDescription>
                {isResetMode
                  ? "Saisissez votre nouveau mot de passe pour sécuriser votre compte."
                  : isSubmitted
                    ? "Les instructions ont été envoyées."
                    : "Pas de panique. Saisissez votre email et nous vous enverrons un lien pour le réinitialiser."}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {isResetMode ? (
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nouveau mot de passe</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        minLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Masquer" : "Afficher"}
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      minLength={6}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-brand-blue hover:bg-brand-blue/90 text-white"
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Lock className="mr-2 h-4 w-4" />
                    )}
                    Enregistrer le mot de passe
                  </Button>
                </form>
              ) : isSubmitted ? (
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                  <p className="text-lg font-semibold">Vérifiez votre boîte mail</p>
                  <p className="text-sm text-gray-600">
                    Un lien pour réinitialiser votre mot de passe a été envoyé à{" "}
                    <strong>{email}</strong>.
                  </p>
                  <p className="text-xs text-gray-500 mt-4">Pensez à vérifier vos spams.</p>
                  <Button
                    variant="outline"
                    className="mt-6"
                    onClick={() => setIsSubmitted(false)}
                  >
                    Renvoyer un lien
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleRequestReset} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center">
                      <Mail className="mr-2 h-4 w-4" />
                      Adresse e-mail
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="votre.email@exemple.com"
                      autoComplete="email"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-brand-orange hover:bg-orange-500 text-white"
                  >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Envoyer le lien de réinitialisation
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
}