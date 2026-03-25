import React from "react";
import AgentImmobilierCityTemplate from "@/templates/AgentImmobilierCityTemplate";

const AgentImmobilierMetzPage = () => {
  const pageData = {
    city: "Metz",
    description:
      "Agents immobiliers à Metz, optimisez votre prospection, captez des leads qualifiés et développez votre activité avec LivingRoom au cœur de la Moselle.",
    ogImage: "https://livingroom.immo/og-agent-immobilier-metz.jpg",
    heroTitle: (
      <>
        Agent Immobilier à Metz, <br className="hidden md:inline" />
        Découvrez de Nouvelles Opportunités Mosellanes
      </>
    ),
    heroSubtitle:
      "Élargissez votre portefeuille clients et affirmez votre présence sur le marché immobilier de Metz et de ses environs.",
    heroImageAlt:
      "Agent immobilier souriant devant la Cathédrale Saint-Étienne de Metz, symbolisant la richesse historique de la ville.",
    heroImageSrc:
      "https://images.unsplash.com/photo-1628178129759-e265b6a715f3?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",

    valuePropositionTitle: "Accroître Votre Efficacité sur le Marché Messin",
    valueProps: [
      {
        icon: "Zap",
        title: "Leads Messins Pré-qualifiés",
        description:
          "Recevez des contacts de particuliers et professionnels dont les projets sont clairement définis à Metz et dans la Moselle.",
      },
      {
        icon: "TrendingUp",
        title: "Valorisez Vos Biens Exclusifs",
        description:
          "Mettez en avant vos mandats exclusifs et trouvez rapidement des acheteurs ou locataires adaptés aux spécificités messines.",
      },
      {
        icon: "Handshake",
        title: "Synergie Locale Renforcée",
        description:
          "Collaborez avec un réseau d'agents immobiliers messins et échangez des opportunités d'affaires.",
      },
    ],

    featuresTitle: "Des Outils Sur Mesure pour Metz",
    featuresList: [
      {
        text: "<b>Matching Avancé:</b> Accédez aux projets immobiliers les plus pertinents dans les quartiers historiques et modernes de Metz.",
      },
      {
        text: "<b>Visibilité Accentuée:</b> Créez un profil d'expert pour vous démarquer et attirer l'attention des prospects locaux.",
      },
      {
        text: "<b>Gestion Simplifiée:</b> Un tableau de bord intuitif pour suivre vos leads, gérer vos annonces et optimiser votre temps.",
      },
      {
        text: "<b>Partage Inter-Agences:</b> Élargissez vos opportunités en partageant des projets et en recevant des propositions de vos confrères messins.",
      },
      {
        text: "<b>Communication Directe:</b> Interagissez facilement avec vos clients et partenaires via notre plateforme sécurisée.",
      },
    ],

    featuresImageAlt:
      "Agent immobilier consultant des plans de quartier de Metz sur un écran d'ordinateur.",
    featuresImageSrc:
      "https://images.unsplash.com/photo-1600880292203-dceb08492e86?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",

    howItWorksTitle: "LivingRoom, votre allié succès à Metz",
    howItWorksSteps: [
      {
        stepNumber: "1",
        title: "Construisez votre Profil d'Expert Local",
        description:
          "Présentez votre spécialisation et votre connaissance approfondie du marché immobilier de Metz sur LivingRoom.",
      },
      {
        stepNumber: "2",
        title: "Capturez les Projets Spécifiques à Metz",
        description:
          "Soyez alerté en temps réel des nouvelles opportunités d'achat ou de vente correspondant à votre expertise à Metz.",
      },
      {
        stepNumber: "3",
        title: "Transformez les Mises en Relation en Succès",
        description:
          "Utilisez nos outils pour optimiser le suivi de vos prospects et multiplier vos transactions immobilières messines.",
      },
    ],

    testimonialsTitle: "Les agents immobiliers messins parlent de LivingRoom",
    testimonials: [
      {
        imageAlt: "Portrait d'un agent immobilier de Metz, David.",
        imageSrc:
          "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        quote:
          "LivingRoom m'a permis de cibler une clientèle plus qualitative à Metz. C'est un gain de temps énorme pour ma prospection.",
        author: "- David S., Agence Metz Cœur de Ville",
      },
      {
        imageAlt: "Portrait d'une agente immobilière de Metz, Clara.",
        imageSrc:
          "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=2722&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        quote:
          "L'option de partage inter-agences est un atout majeur. Cela a ouvert de nouvelles perspectives de collaboration à Metz et dans la région.",
        author: "- Clara L., Indépendante Moselle Immo",
      },
    ],

    // ✅ Paragraphe SEO local Metz (unique + frontalier)
    otherCitiesTitle:
      "Une expertise locale à Metz, un levier pour les projets transfrontaliers",
    otherCitiesParagraph:
      "Le marché immobilier messin se distingue par sa position stratégique aux portes du Luxembourg, de l’Allemagne et de la Belgique. Quartiers recherchés comme l’Impérial, Queuleu, Devant-les-Ponts, Plantières ou encore Montigny-lès-Metz attirent aussi bien des résidents locaux que des investisseurs frontaliers. Avec LivingRoom, vous captez des projets immobiliers concrets liés à la mobilité professionnelle, à l’investissement locatif et aux résidences principales, tout en profitant d’un réseau actif à Nancy, Paris, Lyon, Lille, Bordeaux, Nantes, Rennes et Nice pour multiplier les opportunités inter-villes.",

    callToActionTitle: "Le marché immobilier de Metz vous attend !",
    callToActionSubtitle:
      "Rejoignez la communauté LivingRoom et donnez une nouvelle impulsion à votre carrière d'agent immobilier à Metz.",
  };

  return <AgentImmobilierCityTemplate {...pageData} />;
};

export default AgentImmobilierMetzPage;