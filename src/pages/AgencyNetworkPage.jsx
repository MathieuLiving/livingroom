import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Building2,
  Users,
  Shield,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Settings,
  Award,
  Sparkles,
  PlayCircle,
  Star,
  Share2,
  Link2,
  QrCode,
  LayoutDashboard,
  UserCheck,
  SlidersHorizontal,
} from "lucide-react";
import { Link } from "react-router-dom";

/* ---------------------------------------------------------------------- */
/*  Animations                                                            */
/* ---------------------------------------------------------------------- */

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay },
  }),
};

/* ---------------------------------------------------------------------- */
/*  Hero image                                                            */
/* ---------------------------------------------------------------------- */
/**
 * ✅ Reco photo : ta 2ème image (équipe réduite, crédible).
 * ⚠️ Remplace HERO_IMAGE_URL par l'URL de la version licenciée (sans watermark).
 */
const HERO_IMAGE_URL =
  "https://horizons-cdn.hostinger.com/f7eb5659-bed0-4bf7-847c-ea6067478f08/14a93870234860918b84e4f10cec2344.jpg";

/* ---------------------------------------------------------------------- */
/*  Pricing (Agence S/M/L)                                                */
/* ---------------------------------------------------------------------- */

const AGENCY_PLANS = [
  {
    key: "S",
    name: "Agence S",
    agents: "Jusqu'à 5 agents",
    price: 79,
    perAgent: "≈ 15,8 € / agent",
    highlight: false,
    badge: "Pour démarrer",
  },
  {
    key: "M",
    name: "Agence M",
    agents: "Jusqu'à 10 agents",
    price: 149,
    perAgent: "≈ 14,9 € / agent",
    highlight: true,
    badge: "Le meilleur équilibre",
  },
  {
    key: "L",
    name: "Agence L",
    agents: "Jusqu'à 25 agents",
    price: 249,
    perAgent: "≈ 10,0 € / agent",
    highlight: false,
    badge: "Pour accélérer",
  },
];

/* ---------------------------------------------------------------------- */
/*  Feature table (Directeur + agents)                                    */
/* ---------------------------------------------------------------------- */

const AGENCY_FEATURES = [
  {
    category: "Espace Directeur d'agence",
    rows: [
      { label: "Dashboard agence (vue globale)", included: true },
      { label: "Gestion de l'équipe (ajout / désactivation d'accès)", included: true },
      { label: "Attribution des rôles (directeur / agent)", included: true },
      { label: "Harmonisation des profils (gabarits / champs obligatoires)", included: true },
      { label: "Supervision des cartes de visite digitales des agents", included: true },
      { label: "Paramétrage \"standards agence\" (logo, charte, liens)", included: true },
    ],
  },
  {
    category: "Configuration & onboarding",
    rows: [
      { label: "Création des comptes agents (dans la limite du palier)", included: true },
      { label: "Invitation / activation simplifiée", included: true },
      { label: "Checklist complétude profil (standard agence)", included: true },
      { label: "Standardisation des sections clés (présentation, expertise, zone)", included: true },
    ],
  },
  {
    category: "Cartes de visite digitales (pour tous les collaborateurs)",
    rows: [
      { label: "Carte digitale premium (lien pro)", included: true },
      { label: "QR code pro (avec logo)", included: true },
      { label: "Personnalisation charte agence (couleurs / logo / bannière)", included: true },
      { label: "Vidéo intégrée (présentation agent ou agence)", included: true },
      { label: "Avis clients (module + affichage)", included: true },
      { label: "Liens réseaux sociaux (LinkedIn, Insta, Facebook…)", included: true },
      { label: "Statistiques de visibilité (clics + scans QR)", included: true },
    ],
  },
  {
    category: "Reporting & performance",
    rows: [
      { label: "Tableau agence (global) : visibilité, leads, mises en relation", included: true },
      { label: "Tableau par professionnel : stats de visibilité", included: true },
      { label: "Leads captés par professionnel", included: true },
      { label: "Mises en relation établies par professionnel", included: true },
      { label: "Comparatif équipe (optionnel)", included: true },
      { label: "Export CSV (recommandé)", included: true },
    ],
  },
];

/* ---------------------------------------------------------------------- */
/*  Composants locaux                                                     */
/* ---------------------------------------------------------------------- */

