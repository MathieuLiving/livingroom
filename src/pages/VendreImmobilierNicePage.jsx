import React from "react";
import VendreImmobilierCityTemplate from "@/templates/VendreImmobilierCityTemplate";

const VendreImmobilierNicePage = () => {
  const cityData = {
    city: "Nice",
    description: "Mettez en vente votre bien sur la Côte d'Azur avec succès. Nos experts à Nice vous guident pour valoriser votre patrimoine.",
    ogImage: "https://images.unsplash.com/photo-1517772421389-13824f33083e",
    heroTitle: "Vendre votre Bien Immobilier à Nice",
    heroSubtitle: "Appartement vue mer ou villa sur les collines, trouvez l'acheteur parfait grâce à notre réseau niçois.",
    whyTitle: "L'expertise locale pour vendre à Nice",
    whyParagraph: "Nice attire une clientèle internationale. Il est essentiel de présenter votre bien de manière professionnelle pour séduire ces acquéreurs exigeants.",
    bullets: [
      "Réseau d'acheteurs locaux et internationaux.",
      "Mise en valeur de la vue, de la luminosité et de l'emplacement.",
      "Maîtrise des spécificités de la vente de résidence secondaire.",
      "Estimation gratuite et confidentielle."
    ],
    faqs: [
      {
        q: "Est-ce le bon moment pour vendre à Nice ?",
        a: "La Côte d'Azur reste une valeur refuge. La demande pour les biens de qualité est toujours soutenue."
      },
      {
        q: "Proposez-vous des services multilingues ?",
        a: "Oui, nombre de nos partenaires à Nice parlent anglais et d'autres langues pour gérer la clientèle internationale."
      }
    ]
  };

  return <VendreImmobilierCityTemplate {...cityData} />;
};

export default VendreImmobilierNicePage;