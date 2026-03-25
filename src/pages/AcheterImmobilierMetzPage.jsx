import React from "react";
import AcheterImmobilierCityTemplate from "@/templates/AcheterImmobilierCityTemplate";
import { Zap, TrendingUp, HeartHandshake as Handshake } from 'lucide-react';

const AcheterImmobilierMetzPage = () => {
  const cityData = {
    city: "Metz",
    description: "Découvrez comment acheter un bien immobilier à Metz avec l'accompagnement de nos experts locaux. Profitez du dynamisme et du patrimoine messin pour votre prochain achat.",
    ogImage: "https://images.unsplash.com/photo-1549419131-7e8c3b171630", // Placeholder for Metz
    heroTitle: "Acheter un Bien Immobilier à Metz",
    heroSubtitle: "Trouvez votre appartement ou maison à Metz, une ville historique et culturelle en plein renouveau, avec l'aide de professionnels qualifiés.",
    heroImageAlt: "Cathédrale Saint-Étienne de Metz et le centre-ville",
    valuePropositionTitle: "Pourquoi acheter à Metz avec LivingRoom ?",
    valueProps: [
      {
        icon: Zap,
        title: "Accès Exclusif",
        description: "Découvrez des biens immobiliers à Metz en avant-première, incluant des opportunités rares et des nouveautés.",
      },
      {
        icon: TrendingUp,
        title: "Connaissance du Marché",
        description: "Bénéficiez de l'expertise de nos agents sur le marché messin pour un achat éclairé et un investissement performant.",
      },
      {
        icon: Handshake,
        title: "Accompagnement Personnalisé",
        description: "Un soutien continu, de la recherche à la signature, pour un achat immobilier à Metz serein et réussi.",
      },
    ],
    featuresTitle: "Un parcours d'achat simplifié et efficace à Metz",
    featuresImageAlt: "Vue des berges de la Moselle à Metz",
    featuresList: [
      { text: "Un vaste choix de biens à <b>Metz</b> : appartements en centre-ville, maisons avec jardin, propriétés rénovées." },
      { text: "Une recherche personnalisée selon vos critères précis (quartier, budget, type de bien, etc.)." },
      { text: "Des alertes en temps réel pour les nouvelles annonces immobilières sur le marché messin." },
      { text: "Des conseils d'experts sur les prix au m², les spécificités des quartiers et les tendances du marché de Metz." },
      { text: "Un soutien complet pour les visites, les négociations et la gestion des documents légaux jusqu'à la signature finale." },
    ],
    howItWorksTitle: "Comment acheter votre bien à Metz avec LivingRoom ?",
    howItWorksSteps: [
      {
        stepNumber: 1,
        title: "Exprimez vos besoins",
        description: "Précisez vos attentes pour votre achat immobilier à Metz afin que nous ciblions les meilleures offres.",
      },
      {
        stepNumber: 2,
        title: "Rencontrez nos experts locaux",
        description: "Nous vous mettons en relation avec des agents immobiliers messins spécialisés qui connaissent parfaitement la ville.",
      },
      {
        stepNumber: 3,
        title: "Concrétisez votre achat",
        description: "Recevez des propositions ciblées et laissez-vous guider jusqu'à la finalisation de votre projet à Metz.",
      },
    ],
    testimonialsTitle: "Ce que disent nos clients qui ont acheté à Metz",
    testimonials: [
      {
        quote: "Grâce à LivingRoom, nous avons trouvé l'appartement parfait près du centre-ville de Metz. L'agent était très professionnel et à l'écoute.",
        author: "Laura et Pierre B., acheteurs à Metz",
        imageAlt: "Photo de Laura et Pierre B.",
      },
      {
        quote: "L'équipe LivingRoom a une connaissance incroyable du marché messin. Mon investissement locatif s'est déroulé sans accroc.",
        author: "Sébastien C., investisseur à Metz",
        imageAlt: "Photo de Sébastien C.",
      },
    ],
    callToActionTitle: "Prêt à trouver votre futur bien à Metz ?",
    callToActionSubtitle: "Déposez votre projet d'achat dès aujourd'hui et laissez nos experts messins vous accompagner.",
  };

  return <AcheterImmobilierCityTemplate {...cityData} />;
};

export default AcheterImmobilierMetzPage;