const PillarCard = ({ icon: Icon, title, description, color }) => (
  <Card className="h-full hover:shadow-xl transition-shadow duration-300 border-t-4 border-transparent hover:border-brand-orange rounded-2xl">
    <CardContent className="p-6">
      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4`}>
        <Icon className="h-7 w-7 text-white" />
      </div>
      <h3 className="text-xl font-bold text-brand-blue mb-3">{title}</h3>
      <p className="text-brand-blue leading-relaxed">{description}</p>
    </CardContent>
  </Card>
);

const YesNo = ({ value }) =>
  value ? <CheckCircle className="mx-auto h-5 w-5 text-emerald-500" aria-hidden /> : <span className="text-slate-300">—</span>;

const PlanCard = ({ plan }) => (
  <Card
    className={[
      "rounded-3xl border",
      plan.highlight
        ? "border-brand-orange shadow-lg bg-gradient-to-br from-white via-orange-50/40 to-blue-50/40"
        : "border-slate-200 bg-white",
    ].join(" ")}
  >
    <CardContent className="p-7 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs text-slate-600">
            <span className={`h-2 w-2 rounded-full ${plan.highlight ? "bg-brand-orange" : "bg-slate-300"}`} />
            {plan.badge}
          </div>
          <h3 className="mt-3 text-xl sm:text-2xl font-bold text-brand-blue">{plan.name}</h3>
          <p className="mt-1 text-sm text-brand-blue">{plan.agents}</p>
        </div>
        {plan.highlight && (
          <div className="hidden sm:inline-flex items-center gap-2 rounded-full bg-brand-orange text-white px-3 py-1 text-xs font-semibold">
            Recommandé
          </div>
        )}
      </div>

      <div className="mt-6 flex items-end gap-2">
        <div className="text-4xl font-extrabold text-brand-blue">{plan.price}</div>
        <div className="pb-1 text-slate-600">€ / mois</div>
      </div>
      <div className="mt-1 text-sm text-slate-600">{plan.perAgent}</div>

      <div className="mt-6 space-y-2 text-sm text-slate-700">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-4 w-4 text-brand-orange" />
          <span>Dashboard directeur + reporting équipe</span>
        </div>
        <div className="flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-brand-orange" />
          <span>Comptes agents (dans la limite du palier)</span>
        </div>
        <div className="flex items-center gap-2">
          <QrCode className="h-4 w-4 text-brand-orange" />
          <span>Cartes digitales premium + QR logo + stats</span>
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-brand-orange" />
          <span>Charte agence : cohérence de marque</span>
        </div>
      </div>

      <Button
        className={[
          "mt-7 w-full rounded-full font-semibold",
          plan.highlight ? "bg-brand-orange hover:bg-orange-600 text-white" : "bg-brand-blue hover:bg-blue-700 text-white",
        ].join(" ")}
        asChild
      >
        <Link to="/reseau-agences/inscription">
          Choisir {plan.name}
          <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
      </Button>

      <div className="mt-3 text-[11px] text-slate-500 text-center">
        Capacité par palier • Pas de micro-facturation au jour le jour
      </div>
    </CardContent>
  </Card>
);

/* ---------------------------------------------------------------------- */
/*  Page                                                                  */
/* ---------------------------------------------------------------------- */

const AgencyNetworkPage = () => {
  const pillars = [
    {
      icon: Settings,
      title: "Pilotage & contrôle",
      description:
        "Un tableau de bord agence pour suivre l'activité, la traction et la performance — sans multiplier les outils.",
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: Users,
      title: "Gestion d'équipe simple",
      description:
        "Créez des comptes agents, attribuez des rôles, et gardez une vision claire. Pas de micro-gestion au quotidien.",
      color: "from-purple-500 to-purple-600",
    },
    {
      icon: BarChart3,
      title: "Reporting utile (pas décoratif)",
      description:
        "Suivez les KPIs qui comptent : visibilité, leads captés et mises en relation — par agent et au global.",
      color: "from-orange-500 to-orange-600",
    },
    {
      icon: Award,
      title: "Image & crédibilité",
      description:
        "Une vitrine agence + des profils agents cohérents. Même niveau de qualité, même standard, même confiance.",
      color: "from-green-500 to-green-600",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Créez votre espace agence",
      description: "Configurez l'agence (nom, logo, zone) et activez le compte \"directeur\".",
    },
    {
      number: "02",
      title: "Ajoutez vos agents",
      description:
        "Invitez vos collaborateurs et choisissez votre capacité (S, M ou L). Simple, lisible, scalable.",
    },
    {
      number: "03",
      title: "Pilotez et standardisez",
      description:
        "Suivez l'activité et les conversions, harmonisez les profils, et industrialisez ce qui marche.",
    },
  ];

  const faqJsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "La tarification change-t-elle quand un agent part ou arrive ?",
          acceptedAnswer: {
            "@type": "Answer",
            text:
              "Non. Vous payez une capacité (un palier). Vous pouvez désactiver un agent et en activer un autre dans la limite du palier, sans calcul au jour le jour.",
          },
        },
        {
          "@type": "Question",
          name: "Est-ce une solution multi-agences / réseau ?",
          acceptedAnswer: {
            "@type": "Answer",
            text:
              "Pour l'instant, l'offre est conçue pour une agence (un directeur + une équipe). Une approche multi-agences pourra être envisagée ensuite.",
          },
        },
      ],
    }),
    []
  );

  return (
    <>
      <Helmet>
        <title>Espace Agence - LivingRoom.immo | Pilotage & Reporting Multi-Agents</title>
        <meta
          name="description"
          content="Créez un espace Agence sur LivingRoom.immo : gestion des agents, reporting centralisé, harmonisation des cartes de visite digitales (vidéo, avis, réseaux) et performance mesurable par professionnel."
        />
        <link rel="canonical" href="https://livingroom.immo/reseau-agences" />
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      {/* ------------------------------------------------------------------ */}
      {/* HERO (photo + overlay)                                             */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative isolate overflow-hidden text-white">
        <img
          src={HERO_IMAGE_URL}
          alt="Équipe professionnelle d'agence immobilière"
          className="absolute inset-0 h-full w-full object-cover object-center"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/65" />

        {/* Pattern léger */}
        <div className="absolute inset-0 opacity-25">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.15),transparent_45%)]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:py-24 lg:py-28 min-h-[70vh] flex items-center">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs sm:text-sm text-slate-100 shadow-sm backdrop-blur"
            >
              <Building2 className="h-4 w-4 text-brand-orange" />
              <span>Espace Agence</span>
              <span className="hidden sm:inline text-white/40">•</span>
              <span className="hidden sm:inline">Multi-agents</span>
              <span className="hidden sm:inline text-white/40">•</span>
              <span className="hidden sm:inline">Pilotage & reporting</span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.12}
              className="mt-6 text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight"
            >
              Pilotez votre agence{" "}
              <span className="block text-brand-orange mt-2">sans perdre le contrôle</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.24}
              className="mt-6 text-lg md:text-xl text-blue-100 max-w-3xl mx-auto"
            >
              Créez des comptes pour vos agents, harmonisez leurs cartes de visite digitales (vidéo, avis, réseaux),
              et suivez la performance — <b>sans micro-gestion quotidienne</b>.
            </motion.p>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.36}
              className="mt-8 flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button
                size="lg"
                className="bg-brand-orange hover:bg-orange-600 text-white font-semibold px-8 rounded-full"
                asChild
              >
                <Link to="/reseau-agences/inscription">
                  Créer mon espace agence
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm rounded-full"
                asChild
              >
                <a href="#comment-ca-marche">Voir comment ça marche</a>
              </Button>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.46}
              className="mt-6 flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 justify-center text-xs sm:text-sm text-slate-100"
            >
              <span>✓ Capacité par paliers (simple)</span>
              <span className="hidden sm:inline">·</span>
              <span>✓ Standard agence (logo/charte)</span>
              <span className="hidden sm:inline">·</span>
              <span>✓ Reporting par agent</span>
            </motion.div>
          </div>
        </div>

        {/* Decorative wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path
              d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H0Z"
              fill="white"
            />
          </svg>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 4 Piliers                                                          */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-brand-blue mb-4">
              Un espace agence pensé pour la performance
            </h2>
            <p className="text-lg text-brand-blue max-w-2xl mx-auto">
              Pas un "outil en plus". Un système simple pour gérer l'équipe et transformer la visibilité en résultats.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map((pillar, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
              >
                <PillarCard {...pillar} />
              </motion.div>
            ))}
          </div>

          {/* Mini-bloc punchy */}
          <div className="max-w-5xl mx-auto mt-10">
            <Card className="rounded-3xl border border-slate-200 bg-gradient-to-r from-white via-blue-50 to-orange-50">
              <CardContent className="p-7 sm:p-8">
                <div className="flex flex-col md:flex-row gap-6 md:items-center md:justify-between">
                  <div className="text-left">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/70 border border-slate-200 px-3 py-1 text-xs text-slate-600">
                      <Sparkles className="h-4 w-4 text-brand-orange" />
                      Le point clé
                    </div>
                    <h3 className="mt-3 text-xl sm:text-2xl font-bold text-brand-blue">
                      Vous payez une <span className="text-brand-orange">capacité</span>, pas des complications.
                    </h3>
                    <p className="mt-2 text-sm sm:text-base text-brand-blue max-w-2xl">
                      Ajouts, départs, remplacement d'un agent… votre facturation reste simple :{" "}
                      <b>un palier = un plafond d'utilisateurs</b>. Pas de calcul au jour le jour.
                    </p>
                  </div>

                  <div className="flex flex-col items-stretch sm:items-end gap-3">
                    <Button className="rounded-full bg-brand-orange hover:bg-orange-600 text-white px-6" asChild>
                      <Link to="/reseau-agences/inscription">
                        Activer l'espace agence
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                    <div className="text-[11px] text-slate-500 sm:text-right">
                      Capacité par paliers • Simple à gérer
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Bloc "Ce que l'agence débloque" (CVD + cohérence)                   */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-brand-blue mb-4">
              Des profils agents qui inspirent confiance
            </h2>
            <p className="text-lg text-brand-blue max-w-2xl mx-auto">
              Harmonisez l'image de l'agence, tout en laissant chaque agent valoriser son expertise.
            </p>
          </motion.div>

          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
            <Card className="rounded-2xl border-slate-200">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mb-4">
                  <PlayCircle className="h-6 w-6 text-brand-orange" />
                </div>
                <h3 className="text-lg font-bold text-brand-blue">Vidéo intégrée</h3>
                <p className="mt-2 text-sm text-brand-blue">
                  Présentation agent (ou agence) pour créer une connexion immédiate.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mb-4">
                  <Star className="h-6 w-6 text-brand-orange" />
                </div>
                <h3 className="text-lg font-bold text-brand-blue">Avis clients</h3>
                <p className="mt-2 text-sm text-brand-blue">
                  Une preuve sociale claire, visible, cohérente sur tous les profils.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mb-4">
                  <Share2 className="h-6 w-6 text-brand-orange" />
                </div>
                <h3 className="text-lg font-bold text-brand-blue">Réseaux sociaux</h3>
                <p className="mt-2 text-sm text-brand-blue">
                  Liens pro (LinkedIn, Insta, Facebook…) + QR & lien premium pour partager partout.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="max-w-5xl mx-auto mt-6 grid md:grid-cols-2 gap-6">
            <Card className="rounded-2xl border-slate-200 bg-slate-50">
              <CardContent className="p-6 flex items-start gap-3">
                <div className="mt-0.5">
                  <Link2 className="h-5 w-5 text-brand-orange" />
                </div>
                <div>
                  <div className="font-semibold text-brand-blue">Lien premium + partage immédiat</div>
                  <p className="mt-1 text-sm text-brand-blue">
                    Chaque agent dispose d'un lien pro standardisé (même niveau de qualité, même expérience).
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 bg-slate-50">
              <CardContent className="p-6 flex items-start gap-3">
                <div className="mt-0.5">
                  <QrCode className="h-5 w-5 text-brand-orange" />
                </div>
                <div>
                  <div className="font-semibold text-brand-blue">QR avec logo + stats</div>
                  <p className="mt-1 text-sm text-brand-blue">
                    Scans QR et clics mesurés : vous savez quels agents génèrent le plus de traction.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Pricing (S/M/L)                                                    */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-20 bg-slate-50" id="tarifs-agence">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-brand-blue mb-4">
              Une tarification agence cohérente (mutualisation)
            </h2>
            <p className="text-lg text-brand-blue max-w-3xl mx-auto">
              Tous les paliers incluent les mêmes fonctionnalités. La différence, c'est la{" "}
              <b>capacité d'agents</b>. Plus vous êtes nombreux, plus le prix unitaire baisse.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {AGENCY_PLANS.map((plan) => (
              <PlanCard key={plan.key} plan={plan} />
            ))}
          </div>

          <div className="max-w-5xl mx-auto mt-8">
            <Card className="rounded-3xl border border-slate-200 bg-white">
              <CardContent className="p-6 sm:p-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div className="text-left">
                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 border border-slate-200 px-3 py-1 text-xs text-slate-600">
                      <Sparkles className="h-4 w-4 text-brand-orange" />
                      Logique de mutualisation
                    </div>
                    <h3 className="mt-3 text-xl sm:text-2xl font-bold text-brand-blue">
                      Personne ne se sent lésé.
                    </h3>
                    <p className="mt-2 text-sm sm:text-base text-brand-blue max-w-2xl">
                      Le prix unitaire <b>diminue</b> quand l'organisation grandit. Vous payez une capacité stable,
                      vous gérez votre équipe à l'intérieur du palier, sans quotidien administratif.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button className="rounded-full bg-brand-orange hover:bg-orange-600 text-white px-8" asChild>
                      <Link to="/reseau-agences/inscription">
                        Démarrer avec mon agence
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                    <Button variant="outline" className="rounded-full px-8" asChild>
                      <a href="#fonctionnalites-agence">Voir toutes les fonctionnalités</a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Tableau fonctionnalités (Directeur + équipe)                        */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-20 bg-white" id="fonctionnalites-agence">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-brand-blue mb-4">
              Tout ce que le directeur d'agence débloque
            </h2>
            <p className="text-lg text-brand-blue max-w-3xl mx-auto">
              Gestion d'équipe, harmonisation des cartes de visite digitales, reporting par professionnel :{" "}
              <b>tout est inclus</b> dans Agence S / M / L.
            </p>
          </motion.div>

          <div className="max-w-6xl mx-auto space-y-10">
            {AGENCY_FEATURES.map((section) => (
              <div key={section.category} className="rounded-3xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 flex items-center justify-between">
                  <div className="font-bold text-brand-blue">{section.category}</div>
                  <div className="text-xs text-slate-500">Inclus S / M / L</div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm min-w-[760px]">
                    <thead>
                      <tr className="border-t border-slate-200 bg-white">
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 w-3/5">
                          Fonctionnalité
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 w-2/5">
                          Inclus
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.rows.map((row, idx) => (
                        <tr key={row.label} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
                          <td className="px-6 py-3 text-left text-brand-blue">{row.label}</td>
                          <td className="px-6 py-3 text-center">
                            <YesNo value={row.included} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          <div className="max-w-5xl mx-auto mt-10">
            <Card className="rounded-3xl border border-slate-200 bg-gradient-to-r from-blue-50 via-white to-orange-50">
              <CardContent className="p-7 sm:p-8">
                <div className="flex flex-col md:flex-row gap-6 md:items-center md:justify-between">
                  <div className="text-left">
                    <h3 className="text-xl sm:text-2xl font-bold text-brand-blue">
                      Vous voulez commencer petit ?
                    </h3>
                    <p className="mt-2 text-sm sm:text-base text-brand-blue max-w-2xl">
                      Démarrez en <b>Agence S (5 agents)</b>. Quand l'usage est validé, vous passez en M ou L en un clic.
                    </p>
                  </div>
                  <div className="flex flex-col items-stretch sm:items-end gap-3">
                    <Button className="rounded-full bg-brand-orange hover:bg-orange-600 text-white px-8" asChild>
                      <Link to="/reseau-agences/inscription">
                        Créer mon espace agence
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                    <Button variant="outline" className="rounded-full px-8" asChild>
                      <a href="#fonctionnalites-agence">Voir toutes les fonctionnalités</a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Comment ça marche                                                   */}
      {/* ------------------------------------------------------------------ */}
      <section id="comment-ca-marche" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-brand-blue mb-4">Comment ça marche ?</h2>
            <p className="text-lg text-brand-blue max-w-2xl mx-auto">
              Déploiement simple, sans friction. Vous structurez l'équipe, puis vous pilotez.
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto space-y-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -18 : 18 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: index * 0.16 }}
                className="flex gap-6 items-start"
              >
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-blue to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {step.number}
                  </div>
                </div>
                <div className="flex-1 pt-2">
                  <h3 className="text-2xl font-bold text-brand-blue mb-3">{step.title}</h3>
                  <p className="text-lg text-brand-blue leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.35 }}
            className="text-center mt-12"
          >
            <Button
              size="lg"
              className="bg-brand-blue hover:bg-blue-700 text-white font-semibold px-8 rounded-full"
              asChild
            >
              <Link to="/reseau-agences/inscription">
                Créer mon espace agence
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* CTA Final                                                           */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-50">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_45%)]" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="max-w-3xl mx-auto text-center"
          >
            <Shield className="h-16 w-16 text-brand-orange mx-auto mb-6" />

            <h2 className="text-3xl md:text-4xl font-bold mb-6">Prêt à rendre votre agence plus efficace ?</h2>

            <p className="text-xl text-gray-300 mb-8">
              Un espace agence pour structurer l'équipe, piloter la performance et standardiser votre présence — sans complexité.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 justify-center items-center mb-8">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span>Capacité par paliers</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span>Harmonisation profils</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span>Reporting par agent</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-brand-orange hover:bg-orange-600 text-white font-semibold px-10 rounded-full"
                asChild
              >
                <Link to="/reseau-agences/inscription">
                  Activer l'espace agence
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm rounded-full"
                asChild
              >
                <Link to="/a-propos">En savoir plus</Link>
              </Button>
            </div>

            <div className="mt-4 text-xs text-white/70">
              Conseil : commencez en Agence S, puis augmentez la capacité quand l'usage est validé.
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default AgencyNetworkPage;