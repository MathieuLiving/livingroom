import React from "react";
import AcheterImmobilierCityTemplate from "@/templates/AcheterImmobilierCityTemplate";
import { Zap, TrendingUp, HeartHandshake as Handshake } from 'lucide-react';

const AcheterImmobilierBordeauxPage = () => {
  const cityData = {
    city: "Bordeaux",
    description: "Découvrez comment acheter un bien immobilier à Bordeaux avec l'accompagnement de nos experts locaux. Profitez de l'attractivité de la perle d'Aquitaine pour votre prochain achat.",
    ogImage: "https://images.unsplash.com/photo-1549419131-7e8c3b171630", // Placeholder for Bordeaux
    heroTitle: "Acheter un Bien Immobilier à Bordeaux",
    heroSubtitle: "Trouvez votre futur appartement ou maison à Bordeaux, une ville dynamique et prisée, avec l'aide de professionnels expérimentés.",
    heroImageAlt: "Vue des quais de Bordeaux au coucher du soleil",
    valuePropositionTitle: "Pourquoi acheter à Bordeaux avec LivingRoom ?",
    valueProps: [
      {
        icon: Zap,
        title: "Marché Locaux",
        description: "Accédez à des propriétés non listées et des opportunités uniques grâce à notre réseau d'experts à Bordeaux.",
      },
      {
        icon: TrendingUp,
        title: "Investissement Sûr",
        description: "Bénéficiez d'une analyse précise du marché bordelais pour un investissement immobilier intelligent et rentable.",
      },
      {
        icon: Handshake,
        title: "Soutien Expert",
        description: "Un accompagnement personnalisé, de la recherche à la signature, pour un achat serein et réussi à Bordeaux.",
      },
    ],
    featuresTitle: "Un parcours d'achat immobilier simplifié à Bordeaux",
    featuresImageAlt: "Façade d'un immeuble haussmannien à Bordeaux",
    featuresList: [
      { text: "Un vaste choix de biens à <b>Bordeaux</b> : appartements, maisons de ville, échoppes rénovées." },
      { text: "Une recherche personnalisée selon vos critères précis (quartier, budget, type de bien, etc.)." },
      { text: "Des alertes exclusives pour ne manquer aucune nouvelle propriété sur le marché bordelais." },
      { text: "Des conseils d'experts sur les quartiers de Bordeaux, les prix au m² et les perspectives d'évolution." },
      { text: "Un soutien complet pour les visites, négociations et démarches administratives jusqu'à l'acquisition." },
    ],
    howItWorksTitle: "Comment acheter votre bien à Bordeaux avec LivingRoom ?",
    howItWorksSteps: [
      {
        stepNumber: 1,
        title: "Définissez votre recherche",
        description: "Précisez vos attentes pour votre achat immobilier à Bordeaux afin que nous ciblions les meilleures offres.",
      },
      {
        stepNumber: 2,
        title: "Rencontrez nos experts locaux",
        description: "Nous vous mettons en relation avec des agents immobiliers bordelais spécialisés qui connaissent parfaitement la ville.",
      },
      {
        stepNumber: 3,
        title: "Concrétisez votre achat",
        description: "Recevez des propositions ciblées et laissez-vous guider jusqu'à la finalisation de votre projet à Bordeaux.",
      },
    ],
    testimonialsTitle: "Témoignages de nos clients qui ont acheté à Bordeaux",
    testimonials: [
      {
        quote: "J'ai trouvé ma maison de rêve à Caudéran grâce à LivingRoom. L'agent était d'une aide précieuse et connaissait parfaitement le marché bordelais !",
        author: "Marine D., acheteuse à Bordeaux",
        imageAlt: "Photo de Marine D.",
      },
      {
        quote: "Un accompagnement irréprochable et un accès à des biens que je n'aurais jamais trouvés seul. Mon achat à Bordeaux s'est fait en toute confiance.",
        author: "Thomas L., acheteur à Bordeaux",
        imageAlt: "Photo de Thomas L.",
      },
    ],
    callToActionTitle: "Prêt à trouver votre futur bien à Bordeaux ?",
    callToActionSubtitle: "Déposez votre projet d'achat dès aujourd'hui et laissez nos experts bordelais vous accompagner.",
  };

  return <AcheterImmobilierCityTemplate {...cityData} />;
};

export default AcheterImmobilierBordeauxPage;