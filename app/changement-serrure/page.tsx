import Image from 'next/image';

export default function ChangementSerrure() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-t border-black fixed top-0 left-0 right-0 z-30">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-200 rounded relative">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <path d="M 50 10 L 50 30 M 45 25 L 55 25" stroke="#8B4513" strokeWidth="4" fill="none"/>
                <rect x="20" y="30" width="60" height="40" rx="3" fill="#8B4513"/>
                <circle cx="50" cy="50" r="15" fill="none" stroke="white" strokeWidth="4"/>
                <rect x="45" y="70" width="10" height="20" rx="2" fill="#8B4513"/>
              </svg>
            </div>
          </div>
          <nav className="hidden md:flex gap-4 items-center">
            <div className="relative group">
              <button className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2">
                Nos Services
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
              </button>
              <div className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <a href="/ouverture-porte" className="block px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-t-lg">
                  Ouverture de porte
                </a>
                <a href="/changement-serrure" className="block px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-b-lg">
                  Changement de serrure
                </a>
              </div>
            </div>
            <a href="/#about" className="text-gray-700 hover:text-blue-600">
              À propos
            </a>
            <a href="/#zone" className="text-gray-700 hover:text-blue-600">
              Zone d'intervention
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
          <div className="mb-16 pt-12">
            <div className="mb-6">
              <span className="inline-block bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                Intervention rapide 7j/7
              </span>
              <h1 className="text-4xl md:text-5xl font-bold text-blue-800 mb-6 leading-tight">
                Changement de serrure à Paris & Seine-Saint-Denis
              </h1>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-orange-500 rounded-full mb-6"></div>
            </div>
            
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4 bg-gradient-to-br from-blue-50 to-amber-25 p-8 rounded-xl border-l-4 border-blue-600">
              <p className="text-xl leading-relaxed">
                Votre serrure est usée, cassée ou a été endommagée suite à une effraction ? La Serrure intervient rapidement à Paris et en Seine-Saint-Denis pour remplacer vos serrures avec du matériel de qualité, adapté à vos besoins et à votre budget. Nos artisans garantissent une intervention propre et sécurisée, pour votre tranquillité d'esprit.
              </p>
            </div>
          </div>

          {/* Professional Service */}
          <section className="mb-16 bg-gradient-to-br from-blue-50 to-amber-25 p-8 rounded-2xl shadow-lg border border-blue-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-2xl">🔧</span>
              </div>
              <h2 className="text-2xl font-bold text-blue-800">Pourquoi faire appel à un professionnel pour le changement de serrure ?</h2>
            </div>
            
            <p className="text-gray-700 mb-8 text-lg">
              Changer une serrure peut sembler simple, mais un mauvais montage peut compromettre la sécurité de votre domicile ou de votre local professionnel. Faire appel à un serrurier professionnel permet de :
            </p>
            
            <ul className="space-y-4 text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-blue-600 mt-1">✓</span>
                <span>Garantir une installation correcte et sécurisée</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 mt-1">✓</span>
                <span>Bénéficier d'un matériel adapté à vos besoins et à votre budget</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 mt-1">✓</span>
                <span>Éviter tout dommage à votre porte ou à votre serrure</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 mt-1">✓</span>
                <span>Profiter d'un diagnostic clair et de conseils personnalisés</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 mt-1">✓</span>
                <span>Assurer une intervention rapide et efficace par un artisan expérimenté</span>
              </li>
            </ul>
          </section>

          {/* Services List */}
          <section className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-blue-800 mb-3">Nos prestations</h2>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-orange-500 rounded-full mx-auto"></div>
            </div>
            
            <p className="text-gray-700 mb-8 text-lg text-center max-w-3xl mx-auto">
              Nous remplaçons vos serrures dans toutes les situations courantes : usure normale, casse ou après effraction. Chaque intervention est réalisée avec soin, pour que votre installation soit fiable et sécurisée.
            </p>
            
            <div className="grid md:grid-cols-1 gap-8 max-w-2xl mx-auto">
              {/* Service */}
              <div className="bg-white border-l-4 border-orange-500 rounded-lg shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
                <div className="relative h-48 w-full">
                  <Image src="/5.webp" alt="Changement de serrure" fill className="object-cover" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-blue-800 mb-3">Changement de serrure</h3>
                  <p className="text-gray-700 mb-4">
                    Nous remplaçons vos serrures simples ou classiques avec du matériel de qualité, adapté à votre porte et à vos besoins.
                  </p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">À partir de 80 €</p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-2xl p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Besoin d'un changement de serrure ?</h2>
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

      {/* Emergency Service Section */}
      <section className="py-16 bg-gray-50 relative z-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-white rounded-2xl shadow-xl p-4 md:p-8" style={{background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)'}}>
            {/* Top Section */}
            <div className="text-center mb-4 md:mb-8">
              <h2 className="text-xl md:text-3xl font-bold mb-4 flex items-center justify-center gap-3">
                <span className="text-red-500 text-xl md:text-2xl">⭐</span>
                <span>Service d'urgence 7j/7 — même les jours fériés</span>
              </h2>
              <p className="text-sm md:text-lg text-white/90">
                Nous savons que les urgences ne préviennent pas. C'est pourquoi nous sommes disponibles tous les jours, y compris week-ends et jours fériés.
              </p>
            </div>

            {/* Divider */}
            <div className="border-t border-blue-600 my-4 md:my-8"></div>

            {/* Tariff Surcharges Section */}
            <div className="mb-4 md:mb-8 bg-blue-600 rounded-2xl p-4 md:p-8">
              <h3 className="text-base md:text-xl font-bold mb-4 md:mb-6 flex items-center gap-3" style={{color: '#f59e0b'}}>
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                </svg>
                <span style={{color: '#f59e0b'}}>Majorations tarifaires</span>
              </h3>
              <div className="grid md:grid-cols-3 gap-4 md:gap-6">
                <div className="bg-blue-700 rounded-xl p-4 md:p-6 text-center transition-transform duration-300 hover:scale-105">
                  <p className="text-lg md:text-2xl font-bold mb-2" style={{color: '#f59e0b'}}>18h - 22h</p>
                  <p className="text-sm md:text-lg">Majoration +50%</p>
                </div>
                <div className="bg-blue-700 rounded-xl p-4 md:p-6 text-center transition-transform duration-300 hover:scale-105">
                  <p className="text-lg md:text-2xl font-bold mb-2" style={{color: '#f59e0b'}}>22h - 9h</p>
                  <p className="text-sm md:text-lg">Majoration +100%</p>
                </div>
                <div className="bg-blue-700 rounded-xl p-4 md:p-6 text-center transition-transform duration-300 hover:scale-105">
                  <p className="text-lg md:text-2xl font-bold mb-2" style={{color: '#f59e0b'}}>Week-ends</p>
                  <p className="text-sm md:text-lg">Majoration +100%</p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-blue-600 my-4 md:my-8"></div>

            {/* Bottom Section */}
            <div className="grid md:grid-cols-2 gap-6 md:gap-12 items-center">
              {/* Left Side: Areas of Expertise */}
              <div>
                <h3 className="text-xl md:text-2xl font-bold mb-4 md:mb-6" style={{color: '#f59e0b'}}>Nos domaines d'expertise :</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-blue-600 rounded-lg p-3 text-center flex items-center justify-center transition-transform duration-300 hover:scale-110">
                    <p className="text-sm font-semibold">Poignées</p>
                  </div>
                  <div className="bg-blue-600 rounded-lg p-3 text-center flex items-center justify-center transition-transform duration-300 hover:scale-110">
                    <p className="text-sm font-semibold">Verrous</p>
                  </div>
                  <div className="bg-blue-600 rounded-lg p-3 text-center flex items-center justify-center transition-transform duration-300 hover:scale-110">
                    <p className="text-sm font-semibold">Gâches électriques</p>
                  </div>
                  <div className="bg-blue-600 rounded-lg p-3 text-center flex items-center justify-center transition-transform duration-300 hover:scale-110">
                    <p className="text-sm font-semibold">Cylindres européens</p>
                  </div>
                  <div className="bg-blue-600 rounded-lg p-3 text-center flex items-center justify-center transition-transform duration-300 hover:scale-110">
                    <p className="text-sm font-semibold">Portes blindées</p>
                  </div>
                  <div className="bg-blue-600 rounded-lg p-3 text-center flex items-center justify-center transition-transform duration-300 hover:scale-110">
                    <p className="text-sm font-semibold">Serrures multipoints</p>
                  </div>
                </div>
              </div>

              {/* Right Side: Intervention Time */}
              <div className="text-center">
                <div className="rounded-full w-48 h-48 mx-auto mb-4 flex items-center justify-center" style={{backgroundColor: '#f59e0b'}}>
                  <div className="text-center">
                    <p className="text-6xl font-bold leading-tight text-white">&lt;30</p>
                    <p className="text-2xl font-bold text-white">Minutes</p>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold mb-2">Temps d'intervention moyen</p>
                  <p className="text-base text-white/90">Partout dans notre zone</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="py-8 md:py-16" style={{backgroundColor: '#fffbeb'}}>
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-4 text-blue-800">Pourquoi choisir La Serrure ?</h2>
          <p className="text-base md:text-xl text-center text-gray-700 mb-6 md:mb-12 max-w-3xl mx-auto">
            Notre engagement : vous offrir un service de qualité avec transparence et professionnalisme
          </p>

          <div className="grid md:grid-cols-4 gap-4 md:gap-8">
            {/* Card 1: Réactivité */}
            <div className="bg-white rounded-xl p-6 text-center shadow-lg transition-transform duration-300 hover:scale-105 hover:shadow-xl">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{backgroundColor: '#f59e0b'}}>
                <span className="text-3xl text-white">⚡</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-2 text-blue-800">Réactivité</h3>
              <p className="text-gray-700">Moins de 30 minutes sur site</p>
            </div>

            {/* Card 2: Honnêteté */}
            <div className="bg-white rounded-xl p-6 text-center shadow-lg transition-transform duration-300 hover:scale-105 hover:shadow-xl">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{backgroundColor: '#f59e0b'}}>
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-2 text-blue-800">Honnêteté</h3>
              <p className="text-gray-700">Diagnostic clair, devis immédiat</p>
            </div>

            {/* Card 3: Efficacité */}
            <div className="bg-white rounded-xl p-6 text-center shadow-lg transition-transform duration-300 hover:scale-105 hover:shadow-xl">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{backgroundColor: '#f59e0b'}}>
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-2 text-blue-800">Efficacité</h3>
              <p className="text-gray-700">Chaque geste compte, pas de perte de temps</p>
            </div>

            {/* Card 4: Artisan expérimenté */}
            <div className="bg-white rounded-xl p-6 text-center shadow-lg transition-transform duration-300 hover:scale-105 hover:shadow-xl">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{backgroundColor: '#f59e0b'}}>
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-2 text-blue-800">Artisan expérimenté</h3>
              <p className="text-gray-700">Outillage pro et respect du matériel</p>
            </div>
          </div>
        </div>
      </section>

      {/* Zone d'intervention Section */}
      <section className="py-8 md:py-16" style={{backgroundColor: '#fffbeb'}}>
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-4 text-blue-800">Zone d'intervention</h2>
          <p className="text-base md:text-xl text-center text-gray-700 mb-8 md:mb-12 max-w-3xl mx-auto">
            Nous intervenons rapidement dans tout Paris (75) et la Seine-Saint-Denis (93)
          </p>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
            {/* Left Side: Main Intervention Area Card */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 md:p-8 min-h-[300px] md:min-h-[400px] flex flex-col justify-between text-white shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'}}></div>
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <svg className="w-8 h-8 md:w-10 md:h-10" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <h3 className="text-2xl md:text-3xl font-bold">Paris (75) & Seine-Saint-Denis (93)</h3>
                </div>
                <p className="text-lg md:text-xl mb-8">Intervention rapide dans toute la zone</p>
              </div>
              <div className="relative z-10 mt-auto">
                <div className="bg-white rounded-xl p-4 md:p-6 text-center">
                  <p className="text-3xl md:text-4xl font-bold mb-2" style={{color: '#1e40af'}}>&lt; 30 min</p>
                  <p className="text-sm md:text-base" style={{color: '#3b82f6'}}>Temps d'intervention moyen</p>
                </div>
              </div>
            </div>

            {/* Right Side: Cities List */}
            <div>
              <h3 className="text-xl md:text-2xl font-bold mb-6 text-blue-800">Villes d'intervention principales :</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {['Paris intra-muros (12e, 19e, 20e...)', 'Montreuil', 'Bobigny', 'Pantin', 'Noisy-le-Sec', 'Saint-Denis', 'Bagnolet', 'Les Lilas', 'Romainville', 'Vincennes'].map((city, index) => (
                  <div key={index} className="flex items-center gap-3 text-gray-700">
                    <svg className="w-5 h-5 flex-shrink-0" style={{color: '#f59e0b'}} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    <span className="text-base md:text-lg">{city}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8 bg-blue-600 rounded-xl p-4 md:p-6 text-white">
                <p className="text-sm md:text-base">
                  <strong>Zone élargie :</strong> Nous pouvons également intervenir dans les communes limitrophes. N'hésitez pas à nous contacter pour vérifier la faisabilité de votre demande.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

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
