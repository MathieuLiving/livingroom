import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, ArrowRight } from "lucide-react";
import SEO from "@/components/SEO";

const AgentsImmobiliersParVillePage = () => {
  const cities = [
    { name: "Paris", slug: "agent-immobilier-paris", region: "Île-de-France" },
    { name: "Lyon", slug: "agent-immobilier-lyon", region: "Auvergne-Rhône-Alpes" },
    { name: "Bordeaux", slug: "agent-immobilier-bordeaux", region: "Nouvelle-Aquitaine" },
    { name: "Nice", slug: "agent-immobilier-nice", region: "Provence-Alpes-Côte d'Azur" },
    { name: "Lille", slug: "agent-immobilier-lille", region: "Hauts-de-France" },
    { name: "Nantes", slug: "agent-immobilier-nantes", region: "Pays de la Loire" },
    { name: "Rennes", slug: "agent-immobilier-rennes", region: "Bretagne" },
    { name: "Nancy", slug: "agent-immobilier-nancy", region: "Grand Est" },
    { name: "Metz", slug: "agent-immobilier-metz", region: "Grand Est" },
  ];

  return (
    <>
      <SEO
        title="Agents Immobiliers par Ville | LivingRoom"
        description="Trouvez les meilleurs agents immobiliers dans votre ville. Accédez à une expertise locale pour vos projets d'achat ou de vente avec LivingRoom."
      />
      <div className="min-h-screen bg-slate-50 py-12 md:py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16 space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
              Nos Agents Immobiliers par Ville
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
              Découvrez nos réseaux d'experts locaux à travers la France pour vous accompagner dans tous vos projets immobiliers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cities.map((city) => (
              <motion.div
                key={city.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <Link
                  to={`/${city.slug}`}
                  className="block h-full bg-white rounded-xl shadow-sm hover:shadow-md border border-slate-200 transition-all duration-300 p-6 group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-brand-blue/10 p-3 rounded-lg text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition-colors duration-300">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-brand-blue transition-colors duration-300 transform group-hover:translate-x-1" />
                  </div>
                  
                  <h2 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-brand-blue transition-colors">
                    {city.name}
                  </h2>
                  <p className="text-slate-500 font-medium">{city.region}</p>
                  
                  <div className="mt-6 pt-6 border-t border-slate-100 flex items-center text-sm text-slate-600">
                    <span className="font-semibold group-hover:text-brand-blue transition-colors">
                      Voir les agents à {city.name}
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="mt-20 text-center bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-slate-200">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
              Votre ville n'est pas encore listée ?
            </h2>
            <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
              Nous développons continuellement notre réseau. Vous pouvez tout de même chercher des projets ou des professionnels via notre outil de recherche global.
            </p>
            <Link
              to="/place-des-projets"
              className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-brand-blue rounded-full hover:bg-brand-blue/90 transition-colors shadow-lg hover:shadow-xl"
            >
              Explorer la Place des Projets
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default AgentsImmobiliersParVillePage;