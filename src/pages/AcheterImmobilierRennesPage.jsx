import React from "react";
import AcheterImmobilierCityTemplate from "@/templates/AcheterImmobilierCityTemplate";
import { Zap, TrendingUp, HeartHandshake as Handshake } from 'lucide-react';

const AcheterImmobilierRennesPage = () => {
  const cityData = {
    city: "Rennes",
    description: "Découvrez comment acheter un bien immobilier à Rennes avec l'accompagnement de nos experts locaux. Profitez du cadre de vie agréable et du dynamisme breton pour votre prochain achat.",
    ogImage: "https://images.unsplash.com/photo-1549419131-7e8c3b171630", // Placeholder for Rennes
    heroTitle: "Acheter un Bien Immobilier à Rennes",
    heroSubtitle: "Trouvez votre appartement ou maison à Rennes, une ville étudiante et verte en plein essor, avec l'aide de professionnels attentifs.",
    heroImageAlt: "Rues historiques et maisons à pans de bois à Rennes",
    valuePropositionTitle: "Pourquoi acheter à Rennes avec LivingRoom ?",
    valueProps: [
      {
        icon: Zap,
        title: "Accès Privilégié",
        description: "Découvrez des biens immobiliers exclusifs à Rennes avant leur parution sur les plateformes classiques.",
      },
      {
        icon: TrendingUp,
        title: "Expertise Locale",
        description: "Bénéficiez de la connaissance approfondie de nos agents sur le marché rennais pour un achat intelligent.",
      },
      {
        icon: Handshake,
        title: "Accompagnement Personnalisé",
        description: "De la recherche à la signature, nos experts vous guident pour un achat immobilier à Rennes sans souci.",
      },
    ],
    featuresTitle: "Un processus d'achat fluide et serein à Rennes",
    featuresImageAlt: "Quais de la Vilaine à Rennes",
    featuresList: [
      { text: "Un choix diversifié de biens à <b>Rennes</b> : appartements anciens rénovés, maisons de ville, programmes neufs." },
      { text: "Une recherche ciblée et personnalisée en fonction de vos critères spécifiques (quartier, budget, type de bien, etc.)." },
      { text: "Recevez des alertes en avant-première pour les nouvelles propriétés sur le marché rennais." },
      { text: "Des conseils d'experts sur les valeurs immobilières, les tendances et les opportunités d'investissement à Rennes." },
      { text: "Un soutien pour toutes les étapes : visites, négociations, formalités administratives et juridiques." },
    ],
    howItWorksTitle: "Comment acheter votre bien à Rennes avec LivingRoom ?",
    howItWorksSteps: [
      {
        stepNumber: 1,
        title: "Définissez vos critères",
        description: "Précisez vos attentes pour votre futur achat immobilier à Rennes.",
      },
      {
        stepNumber: 2,
        title: "Mise en relation qualifiée",
        description: "Nous vous connectons avec des agents immobiliers rennais experts de votre secteur de recherche.",
      },
      {
        stepNumber: 3,
        title: "Réalisez votre projet",
        description: "Visitez, négociez et achetez votre bien à Rennes en toute confiance, grâce à notre accompagnement.",
      },
    ],
    testimonialsTitle: "Ce que disent nos clients qui ont acheté à Rennes",
    testimonials: [
      {
        quote: "LivingRoom m'a aidé à trouver mon premier appartement à Rennes, c'était un processus simple et l'agent a été très réactif.",
        author: "Alice B., acheteuse à Rennes",
        imageAlt: "Photo d'Alice B.",
      },
      {
        quote: "L'équipe a une connaissance impressionnante du marché rennais. J'ai pu investir dans un quartier très prometteur en toute sérénité.",
        author: "Olivier L., investisseur à Rennes",
        imageAlt: "Photo d'Olivier L.",
      },
    ],
    callToActionTitle: "Prêt à trouver votre futur bien à Rennes ?",
    callToActionSubtitle: "Lancez votre recherche immobilière à Rennes dès aujourd'hui et concrétisez votre projet.",
  };

  return <AcheterImmobilierCityTemplate {...cityData} />;
};

export default AcheterImmobilierRennesPage;