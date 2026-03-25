import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const linkBase =
    "hover:text-brand-orange transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/70 rounded";

  return (
    <footer className="bg-brand-blue text-white">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h2 className="text-xl font-bold mb-4">LivingRoom.immo</h2>
            <p className="text-gray-300">
              La place de marché qui connecte les projets immobiliers et les
              professionnels.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Navigation</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className={linkBase}>
                  Accueil
                </Link>
              </li>
              <li>
                <Link to="/place-des-projets" className={linkBase}>
                  Place des projets
                </Link>
              </li>
              <li>
                <Link to="/blog" className={linkBase}>
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/a-propos" className={linkBase}>
                  À propos
                </Link>
              </li>
            </ul>
          </div>

          {/* Particuliers */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Particuliers</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/particuliers" className={linkBase}>
                  Déposer un projet
                </Link>
              </li>
              <li>
                <Link to="/place-des-projets" className={linkBase}>
                  Voir les projets immobiliers
                </Link>
              </li>
              <li>
                <Link to="/connexion" className={linkBase}>
                  Mon compte
                </Link>
              </li>
            </ul>
          </div>

          {/* Professionnels */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Professionnels</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/pro-de-limmo" className={linkBase}>
                  LivingRoom Pro
                </Link>
              </li>

              {/* ✅ PRIORITÉ SEO : page "Prospects immobiliers" */}
              <li>
                <Link to="/prospects-immobiliers" className={linkBase}>
                  Prospects immobiliers
                </Link>
              </li>

              <li>
                <Link to="/nos-professionnels-partenaires" className={linkBase}>
                  Professionnels partenaires
                </Link>
              </li>

              <li>
                <Link to="/agents-immobiliers-par-ville" className={linkBase}>
                  Agents immobiliers par ville
                </Link>
              </li>

              <li>
                <Link to="/pro-de-limmo/inscription" className={linkBase}>
                  S&apos;inscrire (Pro)
                </Link>
              </li>

              <li>
                <Link to="/connexion" className={linkBase}>
                  Connexion Pro
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-700 pt-6 flex flex-col md:flex-row justify-between items-center text-sm">
          <p>&copy; {currentYear} LivingRoom.immo. Tous droits réservés.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link to="/mentions-legales" className="hover:underline">
              Mentions légales
            </Link>
            <Link to="/cgu" className="hover:underline">
              CGU
            </Link>
            <Link to="/cgv" className="hover:underline">
              CGV
            </Link>
            <Link to="/confidentialite" className="hover:underline">
              Confidentialité
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;