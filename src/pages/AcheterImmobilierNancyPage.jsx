import React from "react";
import AcheterImmobilierCityTemplate from "@/templates/AcheterImmobilierCityTemplate";
import { Zap, TrendingUp, HeartHandshake as Handshake } from 'lucide-react';

const AcheterImmobilierNancyPage = () => {
  const cityData = {
    city: "Nancy",
    description: "Découvrez comment acheter un bien immobilier à Nancy avec l'accompagnement de nos experts locaux. Profitez de l'élégance et de la richesse culturelle de la cité ducale pour votre prochain achat.",
    ogImage: "https://images.unsplash.com/photo-1549419131-7e8c3b171630", // Placeholder for Nancy
    heroTitle: "Acheter un Bien Immobilier à Nancy",
    heroSubtitle: "Trouvez votre appartement ou maison à Nancy, une ville historique et dynamique, avec l'aide de professionnels engagés.",
    heroImageAlt: "Place Stanislas à Nancy",
    valuePropositionTitle: "Pourquoi acheter à Nancy avec LivingRoom ?",
    valueProps: [
      {
        icon: Zap,
        title: "Opportunités Locales",
        description: "Accédez à des biens immobiliers exclusifs à Nancy, souvent introuvables par les circuits traditionnels.",
      },
      {
        icon: TrendingUp,
        title: "Analyse Approfondie",
        description: "Nos experts vous offrent une vision claire du marché nancéien pour un investissement judicieux et sûr.",
      },
      {
        icon: Handshake,
        title: "Accompagnement Serein",
        description: "Un soutien personnalisé, de la première visite à la signature, pour un achat immobilier à Nancy sans tracas.",
      },
    ],
    featuresTitle: "Votre parcours d'achat facilité à Nancy",
    featuresImageAlt: "Architecture Art Nouveau dans le quartier de la gare à Nancy",
    featuresList: [
      { text: "Un vaste choix de biens à <b>Nancy</b> : appartements haussmanniens, maisons de ville, propriétés Art Nouveau." },
      { text: "Une recherche sur-mesure, adaptée à vos préférences de quartier, de budget et de type de bien." },
      { text: "Des alertes exclusives pour les nouvelles propriétés correspondant à votre projet à <b>Nancy</b>." },
      { text: "Des conseils d'experts sur les prix au m², les spécificités des quartiers et les tendances du marché nancéien." },
      { text: "Un soutien complet pour les visites, négociations et démarches administratives jusqu'à l'acquisition." },
    ],
    howItWorksTitle: "Comment acheter votre bien à Nancy avec LivingRoom ?",
    howItWorksSteps: [
      {
        stepNumber: 1,
        title: "Exprimez vos envies",
        description: "Décrivez-nous en détail le bien idéal que vous recherchez pour votre achat à Nancy.",
      },
      {
        stepNumber: 2,
        title: "Connectez-vous à nos experts",
        description: "Nous vous mettons en relation avec des agents immobiliers nancéiens spécialisés dans votre type de recherche.",
      },
      {
        stepNumber: 3,
        title: "Réalisez votre projet",
        description: "Visitez, négociez et achetez votre bien à Nancy en toute tranquillité, avec un accompagnement dédié.",
      },
    ],
    testimonialsTitle: "Ce que disent nos clients qui ont acheté à Nancy",
    testimonials: [
      {
        quote: "J'ai trouvé ma maison de ville rêvée à Nancy grâce à LivingRoom. L'agent était d'une aide précieuse et connaissait parfaitement le marché local.",
        author: "Marion D., acheteuse à Nancy",
        imageAlt: "Photo de Marion D.",
      },
      {
        quote: "L'accompagnement et les conseils de LivingRoom ont été déterminants pour mon investissement locatif à Nancy. Un service de qualité !",
        author: "Romain G., investisseur à Nancy",
        imageAlt: "Photo de Romain G.",
      },
    ],
    callToActionTitle: "Prêt à trouver votre futur bien à Nancy ?",
    callToActionSubtitle: "Déposez votre projet d'achat dès aujourd'hui et laissez nos experts nancéiens vous accompagner.",
  };

  return <AcheterImmobilierCityTemplate {...cityData} />;
};

export default AcheterImmobilierNancyPage;