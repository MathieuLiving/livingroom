import React from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CheckCircle2, Users, Target, TrendingUp } from "lucide-react";

const ProspectsImmobiliersPage = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>Prospects Immobiliers : Trouvez des leads qualifiés | LivingRoom</title>
        <meta
          name="description"
          content="Développez votre portefeuille clients avec des prospects immobiliers qualifiés. LivingRoom connecte les agents avec des vendeurs et acheteurs sérieux."
        />
      </Helmet>

      {/* Hero Section */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Boostez votre activité avec des <span className="text-brand-blue">prospects qualifiés</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-10">
            Arrêtez de courir après les leads froids. Accédez à une marketplace de projets immobiliers vérifiés et entrez en relation avec des particuliers prêts à agir.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="bg-brand-blue hover:bg-brand-blue/90 text-lg px-8">
              <Link to="/inscription?role=professionnel">Commencer maintenant</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8">
              <Link to="/pro-de-limmo">Découvrir la solution Pro</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-6">
                <Target className="w-6 h-6 text-brand-blue" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Ciblage Précis</h3>
              <p className="text-slate-600">
                Filtrez les projets par localisation, budget et type de bien pour ne recevoir que des prospects pertinents pour votre secteur.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-brand-blue" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Mise en Relation Directe</h3>
              <p className="text-slate-600">
                Échangez directement avec les porteurs de projets via notre messagerie sécurisée. Pas d'intermédiaires inutiles.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-brand-blue" />
              </div>
              <h3 className="text-xl font-semibold mb-4">ROI Maximisé</h3>
              <p className="text-slate-600">
                Optimisez votre temps de prospection et concentrez-vous sur ce que vous faites de mieux : accompagner vos clients.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-slate-900 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Prêt à développer votre portefeuille ?</h2>
          <p className="text-slate-300 text-lg mb-10">
            Rejoignez les professionnels qui font confiance à LivingRoom pour leur prospection digitale.
          </p>
          <Button asChild size="lg" className="bg-brand-blue hover:bg-brand-blue/90 text-lg px-10 py-6 h-auto">
            <Link to="/inscription?role=professionnel">Créer mon compte Pro gratuit</Link>
          </Button>
          <p className="mt-6 text-sm text-slate-400">
            Aucune carte bancaire requise pour l'inscription.
          </p>
        </div>
      </section>
    </div>
  );
};

export default ProspectsImmobiliersPage;