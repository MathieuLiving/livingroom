// PAGE DÉSACTIVÉE - ANCIENNE LANDING "Immobilier Reims"
// Conservée uniquement parce que l'hébergeur ne permet pas la suppression.
// Le site ne l'utilise plus : aucune route ne pointe dessus dans App.jsx.

import React, { useEffect } from "react";

const ImmobilierReimsPage = () => {
  useEffect(() => {
    console.warn(
      "⚠️ ImmobilierReimsPage est désactivée et ne doit plus être utilisée."
    );
  }, []);

  return null; // Aucun rendu, page totalement inoffensive
};

export default ImmobilierReimsPage;