import React from 'react';
import SEO from '@/components/SEO';
import { motion } from 'framer-motion';

const CGUPage = () => {
  return (
    <>
      <SEO
        title="Conditions Générales d'Utilisation (CGU) - LivingRoom.immo"
        description="Conditions Générales d'Utilisation de la plateforme LivingRoom.immo. Règles d'utilisation pour les particuliers et les professionnels."
      />
      <div className="bg-slate-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-sm">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Conditions Générales d'Utilisation (CGU)</h1>
            
            <div className="prose prose-slate max-w-none text-gray-600">
              <p className="mb-4 text-sm text-gray-500">Dernière mise à jour : 02 Janvier 2026</p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. Objet</h2>
              <p>
                Les présentes Conditions Générales d'Utilisation (ci-après "CGU") ont pour objet de définir les modalités et conditions dans lesquelles la société éditrice met à la disposition des utilisateurs (ci-après "les Utilisateurs") le site LivingRoom.immo et les services disponibles sur le site et, d'autre part, la manière par laquelle l'Utilisateur accède au site et utilise ses services.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. Accès au Site</h2>
              <p>
                Le site est accessible gratuitement en tout lieu à tout Utilisateur ayant un accès à Internet. Tous les frais supportés par l'Utilisateur pour accéder au service (matériel informatique, logiciels, connexion Internet, etc.) sont à sa charge.
              </p>
              <p className="mt-2">
                L'accès à certains services (notamment l'espace "Professionnel" et le dépôt de projet pour les "Particuliers") nécessite la création d'un compte utilisateur.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. Compte Utilisateur</h2>
              <p>
                L'Utilisateur s'engage à fournir des informations sincères et exactes concernant son état civil et ses coordonnées, notamment son adresse email. L'Utilisateur est responsable de la mise à jour des informations fournies. Il lui est précisé qu'il peut les modifier en se connectant à son espace membre.
              </p>
              <p className="mt-2">
                Pour accéder aux services, l'Utilisateur devra s'identifier à l'aide de son identifiant et de son mot de passe qui sont strictement personnels et confidentiels. À ce titre, l'Utilisateur s'en interdit toute divulgation.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. Services pour les Particuliers</h2>
              <p>
                LivingRoom.immo permet aux particuliers de déposer des projets immobiliers (achat ou vente) de manière anonyme dans un premier temps. La mise en relation avec un professionnel ne s'effectue qu'après validation explicite de la part du Particulier. Le Particulier s'engage à ne déposer que des projets réels et sérieux.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5. Services pour les Professionnels</h2>
              <p>
                Les professionnels s'engagent à respecter la déontologie de leur profession (Loi Hoguet pour les agents immobiliers) dans leurs échanges avec les particuliers et entre confrères. L'utilisation abusive de la plateforme (spam, démarchage agressif, fausses informations) pourra entraîner la suspension ou la clôture du compte.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6. Propriété Intellectuelle</h2>
              <p>
                Les marques, logos, signes ainsi que tous les contenus du site (textes, images, son...) font l'objet d'une protection par le Code de la propriété intellectuelle et plus particulièrement par le droit d'auteur. L'Utilisateur doit solliciter l'autorisation préalable du site pour toute reproduction, publication, copie des différents contenus.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">7. Données Personnelles</h2>
              <p>
                Les informations demandées à l’inscription au site sont nécessaires et obligatoires pour la création du compte de l'Utilisateur. En particulier, l'adresse électronique pourra être utilisée par le site pour l'administration, la gestion et l'animation du service.
                Le site assure à l'Utilisateur une collecte et un traitement d'informations personnelles dans le respect de la vie privée conformément à la loi n°78-17 du 6 janvier 1978 relative à l'informatique, aux fichiers et aux libertés.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">8. Responsabilité</h2>
              <p>
                Les sources des informations diffusées sur le site LivingRoom.immo sont réputées fiables mais le site ne garantit pas qu'il soit exempt de défauts, d'erreurs ou d'omissions. Les informations communiquées sont présentées à titre indicatif et général sans valeur contractuelle.
              </p>
              <p className="mt-2">
                Le site LivingRoom.immo ne peut être tenu responsable de l'utilisation et de l'interprétation de l'information contenue dans ce site. Le site ne peut être tenu pour responsable d'éventuels virus qui pourraient infecter l'ordinateur ou tout matériel informatique de l'Internaute.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">9. Liens Hypertextes</h2>
              <p>
                Des liens hypertextes peuvent être présents sur le site. L'Utilisateur est informé qu'en cliquant sur ces liens, il sortira du site LivingRoom.immo. Ce dernier n'a pas de contrôle sur les pages web sur lesquelles aboutissent ces liens et ne saurait, en aucun cas, être responsable de leur contenu.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">10. Droit Applicable</h2>
              <p>
                La législation française s'applique au présent contrat. En cas d'absence de résolution amiable d'un litige né entre les parties, les tribunaux français seront seuls compétents pour en connaître.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default CGUPage;