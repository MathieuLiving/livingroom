
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Home, Users, BookOpen, Search, ShieldCheck } from 'lucide-react';
import SEO from '@/components/SEO';

export default function NotFoundPage() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <SEO
        title="Page Introuvable"
        description="La page que vous recherchez n'existe pas ou a été déplacée."
        noindex={true}
        nofollow={true}
      />

      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl overflow-hidden mt-8">
        <div className="bg-brand-blue p-8 text-center text-white">
          <h1 className="text-6xl md:text-8xl font-bold mb-4">404</h1>
          <h2 className="text-2xl md:text-3xl font-semibold mb-2">Page introuvable</h2>
          <p className="text-blue-100 mb-4 max-w-xl mx-auto">
            La page <span className="font-mono bg-black/20 px-2 py-1 rounded text-sm break-all">{location.pathname}</span> n'existe pas ou a été déplacée.
          </p>
        </div>

        <div className="p-6 md:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            <Link
              to="/"
              className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200 group text-center"
            >
              <Home className="w-8 h-8 text-brand-blue mb-3 group-hover:scale-110 transition-transform duration-300" />
              <span className="font-medium text-slate-800">Accueil</span>
            </Link>

            <Link
              to="/nos-professionnels-partenaires"
              className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200 group text-center"
            >
              <Users className="w-8 h-8 text-brand-orange mb-3 group-hover:scale-110 transition-transform duration-300" />
              <span className="font-medium text-slate-800">Nos Partenaires</span>
            </Link>

            <Link
              to="/blog"
              className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200 group text-center"
            >
              <BookOpen className="w-8 h-8 text-brand-blue mb-3 group-hover:scale-110 transition-transform duration-300" />
              <span className="font-medium text-slate-800">Le Blog</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-brand-blue/10 p-2 rounded-lg shrink-0">
                  <Search className="w-6 h-6 text-brand-blue" />
                </div>
                <h3 className="font-semibold text-lg text-slate-800">Vous êtes un particulier ?</h3>
              </div>
              <p className="text-slate-600 mb-6 flex-grow">
                Trouvez le professionnel idéal pour votre projet immobilier parmi notre réseau de partenaires qualifiés.
              </p>
              <Link to="/nos-professionnels-partenaires" className="text-brand-blue font-medium hover:underline flex items-center gap-1">
                Découvrir les professionnels <span>&rarr;</span>
              </Link>
            </div>

            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-brand-orange/10 p-2 rounded-lg shrink-0">
                  <ShieldCheck className="w-6 h-6 text-brand-orange" />
                </div>
                <h3 className="font-semibold text-lg text-slate-800">Vous êtes un professionnel ?</h3>
              </div>
              <p className="text-slate-600 mb-6 flex-grow">
                Rejoignez LivingRoom pour développer votre visibilité et capter de nouveaux mandats qualifiés.
              </p>
              <Link to="/pro-de-limmo" className="text-brand-orange font-medium hover:underline flex items-center gap-1">
                En savoir plus <span>&rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
