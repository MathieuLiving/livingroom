import React from 'react';
import { motion } from 'framer-motion';
import SEO from '@/components/SEO';
import { Users, Building, Target } from 'lucide-react';

const AboutPage = () => {
  return (
    <>
      <SEO
        title="À Propos de LivingRoom.immo"
        description="Découvrez l'équipe et la mission de LivingRoom.immo : réinventer la mise en relation immobilière pour la rendre plus simple, plus transparente et plus humaine."
        keywords="à propos, équipe, mission, immobilier, proptech, mise en relation"
      />
      <div className="bg-white">
        <div className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-brand-blue mb-4">Notre Mission</h1>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
              Réinventer la mise en relation immobilière pour la rendre plus simple, plus transparente et plus humaine. Nous croyons que la technologie doit servir à créer des connexions de qualité entre les porteurs de projet et les professionnels les plus compétents.
            </p>
          </motion.div>

       

          <div className="grid md:grid-cols-3 gap-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="p-6 bg-slate-50 rounded-lg shadow-lg h-full">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-brand-orange rounded-full">
                    <Target className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-semibold text-brand-blue mb-3">Pour les Porteurs de Projet</h2>
                <p className="text-gray-600">
                  Offrir une expérience sereine, confidentielle et sans engagement, où vous gardez le contrôle total et choisissez l'expert qui vous accompagnera.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="p-6 bg-slate-50 rounded-lg shadow-lg h-full">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-brand-orange rounded-full">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-semibold text-brand-blue mb-3">Pour les Professionnels</h2>
                <p className="text-gray-600">
                  Fournir un flux de leads qualifiés et consentis, pour vous permettre de vous concentrer sur votre cœur de métier : le conseil et la transaction.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <div className="p-6 bg-slate-50 rounded-lg shadow-lg h-full">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-brand-orange rounded-full">
                    <Building className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-semibold text-brand-blue mb-3">Notre Vision</h2>
                <p className="text-gray-600">
                  Devenir l'écosystème de confiance de l'immobilier, où chaque projet trouve le partenaire idéal grâce à une alliance parfaite entre la technologie et l'humain.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AboutPage;