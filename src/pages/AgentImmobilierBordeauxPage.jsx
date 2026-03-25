import React from "react";
import AgentImmobilierCityTemplate from "@/templates/AgentImmobilierCityTemplate";

const AgentImmobilierBordeauxPage = () => {
  const pageData = {
    city: "Bordeaux",
    description:
      "Agents immobiliers à Bordeaux, optimisez votre prospection, générez des leads qualifiés et collaborez efficacement avec LivingRoom.",
    ogImage: "https://livingroom.immo/og-agent-immobilier-bordeaux.jpg",
    heroTitle: (
      <>
        Agent Immobilier à Bordeaux, <br className="hidden md:inline" />
        Développez votre Clientèle
      </>
    ),
    heroSubtitle:
      "Captez de nouveaux mandats et connectez-vous avec des acquéreurs potentiels sur le marché bordelais grâce à LivingRoom.",
    heroImageAlt:
      "Bordeaux real estate agent reviewing property documents with a client near the Garonne river.",
    heroImageSrc:
      "https://images.unsplash.com/photo-1596706935398-356c9d09c25f?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",

    valuePropositionTitle: "Répondez aux spécificités du marché bordelais",
    valueProps: [
      {
        icon: "Zap",
        title: "Leads Bordelais Ciblés",
        description:
          "Accédez à des contacts qualifiés, propriétaires vendeurs et acquéreurs, avec des projets clairs dans la région de Bordeaux.",
      },
      {
        icon: "TrendingUp",
        title: "Valorisez vos Biens Bordelais",
        description:
          "Mettez en lumière vos mandats exclusifs et trouvez rapidement les correspondances parfaites pour le marché de Bordeaux.",
      },
      {
        icon: "Handshake",
        title: "Synergies Locales",
        description:
          "Tissez des liens avec d'autres professionnels de l'immobilier bordelais pour des collaborations fructueuses.",
      },
    ],

    featuresTitle: "Outils Adaptés au Dynamisme de Bordeaux",
    featuresList: [
      {
        text: "<b>Matching Géolocalisé :</b> Notre système vous connecte aux opportunités dans les quartiers prisés de Bordeaux et la métropole.",
      },
      {
        text: "<b>Vitrine Professionnelle :</b> Présentez votre expertise et vos biens avec une carte de visite digitale optimisée pour le marché bordelais.",
      },
      {
        text: "<b>Gestion Simplifiée des Leads :</b> Centralisez et suivez tous vos prospects générés, de Caudéran à la Bastide.",
      },
      {
        text: "<b>Annonces Inter-Agences :</b> Partagez et accédez à des projets exclusifs avec vos confrères bordelais.",
      },
      {
        text: "<b>Messagerie Intégrée :</b> Échangez en toute sécurité avec vos clients et partenaires, directement sur la plateforme.",
      },
    ],

    featuresImageAlt:
      "Real estate agent using a tablet to showcase properties in Bordeaux, with city landmarks in the background.",
    featuresImageSrc:
      "https://images.unsplash.com/photo-1516089774577-44f24300e2b9?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",

    howItWorksTitle: "LivingRoom, votre partenaire succès à Bordeaux",
    howItWorksSteps: [
      {
        stepNumber: "1",
        title: "Créez votre Profil Expert Bordelais",
        description:
          "Affichez votre savoir-faire et vos références immobilières spécifiques à la Gironde sur LivingRoom.",
      },
      {
        stepNumber: "2",
        title: "Saisissez les Opportunités Locales",
        description:
          "Soyez informé des projets d'achat et de vente qui correspondent à votre zone d'expertise à Bordeaux.",
      },
      {
        stepNumber: "3",
        title: "Accélérez vos Transactions",
        description:
          "Utilisez nos outils pour gérer efficacement vos contacts et conclure plus de ventes dans l'agglomération bordelaise.",
      },
    ],

    testimonialsTitle: "Les professionnels bordelais témoignent",
    testimonials: [
      {
        imageAlt:
          "Portrait of a successful Bordeaux real estate agent, Pierre.",
        imageSrc:
          "https://images.unsplash.com/photo-1507003211169-e63ba1db6a4c?q=80&w=2787&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        quote:
          "LivingRoom a transformé ma prospection à Bordeaux. J'obtiens des leads d'une qualité inégalée, c'est un gain de temps énorme !",
        author: "- Pierre D., Agent Immobilier Bordeaux Centre",
      },
      {
        imageAlt:
          "Portrait of a satisfied Bordeaux real estate broker, Camille.",
        imageSrc:
          "https://images.unsplash.com/photo-1594744803329-e58f31dc2fd7?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        quote:
          "Grâce à la plateforme, j'ai pu collaborer sur des projets complexes avec d'autres agences bordelaises. Une vraie valeur ajoutée !",
        author: "- Camille G., Courtier Immobilier Bordeaux",
      },
    ],

    // ✅ Paragraphe SEO local Bordeaux
    otherCitiesTitle: "Un réseau immobilier actif dans toute la France",
    otherCitiesParagraph:
      "LivingRoom accompagne également les agents immobiliers dans les grandes métropoles françaises comme Paris, Lyon, Nice, Lille, Nantes, Rennes, Nancy et Metz. Où que vous exerciez, la plateforme vous permet d’accéder à des projets qualifiés, de développer des collaborations inter-professionnelles et de structurer durablement votre prospection.",

    callToActionTitle: "Le Marché de Bordeaux vous Attend",
    callToActionSubtitle:
      "Rejoignez la communauté LivingRoom et donnez un nouvel élan à votre carrière immobilière à Bordeaux.",
  };

  return <AgentImmobilierCityTemplate {...pageData} />;
};

export default AgentImmobilierBordeauxPage;