import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { CheckCircle, Zap, TrendingUp, HeartHandshake as Handshake, ShieldCheck, MessageCircle } from 'lucide-react';

const AgentImmobilierPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-white to-blue-50"
    >
      <Helmet>
        <title>Agents Immobiliers - Simplifiez votre Prospection Immobilière avec LivingRoom</title>
        <meta
          name="description"
          content="Découvrez comment LivingRoom aide les agents immobiliers à optimiser leur prospection, générer des leads qualifiés, et développer leur réseau professionnel."
        />
        <meta property="og:title" content="Agents Immobiliers - Simplifiez votre Prospection Immobilière avec LivingRoom" />
        <meta property="og:description" content="Découvrez comment LivingRoom aide les agents immobiliers à optimiser leur prospection, générer des leads qualifiés, et développer leur réseau professionnel." />
        <meta property="og:image" content="https://livingroom.immo/og-agent-immobilier.jpg" />
        <meta property="og:url" content="https://livingroom.immo/agent-immobilier" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Agents Immobiliers - Simplifiez votre Prospection Immobilière avec LivingRoom" />
        <meta name="twitter:description" content="Découvrez comment LivingRoom aide les agents immobiliers à optimiser leur prospection, générer des leads qualifiés, et développer leur réseau professionnel." />
        <meta name="twitter:image" content="https://livingroom.immo/og-agent-immobilier.jpg" />
      </Helmet>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.h1
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6"
          >
            Agent Immobilier, <br className="hidden md:inline" />Simplifiez votre Prospection
          </motion.h1>
          <motion.p
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto mb-8"
          >
            Accédez à des leads qualifiés, mettez en relation vos projets, et développez votre réseau avec LivingRoom.
          </motion.p>
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Button asChild size="lg" className="bg-brand-blue hover:bg-brand-blue-dark text-white text-lg px-8 py-6 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1">
              <Link to="/pro-de-limmo/inscription">Rejoignez LivingRoom Pro</Link>
            </Button>
          </motion.div>
        </div>
        <img className="absolute inset-0 w-full h-full object-cover opacity-10" alt="Modern office with agents collaborating" src="https://images.unsplash.com/photo-1681184025442-1517cb9319c1" />
      </section>

      {/* Value Proposition Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            Vos défis, nos solutions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5 }}
              className="bg-gray-50 p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col items-center text-center"
            >
              <Zap className="h-12 w-12 text-brand-blue mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Générez des Leads Qualifiés</h3>
              <p className="text-gray-600">
                Fini le démarchage à froid. Recevez des demandes de particuliers et professionnels dont les projets correspondent à votre expertise.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-gray-50 p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col items-center text-center"
            >
              <TrendingUp className="h-12 w-12 text-brand-blue mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Optimisez vos Mandats</h3>
              <p className="text-gray-600">
                Trouvez rapidement l'acquéreur idéal pour vos mandats de vente ou des biens correspondant aux critères de vos clients acquéreurs.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-gray-50 p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col items-center text-center"
            >
              <Handshake className="h-12 w-12 text-brand-blue mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Élargissez votre Réseau</h3>
              <p className="text-gray-600">
                Connectez-vous avec d'autres professionnels de l'immobilier pour des partenariats et des échanges d'opportunités.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-blue-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Fonctionnalités Clés pour les Professionnels
              </h2>
              <ul className="space-y-4 text-lg text-gray-700">
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-1" />
                  <span>
                    <b>Matching Intelligent:</b> Notre algorithme met en correspondance vos projets et alertes avec des opportunités pertinentes.
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-1" />
                  <span>
                    <b>Place de Marché Pro:</b> Publiez vos projets de recherche ou de vente et accédez à ceux de vos confrères.
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-1" />
                  <span>
                    <b>Gestion des Leads Directs:</b> Centralisez et suivez tous vos leads générés via votre carte de visite digitale LivingRoom.
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-1" />
                  <span>
                    <b>Carte de Visite Digitale Avancée:</b> Partagez votre profil, vos services, et capturez des leads directement.
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-1" />
                  <span>
                    <b>Messagerie Sécurisée:</b> Échangez en toute confiance avec vos contacts et clients potentiels.
                  </span>
                </li>
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7 }}
              className="flex justify-center"
            >
              <img className="rounded-lg shadow-xl w-full max-w-md md:max-w-none" alt="Real estate agent using a digital tablet to manage clients and properties." src="https://images.unsplash.com/photo-1561154464-82e9adf32764" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12">
            Comment LivingRoom propulse votre activité
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center p-6 bg-gray-50 rounded-lg shadow-md"
            >
              <span className="text-4xl font-extrabold text-brand-blue mb-4">1</span>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Créez votre Profil Pro</h3>
              <p className="text-gray-600">
                Mettez en avant votre expertise, vos biens et vos recherches sur votre profil LivingRoom optimisé.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-col items-center p-6 bg-gray-50 rounded-lg shadow-md"
            >
              <span className="text-4xl font-extrabold text-brand-blue mb-4">2</span>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Connectez-vous aux Opportunités</h3>
              <p className="text-gray-600">
                Recevez des notifications pour les projets pertinents ou explorez activement notre place de marché.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col items-center p-6 bg-gray-50 rounded-lg shadow-md"
            >
              <span className="text-4xl font-extrabold text-brand-blue mb-4">3</span>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Concluez plus de Transactions</h3>
              <p className="text-gray-600">
                Transformez vos connexions en succès grâce à des outils de communication et de gestion intégrés.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section (Placeholder) */}
      <section className="py-16 md:py-24 bg-blue-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12">
            Ce qu'ils disent de LivingRoom
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6 }}
              className="bg-white p-8 rounded-lg shadow-md flex flex-col items-center text-center"
            >
              <img className="w-24 h-24 rounded-full mb-4 object-cover" alt="Portrait of a happy real estate agent, Sarah." src="https://images.unsplash.com/photo-1623095368514-13b032b1b45c" />
              <p className="text-gray-700 italic mb-4">
                "LivingRoom a transformé ma manière de prospecter. Je reçois des leads d'une qualité inégalée et je gagne un temps précieux."
              </p>
              <p className="font-semibold text-gray-800">- Sarah D., Agent Immobilier</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white p-8 rounded-lg shadow-md flex flex-col items-center text-center"
            >
              <img className="w-24 h-24 rounded-full mb-4 object-cover" alt="Portrait of a satisfied real estate professional, Marc." src="https://images.unsplash.com/photo-1575709091723-d92b0f14a631" />
              <p className="text-gray-700 italic mb-4">
                "La place de marché pro est une mine d'or pour mes recherches. J'ai pu trouver plusieurs biens pour mes clients grâce à LivingRoom."
              </p>
              <p className="font-semibold text-gray-800">- Marc L., Chasseur Immobilier</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 md:py-24 bg-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Prêt à Réinventer votre Prospection ?
          </h2>
          <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto mb-8">
            Rejoignez des centaines d'agents immobiliers qui optimisent déjà leur temps et leurs résultats avec LivingRoom.
          </p>
          <Button asChild size="lg" className="bg-brand-blue hover:bg-brand-blue-dark text-white text-lg px-8 py-6 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1">
            <Link to="/pro-de-limmo/inscription">Inscrivez-vous Gratuitement</Link>
          </Button>
        </div>
      </section>
    </motion.div>
  );
};

export default AgentImmobilierPage;