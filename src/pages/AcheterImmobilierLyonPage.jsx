import React from "react";
import AcheterImmobilierCityTemplate from "@/templates/AcheterImmobilierCityTemplate";
import { Zap, TrendingUp, HeartHandshake as Handshake } from 'lucide-react'; // Import icons

const AcheterImmobilierLyonPage = () => {
  const cityData = {
    city: "Lyon",
    description: "Découvrez comment acheter un bien immobilier à Lyon avec l'accompagnement de nos experts locaux. Simplifiez votre recherche et trouvez la propriété de vos rêves dans la capitale des Gaules.",
    ogImage: "https://images.unsplash.com/photo-1516086623696-224419f5a7e5", // Image of Lyon
    heroTitle: "Acheter un Bien Immobilier à Lyon",
    heroSubtitle: "Trouvez l'appartement ou la maison de vos rêves à Lyon, avec l'aide de professionnels locaux.",
    heroImageAlt: "Vue panoramique de Lyon avec la Basilique de Fourvière",
    valuePropositionTitle: "Pourquoi acheter à Lyon avec LivingRoom ?",
    valueProps: [
      {
        icon: Zap, // Use imported icon component
        title: "Accès Exclusif",
        description: "Accédez à des propriétés non listées et à des opportunités rares grâce à notre réseau d'agents partenaires à Lyon.",
      },
      {
        icon: TrendingUp, // Use imported icon component
        title: "Analyse du Marché Local",
        description: "Bénéficiez d'une expertise approfondie du marché immobilier lyonnais pour prendre des décisions éclairées et optimiser votre investissement.",
      },
      {
        icon: Handshake, // Use imported icon component
        title: "Accompagnement Personnalisé",
        description: "Nos agents vous guident à chaque étape, de la recherche à la signature, pour une transaction fluide et sécurisée.",
      },
    ],
    featuresTitle: "Votre parcours d'achat simplifié à Lyon",
    featuresImageAlt: "Famille visitant une maison traditionnelle à Lyon",
    featuresList: [
      { text: "Accédez à un vaste choix de biens : appartements, maisons, lofts et studios dans tous les arrondissements de <b>Lyon</b>." },
      { text: "Bénéficiez d'une recherche sur-mesure adaptée à vos critères (quartier, budget, type de bien, nombre de pièces, etc.)." },
      { text: "Recevez des alertes exclusives pour les nouvelles propriétés correspondant à votre projet à <b>Lyon</b>." },
      { text: "Obtenez des conseils d'experts sur les spécificités du marché immobilier lyonnais, les prix au m², et les tendances." },
      { text: "Soyez accompagné pour les visites, les négociations et toutes les démarches administratives jusqu'à l'acquisition." },
    ],
    howItWorksTitle: "Comment acheter votre bien à Lyon avec LivingRoom ?",
    howItWorksSteps: [
      {
        stepNumber: 1,
        title: "Décrivez votre projet",
        description: "Renseignez vos critères d'achat pour que nous puissions cibler les meilleures opportunités pour vous à Lyon.",
      },
      {
        stepNumber: 2,
        title: "Connectez-vous à des experts",
        description: "Nous vous mettons en relation avec des agents immobiliers lyonnais spécialisés dans le type de bien et le quartier recherchés.",
      },
      {
        stepNumber: 3,
        title: "Trouvez votre bien idéal",
        description: "Recevez des propositions de biens qui correspondent parfaitement à vos attentes et concrétisez votre achat à Lyon.",
      },
    ],
    testimonialsTitle: "Ce que disent nos clients qui ont acheté à Lyon",
    testimonials: [
      {
        quote: "Grâce à LivingRoom, nous avons trouvé la maison familiale idéale à Lyon en quelques semaines. L'équipe a été très réactive et professionnelle !",
        author: "Amélie et David, acheteurs à Lyon",
        imageAlt: "Photo d'Amélie et David",
      },
      {
        quote: "Leur connaissance du marché lyonnais est impressionnante. Nous avons fait un excellent investissement grâce à leurs conseils avisés.",
        author: "Charles G., investisseur à Lyon",
        imageAlt: "Photo de Charles G.",
      },
    ],
    callToActionTitle: "Prêt à trouver votre futur bien à Lyon ?",
    callToActionSubtitle: "Lancez votre recherche sans attendre et laissez nos experts vous guider vers le succès de votre projet d'achat.",
  };

  return <AcheterImmobilierCityTemplate {...cityData} />;
};

export default AcheterImmobilierLyonPage;