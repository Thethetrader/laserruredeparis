"use client";

import React, { useState, useEffect, useRef } from 'react'
import dynamic from "next/dynamic";
import MacBookPro from './MacBookPro';
// const GoldenBeam3D = dynamic(() => import("./GoldenBeam3D"), { ssr: false });

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showCookiePopup, setShowCookiePopup] = useState(false);
  const [showServicePopup, setShowServicePopup] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const logoRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà accepté les cookies
    const cookiesAccepted = localStorage.getItem('cookiesAccepted');
    if (!cookiesAccepted) {
      setShowCookiePopup(true);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!logoRef.current) return;
      const y = window.scrollY;
      logoRef.current.style.transform = `translateY(${y * 0.1}px)`;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookiesAccepted', 'true');
    setShowCookiePopup(false);
  };

  const refuseCookies = () => {
    localStorage.setItem('cookiesAccepted', 'false');
    setShowCookiePopup(false);
  };

  const openServicePopup = (serviceName: string) => {
    setSelectedService(serviceName);
    setShowServicePopup(true);
  };

  const closeServicePopup = () => {
    setShowServicePopup(false);
    setSelectedService('');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Service Popup */}
      {showServicePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm transition-opacity duration-300 animate-fadein">
          <div className="bg-white/95 rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 relative border border-gray-200 animate-popup-slide-fade">
            <button
              onClick={closeServicePopup}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl font-light bg-white/80 rounded-full w-9 h-9 flex items-center justify-center shadow-sm border border-gray-100 transition-all duration-200 focus:outline-none"
              aria-label="Fermer"
            >
              ×
            </button>
            <h3 className="text-xl font-bold mb-4 text-center text-gray-900 drop-shadow-sm">{selectedService}</h3>
            <p className="text-gray-700 text-center leading-relaxed text-base md:text-lg">
              Votre identité visuelle est le reflet de votre marque : elle traduit vos valeurs, attire votre cible, vous distingue de la concurrence et inspire la confiance. Nous la concevons sur mesure pour qu'elle parle à ceux que vous voulez convaincre.
            </p>
            <button
              onClick={closeServicePopup}
              className="mt-8 mx-auto block bg-black/80 text-white py-2 px-8 rounded-full hover:bg-black transition-colors text-sm shadow-md"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Cookie Popup */}
      {showCookiePopup && (
        <div className="fixed bottom-0 left-0 right-0 bg-black/90 text-white p-4 z-50 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm md:text-base">
                🍪 Nous utilisons des cookies pour améliorer votre expérience sur notre site. 
                En continuant à naviguer, vous acceptez notre utilisation des cookies.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={refuseCookies}
                className="px-4 py-2 text-sm border border-gray-400 rounded-full hover:bg-gray-800 transition-colors"
              >
                Refuser
              </button>
              <button
                onClick={acceptCookies}
                className="px-4 py-2 text-sm bg-white text-black rounded-full hover:bg-gray-200 transition-colors"
              >
                Accepter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button 
              className="text-2xl font-bold text-black hover:text-gray-600 transition-colors cursor-pointer"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Propulsemysite
            </button>
            <button className="md:hidden ml-auto p-2" onClick={() => setMenuOpen(true)}>
              <span className="block w-6 h-0.5 bg-black mb-1"></span>
              <span className="block w-6 h-0.5 bg-black mb-1"></span>
              <span className="block w-6 h-0.5 bg-black"></span>
            </button>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#services" className="text-gray-600 hover:text-black transition">Services</a>
              <a href="#prix" className="text-gray-600 hover:text-black transition">Prix</a>
              <a href="#contact" className="text-gray-600 hover:text-black transition" onClick={() => {
                document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
              }}>Contact</a>
              <a href="/login" className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition">
                Connexion
              </a>
            </nav>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end md:hidden">
          <div className="w-2/3 max-w-xs bg-white h-full p-8 flex flex-col space-y-8 shadow-2xl">
            <button className="self-end mb-8" onClick={() => setMenuOpen(false)}>
              <span className="block w-6 h-0.5 bg-black mb-1 rotate-45 translate-y-1.5"></span>
              <span className="block w-6 h-0.5 bg-black -rotate-45 -translate-y-1.5"></span>
            </button>
            <a href="#services" className="text-lg font-medium text-gray-800" onClick={() => setMenuOpen(false)}>Services</a>
            <a href="#prix" className="text-lg font-medium text-gray-800" onClick={() => setMenuOpen(false)}>Prix</a>
            <a href="#contact" className="text-lg font-medium text-gray-800" onClick={() => {
              setMenuOpen(false);
              setTimeout(() => {
                document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}>Contact</a>
            <a href="/login" className="bg-black text-white px-6 py-2 rounded-full text-center font-medium hover:bg-gray-800 transition" onClick={() => setMenuOpen(false)}>Connexion</a>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <main className="pt-24 w-full flex items-center relative overflow-hidden bg-gradient-to-b from-pink-50 to-white">
        <div className="w-full px-8 py-20 rounded-3xl shadow-xl relative z-20">
          <div className="text-center">
            {/* Logo */}
            <img ref={logoRef} src="/fond.png" alt="Logo Propulsemysite" className="mx-auto w-48 h-48 md:w-60 md:h-60 object-contain mb-6" />
            <h1 className="text-4xl md:text-8xl font-bold text-black mb-8 leading-tight">
              Passez de l'idée à l'impact.
            </h1>
            <p className="text-base md:text-xl text-gray-600 mb-12 max-w-xl mx-auto leading-relaxed">
              Transformez votre vision en réalité digitale grâce à une création sur-mesure, conçue dans un vrai esprit de proximité. Des sites web modernes, rapides et optimisés pour votre succès.
            </p>

            {/* Avantages clés */}
            <div className="grid grid-cols-2 landscape:grid-cols-4 md:grid-cols-4 gap-4 md:gap-6 mb-8">
              {/* <GoldenBeam3D /> */}
              <div 
                className="relative bg-gradient-to-r from-pink-50 via-white to-pink-50 rounded-2xl p-4 md:p-6 text-center transition-all duration-300 transform shadow-sm hover:shadow-lg hover:shadow-gray-400/50 hover:scale-105"
              >
                <div className="text-3xl md:text-4xl mb-2 select-none" role="img" aria-label="Palette">🎨</div>
                <h3 className="text-sm md:text-base font-semibold mb-1">Marquez les esprits</h3>
                <p className="text-xs md:text-sm text-gray-600">Une identité visuelle forte et cohérente pour imposer votre image dès le premier regard.</p>
              </div>
              <div 
                className="bg-gradient-to-r from-pink-50 via-white to-pink-50 rounded-2xl p-4 md:p-6 text-center transition-all duration-300 transform shadow-sm hover:shadow-lg hover:shadow-gray-400/50 hover:scale-105"
              >
                <div className="text-3xl md:text-4xl mb-2 select-none" role="img" aria-label="Licorne">🦄</div>
                <h3 className="text-sm md:text-base font-semibold mb-1">Faites la différence</h3>
                <p className="text-xs md:text-sm text-gray-600">Un design unique et un storytelling qui met en avant ce qui vous rend inimitable.</p>
              </div>
              <div 
                className="bg-gradient-to-r from-pink-50 via-white to-pink-50 rounded-2xl p-4 md:p-6 text-center transition-all duration-300 transform shadow-sm hover:shadow-lg hover:shadow-gray-400/50 hover:scale-105"
              >
                <div className="text-3xl md:text-4xl mb-2 select-none" role="img" aria-label="Poignée de main">🤝</div>
                <h3 className="text-sm md:text-base font-semibold mb-1">Créez du lien</h3>
                <p className="text-xs md:text-sm text-gray-600">Des interfaces pensées pour engager et fidéliser votre audience naturellement.</p>
              </div>
              <div 
                className="bg-gradient-to-r from-pink-50 via-white to-pink-50 rounded-2xl p-4 md:p-6 text-center transition-all duration-300 transform shadow-sm hover:shadow-lg hover:shadow-gray-400/50 hover:scale-105"
              >
                <div className="text-3xl md:text-4xl mb-2 select-none" role="img" aria-label="Graphique">📊</div>
                <h3 className="text-sm md:text-base font-semibold mb-1">Boostez vos résultats</h3>
                <p className="text-xs md:text-sm text-gray-600">Une expérience fluide et performante pour maximiser l’impact et la conversion.</p>
              </div>
            </div>

            <button className="bg-black text-white px-10 py-4 rounded-full text-lg font-medium hover:bg-gray-800 transition-all duration-300 transform hover:scale-105"
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>
              Commencer maintenant
            </button>
          </div>
        </div>
      </main>

      {/* Section "Nos réalisations" - Pas de fond */}
      <section className="py-2 -mt-6 md:mt-0">
        <div className="text-center">
            <h2 className="text-4xl md:text-6xl font-bold text-black mt-2 md:mt-4 mb-1 md:mb-8">
              Nos réalisations
            </h2>
            
            {/* Photos défilantes dans un MacBook Pro */}
            <div className="overflow-x-auto overflow-y-hidden -mb-12 md:mb-0">
              <div className="flex space-x-8 md:space-x-24 animate-scroll-horizontal min-w-max">
                {/* Premier set d'images */}
                <MacBookPro siteUrl="https://réflexologieplantaire.com" siteName="Réflexologie Plantaire" />
                <MacBookPro siteUrl="https://simplifiedtradingjournal.com" siteName="Trading Journal" />
                <MacBookPro siteUrl="https://sadserrurerie.com" siteName="Sad Serrurerie" />
                <MacBookPro siteUrl="https://www.cap-kine-du-sport.com" siteName="CAP Kiné du Sport" />
                <MacBookPro siteUrl="https://rococo-capybara-66cb3f.netlify.app" siteName="Putain de Malédiction" />
                <MacBookPro siteUrl="https://atelierduplombier.com" siteName="L'Atelier du Plombier" />
                {/* Deuxième set pour boucle infinie */}
                <MacBookPro siteUrl="https://réflexologieplantaire.com" siteName="Réflexologie Plantaire" />
                <MacBookPro siteUrl="https://simplifiedtradingjournal.com" siteName="Trading Journal" />
                <MacBookPro siteUrl="https://sadserrurerie.com" siteName="Sad Serrurerie" />
                <MacBookPro siteUrl="https://www.cap-kine-du-sport.com" siteName="CAP Kiné du Sport" />
                <MacBookPro siteUrl="https://rococo-capybara-66cb3f.netlify.app" siteName="Putain de Malédiction" />
                <MacBookPro siteUrl="https://atelierduplombier.com" siteName="L'Atelier du Plombier" />
              </div>
            </div>
        </div>
      </section>

      {/* Section Prix */}
      <section id="prix" className="py-0 md:py-20 bg-gradient-to-b from-white to-pink-50 mt-12 md:mt-0">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold text-black mb-6">
              Nos solutions digitales
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Des packages complets adaptés à votre ambition entrepreneuriale. Développement professionnel, accompagnement personnalisé et résultats garantis.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 items-stretch landscape:grid-cols-3 landscape:gap-4">
            {/* Formule Starter */}
            <div className="bg-gradient-to-r from-pink-50 via-white to-pink-50 rounded-2xl p-8 landscape:p-4 shadow hover:shadow-black-glow transition-all duration-300 transform hover:scale-105 flex flex-col h-full">
              <div className="text-center mb-6 landscape:mb-3">
                <h3 className="text-2xl landscape:text-xl font-semibold text-black mb-2 landscape:mb-1">Starter</h3>
                <p className="text-sm landscape:text-xs text-gray-500 mb-4 landscape:mb-2">Parfait pour débuter</p>
                <div className="text-4xl landscape:text-2xl font-bold text-gray-800">
                  799€
                </div>
              </div>
              <ul className="text-left space-y-3 landscape:space-y-2 text-gray-600 flex-grow mb-8 landscape:mb-4">
                <li className="flex items-start"><span className="text-green-500 mr-2">✓</span><span><strong>Site vitrine professionnel</strong><br/><span className="text-sm text-gray-500">5 pages optimisées</span></span></li>
                <li className="flex items-start"><span className="text-green-500 mr-2">✓</span><span><strong>Design responsive premium</strong><br/><span className="text-sm text-gray-500">Adapté mobile & desktop</span></span></li>
                <li className="flex items-start"><span className="text-green-500 mr-2">✓</span><span><strong>Hébergement sécurisé</strong><br/><span className="text-sm text-gray-500">12 mois + domaine offert</span></span></li>
                <li className="flex items-start"><span className="text-green-500 mr-2">✓</span><span><strong>Support technique</strong><br/><span className="text-sm text-gray-500">Assistance 24 h</span></span></li>
                <li className="flex items-start"><span className="text-red-500 mr-2">✕</span><span><strong>Blog</strong></span></li>
                <li className="flex items-start"><span className="text-red-500 mr-2">✕</span><span><strong>Module e-commerce</strong></span></li>
                <li className="flex items-start"><span className="text-red-500 mr-2">✕</span><span><strong>Optimisation SEO</strong></span></li>
                <li className="flex items-start"><span className="text-red-500 mr-2">✕</span><span><strong>Design sur mesure</strong></span></li>
                <li className="flex items-start"><span className="text-red-500 mr-2">✕</span><span><strong>Espace client Discord</strong></span></li>
                <li className="flex items-start"><span className="text-red-500 mr-2">✕</span><span><strong>Support prioritaire</strong></span></li>
                <li className="flex items-start"><span className="text-red-500 mr-2">✕</span><span><strong>Pages illimitées</strong></span></li>
                <li className="flex items-start"><span className="text-red-500 mr-2">✕</span><span><strong>Accompagnement VIP</strong></span></li>
              </ul>
              <button className="bg-black text-white px-6 py-3 rounded-full text-base font-medium hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 mt-auto">Démarrer mon projet</button>
            </div>
            {/* Formule Pro */}
            <div className="bg-gradient-to-r from-pink-50 via-white to-pink-50 rounded-2xl p-8 landscape:p-4 shadow hover:shadow-black-glow transition-all duration-300 transform hover:scale-105">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="bg-black text-white text-sm landscape:text-xs px-4 py-1 rounded-full flex items-center gap-1 whitespace-nowrap">🔥 <span>Recommandé</span></div>
              </div>
              <div className="text-center mb-6 landscape:mb-3 mt-4 landscape:mt-2">
                <h3 className="text-2xl landscape:text-xl font-semibold text-black mb-2 landscape:mb-1">Pro</h3>
                <p className="text-sm landscape:text-xs text-gray-500 mb-4 landscape:mb-2">Pour entreprises ambitieuses</p>
                <div className="text-4xl landscape:text-2xl font-bold text-gray-800">1299€</div>
              </div>
              <ul className="text-left space-y-3 landscape:space-y-2 text-gray-600 flex-grow mb-8 landscape:mb-4">
                <li className="flex items-start"><span className="text-green-500 mr-2">✓</span><span><strong>Hébergement + domaine</strong><br/><span className="text-sm text-gray-500">12 mois inclus</span></span></li>
                <li className="flex items-start"><span className="text-green-500 mr-2">✓</span><span><strong>Jusqu'à 10 pages + blog</strong></span></li>
                <li className="flex items-start"><span className="text-green-500 mr-2">✓</span><span><strong>Responsive mobile/tablette</strong></span></li>
                <li className="flex items-start"><span className="text-green-500 mr-2">✓</span><span><strong>Formulaire de contact avancé</strong></span></li>
                <li className="flex items-start"><span className="text-green-500 mr-2">✓</span><span><strong>Blog & articles</strong></span></li>
                <li className="flex items-start"><span className="text-green-500 mr-2">✓</span><span><strong>Design personnalisé</strong><br/><span className="text-sm text-gray-500">Identité visuelle</span></span></li>
                <li className="flex items-start"><span className="text-green-500 mr-2">✓</span><span><strong>Module e-commerce</strong><br/><span className="text-sm text-gray-500">Paiements en ligne</span></span></li>
                <li className="flex items-start"><span className="text-red-500 mr-2">✕</span><span><strong>Gestion de stock + analytics</strong></span></li>
                <li className="flex items-start"><span className="text-green-500 mr-2">✓</span><span><strong>SEO</strong><br/><span className="text-sm text-gray-500">Référencement Google</span></span></li>
                <li className="flex items-start"><span className="text-red-500 mr-2">✕</span><span><strong>SEO IA</strong><br/><span className="text-sm text-gray-500">Optimisation LLM + audit</span></span></li>
                <li className="flex items-start"><span className="text-green-500 mr-2">✓</span><span><strong>Support email 24h</strong></span></li>
                <li className="flex items-start"><span className="text-green-500 mr-2">✓</span><span><strong>Espace client + support prioritaire</strong></span></li>
              </ul>
              <button className="bg-black text-white px-6 py-3 rounded-full text-base font-medium hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 mt-auto">Accélérer ma croissance</button>
            </div>
            {/* Formule Premium */}
            <div className="bg-gradient-to-r from-pink-50 via-white to-pink-50 rounded-2xl p-8 landscape:p-4 shadow hover:shadow-black-glow transition-all duration-300 transform hover:scale-105 flex flex-col h-full">
              <div className="text-center mb-6 landscape:mb-3">
                <h3 className="text-2xl landscape:text-xl font-semibold text-black mb-2 landscape:mb-1">Premium</h3>
                <p className="text-sm landscape:text-xs text-gray-500 mb-4 landscape:mb-2">Solution complète sur mesure</p>
                <div className="text-4xl landscape:text-2xl font-bold text-gray-800">1999€</div>
              </div>
              <ul className="text-left space-y-3 landscape:space-y-2 text-gray-600 flex-grow mb-8 landscape:mb-4">
                <li className="flex items-start"><span className="text-green-500 mr-2">✓</span><span><strong>Hébergement + domaine</strong><br/><span className="text-sm text-gray-500">12 mois inclus</span></span></li>
                <li className="flex items-start"><span className="text-green-500 mr-2">✓</span><span><strong>Pages illimitées + blog</strong></span></li>
                <li className="flex items-start"><span className="text-green-500 mr-2">✓</span><span><strong>Responsive mobile/tablette</strong></span></li>
                <li className="flex items-start"><span className="text-green-500 mr-2">✓</span><span><strong>Formulaire avancé + espace membres</strong></span></li>
                <li className="flex items-start"><span className="text-green-500 mr-2">✓</span><span><strong>Blog & articles</strong></span></li>
                <li className="flex items-start"><span className="text-green-500 mr-2">✓</span><span><strong>Design 100 % unique</strong><br/><span className="text-sm text-gray-500">UX + branding complet</span></span></li>
                <li className="flex items-start"><span className="text-green-500 mr-2">✓</span><span><strong>Module e-commerce</strong><br/><span className="text-sm text-gray-500">Paiements en ligne</span></span></li>
                <li className="flex items-start"><span className="text-green-500 mr-2">✓</span><span><strong>Gestion de stock + analytics</strong></span></li>
                <li className="flex items-start"><span className="text-green-500 mr-2">✓</span><span><strong>SEO</strong><br/><span className="text-sm text-gray-500">Référencement Google</span></span></li>
                <li className="flex items-start"><span className="text-green-500 mr-2">✓</span><span><strong>SEO IA</strong><br/><span className="text-sm text-gray-500">Optimisation LLM + audit</span></span></li>
                <li className="flex items-start"><span className="text-green-500 mr-2">✓</span><span><strong>Support email 24h</strong></span></li>
                <li className="flex items-start"><span className="text-green-500 mr-2">✓</span><span><strong>Espace client + support prioritaire</strong></span></li>
              </ul>
              <button className="bg-black text-white px-6 py-3 rounded-full text-base font-medium hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 mt-auto">Dominer mon marché</button>
            </div>
          </div>
        </div>
      </section>

      {/* Formulaire de contact (sous la landing page, avant le footer) */}
      <div id="contact" className="bg-gradient-to-b from-pink-50 to-pink-100">
        <ContactForm />
      </div>

      {/* Section Témoignages */}
<section className="py-16 pb-32 md:pb-16 bg-gradient-to-b from-pink-100 to-pink-50">
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-6xl font-bold text-black mb-4">
              Ce que disent nos clients
            </h2>
            <p className="text-gray-600 text-lg">
              Découvrez l'expérience de nos clients satisfaits
            </p>
          </div>
        </div>
        
        <div className="w-full">
          <div className="overflow-x-auto overflow-y-hidden -mb-28 md:mb-0">
            <div className="flex space-x-8 animate-scroll-horizontal min-w-max pl-4">
              {/* Premier set d'avis */}
              <div className="bg-white rounded-2xl p-2 md:p-8 h-56 md:h-auto shadow hover:shadow-black-glow transition-all duration-300 transform hover:scale-105 w-64 md:w-96 flex-shrink-0">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "Super rendu ! Le site de Canal Poké reflète parfaitement l'esprit du resto."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                    M
                  </div>
                  <div>
                    <p className="font-semibold text-black">Mathieu R.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-2 md:p-8 h-56 md:h-auto shadow hover:shadow-black-glow transition-all duration-300 transform hover:scale-105 w-64 md:w-96 flex-shrink-0">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "Simple, pro et impactant. Le site donne vraiment envie de découvrir Putain de Malédiction."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                    T
                  </div>
                  <div>
                    <p className="font-semibold text-black">Tonton</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-2 md:p-8 h-56 md:h-auto shadow hover:shadow-black-glow transition-all duration-300 transform hover:scale-105 w-64 md:w-96 flex-shrink-0">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "Très satisfait du résultat. Le site est clair, dynamique et inspire confiance."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                    T
                  </div>
                  <div>
                    <p className="font-semibold text-black">Thomas G.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-2 md:p-8 h-56 md:h-auto shadow hover:shadow-black-glow transition-all duration-300 transform hover:scale-105 w-64 md:w-96 flex-shrink-0">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "Interface moderne et intuitive. Excellent travail sur l'expérience utilisateur."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                    S
                  </div>
                  <div>
                    <p className="font-semibold text-black">Sophie L.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-2 md:p-8 h-56 md:h-auto shadow hover:shadow-black-glow transition-all duration-300 transform hover:scale-105 w-64 md:w-96 flex-shrink-0">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "Délais respectés, communication parfaite. Un vrai professionnel !"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                    D
                  </div>
                  <div>
                    <p className="font-semibold text-black">David M.</p>
                  </div>
                </div>
              </div>

              {/* Deuxième set pour boucle infinie */}
              <div className="bg-white rounded-2xl p-2 md:p-8 h-56 md:h-auto shadow hover:shadow-black-glow transition-all duration-300 transform hover:scale-105 w-64 md:w-96 flex-shrink-0">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "Super rendu ! Le site de Canal Poké reflète parfaitement l'esprit du resto."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                    M
                  </div>
                  <div>
                    <p className="font-semibold text-black">Mathieu R.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-2 md:p-8 h-56 md:h-auto shadow hover:shadow-black-glow transition-all duration-300 transform hover:scale-105 w-64 md:w-96 flex-shrink-0">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "Simple, pro et impactant. Le site donne vraiment envie de découvrir Putain de Malédiction."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                    T
                  </div>
                  <div>
                    <p className="font-semibold text-black">Tonton</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-2 md:p-8 h-56 md:h-auto shadow hover:shadow-black-glow transition-all duration-300 transform hover:scale-105 w-64 md:w-96 flex-shrink-0">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "Très satisfait du résultat. Le site est clair, dynamique et inspire confiance."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                    T
                  </div>
                  <div>
                    <p className="font-semibold text-black">Thomas G.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-2 md:p-8 h-56 md:h-auto shadow hover:shadow-black-glow transition-all duration-300 transform hover:scale-105 w-64 md:w-96 flex-shrink-0">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "Interface moderne et intuitive. Excellent travail sur l'expérience utilisateur."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                    S
                  </div>
                  <div>
                    <p className="font-semibold text-black">Sophie L.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-2 md:p-8 h-56 md:h-auto shadow hover:shadow-black-glow transition-all duration-300 transform hover:scale-105 w-64 md:w-96 flex-shrink-0">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "Délais respectés, communication parfaite. Un vrai professionnel !"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                    D
                  </div>
                  <div>
                    <p className="font-semibold text-black">David M.</p>
                  </div>
                </div>
              </div>

              {/* Troisième set pour éliminer tout espace vide */}
              <div className="bg-white rounded-2xl p-2 md:p-8 h-56 md:h-auto shadow hover:shadow-black-glow transition-all duration-300 transform hover:scale-105 w-64 md:w-96 flex-shrink-0">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "Super rendu ! Le site de Canal Poké reflète parfaitement l'esprit du resto."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                    M
                  </div>
                  <div>
                    <p className="font-semibold text-black">Mathieu R.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-2 md:p-8 h-56 md:h-auto shadow hover:shadow-black-glow transition-all duration-300 transform hover:scale-105 w-64 md:w-96 flex-shrink-0">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "Simple, pro et impactant. Le site donne vraiment envie de découvrir Putain de Malédiction."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                    T
                  </div>
                  <div>
                    <p className="font-semibold text-black">Tonton</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-white to-pink-50 border-t border-gray-100 mt-0">
        <div className="max-w-4xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-4 gap-8 text-gray-700">
          <div>
            <h2 className="font-bold text-lg mb-2">Propulsemysite</h2>
            <p className="text-sm mb-4">Boostez votre présence en ligne. Création de sites web modernes, accompagnement et conseils personnalisés.</p>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  const contactSection = document.getElementById('contact');
                  if (contactSection) {
                    contactSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"
                aria-label="Aller au contact"
              >
                <span aria-label="email" role="img">✉️</span>
              </button>
              <a href="https://www.propulsemysite.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"><span aria-label="site" role="img">🌐</span></a>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Produit</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:underline">Accueil</a></li>
              <li><a href="#" className="hover:underline">Fonctionnalités</a></li>
              <li><a href="#" className="hover:underline">Tarifs</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Entreprise</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:underline">Contact</a></li>
              <li><a href="#" className="hover:underline">Support</a></li>
              <li><a href="#" className="hover:underline">À propos</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Légal</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/confidentialite" className="hover:underline">Politique de confidentialité</a></li>
              <li><a href="/conditions" className="hover:underline">Conditions d'utilisation</a></li>
            </ul>
          </div>
        </div>
        <div className="text-center text-xs text-gray-400 py-4 border-t border-gray-100">© {new Date().getFullYear()} Propulsemysite. Tous droits réservés.</div>
      </footer>
    </div>
  )
}

function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [projectName, setProjectName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          message: `Nom du projet: ${projectName}\nNuméro: ${phoneNumber}\n\n${projectDescription}`
        })
      });
      if (res.ok) {
        setStatus('success');
        setName(''); setEmail(''); setProjectName(''); setPhoneNumber(''); setProjectDescription('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="flex items-center justify-center px-4 pt-16 pb-8">
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-3xl hover:shadow-black-glow transition-all duration-300 transform hover:scale-105 border border-gray-200">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4 text-black">Contact / Réserver un appel</h2>
          <p className="text-gray-600 leading-relaxed">
            Pour nous contacter, veuillez remplir le formulaire ci-dessous.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-gray-800 font-semibold mb-2">Nom complet</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="Jean Dupont"
              required 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black bg-gray-50" 
            />
          </div>
          
          <div>
            <label className="block text-gray-800 font-semibold mb-2">Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="jean@email.com"
              required 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black bg-gray-50" 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-gray-800 font-semibold mb-2">Nom du projet</label>
            <input 
              type="text" 
              value={projectName} 
              onChange={e => setProjectName(e.target.value)} 
              placeholder="Nom de votre projet"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black bg-gray-50" 
            />
          </div>
          
          <div>
            <label className="block text-gray-800 font-semibold mb-2">Numéro de téléphone</label>
            <input 
              type="tel" 
              value={phoneNumber} 
              onChange={e => setPhoneNumber(e.target.value)} 
              placeholder="06 12 34 56 78"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black bg-gray-50" 
            />
          </div>
        </div>

        <div className="mb-8">
          <label className="block text-gray-800 font-semibold mb-2">Expliquez brièvement votre projet</label>
          <textarea 
            value={projectDescription} 
            onChange={e => setProjectDescription(e.target.value)} 
            placeholder="Décrivez en quelques lignes votre projet, vos besoins ou vos attentes..."
            required 
            rows={5} 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black bg-gray-50 resize-none" 
          />
        </div>

        <button 
          type="submit" 
          className="w-full bg-black text-white py-4 rounded-full font-semibold text-lg hover:bg-gray-800 transition-colors"
          disabled={status === 'sending'}
        >
          {status === 'sending' ? 'Envoi en cours...' : 'Envoyer'}
        </button>
        {status === 'success' && <p className="text-green-600 text-center mt-4">Message envoyé !</p>}
        {status === 'error' && <p className="text-red-600 text-center mt-4">Erreur d'envoi, réessayez.</p>}
      </form>
    </div>
  );
} 