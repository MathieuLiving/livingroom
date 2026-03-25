import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle,
  Users,
  Target,
  Briefcase,
  ShieldCheck,
  LineChart,
  FileText,
  MessageSquare,
} from "lucide-react";
import SEO from "@/components/SEO";
import { proContent } from "@/lib/content/proPage.fr.js";
import AuthForm from "@/components/auth/AuthForm";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay },
  }),
};

const HERO_IMAGE_URL =
  "https://horizons-cdn.hostinger.com/f7eb5659-bed0-4bf7-847c-ea6067478f08/f95604b386ce4f87c88d946295d66fa3.jpg";

const FEATURES = [
  {
    icon: <Users className="h-8 w-8 text-brand-orange" />,
    title: "Des projets vraiment engagés",
    description:
      "Vous recevez des demandes de particuliers qui ont pris le temps de structurer leur projet avec LivingRoom.",
  },
  {
    icon: <Target className="h-8 w-8 text-brand-orange" />,
    title: "Des mandats ciblés sur votre expertise",
    description:
      "Secteur, type de bien, budget, calendrier : paramétrez vos critères et concentrez-vous sur les projets qui vous correspondent.",
  },
  {
    icon: <Briefcase className="h-8 w-8 text-brand-orange" />,
    title: "Une vitrine pro qui vous ressemble",
    description:
      "Carte de visite digitale, projets vitrine, présentation claire de vos services : tout est pensé pour valoriser votre image.",
  },
  {
    icon: <ShieldCheck className="h-8 w-8 text-brand-orange" />,
    title: "Un cadre rassurant pour vos clients",
    description:
      "Transparence, qualité de l’accompagnement et respect du particulier au cœur de la plateforme.",
  },
];

const STEPS = [
  {
    number: 1,
    title: "Créez votre espace pro",
    description:
      "Présentez votre activité, vos secteurs, vos types de biens et de mandats. En quelques minutes, votre profil est prêt.",
    icon: <FileText className="h-6 w-6 text-brand-orange" />,
  },
  {
    number: 2,
    title: "Recevez des projets ciblés",
    description:
      "Les projets des particuliers sont rapprochés de vos critères. Vous voyez rapidement ceux qui méritent votre attention.",
    icon: <Target className="h-6 w-6 text-brand-orange" />,
  },
  {
    number: 3,
    title: "Qualifiez et signez vos mandats",
    description:
      "Analysez la fiche projet, échangez avec le particulier, planifiez un rendez-vous et transformez plus facilement en mandat signé.",
    icon: <MessageSquare className="h-6 w-6 text-brand-orange" />,
  },
];

const PRICING_FEATURES = [
  {
    label: "Vitrine professionnelle complète (photo, logo, présentation)",
    free: "check",
    premium: "check",
  },
  {
    label: "Carte de visite digitale & QR Code partageable",
    free: "Lien gratuit + QR simple",
    premium: "Lien premium + QR pro",
  },
  {
    label: "Personnalisation carte & QR",
    free: "Couleurs",
    premium: "Couleurs + logo QR",
  },
  {
    label: "Statistiques carte de visite (clics lien & scans QR)",
    free: "dash",
    premium: "check",
  },
  {
    label: "Présentation de vos recherches & ventes via votre carte de visite digitale",
    free: "check",
    premium: "check",
  },
  {
    label: "Formulaire de qualification du projet via la carte de visite digitale",
    free: "check",
    premium: "check",
  },
  {
    label: "Partage de vos projets sur la place de marché & le marché inter-pro",
    free: "Illimités",
    premium: "Illimités",
  },
  {
    label: "Prises de contact actives (demandes envoyées aux porteurs de projets)",
    free: "Jusqu’à 2 demandes",
    premium: "Illimitées",
  },
  {
    label: "Prises de contact entrantes sur vos projets",
    free: "Illimitées",
    premium: "Illimitées",
  },
  {
    label: "Mise en avant sur la plateforme (statut Partenaire)",
    free: "dash",
    premium: "Incluse",
  },
  {
    label: "Alertes prioritaires sur les nouveaux projets",
    free: "dash",
    premium: "check",
  },
  {
    label: "Badge « Professionnel recommandé »",
    free: "dash",
    premium: "check",
  },
];

