import React from "react";
import AgentImmobilierCityTemplate from "@/templates/AgentImmobilierCityTemplate";

const AgentImmobilierRennesPage = () => {
  const pageData = {
    city: "Rennes",
    description:
      "Agents immobiliers à Rennes, développez votre activité, trouvez des leads qualifiés et collaborez efficacement avec LivingRoom dans la capitale bretonne.",
    ogImage: "https://livingroom.immo/og-agent-immobilier-rennes.jpg",
    heroTitle: (
      <>
        Agent Immobilier à Rennes, <br className="hidden md:inline" />
        Conquérez le Marché Breton avec LivingRoom
      </>
    ),
    heroSubtitle:
      "Devenez un acteur incontournable de l'immobilier rennais et accédez à des opportunités inédites.",
    heroImageAlt:
      "Agent immobilier souriant devant l'Opéra de Rennes, symbolisant le dynamisme de la ville.",
    heroImageSrc:
      "https://images.unsplash.com/photo-1598923363364-7d5a5a8f4c47?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",

    valuePropositionTitle: "Répondez aux Spécificités du Marché Rennais",
    valueProps: [
      {
        icon: "Zap",
        title: "Leads Rennais Qualifiés",
        description:
          "Recevez des contacts ciblés de vendeurs et d'acheteurs avec des projets immobiliers clairs à Rennes et ses alentours.",
      },
      {
        icon: "TrendingUp",
        title: "Optimisez vos Mandats Bretons",
        description:
          "Mettez en avant vos biens exclusifs et trouvez rapidement des correspondances idéales sur le marché de Rennes.",
      },
      {
        icon: "Handshake",
        title: "Développez votre Réseau Local",
        description:
          "Tissez des liens et collaborez avec d'autres professionnels de l'immobilier en Bretagne, via une plateforme dédiée.",
      },
    ],

    featuresTitle: "Des Outils Adaptés au Dynamisme Rennais",
    featuresList: [
      {
        text: "<b>Matching Géolocalisé:</b> Connectez-vous aux opportunités dans les quartiers prisés de Rennes, du Thabor à Sainte-Thérèse.",
      },
      {
        text: "<b>Visibilité Renforcée:</b> Créez une vitrine professionnelle pour présenter votre expertise et vos biens immobiliers à Rennes.",
      },
      {
        text: "<b>Gestion Simplifiée des Prospects:</b> Centralisez et suivez l'ensemble de vos leads issus de LivingRoom avec des outils intuitifs.",
      },
      {
        text: "<b>Partage Inter-Agences:</b> Accédez et proposez des projets en exclusivité avec vos confrères rennais et bretons.",
      },
      {
        text: "<b>Communication Fluide:</b> Échangez directement avec vos clients et partenaires via notre messagerie intégrée et sécurisée.",
      },
    ],

    featuresImageAlt:
      "Agent immobilier analysant des données immobilières avec une vue sur les toits de Rennes.",
    featuresImageSrc:
      "https://images.unsplash.com/photo-1628178129759-e265b6a715f3?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",

    howItWorksTitle: "LivingRoom, votre partenaire succès à Rennes",
    howItWorksSteps: [
      {
        stepNumber: "1",
        title: "Créez votre Profil Expert Rennais",
        description:
          "Mettez en avant votre spécialisation et vos références immobilières dans la région de Rennes sur LivingRoom.",
      },
      {
        stepNumber: "2",
        title: "Saisissez les Opportunités Locales",
        description:
          "Recevez des alertes sur les projets d'achat et de vente qui correspondent précisément à votre expertise sur le marché rennais.",
      },
      {
        stepNumber: "3",
        title: "Accélérez vos Transactions",
        description:
          "Utilisez nos outils pour gérer efficacement vos contacts et multiplier vos succès immobiliers à Rennes.",
      },
    ],

    testimonialsTitle: "Les professionnels rennais témoignent",
    testimonials: [
      {
        imageAlt:
          "Portrait d'un agent immobilier rennais performant, Thomas.",
        imageSrc:
          "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        quote:
          "LivingRoom m'a permis de toucher une clientèle plus large et plus qualifiée à Rennes. Mes ventes ont décollé !",
        author: "- Thomas L., Agence Immobilier Centre-Ville, Rennes",
      },
      {
        imageAlt:
          "Portrait d'une agente immobilière rennaise satisfaite, Sophie.",
        imageSrc:
          "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=2722&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        quote:
          "La collaboration avec d'autres agents de la région n'a jamais été aussi simple. LivingRoom est un indispensable pour mon développement en Bretagne.",
        author: "- Sophie G., Mandataire Immobilier Rennes Sud",
      },
    ],

    // ✅ Paragraphe SEO local Rennes (unique)
    otherCitiesTitle:
      "Une expertise locale à Rennes, un réseau immobilier à l’échelle nationale",
    otherCitiesParagraph:
      "À Rennes, le marché immobilier se structure autour de quartiers très recherchés comme le Thabor, Saint-Hélier, Bourg-l’Évêque, Cleunay, Sainte-Thérèse ou encore Cesson-Sévigné et Saint-Grégoire côté métropole. LivingRoom vous permet de capter des projets immobiliers réels au bon moment, sans prospection à froid, tout en renforçant votre visibilité locale. Et parce que de nombreux acquéreurs et investisseurs comparent plusieurs villes, vous profitez aussi d’un réseau actif à Paris, Nantes, Lyon, Bordeaux, Lille, Nice, Nancy et Metz pour multiplier les opportunités.",

    callToActionTitle: "Le Marché de Rennes n'attend que vous !",
    callToActionSubtitle:
      "Rejoignez la communauté LivingRoom et transformez votre approche de l'immobilier à Rennes et en Ille-et-Vilaine.",
  };

  return <AgentImmobilierCityTemplate {...pageData} />;
};

export default AgentImmobilierRennesPage;