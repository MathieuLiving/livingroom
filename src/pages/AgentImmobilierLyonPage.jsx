import React from "react";
import AgentImmobilierCityTemplate from "@/templates/AgentImmobilierCityTemplate";

const AgentImmobilierLyonPage = () => {
  const pageData = {
    city: "Lyon",
    description:
      "Agents immobiliers à Lyon, optimisez votre prospection, générez des leads qualifiés et collaborez efficacement avec LivingRoom.",
    ogImage: "https://livingroom.immo/og-agent-immobilier-lyon.jpg",
    heroTitle: (
      <>
        Agent Immobilier à Lyon, <br className="hidden md:inline" />
        Booster votre Portefeuille Clients
      </>
    ),
    heroSubtitle:
      "Démarquez-vous sur le marché lyonnais, accédez à des opportunités exclusives et développez votre réseau avec LivingRoom.",
    heroImageAlt: "Lyon real estate agent pointing to a map of the city.",
    heroImageSrc:
      "https://images.unsplash.com/photo-1616781498144-8c819c961621?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",

    valuePropositionTitle: "Vos défis à Lyon, nos solutions sur mesure",
    valueProps: [
      {
        icon: "Zap",
        title: "Leads Lyonnais Qualifiés",
        description:
          "Recevez des demandes de particuliers et professionnels avec des projets immobiliers ciblés sur la métropole lyonnaise.",
      },
      {
        icon: "TrendingUp",
        title: "Optimisez vos Mandats sur Lyon",
        description:
          "Trouvez rapidement l'acquéreur idéal pour vos mandats de vente ou des biens d'exception à Lyon et ses environs.",
      },
      {
        icon: "Handshake",
        title: "Élargissez votre Réseau Lyonnais",
        description:
          "Connectez-vous avec les meilleurs professionnels de l'immobilier de la région lyonnaise.",
      },
    ],

    featuresTitle: "Fonctionnalités Clés pour les Professionnels Lyonnais",
    featuresList: [
      {
        text: "<b>Matching Intelligent :</b> Notre algorithme cible les opportunités spécifiquement à Lyon et sa périphérie.",
      },
      {
        text: "<b>Place de Marché Pro :</b> Publiez et accédez aux projets des autres professionnels du Grand Lyon.",
      },
      {
        text: "<b>Gestion des Leads Directs :</b> Centralisez et suivez tous vos leads générés via votre carte de visite digitale LivingRoom.",
      },
      {
        text: "<b>Carte de Visite Digitale Avancée :</b> Partagez votre profil, vos services, et capturez des leads directement.",
      },
      {
        text: "<b>Messagerie Sécurisée :</b> Échangez en toute confiance avec vos contacts et clients potentiels.",
      },
    ],

    featuresImageAlt:
      "Real estate agent working on a laptop with Lyon's cityscape in the background.",
    featuresImageSrc:
      "https://images.unsplash.com/photo-1549925232-a5e227a81b7e",

    howItWorksTitle: "Comment LivingRoom propulse votre activité à Lyon",
    howItWorksSteps: [
      {
        stepNumber: "1",
        title: "Créez votre Profil Pro Lyonnais",
        description:
          "Mettez en avant votre expertise, vos biens et vos recherches sur votre profil LivingRoom optimisé pour Lyon.",
      },
      {
        stepNumber: "2",
        title: "Connectez-vous aux Opportunités Ciblées",
        description:
          "Recevez des notifications pour les projets pertinents à Lyon ou explorez activement notre place de marché.",
      },
      {
        stepNumber: "3",
        title: "Concluez plus de Transactions",
        description:
          "Transformez vos connexions en succès grâce à des outils de communication et de gestion intégrés, adaptés au marché lyonnais.",
      },
    ],

    testimonialsTitle: "Ce qu'ils disent de LivingRoom à Lyon",
    testimonials: [
      {
        imageAlt:
          "Portrait of a happy Lyonnaise real estate agent, Clémentine.",
        imageSrc:
          "https://images.unsplash.com/photo-1544377193-33e144a4b413",
        quote:
          "LivingRoom a été un atout majeur pour ma prospection à Lyon. Les leads sont pertinents et la visibilité est excellente.",
        author: "- Clémentine D., Agent Immobilier Lyon 6e",
      },
      {
        imageAlt:
          "Portrait of a satisfied Lyonnais real estate professional, Julien.",
        imageSrc:
          "https://images.unsplash.com/photo-1599305445672-6386ed97c688",
        quote:
          "La plateforme LivingRoom m'a permis de développer des partenariats stratégiques avec d'autres professionnels à Lyon. Très efficace !",
        author: "- Julien S., Expert Immobilier Lyonnais",
      },
    ],

    // ✅ Paragraphe SEO personnalisé Lyon
    otherCitiesTitle: "Un rayonnement au-delà de la métropole lyonnaise",
    otherCitiesParagraph:
      "Vous exercez également sur d’autres marchés dynamiques ? LivingRoom accompagne aussi les agents immobiliers à Paris, Bordeaux, Nice, Lille, Nantes, Rennes, Nancy et Metz. Une approche identique : des projets qualifiés, une mise en relation ciblée et un réseau professionnel solide, partout en France.",

    callToActionTitle: "Prêt à Conquérir le Marché Lyonnais ?",
    callToActionSubtitle:
      "Rejoignez la communauté d'agents immobiliers lyonnais qui optimisent leurs performances avec LivingRoom.",
  };

  return <AgentImmobilierCityTemplate {...pageData} />;
};

export default AgentImmobilierLyonPage;