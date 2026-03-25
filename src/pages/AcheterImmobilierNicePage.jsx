import React from "react";
import AcheterImmobilierCityTemplate from "@/templates/AcheterImmobilierCityTemplate";
import { Zap, TrendingUp, HeartHandshake as Handshake } from 'lucide-react';

const AcheterImmobilierNicePage = () => {
  const cityData = {
    city: "Nice",
    description: "Découvrez comment acheter un bien immobilier à Nice avec l'accompagnement de nos experts locaux. Profitez du cadre exceptionnel de la Côte d'Azur pour votre prochain achat.",
    ogImage: "https://images.unsplash.com/photo-1517772421389-13824f33083e", // Placeholder for Nice
    heroTitle: "Acheter un Bien Immobilier à Nice",
    heroSubtitle: "Trouvez votre appartement ou villa de rêve à Nice, entre mer et montagne, avec l'aide de professionnels compétents.",
    heroImageAlt: "Vue aérienne de la Promenade des Anglais à Nice",
    valuePropositionTitle: "Pourquoi acheter à Nice avec LivingRoom ?",
    valueProps: [
      {
        icon: Zap,
        title: "Opportunités Rares",
        description: "Accédez à des biens exclusifs et des pépites du marché niçois, souvent introuvables par d'autres canaux.",
      },
      {
        icon: TrendingUp,
        title: "Maîtrise du Marché Local",
        description: "Nos experts connaissent les spécificités de chaque quartier de Nice pour un investissement éclairé.",
      },
      {
        icon: Handshake,
        title: "Accompagnement Personnalisé",
        description: "De la recherche à la concrétisation, nous vous guidons pas à pas pour un achat immobilier à Nice sans stress.",
      },
    ],
    featuresTitle: "Un parcours d'achat immobilier sans effort à Nice",
    featuresImageAlt: "Intérieur d'un appartement lumineux avec vue sur la mer à Nice",
    featuresList: [
      { text: "Un large choix de propriétés à <b>Nice</b> : appartements avec vue mer, villas, maisons de ville." },
      { text: "Une recherche sur-mesure pour trouver le bien qui correspond parfaitement à vos envies et votre budget." },
      { text: "Des alertes en avant-première pour les nouvelles annonces immobilières à Nice." },
      { text: "Des conseils d'experts sur la valeur des biens, les tendances et les quartiers prometteurs de Nice." },
      { text: "Un accompagnement pour toutes les formalités administratives et juridiques liées à l'achat." },
    ],
    howItWorksTitle: "Comment acheter votre bien à Nice avec LivingRoom ?",
    howItWorksSteps: [
      {
        stepNumber: 1,
        title: "Exprimez vos désirs",
        description: "Partagez vos critères d'achat à Nice pour que nous puissions affiner votre recherche.",
      },
      {
        stepNumber: 2,
        title: "Connectez-vous à nos agents niçois",
        description: "Nous vous mettons en contact avec des agents immobiliers locaux, experts de la région niçoise.",
      },
      {
        stepNumber: 3,
        title: "Réalisez votre projet",
        description: "Laissez-vous guider vers la propriété idéale et profitez de votre nouveau cadre de vie à Nice.",
      },
    ],
    testimonialsTitle: "Ce que disent nos clients qui ont acheté à Nice",
    testimonials: [
      {
        quote: "Grâce à LivingRoom, nous avons trouvé la villa de nos rêves dans les collines niçoises. Leur réactivité et leur professionnalisme sont exemplaires !",
        author: "Catherine et Jean-Luc P., acheteurs à Nice",
        imageAlt: "Photo de Catherine et Jean-Luc P.",
      },
      {
        quote: "L'expertise de l'agent sur le marché niçois a été un atout majeur. Nous avons acheté un appartement avec une vue imprenable sans aucune difficulté.",
        author: "Sophie R., acheteuse à Nice",
        imageAlt: "Photo de Sophie R.",
      },
    ],
    callToActionTitle: "Prêt à trouver votre futur bien à Nice ?",
    callToActionSubtitle: "Débutez votre recherche immobilière à Nice dès maintenant et laissez-vous guider par nos experts.",
  };

  return <AcheterImmobilierCityTemplate {...cityData} />;
};

export default AcheterImmobilierNicePage;