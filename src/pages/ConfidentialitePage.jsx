import React from 'react';
import SEO from '@/components/SEO';
import { motion } from 'framer-motion';

const ConfidentialitePage = () => {
  return (
    <>
      <SEO
        title="Politique de Confidentialité - LivingRoom.immo"
        description="Politique de confidentialité et protection des données personnelles (RGPD) de LivingRoom.immo. Détails sur la collecte, le traitement et vos droits."
      />
      <div className="bg-slate-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-sm">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Politique de Confidentialité</h1>
            
            <div className="prose prose-slate max-w-none text-gray-600">
              <p className="text-lg text-gray-700 mb-6">
                La protection de vos données personnelles est une priorité pour <strong>EXEDRE.SAS</strong>. 
                La présente politique de confidentialité a pour objet de vous informer de manière transparente sur la manière dont nous collectons, traitons et protégeons vos données personnelles lors de votre utilisation de la plateforme <strong>LivingRoom.immo</strong>, conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. Responsable de Traitement</h2>
              <p>
                Le responsable du traitement des données collectées sur le site est la société :<br/>
                <strong>EXEDRE.SAS</strong><br/>
                Société par Actions Simplifiée au capital de 30 000 €<br/>
                Siège social : 126 boulevard saint-denis – 92400 Courbevoie, France<br/>
                RCS Nanterre 887 684 850<br/>
                Email délégué à la protection des données : <strong>contact@livingroom.immo</strong>
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. Données Collectées</h2>
              <p>Nous collectons et traitons les catégories de données suivantes, nécessaires à l'utilisation de nos services :</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong>Données d'identification :</strong> Nom, prénom, adresse email, numéro de téléphone, mot de passe (crypté).</li>
                <li><strong>Données professionnelles (pour les Professionnels) :</strong> Nom de la société, numéro de carte professionnelle, SIRET, adresse de l'agence, logo, photo de profil, liens vers les réseaux sociaux, description de l'activité.</li>
                <li><strong>Données relatives aux projets immobiliers :</strong> Critères de recherche (budget, localisation, surface, type de bien) ou caractéristiques des biens mis en vente (photos, description, prix).</li>
                <li><strong>Données de connexion et de navigation :</strong> Adresse IP, type de navigateur, système d'exploitation, journaux de connexion (logs), cookies et traceurs.</li>
                <li><strong>Données de paiement :</strong> Historique des transactions, dates et montants. <em>Note : Les coordonnées bancaires complètes ne sont jamais conservées par LivingRoom.immo mais gérées directement et de manière sécurisée par notre prestataire de paiement certifié PCI-DSS (Stripe).</em></li>
              </ul>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. Finalités du Traitement</h2>
              <p>Nous traitons vos données pour les finalités suivantes :</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong>Fourniture et gestion du service :</strong> Création et gestion de votre compte utilisateur, publication de vos projets, mise en relation entre particuliers et professionnels, hébergement de vos cartes de visite digitales.</li>
                <li><strong>Gestion de la relation client :</strong> Support technique, assistance utilisateur, gestion des réclamations, gestion des abonnements et de la facturation.</li>
                <li><strong>Communication et notifications :</strong> Envoi d'emails transactionnels (confirmation de compte, réinitialisation de mot de passe), notifications d'activité (nouveaux leads, messages reçus), newsletters (uniquement si vous y avez consenti).</li>
                <li><strong>Amélioration de nos services :</strong> Réalisation de statistiques anonymes d'utilisation, analyse de l'audience, amélioration des fonctionnalités techniques et ergonomiques de la plateforme.</li>
                <li><strong>Sécurité et conformité légale :</strong> Prévention de la fraude, sécurisation des accès, respect de nos obligations légales (conservation des logs de connexion, obligations comptables).</li>
              </ul>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. Bases Légales du Traitement</h2>
              <p>Les traitements de vos données reposent sur les bases légales suivantes :</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong>L'exécution du contrat (CGU/CGV) :</strong> Pour permettre l'accès et l'utilisation des services de la plateforme auxquels vous avez souscrit.</li>
                <li><strong>Votre consentement :</strong> Pour le dépôt de certains cookies optionnels ou l'envoi de communications commerciales par voie électronique.</li>
                <li><strong>L'intérêt légitime de EXEDRE.SAS :</strong> Pour assurer la sécurité du site, lutter contre la fraude et améliorer la qualité de nos services.</li>
                <li><strong>L'obligation légale :</strong> Pour répondre à nos obligations fiscales, comptables et réglementaires.</li>
              </ul>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5. Destinataires des Données</h2>
              <p>Vos données personnelles sont confidentielles et accessibles uniquement :</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Aux équipes internes de EXEDRE.SAS dûment habilitées à les traiter.</li>
                <li>Aux autres utilisateurs de la plateforme avec qui vous choisissez d'entrer en relation (ex: un Professionnel recevra les coordonnées d'un Particulier uniquement si ce dernier effectue une demande de contact ou accepte une mise en relation).</li>
                <li>À nos prestataires de services et sous-traitants techniques (hébergement, solution de paiement, service d'emailing) qui agissent sur nos instructions strictes et présentent des garanties suffisantes quant à la protection de vos données.</li>
                <li>Aux autorités administratives ou judiciaires, uniquement sur réquisition légale.</li>
              </ul>
              <p className="mt-2 text-sm italic">Nous nous engageons à ne jamais vendre, louer ou céder vos données personnelles à des tiers à des fins commerciales sans votre consentement explicite.</p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6. Durée de Conservation</h2>
              <p>
                Nous conservons vos données uniquement pour la durée nécessaire aux finalités pour lesquelles elles ont été collectées :
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong>Compte actif :</strong> Les données de votre compte sont conservées tant que celui-ci est actif.</li>
                <li><strong>Compte inactif :</strong> En l'absence d'activité de votre part pendant une durée de 3 ans, votre compte et vos données seront supprimés ou anonymisés, sauf demande contraire de votre part avant échéance.</li>
                <li><strong>Données de facturation :</strong> Conservées pendant 10 ans conformément aux obligations légales et comptables.</li>
                <li><strong>Données techniques (logs) :</strong> Conservées pendant 12 mois.</li>
                <li><strong>Cookies :</strong> Durée de vie maximale de 13 mois.</li>
              </ul>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">7. Vos Droits</h2>
              <p>Conformément à la réglementation en vigueur, vous disposez des droits suivants sur vos données :</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong>Droit d'accès :</strong> Vous pouvez obtenir la confirmation que des données vous concernant sont traitées et en demander une copie.</li>
                <li><strong>Droit de rectification :</strong> Vous pouvez demander la modification de vos données inexactes ou incomplètes directement depuis votre espace personnel.</li>
                <li><strong>Droit à l'effacement (droit à l'oubli) :</strong> Vous pouvez demander la suppression de votre compte et de vos données, sous réserve de nos obligations légales de conservation.</li>
                <li><strong>Droit d'opposition :</strong> Vous pouvez vous opposer à tout moment au traitement de vos données à des fins de prospection commerciale.</li>
                <li><strong>Droit à la portabilité :</strong> Vous pouvez demander à récupérer vos données dans un format structuré, couramment utilisé et lisible par machine.</li>
                <li><strong>Droit à la limitation :</strong> Vous pouvez demander le gel temporaire de l'utilisation de vos données dans certains cas prévus par la loi.</li>
              </ul>
              <p className="mt-4">
                Pour exercer ces droits, il vous suffit de nous contacter par email à l'adresse <strong>contact@livingroom.immo</strong> en précisant l'objet de votre demande.<br/>
                Si vous estimez, après nous avoir contactés, que vos droits « Informatique et Libertés » ne sont pas respectés, vous pouvez adresser une réclamation à la CNIL (www.cnil.fr).
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">8. Cookies</h2>
              <p>
                Lors de votre navigation sur LivingRoom.immo, des cookies sont déposés sur votre terminal (ordinateur, mobile, tablette). Un cookie est un petit fichier texte qui stocke des informations relatives à votre navigation.
              </p>
              <p className="mt-2">Nous utilisons :</p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li><strong>Des cookies techniques indispensables :</strong> Nécessaires au bon fonctionnement du site (gestion de votre session, authentification, sécurité). Ils ne peuvent pas être désactivés.</li>
                <li><strong>Des cookies de mesure d'audience :</strong> Nous permettant d'analyser l'utilisation du site et d'en améliorer les performances de manière anonyme.</li>
              </ul>
              <p className="mt-2">
                Vous pouvez à tout moment configurer votre navigateur pour accepter ou refuser les cookies, ou être alerté lors de leur dépôt. Notez toutefois que le refus des cookies techniques peut empêcher votre connexion à votre espace personnel.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">9. Sécurité des Données</h2>
              <p>
                La sécurité de vos données est essentielle. Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles robustes (protocole HTTPS, chiffrement des données sensibles, protection par mots de passe complexes, pare-feu, contrôle strict des accès) pour protéger vos données contre toute destruction, perte, altération, divulgation ou accès non autorisé.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">10. Contact</h2>
              <p>
                Pour toute question ou demande d'information concernant cette politique de confidentialité, ou pour exercer vos droits, vous pouvez nous contacter :
              </p>
              <ul className="list-none pl-0 mt-2 space-y-1">
                <li>Par email : <strong>contact@livingroom.immo</strong></li>
                <li>Par courrier postal : <strong>EXEDRE.SAS - Protection des Données, 126 boulevard saint-denis, 92400 Courbevoie, France</strong></li>
              </ul>
              
              <p className="text-sm text-gray-500 mt-8 pt-4 border-t">
                Dernière mise à jour : 02 Janvier 2026
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default ConfidentialitePage;