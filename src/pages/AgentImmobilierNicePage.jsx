import React from "react";
import AgentImmobilierCityTemplate from "@/templates/AgentImmobilierCityTemplate";

const AgentImmobilierNicePage = () => {
  const pageData = {
    city: "Nice",
    description:
      "Agents immobiliers à Nice, optimisez votre prospection, générez des leads qualifiés et collaborez efficacement avec LivingRoom sur la Côte d'Azur.",
    ogImage: "https://livingroom.immo/og-agent-immobilier-nice.jpg",
    heroTitle: (
      <>
        Agent Immobilier à Nice, <br className="hidden md:inline" />
        Développez votre Portefeuille sur la Côte d'Azur
      </>
    ),
    heroSubtitle:
      "Positionnez-vous comme l'expert incontournable de l'immobilier niçois et accédez à des opportunités exclusives avec LivingRoom.",
    heroImageAlt:
      "Nice real estate agent looking at properties with a view of the Promenade des Anglais.",
    heroImageSrc:
      "https://images.unsplash.com/photo-1596706935398-356c9d09c25f?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",

    valuePropositionTitle: "Répondre aux Spécificités du Marché Niçois",
    valueProps: [
      {
        icon: "Zap",
        title: "Leads Niçois Qualifiés",
        description:
          "Accédez à des demandes de particuliers et de professionnels avec des projets immobiliers ciblés sur la métropole niçoise.",
      },
      {
        icon: "TrendingUp",
        title: "Valorisez vos Mandats sur Nice",
        description:
          "Trouvez rapidement l'acquéreur idéal pour vos mandats de vente ou des biens d'exception à Nice et ses environs.",
      },
      {
        icon: "Handshake",
        title: "Élargissez votre Réseau Azuréen",
        description:
          "Connectez-vous avec les meilleurs professionnels de l'immobilier de la région niçoise et de la Côte d'Azur.",
      },
    ],

    featuresTitle: "Fonctionnalités Clés pour les Professionnels Niçois",
    featuresList: [
      {
        text: "<b>Matching Intelligent :</b> Notre algorithme cible les opportunités spécifiquement à Nice, de la Vieille Ville à Cimiez.",
      },
      {
        text: "<b>Place de Marché Pro :</b> Publiez et accédez aux projets des autres professionnels du Grand Nice.",
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
      "Real estate agent on a terrace overlooking the Bay of Angels in Nice, working on a tablet.",
    featuresImageSrc:
      "https://images.unsplash.com/photo-1549925232-a5e227a81b7e",

    howItWorksTitle: "Comment LivingRoom propulse votre activité à Nice",
    howItWorksSteps: [
      {
        stepNumber: "1",
        title: "Créez votre Profil Pro Niçois",
        description:
          "Mettez en avant votre expertise, vos biens et vos recherches sur votre profil LivingRoom optimisé pour Nice.",
      },
      {
        stepNumber: "2",
        title: "Connectez-vous aux Opportunités Ciblées",
        description:
          "Recevez des notifications pour les projets pertinents à Nice ou explorez activement notre place de marché.",
      },
      {
        stepNumber: "3",
        title: "Concluez plus de Transactions",
        description:
          "Transformez vos connexions en succès grâce à des outils de communication et de gestion intégrés, adaptés au marché niçois.",
      },
    ],

    testimonialsTitle: "Ce qu'ils disent de LivingRoom à Nice",
    testimonials: [
      {
        imageAlt:
          "Portrait of a successful Nice real estate agent, Sophie.",
        imageSrc:
          "https://images.unsplash.com/photo-1544377193-33e144a4b413",
        quote:
          "LivingRoom a révolutionné ma prospection à Nice. Les leads sont hyper-qualifiés et la plateforme est un vrai plus !",
        author: "- Sophie L., Agent Immobilier Nice Centre",
      },
      {
        imageAlt:
          "Portrait of a satisfied Nice real estate professional, Marc.",
        imageSrc:
          "https://images.unsplash.com/photo-1599305445672-6386ed97c688",
        quote:
          "Grâce à LivingRoom, j'ai pu développer des partenariats stratégiques avec d'autres agences de la Côte d'Azur. Un outil indispensable !",
        author: "- Marc P., Expert Immobilier Niçois",
      },
    ],

    // ✅ Paragraphe SEO local Nice
    otherCitiesTitle: "Un réseau immobilier présent sur tout le territoire",
    otherCitiesParagraph:
      "LivingRoom accompagne également les agents immobiliers dans les grandes villes françaises comme Paris, Lyon, Bordeaux, Lille, Nantes, Rennes, Nancy et Metz. Que vous exerciez sur la Côte d’Azur ou ailleurs en France, la plateforme vous permet d’accéder à des projets qualifiés, de développer votre visibilité locale et de créer des opportunités de collaboration durables.",

    callToActionTitle: "Prêt à Conquérir le Marché Niçois ?",
    callToActionSubtitle:
      "Rejoignez la communauté d'agents immobiliers niçois qui optimisent leurs performances avec LivingRoom.",
  };

  return <AgentImmobilierCityTemplate {...pageData} />;
};

export default AgentImmobilierNicePage;