const FAQ_ITEMS = [
  {
    question: "À qui s’adresse LivingRoom.immo côté professionnels ?",
    answer:
      "LivingRoom.immo s’adresse aux agents immobiliers indépendants et mandataires. Un espace dédié aux agences et réseaux pourra être proposé ensuite.",
  },
  {
    question: "Comment fonctionne la mise en relation ?",
    answer:
      "Lorsqu'un projet vous intéresse, vous pouvez adresser une demande de mise en relation au porteur de projet. Avec le plan Gratuit, vous pouvez envoyer jusqu’à 2 demandes actives. Avec le plan Premium, vous pouvez envoyer autant de demandes que vous le souhaitez.",
  },
  {
    question: "Comment les projets sont-ils qualifiés ?",
    answer:
      "Les porteurs de projets remplissent un formulaire détaillé avec le type de bien, le budget, la localisation, les délais et leur situation actuelle. Cela permet de mieux comprendre leur besoin et de limiter les demandes peu sérieuses.",
  },
  {
    question: "Qu'est-ce que le marché inter-professionnels ?",
    answer:
      "C'est un espace où vous pouvez partager vos mandats avec un réseau de confrères. C'est un excellent moyen de trouver un acquéreur plus rapidement ou de répondre à une recherche spécifique.",
  },
  {
    question: "Comment la carte de visite digitale m'aide-t-elle à obtenir des leads ?",
    answer:
      "Votre carte de visite digitale est un mini-site personnel que vous pouvez partager partout. Elle présente votre expertise, vos projets en cours et permet à un particulier de vous envoyer son projet directement.",
  },
  {
    question: "Y a-t-il un engagement ?",
    answer:
      "L'inscription et l'utilisation des fonctionnalités de base sont gratuites. Le Premium est mensuel et sans engagement. Vous pouvez l’annuler à tout moment.",
  },
];

const FeatureCard = ({ icon, title, description }) => (
  <Card className="text-center hover:shadow-lg transition-shadow rounded-2xl border-slate-100">
    <CardHeader>
      <div className="mx-auto bg-orange-50 rounded-full p-3 w-max mb-4">{icon}</div>
      <CardTitle className="text-brand-blue text-lg" style={{ color: "#005E9E" }}>
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-gray-700 text-sm sm:text-base">{description}</p>
    </CardContent>
  </Card>
);

const CellValue = ({ value }) => {
  if (value === "check") {
    return <CheckCircle className="mx-auto h-5 w-5 text-emerald-500" aria-hidden />;
  }
  if (value === "dash") {
    return <span className="text-slate-300">—</span>;
  }
  return <span className="text-sm font-medium text-slate-700 text-center">{value}</span>;
};

