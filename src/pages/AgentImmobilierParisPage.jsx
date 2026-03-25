import React from "react";
import AgentImmobilierCityTemplate from "@/templates/AgentImmobilierCityTemplate";

const AgentImmobilierParisPage = () => {
  const pageData = {
    city: "Paris",
    description:
      "Agents immobiliers à Paris, optimisez votre prospection, générez des leads qualifiés et collaborez efficacement avec LivingRoom.",
    ogImage: "https://livingroom.immo/og-agent-immobilier-paris.jpg",
    heroTitle: (
      <>
        Agent Immobilier à Paris, <br className="hidden md:inline" />
        Booster votre Portefeuille Clients
      </>
    ),
    heroSubtitle:
      "Démarquez-vous sur le marché parisien, accédez à des opportunités exclusives et développez votre réseau avec LivingRoom.",
    heroImageAlt:
      "Parisian real estate agent discussing property details near the Eiffel Tower.",
    heroImageSrc: "https://images.unsplash.com/photo-1569963329981-5f87ed77cc32",

    valuePropositionTitle: "Vos défis à Paris, nos solutions sur mesure",
    valueProps: [
      {
        icon: "Zap",
        title: "Leads Parisiens Qualifiés",
        description:
          "Recevez des demandes de particuliers et professionnels avec des projets immobiliers ciblés sur la capitale.",
      },
      {
        icon: "TrendingUp",
        title: "Optimisez vos Mandats Prestigieux",
        description:
          "Trouvez rapidement l'acquéreur idéal pour vos mandats de vente ou des biens d'exception à Paris.",
      },
      {
        icon: "Handshake",
        title: "Élargissez votre Réseau Parisien",
        description:
          "Connectez-vous avec les meilleurs professionnels de l'immobilier de la région parisienne.",
      },
    ],

    featuresTitle: "Fonctionnalités Clés pour les Professionnels Parisiens",
    featuresList: [
      {
        text: "<b>Matching Intelligent:</b> Notre algorithme cible les opportunités spécifiquement à Paris et petite couronne.",
      },
      {
        text: "<b>Place de Marché Pro:</b> Publiez et accédez aux projets des autres professionnels du Grand Paris.",
      },
      {
        text: "<b>Gestion des Leads Directs:</b> Centralisez et suivez tous vos leads générés via votre carte de visite digitale LivingRoom.",
      },
      {
        text: "<b>Carte de Visite Digitale Avancée:</b> Partagez votre profil, vos services, et capturez des leads directement.",
      },
      {
        text: "<b>Messagerie Sécurisée:</b> Échangez en toute confiance avec vos contacts et clients potentiels.",
      },
    ],
    featuresImageAlt:
      "Real estate agent on a tablet, with a Parisian skyline in the background, showcasing efficient property management.",
    featuresImageSrc: "https://images.unsplash.com/photo-1544377193-33e144a4b413",

    howItWorksTitle: "Comment LivingRoom propulse votre activité à Paris",
    howItWorksSteps: [
      {
        stepNumber: "1",
        title: "Créez votre Profil Pro Parisien",
        description:
          "Mettez en avant votre expertise, vos biens et vos recherches sur votre profil LivingRoom optimisé pour Paris.",
      },
      {
        stepNumber: "2",
        title: "Connectez-vous aux Opportunités Ciblées",
        description:
          "Recevez des notifications pour les projets pertinents à Paris ou explorez activement notre place de marché.",
      },
      {
        stepNumber: "3",
        title: "Concluez plus de Transactions",
        description:
          "Transformez vos connexions en succès grâce à des outils de communication et de gestion intégrés, adaptés au marché parisien.",
      },
    ],

    testimonialsTitle: "Ce qu'ils disent de LivingRoom à Paris",
    testimonials: [
      {
        imageAlt: "Portrait of a happy Parisian real estate agent, Sophie.",
        imageSrc: "https://images.unsplash.com/photo-1549068106-b024baf50106",
        quote:
          "LivingRoom m'a permis de me positionner comme experte sur mon arrondissement. Les leads sont hyper qualifiés et la plateforme est intuitive.",
        author: "- Sophie L., Agent Immobilier Paris 16e",
      },
      {
        imageAlt:
          "Portrait of a satisfied Parisian real estate professional, Antoine.",
        imageSrc: "https://images.unsplash.com/photo-1599305445672-6386ed97c688",
        quote:
          "Grâce à LivingRoom, j'ai déniché des opportunités d'investissement que je n'aurais jamais trouvées ailleurs à Paris. Un outil indispensable !",
        author: "- Antoine M., Investisseur Immobilier Parisien",
      },
    ],

    // ✅ Ajout du paragraphe SEO “autres villes”
    otherCitiesTitle: "Vous travaillez aussi en dehors de Paris ?",
    otherCitiesParagraph:
      "LivingRoom accompagne aussi les professionnels à Lyon, Bordeaux, Nice, Lille, Nantes, Rennes, Nancy et Metz. Le principe reste le même : des projets qualifiés, un matching par secteur, et une mise en relation maîtrisée.",

    callToActionTitle: "Prêt à Conquérir le Marché Parisien ?",
    callToActionSubtitle:
      "Rejoignez la communauté d'agents immobiliers parisiens qui optimisent leurs performances avec LivingRoom.",
  };

  return <AgentImmobilierCityTemplate {...pageData} />;
};

export default AgentImmobilierParisPage;