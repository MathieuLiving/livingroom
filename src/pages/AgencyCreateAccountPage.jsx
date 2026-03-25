// src/pages/AgencyCreateAccountPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import {
  Building2,
  Mail,
  Lock,
  ArrowRight,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Phone,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/customSupabaseClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function useQueryParams() {
  const location = useLocation();
  return useMemo(() => new URLSearchParams(location.search), [location.search]);
}

function getInviteToken(params) {
  return (
    params.get("invite_token") ||
    params.get("token") ||
    params.get("invitation_token") ||
    ""
  ).trim();
}

/**
 * ✅ Modèle stable :
 * - profiles.role = "professionnel" | "particulier" | "admin"
 * - professionnels.agency_role = "director" | "team_leader" | "agent"
 *
 * Cette page ne doit JAMAIS pousser un autre role dans profiles.role.
 */
const AgencyCreateAccountPage = () => {
  const params = useQueryParams();
  const inviteToken = getInviteToken(params);
  const isInviteFlow = Boolean(inviteToken);

  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    agencyName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // ✅ Backup localStorage pour retrouver l’état après confirmation email
  useEffect(() => {
    if (!isInviteFlow) return;
    try {
      localStorage.setItem("agency_invite_token", inviteToken);
    } catch {
      // ignore
    }
  }, [inviteToken, isInviteFlow]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getEmailRedirectTo = () => {
    // Page que tu as déjà : /reseau-agences/finalisation
    // On conserve le token pour le flow invitation.
    const base = `${window.location.origin}/reseau-agences/finalisation`;
    if (!isInviteFlow) return base;
    return `${base}?invite_token=${encodeURIComponent(inviteToken)}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      setIsLoading(false);
      return;
    }

    // ✅ Draft localStorage (pour reprise après email confirmation)
    try {
      localStorage.setItem(
        "agency_creation_draft",
        JSON.stringify({
          flow: isInviteFlow ? "invite" : "director_create",
          invite_token: isInviteFlow ? inviteToken : null,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || null,
          agencyName: isInviteFlow ? null : formData.agencyName,
          email: formData.email,
          created_at: new Date().toISOString(),
        })
      );
    } catch {
      // ignore
    }

    try {
      const emailRedirectTo = getEmailRedirectTo();

      /**
       * ✅ Metadata à envoyer à Supabase Auth
       *
       * Objectif :
       * - éviter l’erreur "profiles.role NOT NULL"
       *   => on envoie TOUJOURS role="professionnel"
       *
       * Note :
       * - Pour un invité, on met agency_invite_token
       * - Pour un directeur, on met agency_name (servira à créer agencies.name en finalisation)
       */
      const userMeta = {
        // identité
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone || null,

        // ✅ CRITIQUE : rôle DB stable
        role: "professionnel",
        user_type: "professionnel", // legacy safe

        // invitation
        agency_invite_token: isInviteFlow ? inviteToken : null,

        // agence / rôle agence
        agency_role: isInviteFlow ? "agent" : "director",
        agency_name: isInviteFlow ? null : (formData.agencyName || null),

        // pro visibilité (optionnel)
        visibility_pro_partner_page: true,
      };

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: userMeta,
          emailRedirectTo,
        },
      });

      if (signUpError) throw signUpError;

      if (!data?.user) {
        throw new Error("Utilisateur non créé par Supabase Auth.");
      }

      setIsSuccess(true);
      toast({
        title: "Compte créé avec succès",
        description: "Veuillez vérifier votre email pour confirmer votre inscription.",
      });
    } catch (err) {
      console.error("[AgencyCreateAccountPage] signUp error:", err);
      setError(err?.message || "Une erreur est survenue lors de l'inscription.");
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err?.message || "Une erreur est survenue.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <Helmet>
          <title>
            {isInviteFlow
              ? "Inscription Réseau - Vérification Email | LivingRoom.immo"
              : "Inscription Agence - Vérification Email | LivingRoom.immo"}
          </title>
        </Helmet>

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center"
          >
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Vérifiez votre email
            </h2>

            <p className="text-gray-600 mb-6">
              Un lien de confirmation a été envoyé à{" "}
              <strong>{formData.email}</strong>.
              <br />
              {isInviteFlow
                ? "Cliquez sur ce lien pour rejoindre votre agence."
                : "Cliquez sur ce lien pour activer votre compte agence."}
            </p>

            <div className="flex flex-col space-y-3">
              <Button asChild variant="outline" className="w-full">
                <Link to="/connexion">Retour à la connexion</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>
          {isInviteFlow
            ? "Rejoindre une agence | LivingRoom.immo"
            : "Créer un compte Agence | LivingRoom.immo"}
        </title>
        <meta
          name="description"
          content={
            isInviteFlow
              ? "Rejoignez une agence sur LivingRoom.immo via une invitation."
              : "Inscrivez votre agence sur LivingRoom.immo et commencez à développer votre réseau."
          }
        />
      </Helmet>

      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Link to="/" className="flex justify-center mb-6">
            <img
              className="h-10 w-auto"
              src="https://horizons-cdn.hostinger.com/f7eb5659-bed0-4bf7-847c-ea6067478f08/81bc2da05b2ffbe090fd1540a48ac891.png"
              alt="LivingRoom.immo"
            />
          </Link>

          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isInviteFlow ? "Rejoindre une agence" : "Créez votre compte Agence"}
          </h2>

          <p className="mt-2 text-center text-sm text-gray-600">
            Ou{" "}
            <Link
              to="/connexion"
              className="font-medium text-brand-blue hover:text-blue-500"
            >
              connectez-vous à votre compte existant
            </Link>
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border-t-4 border-brand-orange"
          >
            <form className="space-y-6" onSubmit={handleSubmit}>
              {isInviteFlow && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                  <div className="font-semibold">Invitation détectée</div>
                  <div className="text-xs text-emerald-800 mt-1">
                    Après confirmation email, vous serez rattaché automatiquement
                    à l’agence.
                  </div>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erreur</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* ✅ Directeur uniquement */}
              {!isInviteFlow && (
                <div>
                  <Label htmlFor="agencyName">Nom de l'agence</Label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building2 className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      id="agencyName"
                      name="agencyName"
                      type="text"
                      required
                      className="pl-10"
                      placeholder="Immo Plus Paris"
                      value={formData.agencyName}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">
                    {isInviteFlow ? "Prénom" : "Prénom du directeur"}
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    placeholder="Jean"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <Label htmlFor="lastName">
                    {isInviteFlow ? "Nom" : "Nom du directeur"}
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    placeholder="Dupont"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Téléphone (optionnel)</Label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    className="pl-10"
                    placeholder="06 12 34 56 78"
                    value={formData.phone}
                    onChange={handleChange}
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Adresse email professionnelle</Label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="pl-10"
                    placeholder="contact@agence.com"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                  />
                </div>

                {isInviteFlow ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Utilisez le même email que celui qui a reçu l’invitation.
                  </p>
                ) : null}
              </div>

              <div>
                <Label htmlFor="password">Mot de passe</Label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="pl-10"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    className="pl-10"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  className="h-4 w-4 text-brand-orange focus:ring-brand-orange border-gray-300 rounded"
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                  J'accepte les{" "}
                  <Link to="/cgu" className="text-brand-blue hover:underline">
                    Conditions Générales d'Utilisation
                  </Link>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full bg-brand-orange hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-md shadow transition duration-150 ease-in-out"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  <>
                    {isInviteFlow
                      ? "Créer mon compte & rejoindre"
                      : "Créer mon compte agence"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default AgencyCreateAccountPage;