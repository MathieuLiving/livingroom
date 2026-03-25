import React from "react";
import AgentImmobilierCityTemplate from "@/templates/AgentImmobilierCityTemplate";

const AgentImmobilierNancyPage = () => {
  const pageData = {
    city: "Nancy",
    description:
      "Agents immobiliers à Nancy, amplifiez votre visibilité, générez des leads locaux et dynamisez vos transactions avec LivingRoom au cœur de la Lorraine.",
    ogImage: "https://livingroom.immo/og-agent-immobilier-nancy.jpg",
    heroTitle: (
      <>
        Agent Immobilier à Nancy, <br className="hidden md:inline" />
        Rayonnez sur le Marché de la Cité Ducale
      </>
    ),
    heroSubtitle:
      "Optimisez votre prospection et développez votre réseau dans la dynamique ville de Nancy avec LivingRoom.",
    heroImageAlt: "Agent immobilier souriant devant la Place Stanislas à Nancy.",
    heroImageSrc:
      "https://images.unsplash.com/photo-1579737107873-1f8e1c6e1e7f?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",

    valuePropositionTitle: "Développez Votre Expertise Immobilière à Nancy",
    valueProps: [
      {
        icon: "Zap",
        title: "Leads Nancéiens Ciblés",
        description:
          "Accédez à des projets immobiliers vérifiés de particuliers et professionnels dans l'agglomération nancéienne.",
      },
      {
        icon: "TrendingUp",
        title: "Accélérez vos Ventes en Lorraine",
        description:
          "Identifiez rapidement l'acquéreur ou le bien idéal pour vos mandats, en phase avec les tendances du marché nancéien.",
      },
      {
        icon: "Handshake",
        title: "Renforcez Votre Réseau Local",
        description:
          "Connectez-vous avec les acteurs clés de l'immobilier de Nancy et de la région Lorraine pour des partenariats stratégiques.",
      },
    ],

    featuresTitle: "Des Fonctionnalités Conçues pour le Marché Nancéien",
    featuresList: [
      {
        text: "<b>Matching Intelligent:</b> Notre plateforme vous met en relation avec des projets pertinents dans les quartiers de Nancy, de la Ville Vieille à Haussonville.",
      },
      {
        text: "<b>Visibilité Optimale:</b> Créez un profil professionnel percutant pour attirer les prospects qualifiés directement depuis LivingRoom.",
      },
      {
        text: "<b>Tableau de Bord Intuitif:</b> Gérez vos leads, vos contacts et vos projets en cours avec une efficacité inégalée.",
      },
      {
        text: "<b>Marketplace Inter-Pro Locale:</b> Partagez et découvrez des opportunités exclusives avec d'autres professionnels de la Meurthe-et-Moselle.",
      },
      {
        text: "<b>Communication Facilite:</b> Échangez avec vos contacts via une messagerie sécurisée, centralisant toutes vos interactions.",
      },
    ],

    featuresImageAlt:
      "Agent immobilier consultant une carte de Nancy sur une tablette.",
    featuresImageSrc:
      "https://images.unsplash.com/photo-1596489370014-99edc7198a28?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",

    howItWorksTitle: "LivingRoom : Votre Partenaire de Succès à Nancy",
    howItWorksSteps: [
      {
        stepNumber: "1",
        title: "Créez votre Vitrine Nancéienne",
        description:
          "Présentez votre expertise et vos biens immobiliers à Nancy, attirant ainsi une clientèle ciblée.",
      },
      {
        stepNumber: "2",
        title: "Recevez des Opportunités Qualifiées",
        description:
          "Soyez alerté des projets d'achat ou de vente correspondant à vos critères et à votre zone d'intervention à Nancy.",
      },
      {
        stepNumber: "3",
        title: "Concrétisez vos Transactions",
        description:
          "Transformez ces mises en relation en succès commerciaux grâce à des outils performants et un réseau étendu.",
      },
    ],

    testimonialsTitle: "Ce que les Professionnels Nancéiens disent de LivingRoom",
    testimonials: [
      {
        imageAlt: "Portrait d'un agent immobilier nancéien satisfait, Marc.",
        imageSrc:
          "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        quote:
          "LivingRoom a révolutionné ma façon de travailler à Nancy. Je gagne un temps précieux et la qualité des leads est exceptionnelle.",
        author: "- Marc D., Agence Immobilière Stanislas, Nancy",
      },
      {
        imageAlt: "Portrait d'une courtière immobilière nancéienne, Julie.",
        imageSrc:
          "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=2722&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        quote:
          "Grâce à LivingRoom, j'ai pu étendre mon réseau professionnel à Nancy et collaborer sur des projets complexes avec une grande facilité. C'est un outil indispensable.",
        author: "- Julie R., Courtière Immobilière, Nancy",
      },
    ],

    // ✅ Paragraphe SEO local Nancy (universités, cadres, primo-accédants)
    otherCitiesTitle:
      "Nancy, un marché porté par les étudiants, les cadres et les primo-accédants",
    otherCitiesParagraph:
      "Nancy bénéficie d’un marché immobilier dynamique, soutenu par son pôle universitaire majeur, ses écoles de renom et un bassin d’emplois attractif en Lorraine. Des secteurs comme la Ville Vieille, Charles III, Haussonville, Boudonville ou Villers-lès-Nancy attirent étudiants, jeunes actifs, cadres et investisseurs locatifs. Avec LivingRoom, vous captez des projets immobiliers concrets liés à la résidence principale, à l’investissement étudiant et à la mobilité professionnelle, tout en profitant d’un réseau actif à Metz, Paris, Lyon, Lille, Bordeaux, Nantes, Rennes et Nice pour développer des opportunités inter-villes.",

    callToActionTitle: "Prêt à Conquérir le Marché Immobilier de Nancy ?",
    callToActionSubtitle:
      "Rejoignez LivingRoom et donnez une nouvelle dimension à votre activité professionnelle dans la région de Nancy.",
  };

  return <AgentImmobilierCityTemplate {...pageData} />;
};

export default AgentImmobilierNancyPage;