// src/pages/ProjectFirstFlowPage.jsx
import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, MailCheck, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/customSupabaseClient";

import { useToast } from "@/components/ui/use-toast";
import SEO from "@/components/SEO";
import NewProjectFormParticulier from "@/components/project/NewProjectFormParticulier";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom"; // ✅ useNavigate (redir login)

const AFTER_CONFIRM_PATH = "/particulier/projets";
const PAGE_PATH = "/preciser-projet";
const PAGE_URL = `https://livingroom.immo${PAGE_PATH}`;

const HERO_IMAGE =
  "https://horizons-cdn.hostinger.com/f7eb5659-bed0-4bf7-847c-ea6067478f08/92d23901cc73e642d1e7eadfe0827827.jpg";

// Steps : 0 = choix achat/vente, 1 = projet, 2 = coordonnées
const STEP_PICK = 0;
const STEP_PROJECT = 1;
const STEP_CONTACT = 2;

export default function ProjectFirstFlowPage() {
  const { toast } = useToast();
  const nav = useNavigate();

  const [step, setStep] = useState(STEP_PICK);
  const [typeProjet, setTypeProjet] = useState(null); // "achat" | "vente" | null

  const [formUser, setFormUser] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
  });

  const [projectPayload, setProjectPayload] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [awaitingEmailConfirmation, setAwaitingEmailConfirmation] = useState(false);
  const [draftId, setDraftId] = useState(null);

  const handleUserChange = (field) => (e) => {
    setFormUser((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const seoTitle =
    typeProjet === "achat"
      ? "Préciser mon projet d’achat immobilier"
      : typeProjet === "vente"
      ? "Préciser mon projet de vente immobilière"
      : "Préciser mon projet immobilier (achat ou vente)";

  const seoDescription =
    typeProjet === "achat"
      ? "Précisez votre projet d’achat immobilier en quelques minutes (type de bien, budget, localisation) et avancez sereinement avec LivingRoom."
      : typeProjet === "vente"
      ? "Précisez votre projet de vente immobilière (bien, timing, objectifs) et avancez sereinement avec LivingRoom."
      : "Précisez votre projet immobilier (achat ou vente) en quelques minutes et avancez sereinement avec LivingRoom.";

  const webPageSchema = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Préciser votre projet immobilier",
      url: PAGE_URL,
      description: seoDescription,
      inLanguage: "fr-FR",
      isPartOf: {
        "@type": "WebSite",
        name: "LivingRoom.immo",
        url: "https://livingroom.immo",
      },
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: HERO_IMAGE,
      },
    };
  }, [seoDescription]);

  const breadcrumbSchema = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: "https://livingroom.immo/" },
        { "@type": "ListItem", position: 2, name: "Préciser mon projet", item: PAGE_URL },
      ],
    };
  }, []);

  const faqJsonLd = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Combien de temps faut-il pour préciser un projet immobilier ?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Quelques minutes suffisent pour préciser l’essentiel. Vous pourrez compléter ou modifier votre projet plus tard depuis votre espace.",
          },
        },
        {
          "@type": "Question",
          name: "Puis-je modifier mon projet d’achat immobilier ou mon projet de vente immobilière plus tard ?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Oui. Votre projet d’achat immobilier ou votre projet de vente immobilière reste modifiable à tout moment depuis Mes projets.",
          },
        },
        {
          "@type": "Question",
          name: "Suis-je obligé d’être mis en relation avec un professionnel ?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Non. Aucune mise en relation n’est effectuée sans votre validation.",
          },
        },
      ],
    };
  }, []);

  const banner = useMemo(() => {
    if (!awaitingEmailConfirmation) return null;
    return (
      <div className="mb-6 rounded-2xl border border-blue-200 bg-white shadow-sm">
        <div className="p-5 sm:p-6 flex gap-4">
          <div className="mt-0.5">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <MailCheck className="h-5 w-5 text-blue-700" />
            </div>
          </div>

          <div className="flex-1">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              Dernière étape : confirmez votre email
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Votre projet a été sauvegardé. Cliquez sur le lien reçu par email : vous serez redirigé(e) vers{" "}
              <span className="font-medium">Mes projets</span> et tout sera finalisé automatiquement.
            </p>

            {draftId && (
              <p className="mt-2 text-xs text-gray-500">
                Référence interne : <span className="font-mono">{draftId}</span>
              </p>
            )}

            <p className="mt-3 text-xs text-gray-500">Astuce : vérifiez aussi les spams.</p>
          </div>
        </div>
      </div>
    );
  }, [awaitingEmailConfirmation, draftId]);

  const chooseTypeProjet = (v) => {
    setTypeProjet(v);
    setProjectPayload(null);
    setStep(STEP_PROJECT);
    setAwaitingEmailConfirmation(false);
  };

  const handleProjectStepSubmit = (payloadFromForm) => {
    if (!payloadFromForm) {
      toast({
        variant: "destructive",
        title: "Projet incomplet",
        description: "Merci de compléter les informations de votre projet avant de continuer.",
      });
      return;
    }

    const normalized = { ...payloadFromForm, type_projet: typeProjet || payloadFromForm.type_projet || null };

    if (!normalized.type_projet) {
      toast({
        variant: "destructive",
        title: "Projet incomplet",
        description: "Merci de sélectionner votre projet (achat ou vente).",
      });
      return;
    }

    setProjectPayload(normalized);
    setStep(STEP_CONTACT);
  };

  const handleFinalSubmit = async () => {
    const { firstName, lastName, phone, email, password } = formUser;

    if (!projectPayload?.type_projet) {
      toast({
        variant: "destructive",
        title: "Projet manquant",
        description: "Merci de compléter votre projet avant de valider.",
      });
      setStep(STEP_PROJECT);
      return;
    }

    if (!firstName || !lastName || !email || !password) {
      toast({
        variant: "destructive",
        title: "Champs manquants",
        description: "Merci de renseigner au minimum prénom, nom, email et mot de passe.",
      });
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    setAwaitingEmailConfirmation(false);
    setDraftId(null);

    try {
      // ✅ Si déjà connecté : création directe via Edge Function existante
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user?.id) {
        const { error } = await supabase.functions.invoke("create-particulier-and-project", {
          body: {
            user: {
              first_name: firstName,
              last_name: lastName,
              phone: phone || null,
              email,
            },
            project: projectPayload,
          },
        });

        if (error) {
          console.error("[ProjectFirstFlow] create-particulier-and-project (signed-in) error:", error);
          toast({
            variant: "destructive",
            title: "Erreur",
            description: "Impossible d’enregistrer votre projet. Réessayez.",
          });
          return;
        }

        toast({ title: "C’est enregistré ✅", description: "Votre projet est créé et l’équipe a été notifiée." });

        setFormUser({ firstName: "", lastName: "", phone: "", email: "", password: "" });
        setProjectPayload(null);
        setTypeProjet(null);
        setStep(STEP_PICK);
        return;
      }

      // ✅ 1) Sauvegarde draft (public, avant auth)
      const draftPayload = {
        user: {
          first_name: firstName,
          last_name: lastName,
          phone: phone || null,
          email,
        },
        project: projectPayload,
      };

      const newDraftId = crypto.randomUUID();

      const { error: draftErr } = await supabase
        .from("particulier_project_drafts")
        .insert([{ id: newDraftId, email, payload: draftPayload }]);

      if (draftErr) {
        console.error("[ProjectFirstFlow] draft insert error:", draftErr);
        toast({
          variant: "destructive",
          title: "Erreur",
          description:
            "Impossible de sauvegarder votre projet. (Accès refusé ou problème technique). Réessayez.",
        });
        return;
      }

      setDraftId(newDraftId);

      // ✅ 2) Signup + redirect (via AuthCallback) vers /particulier/projets?draft=<id>
      const next = `${AFTER_CONFIRM_PATH}?draft=${newDraftId}`;
      const emailRedirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo,
          data: {
            // ✅ on force particulier (sert de "hint" pour le callback)
            user_type: "particulier",
            role: "particulier",
            first_name: firstName,
            last_name: lastName,
            phone: phone || null,
          },
        },
      });

      if (signUpError) {
        console.error("[ProjectFirstFlow] signUp error:", signUpError);

        // ✅ cas "compte déjà existant" : on redirige vers connexion avec next pour finaliser
        const msg = String(signUpError.message || "");
        if (msg.toLowerCase().includes("user already registered")) {
          toast({
            title: "Compte déjà existant",
            description:
              "Un compte existe déjà avec cet email. Connectez-vous pour finaliser votre projet.",
          });

          // On redirige vers /connexion en conservant le next (draft)
          nav(`/connexion?next=${encodeURIComponent(next)}`, { replace: true });
          return;
        }

        toast({
          variant: "destructive",
          title: "Inscription impossible",
          description: signUpError.message,
        });
        return;
      }

      setAwaitingEmailConfirmation(true);

      toast({
        title: "Confirmez votre email ✅",
        description:
          "Votre projet est sauvegardé. Confirmez l’email reçu : vous serez redirigé(e) vers Mes projets et tout sera finalisé.",
      });
    } catch (e) {
      console.error("[ProjectFirstFlow] Exception:", e);
      toast({
        variant: "destructive",
        title: "Erreur inattendue",
        description: "Une erreur est survenue. Réessayez.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const Progress = () => {
    const total = 3;
    const current = step + 1;
    const pct = Math.round((current / total) * 100);
    return (
      <div className="mt-6">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            Étape {current} / {total}
          </span>
          <span>{pct}%</span>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full bg-brand-blue" style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  };

  return (
    <>
      <SEO
        title={seoTitle}
        description={seoDescription}
        canonicalUrl={PAGE_URL}
        ogImage={HERO_IMAGE}
        imageAlt="Préciser un projet immobilier avec LivingRoom"
        schema={[webPageSchema, breadcrumbSchema, faqJsonLd]}
      />

      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="container mx-auto px-4 py-12"
        >
          <div className="max-w-4xl mx-auto">
            <div className="mb-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="text-center md:text-left">
                  <h1 className="text-4xl md:text-5xl font-bold text-brand-blue mb-3">
                    Précisez votre projet immobilier
                  </h1>
                  <p className="text-lg text-gray-600">
                    Achetez ou vendez un bien plus sereinement. Décrivez votre projet en quelques minutes.
                  </p>
                  <p className="mt-3 text-xs text-gray-500">🔒 Aucune mise en relation sans votre validation.</p>
                  <Progress />
                </div>

                <div className="hidden md:block">
                  <img
                    src={HERO_IMAGE}
                    alt="Préciser un projet immobilier avec LivingRoom"
                    className="w-full h-auto rounded-2xl shadow-sm"
                    width="600"
                    height="400"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            </div>

            {banner}

            {step === STEP_PICK && (
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Quel est votre projet ?</h2>
                <p className="text-sm text-gray-500 mb-6">
                  Choisissez une option pour afficher le formulaire adapté à votre projet.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => chooseTypeProjet("achat")}
                    className="text-left rounded-2xl border border-gray-200 p-5 hover:bg-gray-50 transition"
                  >
                    <div className="text-base font-semibold text-gray-900">Acheter</div>
                    <div className="mt-1 text-sm text-gray-600">
                      Décrivez votre projet d’achat immobilier (zone, budget, type de bien…).
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => chooseTypeProjet("vente")}
                    className="text-left rounded-2xl border border-gray-200 p-5 hover:bg-gray-50 transition"
                  >
                    <div className="text-base font-semibold text-gray-900">Vendre</div>
                    <div className="mt-1 text-sm text-gray-600">
                      Décrivez votre projet de vente immobilière (ville, surface, prix souhaité…).
                    </div>
                  </button>
                </div>
              </div>
            )}

            {step === STEP_PROJECT && (
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-100 space-y-6">
                <div className="flex items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setStep(STEP_PICK);
                      setTypeProjet(null);
                      setProjectPayload(null);
                    }}
                    className="px-2"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Changer de projet
                  </Button>

                  <div className="text-sm text-gray-500">
                    Sélection :{" "}
                    <span className="font-medium text-gray-900">
                      {typeProjet === "achat" ? "Achat" : "Vente"}
                    </span>
                  </div>
                </div>

                <h2 className="text-xl font-semibold text-gray-900">
                  {typeProjet === "achat" ? "Décrivez votre projet d’achat" : "Décrivez votre projet de vente"}
                </h2>

                <NewProjectFormParticulier
                  forcedTypeProjet={typeProjet}
                  hideTypeTabs
                  onCreated={handleProjectStepSubmit}
                  onUpdated={handleProjectStepSubmit}
                  submitButtonText={
                    <span className="inline-flex items-center">
                      Continuer <span className="ml-1">→</span>
                    </span>
                  }
                />

                <p className="text-xs text-muted-foreground leading-relaxed">
                  Les informations recueillies sont nécessaires au traitement de votre demande.{" "}
                  <Link className="underline underline-offset-2 hover:opacity-80" to="/confidentialite">
                    Politique de confidentialité
                  </Link>
                  .
                </p>
              </div>
            )}

            {step === STEP_CONTACT && (
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-100 space-y-8">
                <div className="flex items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep(STEP_PROJECT)}
                    className="px-2"
                    disabled={isSubmitting}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour au projet
                  </Button>

                  <div className="text-sm text-gray-500">
                    Projet :{" "}
                    <span className="font-medium text-gray-900">
                      {typeProjet === "achat" ? "Achat" : "Vente"}
                    </span>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Vos coordonnées</h2>
                  <p className="text-sm text-gray-500">
                    On vous crée un espace pour retrouver votre projet.{" "}
                    <span className="font-medium">Aucune mise en relation sans votre accord.</span>
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                    <Input
                      type="text"
                      value={formUser.firstName}
                      onChange={handleUserChange("firstName")}
                      placeholder="Votre prénom"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                    <Input
                      type="text"
                      value={formUser.lastName}
                      onChange={handleUserChange("lastName")}
                      placeholder="Votre nom"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone (facultatif)</label>
                    <Input
                      type="tel"
                      value={formUser.phone}
                      onChange={handleUserChange("phone")}
                      placeholder="06 12 34 56 78"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <Input
                      type="email"
                      value={formUser.email}
                      onChange={handleUserChange("email")}
                      placeholder="vous@example.com"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe *</label>
                    <Input
                      type="password"
                      value={formUser.password}
                      onChange={handleUserChange("password")}
                      placeholder="Choisissez un mot de passe"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  Les informations recueillies sont nécessaires au traitement de votre demande.{" "}
                  <Link className="underline underline-offset-2 hover:opacity-80" to="/confidentialite">
                    Politique de confidentialité
                  </Link>
                  .
                </p>

                <div className="flex justify-end">
                  <Button type="button" onClick={handleFinalSubmit} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isSubmitting ? "Enregistrement…" : "Créer mon compte et enregistrer mon projet"}
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-10 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
              <h2 className="text-2xl font-semibold text-gray-900">Préciser son projet immobilier avant de se lancer</h2>
              <p className="mt-3 text-gray-600">
                Définir son projet d’achat immobilier ou son projet de vente immobilière est une étape clé avant de se
                lancer.
              </p>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-gray-100 p-5">
                  <h3 className="text-lg font-semibold text-gray-900">Projet d’achat immobilier</h3>
                  <p className="mt-2 text-gray-600">
                    Définissez votre zone de recherche, votre budget, le type de bien et vos critères prioritaires.
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-100 p-5">
                  <h3 className="text-lg font-semibold text-gray-900">Projet de vente immobilière</h3>
                  <p className="mt-2 text-gray-600">
                    Renseignez les informations clés de votre bien, vos objectifs et votre calendrier.
                  </p>
                </div>
              </div>

              <p className="mt-6 text-gray-600">
                <span className="font-medium">Aucune mise en relation n’est effectuée sans votre validation.</span>
              </p>

              <p className="mt-4 text-xs text-gray-500">
                Besoin d’en savoir plus sur vos données ?{" "}
                <Link className="underline underline-offset-2 hover:opacity-80" to="/confidentialite">
                  Consultez notre politique de confidentialité
                </Link>
                .
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}