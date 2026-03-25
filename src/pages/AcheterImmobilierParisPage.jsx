import React from "react";
import AcheterImmobilierCityTemplate from "@/templates/AcheterImmobilierCityTemplate";
import { Zap, TrendingUp, HeartHandshake as Handshake } from 'lucide-react'; // Import icons

const AcheterImmobilierParisPage = () => {
  const cityData = {
    city: "Paris",
    description: "Découvrez comment acheter un bien immobilier à Paris avec l'accompagnement de nos experts locaux. Simplifiez votre recherche et trouvez la propriété de vos rêves dans la capitale.",
    ogImage: "https://images.unsplash.com/photo-1502602898666-8f2a2707ae4d", // Image of Paris
    heroTitle: "Acheter un Bien Immobilier à Paris",
    heroSubtitle: "Trouvez l'appartement ou la maison de vos rêves dans la capitale, avec l'aide de professionnels locaux.",
    heroImageAlt: "Vue panoramique de Paris avec la Tour Eiffel",
    valuePropositionTitle: "Pourquoi acheter à Paris avec LivingRoom ?",
    valueProps: [
      {
        icon: Zap, // Use imported icon component
        title: "Accès Exclusif",
        description: "Accédez à des propriétés non listées et à des opportunités rares grâce à notre réseau d'agents partenaires à Paris.",
      },
      {
        icon: TrendingUp, // Use imported icon component
        title: "Analyse du Marché Local",
        description: "Bénéficiez d'une expertise approfondie du marché immobilier parisien pour prendre des décisions éclairées et optimiser votre investissement.",
      },
      {
        icon: Handshake, // Use imported icon component
        title: "Accompagnement Personnalisé",
        description: "Nos agents vous guident à chaque étape, de la recherche à la signature, pour une transaction fluide et sécurisée.",
      },
    ],
    featuresTitle: "Votre parcours d'achat simplifié à Paris",
    featuresImageAlt: "Couple visitant un appartement moderne à Paris",
    featuresList: [
      { text: "Accédez à un vaste choix de biens : appartements, maisons, lofts et studios dans tous les arrondissements de <b>Paris</b>." },
      { text: "Bénéficiez d'une recherche sur-mesure adaptée à vos critères (quartier, budget, type de bien, nombre de pièces, etc.)." },
      { text: "Recevez des alertes exclusives pour les nouvelles propriétés correspondant à votre projet à <b>Paris</b>." },
      { text: "Obtenez des conseils d'experts sur les spécificités du marché immobilier parisien, les prix au m², et les tendances." },
      { text: "Soyez accompagné pour les visites, les négociations et toutes les démarches administratives jusqu'à l'acquisition." },
    ],
    howItWorksTitle: "Comment acheter votre bien à Paris avec LivingRoom ?",
    howItWorksSteps: [
      {
        stepNumber: 1,
        title: "Décrivez votre projet",
        description: "Renseignez vos critères d'achat pour que nous puissions cibler les meilleures opportunités pour vous à Paris.",
      },
      {
        stepNumber: 2,
        title: "Connectez-vous à des experts",
        description: "Nous vous mettons en relation avec des agents immobiliers parisiens spécialisés dans le type de bien et le quartier recherchés.",
      },
      {
        stepNumber: 3,
        title: "Trouvez votre bien idéal",
        description: "Recevez des propositions de biens qui correspondent parfaitement à vos attentes et concrétisez votre achat à Paris.",
      },
    ],
    testimonialsTitle: "Ce que disent nos clients qui ont acheté à Paris",
    testimonials: [
      {
        quote: "Grâce à LivingRoom, nous avons trouvé l'appartement de nos rêves dans le 10ème arrondissement de Paris en un temps record. L'agent était incroyable !",
        author: "Sophie et Marc, acheteurs à Paris",
        imageAlt: "Photo de Sophie et Marc",
      },
      {
        quote: "L'accompagnement personnalisé et l'accès à des biens exclusifs ont fait toute la différence. Notre investissement à Paris s'est déroulé sans accroc.",
        author: "Jérôme P., investisseur à Paris",
        imageAlt: "Photo de Jérôme P.",
      },
    ],
    callToActionTitle: "Prêt à trouver votre futur bien à Paris ?",
    callToActionSubtitle: "Lancez votre recherche sans attendre et laissez nos experts vous guider vers le succès de votre projet d'achat.",
  };

  return <AcheterImmobilierCityTemplate {...cityData} />;
};

export default AcheterImmobilierParisPage;