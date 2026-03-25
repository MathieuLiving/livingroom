import React from "react";
import AcheterImmobilierCityTemplate from "@/templates/AcheterImmobilierCityTemplate";
import { Zap, TrendingUp, HeartHandshake as Handshake } from 'lucide-react';

const AcheterImmobilierLillePage = () => {
  const cityData = {
    city: "Lille",
    description: "Découvrez comment acheter un bien immobilier à Lille avec l'accompagnement de nos experts locaux. Profitez du dynamisme et du patrimoine lillois pour votre prochain achat.",
    ogImage: "https://images.unsplash.com/photo-1616788225575-d1f2a3f7f0e0", // Placeholder for Lille
    heroTitle: "Acheter un Bien Immobilier à Lille",
    heroSubtitle: "Trouvez votre appartement, maison ou loft à Lille, une ville pleine de charme et d'opportunités, avec l'aide de professionnels aguerris.",
    heroImageAlt: "Grand'Place de Lille avec l'Opéra",
    valuePropositionTitle: "Pourquoi acheter à Lille avec LivingRoom ?",
    valueProps: [
      {
        icon: Zap,
        title: "Offres Exclusives",
        description: "Accédez en priorité à des biens immobiliers à Lille qui ne sont pas encore sur le marché public.",
      },
      {
        icon: TrendingUp,
        title: "Vision Stratégique",
        description: "Bénéficiez de l'expertise de nos agents sur le marché lillois pour un achat optimisé et un investissement sûr.",
      },
      {
        icon: Handshake,
        title: "Accompagnement Sur Mesure",
        description: "Nos conseillers vous accompagnent de A à Z pour une acquisition immobilière fluide et sans tracas à Lille.",
      },
    ],
    featuresTitle: "Un processus d'achat simplifié et efficace à Lille",
    featuresImageAlt: "Rue pavée du Vieux-Lille avec des façades colorées",
    featuresList: [
      { text: "Découvrez un large éventail de biens à <b>Lille</b> : maisons de maître, appartements modernes, lofts." },
      { text: "Profitez d'une recherche personnalisée, adaptée à vos préférences de quartier, de budget et de style." },
      { text: "Recevez des alertes en temps réel pour les nouvelles propriétés correspondant à vos critères à <b>Lille</b>." },
      { text: "Bénéficiez de conseils avisés sur les prix au m², les spécificités des quartiers et les tendances du marché lillois." },
      { text: "Un soutien expert pour les visites, les négociations et la gestion des documents légaux jusqu'à la signature finale." },
    ],
    howItWorksTitle: "Comment acheter votre bien à Lille avec LivingRoom ?",
    howItWorksSteps: [
      {
        stepNumber: 1,
        title: "Exprimez votre projet",
        description: "Décrivez-nous le bien idéal que vous recherchez à Lille et vos critères essentiels.",
      },
      {
        stepNumber: 2,
        title: "Mise en relation privilégiée",
        description: "Nous vous connectons avec des agents immobiliers lillois qui sont les plus qualifiés pour votre recherche.",
      },
      {
        stepNumber: 3,
        title: "Achetez en toute confiance",
        description: "Profitez d'un accompagnement expert pour visiter, négocier et finaliser l'achat de votre bien à Lille.",
      },
    ],
    testimonialsTitle: "Ce que disent nos clients qui ont acheté à Lille",
    testimonials: [
      {
        quote: "LivingRoom a rendu mon achat à Lille incroyablement simple. L'agent a trouvé l'appartement parfait dans le Vieux-Lille en quelques semaines !",
        author: "Clara S., acheteuse à Lille",
        imageAlt: "Photo de Clara S.",
      },
      {
        quote: "Leur connaissance approfondie du marché lillois a été déterminante. J'ai pu faire un excellent investissement grâce à leurs conseils.",
        author: "Nicolas V., investisseur à Lille",
        imageAlt: "Photo de Nicolas V.",
      },
    ],
    callToActionTitle: "Prêt à trouver votre futur bien à Lille ?",
    callToActionSubtitle: "Lancez votre recherche immobilière à Lille dès aujourd'hui et laissez-vous guider par nos experts.",
  };

  return <AcheterImmobilierCityTemplate {...cityData} />;
};

export default AcheterImmobilierLillePage;