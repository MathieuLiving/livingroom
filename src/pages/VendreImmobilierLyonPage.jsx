import React from "react";
import VendreImmobilierCityTemplate from "@/templates/VendreImmobilierCityTemplate";

const VendreImmobilierLyonPage = () => {
  const cityData = {
    city: "Lyon",
    description: "Confiez la vente de votre bien à Lyon à des professionnels expérimentés. Estimation, diffusion, et vente optimisée dans la capitale des Gaules.",
    ogImage: "https://images.unsplash.com/photo-1516086623696-224419f5a7e5",
    heroTitle: "Vendre votre Bien Immobilier à Lyon",
    heroSubtitle: "De la Presqu'île à la Croix-Rousse, trouvez l'acquéreur idéal pour votre appartement ou maison lyonnaise.",
    whyTitle: "Pourquoi choisir LivingRoom pour vendre à Lyon ?",
    whyParagraph: "Lyon est un marché dynamique où les prix varient fortement d'un quartier à l'autre. Nos experts lyonnais vous aident à positionner votre bien au juste prix.",
    bullets: [
      "Expertise locale sur tous les arrondissements de Lyon.",
      "Valorisation de votre bien (photos pro, visite virtuelle).",
      "Accès à un fichier d'acquéreurs qualifiés en recherche active sur Lyon.",
      "Suivi personnalisé jusqu'à la signature chez le notaire."
    ],
    faqs: [
      {
        q: "Quels sont les quartiers les plus prisés à Lyon ?",
        a: "La Presqu'île, le 6ème arrondissement, la Croix-Rousse et le Vieux Lyon restent des valeurs sûres, mais d'autres secteurs montent en puissance."
      },
      {
        q: "Faut-il rénover avant de vendre à Lyon ?",
        a: "Cela dépend de l'état du bien et du quartier. Une estimation professionnelle vous aidera à déterminer si des travaux sont rentables."
      }
    ]
  };

  return <VendreImmobilierCityTemplate {...cityData} />;
};

export default VendreImmobilierLyonPage;