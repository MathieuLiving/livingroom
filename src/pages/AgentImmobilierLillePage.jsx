import React from "react";
import AgentImmobilierCityTemplate from "@/templates/AgentImmobilierCityTemplate";

const AgentImmobilierLillePage = () => {
  const pageData = {
    city: "Lille",
    description:
      "Agents immobiliers à Lille, optimisez votre prospection, générez des leads qualifiés et collaborez efficacement avec LivingRoom dans la métropole lilloise.",
    ogImage: "https://livingroom.immo/og-agent-immobilier-lille.jpg",
    heroTitle: (
      <>
        Agent Immobilier à Lille, <br className="hidden md:inline" />
        Développez votre Portefeuille dans le Nord
      </>
    ),
    heroSubtitle:
      "Devenez un acteur clé du marché immobilier lillois et accédez à des opportunités uniques grâce à LivingRoom.",
    heroImageAlt:
      "Lille real estate agent discussing property details with clients near the Grand Place.",
    heroImageSrc:
      "https://images.unsplash.com/photo-1627944122176-795a94025d57?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",

    valuePropositionTitle: "Répondez aux Spécificités du Marché Lillois",
    valueProps: [
      {
        icon: "Zap",
        title: "Leads Lillois Ciblés",
        description:
          "Recevez des contacts qualifiés de propriétaires vendeurs et d'acquéreurs avec des projets clairs dans la métropole lilloise.",
      },
      {
        icon: "TrendingUp",
        title: "Valorisez vos Biens Lillois",
        description:
          "Mettez en avant vos mandats exclusifs et trouvez rapidement les correspondances parfaites pour le marché de Lille et ses environs.",
      },
      {
        icon: "Handshake",
        title: "Synergies Régionales",
        description:
          "Développez des collaborations fructueuses avec d'autres professionnels de l'immobilier du Nord, directement sur la plateforme.",
      },
    ],

    featuresTitle: "Outils Optimisés pour le Dynamisme Lillois",
    featuresList: [
      {
        text: "<b>Matching Géolocalisé:</b> Connectez-vous aux opportunités dans les quartiers prisés de Lille, de Wazemmes au Vieux-Lille.",
      },
      {
        text: "<b>Vitrine Professionnelle:</b> Présentez votre expertise et vos annonces avec une carte de visite digitale pensée pour le marché local.",
      },
      {
        text: "<b>Gestion Simplifiée des Leads:</b> Centralisez et suivez l'ensemble de vos prospects générés sur la plateforme LivingRoom.",
      },
      {
        text: "<b>Annonces Inter-Agences:</b> Partagez et accédez à des projets exclusifs avec vos confrères lillois et régionaux.",
      },
      {
        text: "<b>Messagerie Intégrée:</b> Échangez de manière fluide et sécurisée avec vos clients et partenaires.",
      },
    ],

    featuresImageAlt:
      "Real estate agent using a laptop to manage properties with Lille's modern architecture in the background.",
    featuresImageSrc:
      "https://images.unsplash.com/photo-1601664426543-02f5a5c6e863?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",

    howItWorksTitle: "LivingRoom, votre partenaire succès à Lille",
    howItWorksSteps: [
      {
        stepNumber: "1",
        title: "Créez votre Profil Expert Lillois",
        description:
          "Mettez en avant votre savoir-faire et vos références immobilières spécifiques au Nord sur LivingRoom.",
      },
      {
        stepNumber: "2",
        title: "Saisissez les Opportunités Locales",
        description:
          "Soyez informé des projets d'achat et de vente qui correspondent précisément à votre zone d'expertise à Lille.",
      },
      {
        stepNumber: "3",
        title: "Accélez vos Transactions",
        description:
          "Utilisez nos outils pour gérer efficacement vos contacts et conclure plus de ventes dans la métropole lilloise.",
      },
    ],

    testimonialsTitle: "Les professionnels lillois témoignent",
    testimonials: [
      {
        imageAlt: "Portrait of a successful Lille real estate agent, Antoine.",
        imageSrc:
          "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        quote:
          "LivingRoom a considérablement amélioré ma prospection à Lille. Les leads sont de grande qualité, un gain de temps précieux !",
        author: "- Antoine V., Agent Immobilier Vieux-Lille",
      },
      {
        imageAlt: "Portrait of a satisfied Lille real estate professional, Clara.",
        imageSrc:
          "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=2722&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        quote:
          "La plateforme me permet de collaborer facilement avec d'autres agences de la région. C'est un atout majeur pour mon développement !",
        author: "- Clara M., Mandataire Immobilier Lille",
      },
    ],

    // ✅ Paragraphe SEO local Lille (unique)
    otherCitiesTitle: "Un accompagnement local, un réseau national",
    otherCitiesParagraph:
      "À Lille, le marché bouge vite entre le Vieux-Lille, Vauban, Wazemmes, Marcq-en-Barœul ou Villeneuve-d’Ascq : il faut capter les bons projets au bon moment. LivingRoom vous aide à générer des leads qualifiés, à renforcer votre visibilité locale et à collaborer avec d’autres pros. La plateforme est aussi active dans les grandes villes françaises comme Paris, Lyon, Bordeaux, Nice, Nantes, Rennes, Nancy et Metz pour créer un réseau national au service de vos mandats.",

    callToActionTitle: "Le Marché de Lille vous Attend",
    callToActionSubtitle:
      "Rejoignez la communauté LivingRoom et donnez un nouvel élan à votre carrière immobilière à Lille.",
  };

  return <AgentImmobilierCityTemplate {...pageData} />;
};

export default AgentImmobilierLillePage;