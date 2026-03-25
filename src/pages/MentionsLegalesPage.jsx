import React from 'react';
import SEO from '@/components/SEO';
import { motion } from 'framer-motion';

const MentionsLegalesPage = () => {
  return (
    <>
      <SEO
        title="Mentions Légales - LivingRoom.immo"
        description="Mentions légales de la plateforme LivingRoom.immo. Informations sur l'éditeur EXEDRE.SAS, l'hébergeur et la protection des données."
      />
      <div className="bg-slate-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-sm">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Mentions Légales</h1>
            
            <div className="prose prose-slate max-w-none text-gray-600">
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. Éditeur du Site</h2>
              <p>
                Le site internet <strong>LivingRoom.immo</strong> est édité par la société :
              </p>
              <ul className="list-none pl-0 mt-2 space-y-1">
                <li><strong>Dénomination sociale :</strong> EXEDRE.SAS</li>
                <li><strong>Forme juridique :</strong> Société par Actions Simplifiée (SAS)</li>
                <li><strong>Capital social :</strong> 30 000 €</li>
                <li><strong>Siège social :</strong> 126 boulevard saint-denis – 92400 Courbevoie, France</li>
                <li><strong>SIRET :</strong> 887 684 850 00035</li>
                <li><strong>RCS :</strong> Nanterre</li>
                <li><strong>Numéro de TVA Intracommunautaire :</strong> FR72887684850</li>
                <li><strong>Directeur de la publication :</strong> Mathieu Guerin</li>
                <li><strong>Email de contact :</strong> contact@livingroom.immo</li>
              </ul>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. Hébergement</h2>
              <p>
                Le site est hébergé par :
              </p>
              <ul className="list-none pl-0 mt-2 space-y-1">
                <li><strong>Hébergeur :</strong> Hostinger International Ltd.</li>
                <li><strong>Adresse :</strong> 61 Lordou Vironos Street, 6023 Larnaca, Chypre</li>
                <li><strong>Site web :</strong> <a href="https://www.hostinger.fr" target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline">https://www.hostinger.fr</a></li>
              </ul>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. Propriété Intellectuelle</h2>
              <p>
                L'ensemble de ce site relève de la législation française et internationale sur le droit d'auteur et la propriété intellectuelle. Tous les droits de reproduction sont réservés, y compris pour les documents téléchargeables et les représentations iconographiques et photographiques.
              </p>
              <p className="mt-2">
                La reproduction de tout ou partie de ce site sur un support électronique quel qu'il soit est formellement interdite sauf autorisation expresse du directeur de la publication.
                Toute utilisation non autorisée du site ou de l'un quelconque des éléments qu'il contient sera considérée comme constitutive d'une contrefaçon et poursuivie conformément aux dispositions des articles L.335-2 et suivants du Code de Propriété Intellectuelle.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. Protection des Données Personnelles (RGPD)</h2>
              <p>
                Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés, EXEDRE.SAS s'engage à assurer la protection, la confidentialité et la sécurité des données personnelles des utilisateurs de ses services.
              </p>
              <p className="mt-2">
                Les données collectées sont destinées à l'usage exclusif de EXEDRE.SAS et de ses partenaires dans le cadre strict de l'exécution des services proposés (mise en relation, gestion de compte, abonnement).
              </p>
              <p className="mt-2">
                Vous disposez d'un droit d'accès, de rectification, de portabilité et d'effacement de vos données personnelles. Pour exercer ces droits, vous pouvez nous contacter à l'adresse suivante : <strong>contact@livingroom.immo</strong>.
              </p>
              <p className="mt-2">
                Pour plus d'informations, veuillez consulter notre <a href="/confidentialite" className="text-brand-blue hover:underline">Politique de Confidentialité</a>.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5. Cookies</h2>
              <p>
                Le site LivingRoom.immo utilise des cookies pour améliorer l'expérience utilisateur, réaliser des statistiques de visites et permettre le bon fonctionnement de certaines fonctionnalités (authentification, mémorisation des préférences).
              </p>
              <p className="mt-2">
                Lors de votre première visite, un bandeau vous informe de la présence de ces cookies et vous invite à indiquer votre choix. Vous pouvez à tout moment configurer votre navigateur pour refuser les cookies, bien que cela puisse altérer certaines fonctionnalités du site.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6. Limitation de Responsabilité</h2>
              <p>
                EXEDRE.SAS s'efforce de fournir sur le site LivingRoom.immo des informations aussi précises que possible. Toutefois, elle ne pourra être tenue responsable des oublis, des inexactitudes et des carences dans la mise à jour, qu'elles soient de son fait ou du fait des tiers partenaires qui lui fournissent ces informations.
              </p>
              <p className="mt-2">
                Toutes les informations indiquées sur le site sont données à titre indicatif et sont susceptibles d'évoluer. Par ailleurs, les renseignements figurant sur le site ne sont pas exhaustifs.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">7. Contact</h2>
              <p>
                Pour toute question relative aux présentes mentions légales ou pour tout signalement de contenu ou d'activités illicites, l'utilisateur peut contacter l'éditeur à l'adresse suivante : <strong>contact@livingroom.immo</strong>.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default MentionsLegalesPage;