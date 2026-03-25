// src/pages/ProjectOwnerPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle,
  Search,
  Users,
  Award,
  ShieldCheck,
  FileText,
  MessageSquare,
  Star,
} from "lucide-react";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/lib/customSupabaseClient";
import AuthForm from "@/components/auth/AuthForm";
import SEO from "@/components/SEO";
import { Helmet } from "react-helmet-async";

/* ---------------------------------------------------------------------- */
/*  Animations                                                            */
/* ---------------------------------------------------------------------- */

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay },
  }),
};

/* ---------------------------------------------------------------------- */
/*  Contenus                                                              */
/* ---------------------------------------------------------------------- */

const FEATURES = [
  {
    icon: <Search className="h-8 w-8 text-brand-orange" />,
    title: "Un brief unique pour tout centraliser",
    description:
      "Décrivez votre projet une seule fois. Inutile de répéter les mêmes informations à chaque professionnel.",
  },
  {
    icon: <Users className="h-8 w-8 text-brand-orange" />,
    title: "Des professionnels réellement intéressés",
    description:
      "Ce sont les agents qui viennent vers vous, parce que votre projet correspond à leur expertise et à leur secteur.",
  },
  {
    icon: <CheckCircle className="h-8 w-8 text-brand-orange" />,
    title: "Vous gardez le contrôle",
    description:
      "Vous choisissez à qui répondre, quand échanger et à quel rythme faire avancer votre projet.",
  },
  {
    icon: <Award className="h-8 w-8 text-brand-orange" />,
    title: "Un cadre rassurant",
    description:
      "LivingRoom met en avant la transparence, l’écoute et la qualité de l’accompagnement, côté particuliers comme côté pros.",
  },
];

const STEPS = [
  {
    number: 1,
    title: "Décrivez votre projet",
    description:
      "Acheter, vendre, changer de vie : racontez-nous votre projet en quelques questions simples.",
    icon: <FileText className="h-6 w-6 text-brand-orange" />,
  },
  {
    number: 2,
    title: "Nous trouvons les bons profils",
    description:
      "Notre technologie rapproche votre projet des professionnels les plus pertinents pour vous.",
    icon: <Users className="h-6 w-6 text-brand-orange" />,
  },
  {
    number: 3,
    title: "Vous choisissez avec qui avancer",
    description:
      "Vous recevez des propositions, consultez les profils et décidez qui vous souhaitez recontacter.",
    icon: <MessageSquare className="h-6 w-6 text-brand-orange" />,
  },
];

const FeatureCard = ({ icon, title, description }) => (
  <Card className="text-center hover:shadow-lg transition-shadow rounded-2xl border-slate-100">
    <CardHeader>
      <div className="mx-auto bg-orange-50 rounded-full p-3 w-max mb-4">
        {icon}
      </div>
      <CardTitle className="text-brand-blue text-lg">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-gray-700 text-sm sm:text-base">{description}</p>
    </CardContent>
  </Card>
);

/* ---------------------------------------------------------------------- */
/*  Page                                                                  */
/* ---------------------------------------------------------------------- */

