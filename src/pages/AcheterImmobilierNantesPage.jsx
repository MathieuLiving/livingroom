import React from "react";
import AcheterImmobilierCityTemplate from "@/templates/AcheterImmobilierCityTemplate";
import { Zap, TrendingUp, HeartHandshake as Handshake } from 'lucide-react';

const AcheterImmobilierNantesPage = () => {
  const cityData = {
    city: "Nantes",
    description: "Découvrez comment acheter un bien immobilier à Nantes avec l'accompagnement de nos experts locaux. Profitez de la qualité de vie et du dynamisme de la cité des Ducs pour votre prochain achat.",
    ogImage: "https://images.unsplash.com/photo-1549419131-7e8c3b171630", // Placeholder for Nantes
    heroTitle: "Acheter un Bien Immobilier à Nantes",
    heroSubtitle: "Trouvez votre appartement ou maison à Nantes, une ville en pleine croissance et offrant un cadre de vie prisé, avec l'aide de professionnels dédiés.",
    heroImageAlt: "Vue du Château des Ducs de Bretagne à Nantes",
    valuePropositionTitle: "Pourquoi acheter à Nantes avec LivingRoom ?",
    valueProps: [
      {
        icon: Zap,
        title: "Accès Privilégié",
        description: "Découvrez des biens immobiliers exclusifs à Nantes avant même leur diffusion sur le marché traditionnel.",
      },
      {
        icon: TrendingUp,
        title: "Analyse Fine du Marché",
        description: "Nos experts vous fournissent une analyse détaillée du marché nantais pour des décisions d'achat éclairées.",
      },
      {
        icon: Handshake,
        title: "Accompagnement Complet",
        description: "Un parcours d'achat serein et efficace à Nantes, de la recherche à la signature finale, grâce à notre soutien expert.",
      },
    ],
    featuresTitle: "Votre recherche immobilière simplifiée à Nantes",
    featuresImageAlt: "Bâtiments modernes et verdure le long de l'Erdre à Nantes",
    featuresList: [
      { text: "Un choix varié de biens à <b>Nantes</b> : appartements neufs, maisons de caractère, lofts et studios." },
      { text: "Une recherche personnalisée et ciblée en fonction de vos critères (quartier, budget, type de bien, etc.)." },
      { text: "Recevez des alertes exclusives pour les nouvelles annonces immobilières sur le marché nantais." },
      { text: "Bénéficiez de conseils d'experts sur les spécificités des quartiers nantais, les prix au m² et les opportunités d'investissement." },
      { text: "Un accompagnement pour toutes les étapes : visites, négociations, démarches administratives et juridiques." },
    ],
    howItWorksTitle: "Comment acheter votre bien à Nantes avec LivingRoom ?",
    howItWorksSteps: [
      {
        stepNumber: 1,
        title: "Définissez votre projet",
        description: "Indiquez-nous précisément ce que vous recherchez pour votre achat à Nantes.",
      },
      {
        stepNumber: 2,
        title: "Connectez-vous à nos agents",
        description: "Nous vous mettons en relation avec des professionnels de l'immobilier nantais, experts de la région.",
      },
      {
        stepNumber: 3,
        title: "Réussissez votre achat",
        description: "Visitez, négociez et achetez votre bien à Nantes en toute tranquillité, avec l'aide de nos experts.",
      },
    ],
    testimonialsTitle: "Ce que disent nos clients qui ont acheté à Nantes",
    testimonials: [
      {
        quote: "Nous avons trouvé notre maison familiale à Nantes en un temps record grâce à LivingRoom. L'agent était très à l'écoute de nos besoins.",
        author: "Julie et David G., acheteurs à Nantes",
        imageAlt: "Photo de Julie et David G.",
      },
      {
        quote: "L'expertise de l'équipe sur le marché nantais est formidable. J'ai pu acheter un appartement pour mon investissement locatif sans aucune difficulté.",
        author: "Marc T., investisseur à Nantes",
        imageAlt: "Photo de Marc T.",
      },
    ],
    callToActionTitle: "Prêt à trouver votre futur bien à Nantes ?",
    callToActionSubtitle: "Lancez votre recherche immobilière à Nantes dès aujourd'hui et concrétisez votre projet.",
  };

  return <AcheterImmobilierCityTemplate {...cityData} />;
};

export default AcheterImmobilierNantesPage;