import React from "react";
import VendreImmobilierCityTemplate from "@/templates/VendreImmobilierCityTemplate";

const VendreImmobilierBordeauxPage = () => {
  const cityData = {
    city: "Bordeaux",
    description: "Vendez votre échoppe ou appartement à Bordeaux dans les meilleures conditions. Nos agents partenaires maîtrisent le marché bordelais.",
    ogImage: "https://images.unsplash.com/photo-1549419131-7e8c3b171630",
    heroTitle: "Vendre votre Bien Immobilier à Bordeaux",
    heroSubtitle: "Profitez de l'attractivité de Bordeaux pour réaliser une vente rapide et sécurisée avec nos experts locaux.",
    whyTitle: "Vendre à Bordeaux avec LivingRoom",
    whyParagraph: "Le marché immobilier bordelais a beaucoup évolué. Pour vendre au meilleur prix, il est crucial de bien connaître les tendances actuelles de la 'Belle Endormie'.",
    bullets: [
      "Connaissance pointue des quartiers (Chartrons, Saint-Michel, Caudéran...).",
      "Estimation réaliste en phase avec le marché actuel.",
      "Marketing immobilier ciblé pour attirer les acheteurs parisiens et locaux.",
      "Gestion complète des visites et des offres."
    ],
    faqs: [
      {
        q: "Comment se porte le marché immobilier à Bordeaux ?",
        a: "Le marché s'est stabilisé après une forte hausse. Les biens de qualité et bien situés continuent de se vendre rapidement."
      },
      {
        q: "Quels documents préparer pour la vente ?",
        a: "Titre de propriété, diagnostics techniques, procès-verbaux d'AG (si copropriété), taxe foncière, etc."
      }
    ]
  };

  return <VendreImmobilierCityTemplate {...cityData} />;
};

export default VendreImmobilierBordeauxPage;