const ProDeImmoPage = () => {
  const { seo } = proContent || {};
  const [authOpen, setAuthOpen] = useState(false);

  const openAuthModal = () => setAuthOpen(true);

  const CANONICAL_URL = "https://livingroom.immo/pro-de-limmo";
  const OG_IMAGE = HERO_IMAGE_URL;

  const pageTitle =
    seo?.title ??
    "Professionnels de l'immobilier | LivingRoom Pro – Des projets réellement qualifiés";

  const pageDescription =
    seo?.description ??
    "Accédez à des projets immobiliers réellement engagés, qualifiez vos mandats, développez votre visibilité et obtenez plus de leads grâce à LivingRoom Pro.";

  const faqJsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ_ITEMS.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    }),
    []
  );

  const webPageJsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: pageTitle,
      url: CANONICAL_URL,
      description: pageDescription,
      isPartOf: {
        "@type": "WebSite",
        name: "LivingRoom.immo",
        url: "https://livingroom.immo",
      },
    }),
    [pageTitle, pageDescription]
  );

  const breadcrumbJsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Accueil",
          item: "https://livingroom.immo/",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Professionnels de l'immobilier",
          item: CANONICAL_URL,
        },
      ],
    }),
    [CANONICAL_URL]
  );

  return (
    <>
      <SEO
        title={pageTitle}
        description={pageDescription}
        canonicalUrl={CANONICAL_URL}
        image={OG_IMAGE}
        schema={[webPageJsonLd, breadcrumbJsonLd, faqJsonLd]}
      />

      <main className="bg-slate-50">
        <section className="relative isolate overflow-hidden text-white">
          <img
            src={HERO_IMAGE_URL}
            alt="Un professionnel de l'immobilier signe un mandat avec un couple"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/60" />

          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:py-24 lg:py-28 min-h-[70vh] flex items-center">
            <div className="max-w-3xl">
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={0}
                className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs sm:text-sm text-slate-100 shadow-sm backdrop-blur"
              >
                <span className="inline-flex items-center gap-1">
                  <LineChart className="h-4 w-4 text-brand-orange" />
                  <span>Projets réellement qualifiés</span>
                </span>
                <span className="hidden sm:inline text-white/40">•</span>
                <span className="hidden sm:inline">Plus de mandats, moins de temps perdu</span>
                <span className="hidden sm:inline text-white/40">•</span>
                <span className="hidden sm:inline">Sans engagement</span>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={0.1}
                className="mt-6 text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight"
              >
                Vos compétences méritent
                <br className="hidden sm:block" />
                <span className="block">
                  les <span className="text-brand-orange">meilleurs projets</span>.
                </span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={0.25}
                className="mt-6 text-base sm:text-lg leading-7 sm:leading-8 text-slate-100 max-w-xl"
              >
                Accédez à des projets réellement qualifiés et engagés. Générez plus de mandats sans démarchage à froid. Simple, efficace et sans engagement.
              </motion.p>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={0.4}
                className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4"
              >
                <Button
                  size="lg"
                  onClick={openAuthModal}
                  className="bg-brand-orange hover:bg-orange-500 text-white shadow-lg rounded-full px-8 py-5 text-sm sm:text-base md:text-lg"
                >
                  Créer mon profil gratuit
                </Button>

                <div className="flex flex-col sm:flex-row flex-wrap gap-1 sm:gap-3 text-xs sm:text-sm text-slate-100">
                  <span>✓ Inscription en quelques minutes</span>
                  <span className="hidden sm:inline">·</span>
                  <span>✓ Version gratuite disponible</span>
                  <span className="hidden sm:inline">·</span>
                  <span>✓ Sans engagement</span>
                </div>
              </motion.div>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={0.5}
                className="mt-4 text-xs sm:text-sm text-slate-100"
              >
                <span className="opacity-80">Déjà inscrit ? </span>
                <button
                  type="button"
                  onClick={openAuthModal}
                  className="underline underline-offset-4 font-medium"
                >
                  Accédez à votre espace pro
                </button>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="bg-white py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-brand-blue" style={{ color: "#005E9E" }}>
                Pourquoi rejoindre LivingRoom en tant que pro ?
              </h2>
              <p className="text-base sm:text-lg text-gray-700 mt-2 max-w-2xl mx-auto">
                Une plateforme pensée pour les professionnels qui privilégient la qualité des projets à la quantité de leads.
              </p>
            </div>

            <div className="max-w-3xl mx-auto mb-10">
              <Card className="border-brand-orange/15 bg-gradient-to-r from-orange-50 via-white to-blue-50 rounded-2xl">
                <CardContent className="py-6 px-6 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-brand-orange flex items-center justify-center">
                      <ShieldCheck className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm text-slate-600">Une approche centrée sur la confiance et la qualité</p>
                      <p className="text-base sm:text-lg font-semibold text-brand-blue" style={{ color: "#005E9E" }}>
                        LivingRoom valorise votre expertise auprès de particuliers vraiment engagés dans leur projet.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {FEATURES.map((feature, index) => (
                <FeatureCard key={index} {...feature} />
              ))}
            </div>
          </div>
        </section>

        <section
          className="py-16 md:py-24 bg-slate-50"
          id="how-it-works-pro"
          aria-labelledby="how-it-works-pro-title"
        >
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2
                id="how-it-works-pro-title"
                className="text-3xl md:text-4xl font-bold text-brand-blue"
                style={{ color: "#005E9E" }}
              >
                Comment ça marche côté pro ?
              </h2>
              <p className="text-base sm:text-lg text-gray-700 mt-2 max-w-2xl mx-auto">
                Un parcours pensé pour s’intégrer simplement dans votre quotidien de terrain.
              </p>
            </div>

            <div className="relative">
              <div className="hidden md:block absolute top-11 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-orange/40 to-transparent" />
              <div className="grid md:grid-cols-3 gap-8">
                {STEPS.map((step, index) => (
                  <motion.div
                    key={step.number}
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    custom={0.1 * index}
                    className="flex flex-col items-center text-center"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-brand-orange text-white rounded-full h-12 w-12 flex items-center justify-center text-lg font-bold">
                        {step.number}
                      </div>
                      <div className="hidden md:flex items-center justify-center h-10 w-10 rounded-full bg-orange-50">
                        {step.icon}
                      </div>
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-2 text-brand-blue" style={{ color: "#005E9E" }}>
                      {step.title}
                    </h3>
                    <p className="text-gray-700 text-sm sm:text-base max-w-xs">{step.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-12">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-brand-blue mb-3" style={{ color: "#005E9E" }}>
                Des leads immobiliers qualifiés, sans prospection à froid
              </h2>
              <p className="text-slate-700 leading-relaxed">
                LivingRoom Pro centralise des projets d’achat et de vente structurés par les particuliers (budget, localisation, calendrier, typologie). Vous ciblez votre secteur et vos critères, puis vous vous présentez aux projets où vous avez une vraie valeur ajoutée.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button asChild variant="outline" className="rounded-full">
                  <Link to="/place-des-projets">Voir la place des projets</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full">
                  <Link to="/agents-immobiliers-par-ville">Index SEO par ville</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full">
                  <Link to="/particuliers">Côté particuliers</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-16 md:py-24" id="tarifs-pro">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-brand-blue" style={{ color: "#005E9E" }}>
                Deux offres. Zéro blabla.
              </h2>
              <p className="text-base sm:text-lg text-gray-700 mt-2 max-w-2xl mx-auto">
                Commencez gratuitement. Passez en Premium quand vous voulez reprendre la main : statistiques, visibilité, demandes illimitées.
              </p>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[820px] rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="w-2/5 px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 rounded-tl-2xl">
                        Fonctionnalités
                      </th>
                      <th className="w-1/5 px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <div className="flex flex-col items-center gap-1">
                          <span>Gratuit</span>
                        </div>
                      </th>
                      <th className="w-2/5 px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 rounded-tr-2xl">
                        <div className="flex flex-col items-center gap-1">
                          <span>Premium</span>
                          <span className="text-[11px] font-normal text-slate-500">Sans engagement</span>
                        </div>
                      </th>
                    </tr>
                    <tr className="border-t border-slate-200 bg-white">
                      <th className="px-6 py-4 text-left text-xs font-normal text-slate-400">&nbsp;</th>
                      <th className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-3xl font-bold text-slate-900">0</span>
                          <span className="text-xs text-slate-500">/ pour toujours</span>
                        </div>
                      </th>
                      <th className="px-6 py-4 text-center bg-blue-50/40">
                        <div className="flex flex-col items-center">
                          <span className="text-3xl font-bold text-slate-900">19</span>
                          <span className="text-xs text-slate-500">/ mois</span>
                        </div>
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {PRICING_FEATURES.map((row, idx) => (
                      <tr key={row.label} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
                        <td className="px-6 py-3 text-left align-top text-[13px] text-slate-700">{row.label}</td>
                        <td className="px-6 py-3 text-center align-middle">
                          <CellValue value={row.free} />
                        </td>
                        <td className="px-6 py-3 text-center align-middle bg-blue-50/20">
                          <CellValue value={row.premium} />
                        </td>
                      </tr>
                    ))}

                    <tr className="border-t border-slate-200 bg-slate-50/80">
                      <td className="px-6 py-4" />
                      <td className="px-6 py-4 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={openAuthModal}
                          className="rounded-full px-4 text-xs border-slate-300 text-brand-blue hover:bg-slate-100"
                          style={{ color: "#005E9E" }}
                        >
                          Créer mon profil gratuit
                        </Button>
                      </td>
                      <td className="px-6 py-4 text-center bg-blue-50/40 rounded-b-2xl">
                        <Button
                          size="sm"
                          onClick={openAuthModal}
                          className="rounded-full px-4 text-xs bg-brand-orange hover:bg-orange-500 text-white"
                        >
                          Passer en Premium
                        </Button>
                        <div className="mt-2 text-[11px] text-slate-600">
                          Débloquer demandes illimitées + stats
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-8 max-w-5xl mx-auto">
              <Card className="rounded-3xl border border-slate-200 bg-gradient-to-r from-blue-50 via-white to-orange-50">
                <CardContent className="py-7 px-6 sm:px-8">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="text-left">
                      <div className="inline-flex items-center gap-2 rounded-full bg-white/70 border border-slate-200 px-3 py-1 text-xs text-slate-600">
                        <span className="h-2 w-2 rounded-full bg-brand-orange" />
                        Pourquoi passer Premium ?
                      </div>

                      <h3 className="mt-3 text-xl sm:text-2xl font-bold text-slate-900">
                        Le gratuit vous rend visible. Le Premium vous rend <span className="text-brand-orange">dangereux</span>.
                      </h3>

                      <p className="mt-2 text-sm sm:text-base text-slate-700 max-w-2xl">
                        Demandes illimitées, stats, visibilité renforcée. Et une règle simple :
                        <b> un seul mandat couvre largement plusieurs mois d’abonnement.</b>
                      </p>

                      <ul className="mt-4 grid sm:grid-cols-2 gap-3 text-sm text-slate-700">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
                          <span>
                            <b>Illimité</b> : vous contactez autant de projets que nécessaire
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
                          <span>
                            <b>Mesurable</b> : clics sur le lien + scans QR pour savoir ce qui marche
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
                          <span>
                            <b>Plus visible</b> : mise en avant + badge recommandé = plus de confiance
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
                          <span>
                            <b>Plus rapide</b> : alertes prioritaires pour ne rien rater
                          </span>
                        </li>
                      </ul>

                      <p className="mt-4 text-xs sm:text-sm text-slate-600">
                        Sans engagement. Résiliable à tout moment. Le Premium doit vous servir — pas vous enfermer.
                      </p>
                    </div>

                    <div className="flex flex-col items-stretch sm:items-end gap-3">
                      <Button
                        onClick={openAuthModal}
                        className="rounded-full bg-brand-orange hover:bg-orange-500 text-white px-6"
                      >
                        Passer en Premium
                      </Button>
                      <Button
                        variant="outline"
                        onClick={openAuthModal}
                        className="rounded-full px-6 border-slate-300 text-slate-700 hover:bg-white"
                      >
                        Créer mon profil gratuit
                      </Button>
                      <div className="text-[11px] text-slate-500 sm:text-right">
                        19 € / mois • Sans engagement
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 max-w-4xl mx-auto">
              <Card className="rounded-2xl border-slate-200 bg-slate-50">
                <CardContent className="py-5 px-6">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <LineChart className="h-5 w-5 text-brand-orange" />
                    </div>
                    <div className="text-sm text-slate-700">
                      <div className="font-semibold text-slate-900">
                        Votre carte de visite digitale devient un outil de performance
                      </div>
                      <p className="mt-1">
                        Tous les pros disposent d’un <b>lien gratuit</b> et d’un <b>QR code simple</b>. Le <b>Premium</b> débloque un <b>lien premium</b> avec <b>QR code avec logo</b> plus des <b>statistiques</b> (clics sur le lien et scans du QR). Et surtout : des <b>demandes illimitées</b> pour contacter les meilleurs projets.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="bg-slate-50 py-16 md:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-brand-blue" style={{ color: "#005E9E" }}>
                Questions fréquentes
              </h2>
            </div>

            <div className="space-y-4">
              {FAQ_ITEMS.map((item, index) => (
                <motion.div
                  key={item.question}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.2 }}
                  custom={0.05 * index}
                >
                  <Card className="border-slate-100 rounded-2xl">
                    <CardHeader>
                      <CardTitle className="text-brand-blue text-base sm:text-lg" style={{ color: "#005E9E" }}>
                        {item.question}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 text-sm sm:text-base">{item.answer}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-brand-blue text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              Prêt à rencontrer vos prochains mandats ?
            </h2>
            <p className="text-base sm:text-lg md:text-xl mb-8 max-w-2xl mx-auto text-blue-100">
              Créez votre espace LivingRoom Pro, paramétrez vos critères et commencez à recevoir des projets de particuliers vraiment engagés.
            </p>

            <Button
              size="lg"
              onClick={openAuthModal}
              className="bg-brand-orange hover:bg-brand-orange/90 text-white font-bold text-base sm:text-lg px-8 py-5 rounded-full"
            >
              Créer mon profil gratuit
            </Button>

            <div className="mt-4 text-xs sm:text-sm text-white/80">
              <span className="opacity-80">Déjà inscrit ? </span>
              <button
                type="button"
                onClick={openAuthModal}
                className="underline underline-offset-4 font-medium"
              >
                Accédez à votre espace pro
              </button>
            </div>
          </div>
        </section>
      </main>

      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent className="max-w-lg w-full p-0 border-none bg-transparent shadow-none">
          <div className="w-full">
            <AuthForm userType="professionnel" />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProDeImmoPage;