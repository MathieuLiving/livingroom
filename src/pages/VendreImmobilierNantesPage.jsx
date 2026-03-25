import React from "react";
import VendreImmobilierCityTemplate from "@/templates/VendreImmobilierCityTemplate";

const VendreImmobilierNantesPage = () => {
  const cityData = {
    city: "Nantes",
    description: "Vendez votre bien à Nantes en toute confiance. Nos experts vous accompagnent pour une transaction fluide et sécurisée.",
    ogImage: "https://images.unsplash.com/photo-1550951473-b7b51b72e505", // Placeholder or general Nantes vibe
    heroTitle: "Vendre votre Bien Immobilier à Nantes",
    heroSubtitle: "Bénéficiez de l'attractivité de Nantes pour vendre votre propriété au meilleur prix avec nos partenaires locaux.",
    whyTitle: "Vendre à Nantes avec LivingRoom",
    whyParagraph: "Nantes est une ville en pleine expansion. Pour bien vendre, il faut comprendre les projets urbains et l'évolution des quartiers.",
    bullets: [
      "Analyse approfondie du marché nantais et de ses évolutions.",
      "Stratégie de vente personnalisée pour votre bien.",
      "Réseau d'acquéreurs sérieux et solvables.",
      "Estimation offerte sans engagement."
    ],
    faqs: [
      {
        q: "Quels sont les quartiers qui montent à Nantes ?",
        a: "Outre l'hypercentre, des quartiers comme l'Île de Nantes, Chantenay ou Doulon connaissent un fort dynamisme."
      },
      {
        q: "Comment mettre en valeur mon bien ?",
        a: "Désencombrer, faire de petites réparations et soigner la luminosité sont des atouts majeurs pour les visites."
      }
    ]
  };

  return <VendreImmobilierCityTemplate {...cityData} />;
};

export default VendreImmobilierNantesPage;