const ProjectOwnerPage = () => {
  const { user } = useAuth();
  const location = useLocation();

  const [socialProofImages, setSocialProofImages] = useState([]);

  useEffect(() => {
    const fetchImages = async () => {
      const { data, error } = await supabase
        .from("picture_website")
        .select("picture_id, picture_url")
        .in("picture_id", ["vente", "couple", "hero_background", "agent_showing_house"]);

      if (error) {
        console.error("Error fetching social proof images:", error);
      } else {
        setSocialProofImages(data || []);
      }
    };

    fetchImages();
  }, []);

  const primaryCtaLabel = user ? "Accéder à mon tableau de bord" : "Démarrer mon projet";
  const primaryCtaLink = user ? "/dashboard-particulier" : "/preciser-projet";

  const finalCtaLabel = user ? "Retourner à mon espace" : "Je décris mon projet";
  const finalCtaLink = primaryCtaLink;

  /* ---------------------------------------------------------------------- */
  /*  SEO : canonical + OG + JSON-LD                                       */
  /* ---------------------------------------------------------------------- */

  const CANONICAL_URL = "https://livingroom.immo/particuliers";

  // Image OG stable (celle du hero). Si tu as une OG dédiée, mets-la ici.
  const OG_IMAGE =
    "https://horizons-cdn.hostinger.com/f7eb5659-bed0-4bf7-847c-ea6067478f08/98f7df34851948bc7602e32fe8c4b921.jpg";

  // Évite les dupes si ?utm= etc.
  const canonical = useMemo(() => {
    // Si un jour tu changes le routeur et veux calculer depuis location, tu peux,
    // mais ici on impose l'URL canonique unique.
    return CANONICAL_URL;
  }, [location.pathname]);

  const faqJsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Le service est-il vraiment gratuit pour les particuliers ?",
          acceptedAnswer: {
            "@type": "Answer",
            text:
              "Oui. La création de compte et le dépôt de projet sont gratuits pour les particuliers. Vous gardez aussi le contrôle sur le partage de vos coordonnées.",
          },
        },
        {
          "@type": "Question",
          name: "Comment LivingRoom protège mes coordonnées ?",
          acceptedAnswer: {
            "@type": "Answer",
            text:
              "Vous déposez votre projet et recevez des propositions. Vous choisissez ensuite à quel professionnel transmettre vos coordonnées et à quel moment.",
          },
        },
        {
          "@type": "Question",
          name: "Combien de temps faut-il pour déposer un projet ?",
          acceptedAnswer: {
            "@type": "Answer",
            text:
              "Quelques minutes suffisent : un formulaire guidé vous aide à structurer votre achat ou votre vente afin d’attirer les bons professionnels.",
          },
        },
        {
          "@type": "Question",
          name: "Est-ce que les professionnels sont vérifiés ?",
          acceptedAnswer: {
            "@type": "Answer",
            text:
              "LivingRoom met en avant des professionnels identifiés et favorise un cadre d’échange transparent, pour des mises en relation plus sereines.",
          },
        },
      ],
    }),
    []
  );

  const webPageJsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Votre projet immobilier commence ici | LivingRoom",
      url: canonical,
      description:
        "Déposez votre projet d'achat ou de vente et laissez des professionnels venir à vous. Simple, discret et 100% gratuit pour les particuliers.",
      isPartOf: {
        "@type": "WebSite",
        name: "LivingRoom.immo",
        url: "https://livingroom.immo",
      },
    }),
    [canonical]
  );

  return (
    <>
      <SEO
        title="Votre projet immobilier commence ici | LivingRoom"
        description="Déposez votre projet d'achat ou de vente et laissez des professionnels vérifiés venir à vous. Simple, discret et 100% gratuit pour les particuliers."
        url={canonical}
        image={OG_IMAGE}
      />

      {/* ✅ SEO technique : canonical + JSON-LD */}
      <Helmet>
        <link rel="canonical" href={canonical} />
        <script type="application/ld+json">{JSON.stringify(webPageJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      <main className="bg-slate-50">
        {/* ------------------------------------------------------------------ */}
        {/* HERO plein écran                                                   */}
        {/* ------------------------------------------------------------------ */}
        <section className="relative isolate overflow-hidden text-white">
          <img
            src={OG_IMAGE}
            alt="Famille en déménagement avec un professionnel immobilier"
            className="absolute inset-0 h-full w-full object-cover object-[center_65%]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/75 to-slate-900/25" />

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
                  <Star className="h-4 w-4 text-brand-orange" />
                  <span>Professionnels vérifiés</span>
                </span>
                <span className="hidden sm:inline text-white/40">•</span>
                <span className="hidden sm:inline">
                  Service 100% gratuit pour les particuliers
                </span>
                <span className="hidden sm:inline text-white/40">•</span>
                <span className="hidden sm:inline">
                  Mise en relation en toute transparence
                </span>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={0.1}
                className="mt-6 text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight"
              >
                Le bon professionnel
                <br className="hidden sm:block" />
                <span className="block">
                  pour votre <span className="text-brand-orange">projet immobilier</span>.
                </span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={0.25}
                className="mt-6 text-base sm:text-lg leading-7 sm:leading-8 text-slate-100 max-w-xl"
              >
                {user
                  ? "Retrouvez vos projets, suivez les réponses des professionnels et avancez sereinement dans votre achat ou votre vente."
                  : "Vous avez un projet d'achat ou de vente ? Déposez-le une seule fois en quelques minutes et laissez des professionnels sélectionnés venir à vous, sans démarchage agressif."}
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
                  asChild
                  className="bg-brand-orange hover:bg-orange-500 text-white shadow-lg rounded-full px-8 py-5 text-sm sm:text-base md:text-lg"
                >
                  <Link to={primaryCtaLink}>{primaryCtaLabel}</Link>
                </Button>

                <div className="flex flex-col sm:flex-row flex-wrap gap-1 sm:gap-3 text-xs sm:text-sm text-slate-100">
                  <span>✓ Service 100% gratuit</span>
                  <span className="hidden sm:inline">·</span>
                  <span>✓ Vos coordonnées restent confidentielles</span>
                  <span className="hidden sm:inline">·</span>
                  <span>✓ Sans engagement</span>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* Auth Form Section                                                  */}
        {/* ------------------------------------------------------------------ */}
        {!user && (
          <section className="py-16 md:py-24 bg-brand-blue">
            <div className="container mx-auto px-4">
              <div className="grid md:grid-cols-2 gap-10 items-center">
                <div className="text-white">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
                    Créez votre espace en quelques secondes
                  </h2>
                  <p className="text-sm sm:text-base md:text-lg text-white/80 mt-3 max-w-xl">
                    Un seul espace pour déposer votre projet, échanger avec les
                    professionnels et suivre vos démarches en toute sérénité.
                  </p>

                  <ul className="mt-6 space-y-2 text-sm text-white/80">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-300" />
                      <span>Gratuit pour les particuliers</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-300" />
                      <span>Professionnels vérifiés et identifiés</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-300" />
                      <span>Vos échanges centralisés dans un espace sécurisé</span>
                    </li>
                  </ul>
                </div>

                <div className="w-full max-w-md ml-auto mr-auto md:mr-0">
                  <div className="bg-white rounded-2xl shadow-2xl border border-slate-100">
                    <div className="px-6 pt-6 pb-3 border-b border-slate-100">
                      <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue">
                        Étape 1
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-900">
                        Créez votre espace LivingRoom
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        Indiquez vos informations ci-dessous pour vous connecter
                        ou créer votre compte.
                      </p>
                    </div>
                    <div className="p-6">
                      <AuthForm userType="particulier" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* How it works                                                       */}
        {/* ------------------------------------------------------------------ */}
        <section
          className="py-16 md:py-24 bg-slate-50"
          id="how-it-works"
          aria-labelledby="how-it-works-title"
        >
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2
                id="how-it-works-title"
                className="text-3xl md:text-4xl font-bold text-brand-blue"
              >
                Comment ça marche ?
              </h2>
              <p className="text-base sm:text-lg text-gray-700 mt-2 max-w-2xl mx-auto">
                Un parcours pensé pour vous faire gagner du temps, sans pression
                commerciale.
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
                    <h3 className="text-lg sm:text-xl font-semibold mb-2 text-brand-blue">
                      {step.title}
                    </h3>
                    <p className="text-gray-700 text-sm sm:text-base max-w-xs">
                      {step.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* Features                                                           */}
        {/* ------------------------------------------------------------------ */}
        <section className="bg-white py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-brand-blue">
                Pourquoi passer par LivingRoom ?
              </h2>
              <p className="text-base sm:text-lg text-gray-700 mt-2 max-w-2xl mx-auto">
                Vous gardez la main sur votre projet, nous vous aidons à faire
                les bonnes rencontres.
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
                      <p className="text-sm text-slate-600">
                        Un accompagnement qui privilégie la confiance et l&apos;écoute
                      </p>
                      <p className="text-base sm:text-lg font-semibold text-slate-900">
                        Les particuliers accompagnés soulignent la simplicité du
                        parcours et la qualité des échanges avec les professionnels.
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

        {/* ------------------------------------------------------------------ */}
        {/* ✅ Bloc SEO “visible” + maillage interne                           */}
        {/* ------------------------------------------------------------------ */}
        <section className="bg-slate-50 py-12">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-brand-blue mb-3">
                Déposer un projet immobilier (achat ou vente) en toute simplicité
              </h2>
              <p className="text-slate-700 leading-relaxed">
                LivingRoom vous aide à structurer votre projet immobilier en quelques minutes, puis à recevoir des
                propositions de professionnels adaptés à votre secteur et à votre typologie de bien. Vous restez libre :
                vous choisissez qui contacter et quand partager vos coordonnées.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button asChild variant="outline" className="rounded-full">
                  <Link to="/place-des-projets">Découvrir les projets</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full">
                  <Link to="/agents-immobiliers-par-ville">Trouver un agent par ville</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full">
                  <Link to="/pro-de-limmo">Vous êtes pro ?</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* CTA final                                                          */}
        {/* ------------------------------------------------------------------ */}
        <section className="py-20 bg-brand-blue text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              Prêt à avancer sur votre projet ?
            </h2>
            <p className="text-base sm:text-lg md:text-xl mb-8 max-w-2xl mx-auto text-blue-100">
              Déposez votre projet en quelques minutes et laissez les professionnels adaptés venir à vous. Vous gardez la
              main à chaque étape.
            </p>

            <Button
              asChild
              size="lg"
              className="bg-brand-orange hover:bg-brand-orange/90 text-white font-bold text-base sm:text-lg px-8 py-5 rounded-full"
            >
              <Link to={finalCtaLink}>{finalCtaLabel}</Link>
            </Button>

            <div className="mt-6 flex flex-col items-center gap-3 text-xs sm:text-sm text-white/80">
              <div className="flex -space-x-2">
                {socialProofImages.length > 0
                  ? socialProofImages.slice(0, 4).map((img, i) => (
                      <img
                        key={img.picture_id || i}
                        src={img.picture_url}
                        alt="Utilisateur LivingRoom"
                        className="h-8 w-8 rounded-full border-2 border-brand-blue object-cover bg-white"
                      />
                    ))
                  : [1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-8 w-8 rounded-full border-2 border-brand-blue bg-white/90"
                      />
                    ))}
              </div>
              <p>De nouveaux projets accompagnés chaque mois, partout en France.</p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default ProjectOwnerPage;