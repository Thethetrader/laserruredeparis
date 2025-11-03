import Image from 'next/image';

export default function OuverturePorte() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <defs>
                  <linearGradient id="keyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor: '#ff8c00', stopOpacity: 1}} />
                    <stop offset="100%" style={{stopColor: '#ffa500', stopOpacity: 1}} />
                  </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="15" fill="none" stroke="white" strokeWidth="4"/>
                <rect x="45" y="70" width="10" height="20" rx="2" fill="#8B4513"/>
              </svg>
            </div>
          </div>
          <nav className="hidden md:flex gap-4 items-center">
            <a href="/" className="text-gray-700 hover:text-blue-600">
              Accueil
            </a>
            <a href="/ouverture-porte" className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-medium">
              Ouverture de porte
            </a>
            <a href="/changement-serrure" className="text-gray-700 hover:text-blue-600">
              Changement de serrure
            </a>
            <a href="/#contact" className="text-gray-700 hover:text-blue-600">
              Contact
            </a>
          </nav>
          <div className="flex gap-3">
            <a href="https://wa.me/33664784213" target="_blank" rel="noopener noreferrer" className="text-white px-4 py-2 rounded-lg flex items-center gap-2 transition" style={{background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)'}}>
              <span className="text-xl">💬</span>
            </a>
            <a href="tel:+33664784213" className="text-white px-4 py-2 rounded-lg flex items-center gap-2 transition" style={{background: 'linear-gradient(135deg, #ea580c 0%, #f59e0b 50%, #fb923c 100%)'}}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
              <span className="hidden md:inline">Appeler maintenant</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Hero Section */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-blue-800 mb-8">Ouverture de porte à Paris & Seine-Saint-Denis — Intervention rapide et sécurisée</h1>
            
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              <p>
                Vous êtes bloqué à l'extérieur de chez vous ou de votre local professionnel ? La Serrure intervient rapidement à Paris et en Seine-Saint-Denis pour tout type de porte, claquée ou fermée à clé. Avec un service non surtaxé, nos artisans garantissent une intervention propre, sécurisée et efficace, sans endommager votre porte si c'est simple.
              </p>
            </div>
          </div>

          {/* Professional Service */}
          <section className="mb-12 bg-blue-50 p-8 rounded-lg">
            <h2 className="text-2xl font-bold text-blue-800 mb-6">Pourquoi faire appel à un professionnel pour l'ouverture de porte ?</h2>
            
            <p className="text-gray-700 mb-6">
              Tenter d'ouvrir une porte soi-même peut provoquer des dégâts irréversibles sur la serrure ou sur l'encadrement. Faire appel à un serrurier professionnel permet de :
            </p>
            
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-blue-600 mt-1">✓</span>
                <span>Préserver votre porte et votre serrure grâce à des techniques adaptées</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 mt-1">✓</span>
                <span>Garantir une ouverture en toute sécurité, même en cas de porte blindée</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 mt-1">✓</span>
                <span>Bénéficier d'un tarif personnalisé pour restaurer la sécurité de votre domicile ou local professionnel</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 mt-1">✓</span>
                <span>Éviter les coûts supplémentaires liés à des réparations et cas de non-réparation</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 mt-1">✓</span>
                <span>Profiter de l'expérience d'un artisan formé aux dernières techniques et outils professionnels</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 mt-1">✓</span>
                <span>Obtenir un service fiable et garanti, avec un devis clair et transparent, intervenir même dans les situations complexes : serrures haut de gamme, portes blindées récentes, etc.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 mt-1">✓</span>
                <span>Préserver la confidentialité et la sécurité de votre logement ou local</span>
              </li>
            </ul>
          </section>

          {/* Services List */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-blue-800 mb-8">Nos prestations</h2>
            
            <div className="space-y-8">
              {/* Service 1 */}
              <div className="border-l-4 border-orange-500 pl-6">
                <h3 className="text-xl font-bold text-blue-800 mb-3">Ouverture de porte claquée</h3>
                <p className="text-gray-700 mb-4">
                  Nous intervenons pour ouvrir les portes claquées, avec des techniques précises qui préservent votre serrure. Idéal en cas d'oubli de vos clés ou de fermeture accidentelle.
                </p>
                <p className="text-2xl font-bold text-blue-700">90 €</p>
              </div>

              {/* Service 2 */}
              <div className="border-l-4 border-orange-500 pl-6">
                <h3 className="text-xl font-bold text-blue-800 mb-3">Ouverture de porte blindée claquée</h3>
                <p className="text-gray-700 mb-4">
                  Même une porte blindée peut être ouverte sans dommage grâce à nos outils spécialisés et à l'expertise de nos artisans. Nous assurons une intervention rapide tout en respectant votre sécurité.
                </p>
                <p className="text-2xl font-bold text-blue-700">120 €</p>
              </div>

              {/* Service 3 */}
              <div className="border-l-4 border-orange-500 pl-6">
                <h3 className="text-xl font-bold text-blue-800 mb-3">Ouverture de porte simple fermée à clé</h3>
                <p className="text-gray-700 mb-4">
                  Clé perdue, serrure endommagée ou porte verrouillée ? Nous réalisons l'ouverture sans destruction, avec un diagnostic clair de l'état de votre serrure.
                </p>
                <p className="text-2xl font-bold text-blue-700">130 €</p>
              </div>

              {/* Service 4 */}
              <div className="border-l-4 border-orange-500 pl-6">
                <h3 className="text-xl font-bold text-blue-800 mb-3">Ouverture de porte blindée fermée à clé</h3>
                <p className="text-gray-700 mb-4">
                  Les portes blindées demandent un savoir-faire particulier. Nos serruriers utilisent des méthodes professionnelles pour intervenir rapidement tout en garantissant la sécurité maximale de votre logement ou local professionnel.
                </p>
                <p className="text-2xl font-bold text-blue-700">170 €</p>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-2xl p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Besoin d'une ouverture de porte ?</h2>
            <p className="text-xl mb-8">Intervention rapide 7j/7 à Paris et en Seine-Saint-Denis</p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <a href="tel:+33664784213" className="bg-white text-blue-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition inline-flex items-center justify-center gap-3">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
                06 64 78 42 13
              </a>
              <a href="https://wa.me/33664784213" target="_blank" rel="noopener noreferrer" className="bg-green-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-600 transition inline-flex items-center justify-center gap-3">
                <span className="text-2xl">💬</span>
                WhatsApp
              </a>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-xl font-bold mb-4">La Serrure de Paris</p>
            <p className="mb-4">Serrurier à Paris & Seine-Saint-Denis</p>
            <div className="flex justify-center gap-6">
              <a href="tel:+33664784213" className="hover:text-orange-500 transition">06 64 78 42 13</a>
              <span>•</span>
              <a href="mailto:la.serrure.93@gmail.com" className="hover:text-orange-500 transition">la.serrure.93@gmail.com</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

