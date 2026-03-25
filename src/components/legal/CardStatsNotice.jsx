import React from "react";
import { Info } from "lucide-react";
import { motion } from "framer-motion";

const CardStatsNotice = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start space-x-3 text-blue-800 text-sm md:text-base shadow-sm"
    >
      <Info className="h-5 w-5 flex-shrink-0 text-blue-600 mt-0.5" />
      <div>
        <p className="font-semibold mb-1">Confidentialité des statistiques</p>
        <p>
          Les statistiques affichées sur cette page sont anonymes et agrégées.
          Elles ne permettent en aucun cas d'identifier des visiteurs
          individuels. Nous respectons votre vie privée et celle de vos clients.
        </p>
      </div>
    </motion.div>
  );
};

export default CardStatsNotice;