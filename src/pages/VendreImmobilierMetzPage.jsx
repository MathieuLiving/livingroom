import React from "react";
import VendreImmobilierCityTemplate from "@/templates/VendreImmobilierCityTemplate";

const VendreImmobilierMetzPage = () => {
  const cityData = {
    city: "Metz",
    description: "Vendez votre bien à Metz avec l'aide de spécialistes locaux. Estimation juste et vente efficace dans la cité messine.",
    ogImage: "https://images.unsplash.com/photo-1549419131-7e8c3b171630", // Placeholder
    heroTitle: "Vendre votre Bien Immobilier à Metz",
    heroSubtitle: "Appartement en centre-ville ou maison en périphérie, nous vous aidons à vendre au meilleur prix à Metz.",
    whyTitle: "Pourquoi vendre à Metz avec nous ?",
    whyParagraph: "Metz offre un cadre de vie prisé et une proximité avec le Luxembourg. Nos agents savent valoriser ces atouts auprès des acheteurs.",
    bullets: [
      "Connaissance du marché local et des travailleurs frontaliers.",
      "Estimation précise de votre bien immobilier.",
      "Visibilité accrue de votre annonce.",
      "Conseils pour réussir votre vente rapidement."
    ],
    faqs: [
      {
        q: "Les frontaliers cherchent-ils à acheter à Metz ?",
        a: "Oui, Metz est une option attractive pour de nombreux travailleurs frontaliers cherchant une meilleure qualité de vie."
      },
      {
        q: "Quel est le délai pour obtenir une estimation ?",
        a: "Nos partenaires s'engagent généralement à vous fournir une estimation sous 48h après la visite du bien."
      }
    ]
  };

  return <VendreImmobilierCityTemplate {...cityData} />;
};

export default VendreImmobilierMetzPage;