import React from "react";
import VendreImmobilierCityTemplate from "@/templates/VendreImmobilierCityTemplate";

const VendreImmobilierRennesPage = () => {
  const cityData = {
    city: "Rennes",
    description: "Optimisez la vente de votre bien immobilier à Rennes. Nos agents partenaires vous offrent leur expertise du marché breton.",
    ogImage: "https://images.unsplash.com/photo-1549419131-7e8c3b171630", // Placeholder
    heroTitle: "Vendre votre Bien Immobilier à Rennes",
    heroSubtitle: "Trouvez rapidement un acquéreur pour votre maison ou appartement à Rennes grâce à notre réseau local.",
    whyTitle: "L'immobilier à Rennes : notre expertise",
    whyParagraph: "Rennes, avec l'arrivée de la LGV, est devenue très attractive. Nos experts vous aident à tirer parti de ce dynamisme pour votre vente.",
    bullets: [
      "Estimation fiable basée sur la réalité du marché rennais.",
      "Mise en avant des atouts de votre bien (proximité métro, gare...).",
      "Sélection rigoureuse des candidats acquéreurs.",
      "Accompagnement jusqu'à la remise des clés."
    ],
    faqs: [
      {
        q: "Le marché rennais est-il tendu ?",
        a: "Oui, la demande est forte à Rennes, notamment pour les petites surfaces et les maisons avec jardin."
      },
      {
        q: "Proposez-vous des estimations pour les investisseurs ?",
        a: "Tout à fait, nous accompagnons aussi la vente de biens locatifs et d'immeubles de rapport."
      }
    ]
  };

  return <VendreImmobilierCityTemplate {...cityData} />;
};

export default VendreImmobilierRennesPage;