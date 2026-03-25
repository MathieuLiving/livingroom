import React from "react";
import VendreImmobilierCityTemplate from "@/templates/VendreImmobilierCityTemplate";

const VendreImmobilierLillePage = () => {
  const cityData = {
    city: "Lille",
    description: "Réussissez la vente de votre maison ou appartement à Lille. Nos agents connaissent parfaitement la métropole lilloise.",
    ogImage: "https://images.unsplash.com/photo-1616788225575-d1f2a3f7f0e0",
    heroTitle: "Vendre votre Bien Immobilier à Lille",
    heroSubtitle: "Du Vieux-Lille aux communes de la métropole, nous vous aidons à concrétiser votre projet de vente.",
    whyTitle: "Pourquoi nous choisir pour vendre à Lille ?",
    whyParagraph: "La métropole lilloise est vaste et diversifiée. Nos experts vous apportent une analyse fine de votre secteur pour une vente efficace.",
    bullets: [
      "Expertise sur Lille et sa métropole (Marcq, La Madeleine, Lambersart...).",
      "Estimation précise tenant compte du charme et de l'état du bien.",
      "Diffusion optimisée pour toucher les acquéreurs locaux et les investisseurs.",
      "Accompagnement humain et transparent."
    ],
    faqs: [
      {
        q: "Combien de temps faut-il pour vendre à Lille ?",
        a: "Le marché lillois est dynamique. Un bien au prix se vend généralement rapidement, souvent en quelques semaines."
      },
      {
        q: "Faites-vous l'estimation de maisons de courée ?",
        a: "Oui, nous estimons tous types de biens, des maisons de courée aux hôtels particuliers."
      }
    ]
  };

  return <VendreImmobilierCityTemplate {...cityData} />;
};

export default VendreImmobilierLillePage;