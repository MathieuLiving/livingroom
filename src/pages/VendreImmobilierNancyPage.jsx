import React from "react";
import VendreImmobilierCityTemplate from "@/templates/VendreImmobilierCityTemplate";

const VendreImmobilierNancyPage = () => {
  const cityData = {
    city: "Nancy",
    description: "Vendez votre bien immobilier à Nancy avec l'aide de nos experts locaux. Estimation précise et vente rapide place Stanislas et alentours.",
    ogImage: "https://images.unsplash.com/photo-1549419131-7e8c3b171630", // Placeholder
    heroTitle: "Vendre votre Bien Immobilier à Nancy",
    heroSubtitle: "De la Place Stanislas aux rives de la Meurthe, trouvez l'acquéreur idéal pour votre propriété nancéienne.",
    whyTitle: "Pourquoi vendre à Nancy avec LivingRoom ?",
    whyParagraph: "Nancy est une ville au patrimoine riche et au marché dynamique. Nos partenaires connaissent parfaitement les spécificités de chaque quartier pour valoriser votre bien.",
    bullets: [
      "Expertise locale sur Nancy et sa métropole.",
      "Estimation fiable basée sur les ventes récentes.",
      "Mise en valeur de votre bien (photos, description soignée).",
      "Accompagnement personnalisé jusqu'à la signature."
    ],
    faqs: [
      {
        q: "Quels sont les quartiers recherchés à Nancy ?",
        a: "Le centre-ville, la Vieille Ville et les quartiers proches de la gare sont très prisés, tout comme les secteurs résidentiels calmes."
      },
      {
        q: "Comment se déroule l'estimation ?",
        a: "Un agent partenaire visite votre bien, analyse ses caractéristiques et le compare au marché pour vous fournir une estimation juste."
      }
    ]
  };

  return <VendreImmobilierCityTemplate {...cityData} />;
};

export default VendreImmobilierNancyPage;