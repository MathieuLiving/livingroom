// PAGE DÉSACTIVÉE - ANCIENNE PAGE QUARTIER COURBEVOIE (neighborhood)
// Conservée uniquement parce que l'hébergeur ne permet pas la suppression.
//
// Le site actuel n'utilise plus ces pages.
// Les données courbevoieData.jsx sont également obsolètes.

import React, { useEffect } from "react";

const CourbevoieNeighborhoodPage = () => {
  useEffect(() => {
    console.warn(
      "⚠️ CourbevoieNeighborhoodPage est désactivée et ne doit plus être utilisée."
    );
  }, []);

  return null; // Aucun rendu = page totalement inoffensive
};

export default CourbevoieNeighborhoodPage;