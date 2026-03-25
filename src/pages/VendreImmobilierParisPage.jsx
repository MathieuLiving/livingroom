import React from "react";
import VendreImmobilierCityTemplate from "@/templates/VendreImmobilierCityTemplate";

const VendreImmobilierParisPage = () => {
  const cityData = {
    city: "Paris",
    description: "Vendez votre bien immobilier à Paris rapidement et au meilleur prix. Nos experts locaux vous accompagnent à chaque étape de la vente dans la capitale.",
    ogImage: "https://images.unsplash.com/photo-1502602898666-8f2a2707ae4d",
    heroTitle: "Vendre votre Bien Immobilier à Paris",
    heroSubtitle: "Obtenez la meilleure offre pour votre propriété parisienne avec l'aide de nos experts locaux, de l'estimation à la vente.",
    whyTitle: "Pourquoi vendre à Paris avec LivingRoom ?",
    whyParagraph: "Le marché parisien est unique et demande une expertise pointue. Que vous vendiez un studio dans le Marais ou un appartement familial dans le 15ème, nos partenaires connaissent chaque micro-marché.",
    bullets: [
      "Estimation précise basée sur les dernières ventes de votre quartier.",
      "Mise en relation avec des agents parisiens triés sur le volet.",
      "Stratégies de vente adaptées aux spécificités parisiennes (biens atypiques, Haussmannien...).",
      "Accompagnement juridique et administratif complet."
    ],
    faqs: [
      {
        q: "Combien coûte une estimation à Paris ?",
        a: "L'estimation est généralement offerte par nos partenaires agents immobiliers dans le cadre d'un projet de vente."
      },
      {
        q: "Quel est le délai moyen de vente à Paris ?",
        a: "Le délai varie selon l'arrondissement et le prix, mais un bien au prix du marché se vend souvent en moins de 60 jours."
      }
    ]
  };

  return <VendreImmobilierCityTemplate {...cityData} />;
};

export default VendreImmobilierParisPage;