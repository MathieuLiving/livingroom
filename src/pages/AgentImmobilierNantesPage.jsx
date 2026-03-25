import React from "react";
import AgentImmobilierCityTemplate from "@/templates/AgentImmobilierCityTemplate";

const AgentImmobilierNantesPage = () => {
  const pageData = {
    city: "Nantes",
    description:
      "Agents immobiliers à Nantes, optimisez votre prospection, générez des leads qualifiés et développez votre réseau avec LivingRoom dans la vibrante ville de Nantes.",
    ogImage: "https://livingroom.immo/og-agent-immobilier-nantes.jpg",
    heroTitle: (
      <>
        Agent Immobilier à Nantes, <br className="hidden md:inline" />
        Développez Votre Potentiel au Cœur des Pays de la Loire
      </>
    ),
    heroSubtitle:
      "Capitalisez sur le dynamisme immobilier nantais et accédez à des opportunités exclusives avec LivingRoom.",
    heroImageAlt:
      "Agent immobilier souriant dans les rues de Nantes avec les Machines de l'île en arrière-plan.",
    heroImageSrc:
      "https://images.unsplash.com/photo-1628178129759-e265b6a715f3?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",

    valuePropositionTitle: "Saisissez les Opportunités du Marché Nantais",
    valueProps: [
      {
        icon: "Zap",
        title: "Leads Nantais Qualifiés",
        description:
          "Accédez à des demandes immobilières ciblées de particuliers et professionnels ayant des projets concrets à Nantes et sa métropole.",
      },
      {
        icon: "TrendingUp",
        title: "Accélérez vos Ventes à Nantes",
        description:
          "Trouvez rapidement l'acquéreur idéal ou le bien recherché pour vos mandats, en phase avec les spécificités du marché nantais.",
      },
      {
        icon: "Handshake",
        title: "Construisez votre Réseau Local",
        description:
          "Connectez-vous avec les acteurs clés de l'immobilier nantais et des Pays de la Loire pour des collaborations mutuellement bénéfiques.",
      },
    ],

    featuresTitle: "Fonctionnalités Dediées aux Agents Immobiliers Nantais",
    featuresList: [
      {
        text: "<b>Matching Précis:</b> Notre algorithme vous connecte aux projets pertinents dans les quartiers nantais, de Bouffay à l'île de Nantes.",
      },
      {
        text: "<b>Place de Marché Pro Locale:</b> Découvrez et proposez des projets exclusifs avec d'autres professionnels de la région nantaise.",
      },
      {
        text: "<b>Carte de Visite Digitale Optimisée:</b> Présentez votre expertise, vos biens et vos services pour attirer des prospects directement depuis votre profil LivingRoom.",
      },
      {
        text: "<b>Gestion de Leads Intuitive:</b> Centralisez et suivez toutes vos opportunités, de la prise de contact à la signature, avec des outils adaptés.",
      },
      {
        text: "<b>Messagerie Sécurisée:</b> Communiquez efficacement et en toute confiance avec vos contacts et clients potentiels nantais.",
      },
    ],

    featuresImageAlt:
      "Agent immobilier utilisant une tablette devant la cathédrale de Nantes.",
    featuresImageSrc:
      "https://images.unsplash.com/photo-1628185542289-53b018597fbf?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",

    howItWorksTitle:
      "LivingRoom : Levier de Croissance pour votre Agence à Nantes",
    howItWorksSteps: [
      {
        stepNumber: "1",
        title: "Créez votre Profil Expert Nantais",
        description:
          "Mettez en lumière votre spécialisation sur le marché immobilier de Nantes et de sa région.",
      },
      {
        stepNumber: "2",
        title: "Recevez des Opportunités Ciblées",
        description:
          "Soyez alerté des projets d'achat ou de vente qui correspondent précisément à vos critères et zones de prédilection à Nantes.",
      },
      {
        stepNumber: "3",
        title: "Développez votre Portefeuille",
        description:
          "Transformez ces connexions qualifiées en succès grâce à une plateforme conçue pour faciliter vos transactions immobilières à Nantes.",
      },
    ],

    testimonialsTitle: "Les Professionnels Nantais Parlent de LivingRoom",
    testimonials: [
      {
        imageAlt: "Portrait d'une agente immobilière nantaise réussie, Marine.",
        imageSrc:
          "https://images.unsplash.com/photo-1596489370014-99edc7198a28?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        quote:
          "LivingRoom a considérablement dynamisé ma prospection à Nantes. Je reçois des leads d'une qualité inégalée, c'est un véritable atout !",
        author: "- Marine D., Agence Immobilier Loire, Nantes",
      },
      {
        imageAlt: "Portrait d'un professionnel immobilier nantais satisfait, Julien.",
        imageSrc:
          "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        quote:
          "La collaboration inter-professionnels est d'une facilité déconcertante sur LivingRoom. J'ai pu conclure plusieurs affaires grâce à mon réseau nantais.",
        author: "- Julien S., Expert Immobilier Centre-Ville Nantes",
      },
    ],

    // ✅ Paragraphe SEO local Nantes (unique)
    otherCitiesTitle: "Une expertise locale à Nantes, un réseau national LivingRoom",
    otherCitiesParagraph:
      "À Nantes, les projets se jouent souvent au bon timing : centre-ville, Graslin, Canclaux, Saint-Félix, Procé, Doulon, ou encore l’Île de Nantes et Rezé côté métropole. LivingRoom vous aide à capter des leads vraiment qualifiés, à renforcer votre visibilité locale et à accélérer vos mises en relation (sans prospection à froid). Et parce que beaucoup de clients bougent entre métropoles, la plateforme est aussi active dans des villes comme Paris, Lyon, Bordeaux, Nice, Lille, Rennes, Nancy et Metz pour élargir votre réseau et multiplier les opportunités.",

    callToActionTitle: "Prêt à Booster votre Réussite à Nantes ?",
    callToActionSubtitle:
      "Rejoignez la communauté LivingRoom et transformez votre manière de travailler l'immobilier dans la métropole nantaise.",
  };

  return <AgentImmobilierCityTemplate {...pageData} />;
};

export default AgentImmobilierNantesPage;