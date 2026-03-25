import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const RgpdNotice = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-brand-orange text-white p-6 rounded-lg shadow-md mb-8"
    >
      <h2 className="text-2xl font-bold mb-4">Protection de vos Données Personnelles (RGPD)</h2>
      <p className="mb-4">
        La protection de vos données personnelles est notre priorité. Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés, nous nous engageons à assurer la protection, la confidentialité et la sécurité de vos données personnelles.
      </p>
      <p className="mb-4">
        Nous collectons et traitons vos données uniquement dans le cadre strict de l'exécution de nos services et pour les finalités explicites que nous vous présentons. Vous disposez à tout moment d'un droit d'accès, de rectification, de portabilité et d'effacement de vos données.
      </p>
      <p>
        Pour plus de détails sur la gestion de vos données et l'exercice de vos droits, veuillez consulter notre{" "}
        <Link to="/confidentialite" className="underline font-semibold hover:text-brand-gold transition-colors">
          Politique de Confidentialité
        </Link>
        .
      </p>
    </motion.div>
  );
};

export default RgpdNotice;