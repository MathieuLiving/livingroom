import React from 'react';
import SEO from '@/components/SEO';
import { motion } from 'framer-motion';

const CGVPage = () => {
  return (
    <>
      <SEO
        title="Conditions Générales de Vente (CGV) - LivingRoom.immo"
        description="Consultez les Conditions Générales de Vente de LivingRoom.immo. Informations sur les abonnements, les paiements et les services pour les professionnels de l'immobilier."
      />
      <div className="bg-slate-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-sm">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Conditions Générales de Vente (CGV)</h1>
            
            <div className="prose prose-slate max-w-none text-gray-600">
              <p className="mb-4 text-sm text-gray-500">Dernière mise à jour : 02 Janvier 2026</p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. Préambule</h2>
              <p>
                Les présentes Conditions Générales de Vente (ci-après "CGV") s'appliquent, sans restriction ni réserve, à l'ensemble des ventes de services conclues par la société éditrice de LivingRoom.immo (ci-après "le Prestataire") auprès de clients professionnels (ci-après "le Client" ou "le Professionnel") désirant souscrire aux services proposés sur le site internet LivingRoom.immo.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. Services Proposés</h2>
              <p>
                LivingRoom.immo propose aux professionnels de l'immobilier des services d'abonnement mensuel ou annuel donnant accès à des fonctionnalités avancées, notamment :
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>La création et la gestion d'une fiche profil enrichie.</li>
                <li>L'accès à des leads qualifiés (projets d'achat ou de vente).</li>
                <li>La création de cartes de visite digitales (CVD).</li>
                <li>L'accès au marché inter-professionnel.</li>
              </ul>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. Commandes et Abonnements</h2>
              <p>
                La souscription aux services s'effectue exclusivement en ligne sur le site LivingRoom.immo. Le Client sélectionne l'offre d'abonnement de son choix (ex: "Essentiel", "Premium", "Premium Plus"). La validation de la commande implique l'adhésion pleine et entière aux présentes CGV.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. Tarifs et Paiement</h2>
              <p>
                Les services sont fournis aux tarifs en vigueur figurant sur le site lors de l'enregistrement de la commande par le Prestataire. Les prix sont exprimés en Euros et hors taxes (HT). La TVA applicable est celle en vigueur au jour de la facturation.
              </p>
              <p className="mt-2">
                Le paiement est exigible immédiatement à la commande. Le règlement s'effectue par carte bancaire ou prélèvement via notre partenaire de paiement sécurisé (Stripe). Le Client garantit qu'il dispose des autorisations nécessaires pour utiliser le mode de paiement choisi.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5. Durée et Résiliation</h2>
              <p>
                Les abonnements sont conclus pour une durée déterminée (mensuelle ou annuelle) avec reconduction tacite, sauf dénonciation par l'une ou l'autre des parties.
              </p>
              <p className="mt-2">
                Le Client peut résilier son abonnement à tout moment depuis son espace client. La résiliation prendra effet à la fin de la période d'abonnement en cours. Aucun remboursement prorata temporis ne sera effectué pour la période entamée.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6. Droit de Rétractation</h2>
              <p>
                Conformément à l'article L.221-18 du Code de la consommation, si le Client est un consommateur, il dispose d'un délai de 14 jours pour exercer son droit de rétractation. Toutefois, s'agissant de contrats conclus entre professionnels dans le cadre de leur activité principale, le droit de rétractation ne s'applique pas, sauf exception légale stricte.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">7. Responsabilité du Prestataire</h2>
              <p>
                Le Prestataire s'engage à fournir ses services avec diligence et selon les règles de l'art, étant précisé qu'il pèse sur lui une obligation de moyens, à l'exclusion de toute obligation de résultat. Le Prestataire ne saurait être tenu responsable des interruptions de service liées à des opérations de maintenance ou à des défaillances du réseau internet.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">8. Données Personnelles</h2>
              <p>
                Les données personnelles collectées auprès du Client font l'objet d'un traitement informatique nécessaire à la gestion de la commande et à la relation commerciale. Elles peuvent être transmises aux partenaires chargés de l'exécution, du traitement, de la gestion et du paiement des commandes. Le Client dispose d'un droit d'accès, de rectification et d'opposition conformément à la réglementation en vigueur (RGPD). Voir notre Politique de Confidentialité pour plus de détails.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">9. Droit Applicable et Litiges</h2>
              <p>
                Les présentes CGV sont régies par le droit français. Tous les litiges auxquels les opérations d'achat et de vente conclues en application des présentes CGV pourraient donner lieu, concernant tant leur validité, leur interprétation, leur exécution, leur résiliation, leurs conséquences et leurs suites et qui n'auraient pu être résolus entre le Prestataire et le Client seront soumis aux tribunaux compétents dans les conditions de droit commun.
              </p>

              <div className="mt-12 pt-8 border-t border-gray-200 text-sm text-gray-500">
                <p>Pour toute question relative aux présentes CGV, vous pouvez nous contacter à l'adresse : contact@livingroom.immo</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default CGVPage;