import React from 'react';

export const courbevoieNeighborhoods = [
    {
        slug: "becon",
        name: "Bécon",
        description: "Quartier résidentiel prisé pour son calme, ses parcs et sa proximité avec la Seine.",
        postalCode: "92400",
        mainImage: "becon-main.jpg",
        images: ["becon-1.jpg", "becon-2.jpg", "becon-3.jpg"],
        ambiance: "Paisible et familial",
        pointsOfInterest: ["Parc de Bécon", "Bords de Seine", "Gare de Bécon-les-Bruyères"],
        pros: ["Proximité de Paris", "Espaces verts", "Bonnes écoles"],
        cons: ["Prix de l'immobilier élevés", "Moins animé que le centre-ville"],
    },
    {
        slug: "gambetta",
        name: "Gambetta",
        description: "Le cœur commerçant de Courbevoie, dynamique et bien desservi.",
        postalCode: "92400",
        mainImage: "gambetta-main.jpg",
        images: ["gambetta-1.jpg", "gambetta-2.jpg", "gambetta-3.jpg"],
        ambiance: "Urbain et animé",
        pointsOfInterest: ["Marché de Gambetta", "Nombreux commerces et restaurants", "Mairie de Courbevoie"],
        pros: ["Vie de quartier animée", "Excellente desserte en transports", "Tous commerces à pied"],
        cons: ["Plus bruyant", "Moins d'espaces verts"],
    },
    {
        slug: "faubourg-de-l-arche",
        name: "Faubourg de l'Arche",
        description: "Un quartier moderne aux portes de La Défense, mêlant habitations et bureaux.",
        postalCode: "92400",
        mainImage: "faubourg-arche-main.jpg",
        images: ["faubourg-arche-1.jpg", "faubourg-arche-2.jpg", "faubourg-arche-3.jpg"],
        ambiance: "Moderne et fonctionnel",
        pointsOfInterest: ["Pôle universitaire Léonard de Vinci", "Parc du Millénaire", "Proximité de La Défense"],
        pros: ["Architecture récente", "Idéal pour les professionnels de La Défense", "Bonne infrastructure"],
        cons: ["Peut manquer de charme ancien", "Ambiance plus 'corporate'"],
    },
    {
        slug: "marceau-republique",
        name: "Marceau - République",
        description: "Quartier résidentiel dense, bien situé entre le centre et La Défense.",
        postalCode: "92400",
        mainImage: "marceau-republique-main.jpg",
        images: ["marceau-republique-1.jpg", "marceau-republique-2.jpg", "marceau-republique-3.jpg"],
        ambiance: "Résidentiel et pratique",
        pointsOfInterest: ["Espace Carpeaux", "Bibliothèque municipale", "Commerces de proximité"],
        pros: ["Bonne localisation", "Mélange d'architectures", "Vie de quartier agréable"],
        cons: ["Circulation parfois dense", "Stationnement difficile"],
    }
];

export const neighborhoodData = courbevoieNeighborhoods.reduce((acc, neighborhood) => {
    acc[neighborhood.slug] = neighborhood;
    return acc;
}, {});