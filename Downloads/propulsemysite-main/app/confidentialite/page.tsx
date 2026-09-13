import React from 'react'

export default function PolitiqueConfidentialite() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-gray-800">
      <h1 className="text-3xl font-bold mb-6">Politique de confidentialité</h1>
      <p className="text-sm text-gray-500 mb-8">Dernière mise à jour : 10 juin 2025</p>

      <h2 className="text-xl font-semibold mb-2 mt-6">1. Informations que nous collectons</h2>
      <p className="mb-4">Nous collectons les informations que vous nous fournissez directement, telles que :</p>
      <ul className="list-disc pl-6 space-y-1 mb-6">
        <li>Informations de compte (nom, adresse électronique, mot de passe)</li>
        <li>Préférences de contenu et données d'entraînement vocal</li>
        <li>Informations de paiement (traitées de manière sécurisée par des fournisseurs tiers)</li>
        <li>Communication avec notre équipe de support</li>
      </ul>

      <h2 className="text-xl font-semibold mb-2">2. Comment nous utilisons vos informations</h2>
      <p className="mb-6">Nous utilisons vos informations pour :</p>
      <ul className="list-disc pl-6 space-y-1 mb-6">
        <li>Fournir et améliorer nos services de génération de contenu</li>
        <li>Traiter les paiements et gérer votre abonnement</li>
        <li>Vous envoyer des mises à jour de service et des avis importants</li>
        <li>Répondre à vos questions et fournir un support client</li>
        <li>Analyser l'utilisation du service pour améliorer l'expérience utilisateur</li>
      </ul>

      <h2 className="text-xl font-semibold mb-2">3. Partage d'informations</h2>
      <p className="mb-6">Nous ne vendons, n'échangeons, ni ne louons vos informations personnelles à des tiers. Nous pouvons partager vos informations uniquement dans les circonstances suivantes :</p>
      <ul className="list-disc pl-6 space-y-1 mb-6">
        <li>Avec votre consentement explicite</li>
        <li>Pour nous conformer aux obligations légales</li>
        <li>Avec des fournisseurs de services de confiance qui nous aident dans nos opérations</li>
        <li>Pour protéger nos droits et prévenir la fraude</li>
      </ul>

      <h2 className="text-xl font-semibold mb-2">4. Sécurité des données</h2>
      <p className="mb-6">Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos informations personnelles contre l'accès non autorisé, l'altération, la divulgation ou la destruction. Cependant, aucune méthode de transmission sur Internet n'est sécurisée à 100%.</p>

      <h2 className="text-xl font-semibold mb-2">5. Conservation des données</h2>
      <p className="mb-6">Nous conservons vos informations personnelles aussi longtemps que nécessaire pour fournir nos services et accomplir les objectifs décrits dans cette politique, à moins qu'une période de conservation plus longue ne soit requise par la loi.</p>

      <h2 className="text-xl font-semibold mb-2">6. Vos droits</h2>
      <p className="mb-6">Vous avez le droit de :</p>
      <ul className="list-disc pl-6 space-y-1 mb-6">
        <li>Accéder, mettre à jour ou supprimer vos informations personnelles</li>
        <li>Vous désinscrire des communications marketing</li>
        <li>Demander une copie de vos données</li>
        <li>Vous opposer au traitement de vos informations personnelles</li>
      </ul>

      <h2 className="text-xl font-semibold mb-2">7. Cookies et suivi</h2>
      <p className="mb-6">Nous utilisons des cookies et des technologies similaires pour améliorer votre expérience, analyser les modèles d'utilisation et fournir du contenu personnalisé. Vous pouvez contrôler les paramètres des cookies via les préférences de votre navigateur.</p>

      <h2 className="text-xl font-semibold mb-2">8. Confidentialité des enfants</h2>
      <p className="mb-6">Notre service n'est pas destiné aux enfants de moins de 13 ans. Nous ne collectons pas sciemment d'informations personnelles d'enfants de moins de 13 ans.</p>

      <h2 className="text-xl font-semibold mb-2">9. Modifications de cette politique</h2>
      <p className="mb-6">Nous pouvons mettre à jour cette politique de confidentialité de temps à autre. Nous vous informerons de tout changement en publiant la nouvelle politique sur cette page et en mettant à jour la date de « Dernière mise à jour ».</p>

      <h2 className="text-xl font-semibold mb-2">10. Nous contacter</h2>
      <p>Si vous avez des questions sur cette politique de confidentialité, veuillez nous contacter à : <a href="mailto:hi@llmfind.com" className="text-blue-600 hover:underline">hi@llmfind.com</a></p>
    </main>
  )
} 