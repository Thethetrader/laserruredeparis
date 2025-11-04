'use client';

import Image from "next/image";
import { useState } from "react";

export default function Home() {
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-t border-black fixed top-0 left-0 right-0 z-30">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <a href="/" className="block">
              <div className="w-20 h-20 md:w-24 md:h-24 relative">
                <Image src="/LOGOPNG.png" alt="Logo La Serrure de Paris" fill className="object-contain" />
              </div>
            </a>
          </div>
          <nav className="hidden md:flex gap-4 items-center">
            <div className="relative group">
              <button className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-medium text-base flex items-center gap-2">
                Nos Services
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
              </button>
              <div className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <a href="/ouverture-porte" className="block px-4 py-3 text-base text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-t-lg">
                  Ouverture de porte
                </a>
                <a href="/changement-serrure" className="block px-4 py-3 text-base text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-b-lg">
                  Changement de serrure
                </a>
              </div>
            </div>
            <a href="#about" className="text-base text-gray-700 hover:text-blue-600">
              À propos
            </a>
            <a href="#zone" className="text-base text-gray-700 hover:text-blue-600">
              Zone d'intervention
            </a>
            <a href="#contact" className="text-base text-gray-700 hover:text-blue-600">
              Contact
            </a>
          </nav>
          <div className="flex gap-3 items-center">
            <a href="https://wa.me/33664784213" target="_blank" rel="noopener noreferrer" className="text-white w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-2 rounded-lg flex items-center justify-center gap-2 transition" style={{background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)'}}>
              <span className="text-xl">💬</span>
            </a>
            <a href="tel:+33664784213" className="text-white w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-2 rounded-lg flex items-center justify-center gap-2 transition" style={{background: 'linear-gradient(135deg, #ea580c 0%, #f59e0b 50%, #fb923c 100%)'}}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
              <span className="hidden md:inline text-base">Appeler maintenant</span>
            </a>
            
            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center"
              aria-label="Toggle menu"
            >
              <div className="flex flex-col gap-1.5">
                <span className={`w-6 h-0.5 bg-gray-700 transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                <span className={`w-6 h-0.5 bg-gray-700 transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
                <span className={`w-6 h-0.5 bg-gray-700 transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <div className={`md:hidden absolute top-full left-0 right-0 bg-gradient-to-b from-white to-gray-50 border-t-2 border-orange-200 shadow-2xl z-50 transition-all duration-500 ease-out overflow-hidden ${
          isMobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <nav className="container mx-auto px-6 py-8 flex flex-col gap-1">
            {/* Services Section */}
            <div className="flex flex-col gap-3 mb-6">
              <p className="text-base font-extrabold text-orange-500 uppercase tracking-[0.2em] mb-4 px-3 letter-spacing-wider">Nos Services</p>
              <a 
                href="/ouverture-porte" 
                className="group text-gray-900 hover:text-orange-600 bg-white hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 px-6 py-5 rounded-2xl transition-all duration-300 font-bold text-base border-2 border-transparent hover:border-orange-300 hover:shadow-lg transform hover:scale-[1.02]" 
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="text-2xl mr-3">🔑</span>
                <span className="tracking-wide">Ouverture de porte</span>
              </a>
              <a 
                href="/changement-serrure" 
                className="group text-gray-900 hover:text-orange-600 bg-white hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 px-6 py-5 rounded-2xl transition-all duration-300 font-bold text-base border-2 border-transparent hover:border-orange-300 hover:shadow-lg transform hover:scale-[1.02]" 
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="text-2xl mr-3">🔧</span>
                <span className="tracking-wide">Changement de serrure</span>
              </a>
            </div>
            
            {/* Divider */}
            <div className="border-t-2 border-gray-200 my-4"></div>
            
            {/* Other Links */}
            <a 
              href="#about" 
              className="text-gray-800 hover:text-blue-700 bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 px-6 py-4 rounded-xl transition-all duration-300 font-semibold text-base tracking-wide border-2 border-transparent hover:border-blue-200 hover:shadow-md" 
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span className="text-2xl mr-3">ℹ️</span>
              À propos
            </a>
            <a 
              href="#zone" 
              className="text-gray-800 hover:text-blue-700 bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 px-6 py-4 rounded-xl transition-all duration-300 font-semibold text-base tracking-wide border-2 border-transparent hover:border-blue-200 hover:shadow-md" 
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span className="text-2xl mr-3">📍</span>
              Zone d'intervention
            </a>
            <a 
              href="#contact" 
              className="text-gray-800 hover:text-blue-700 bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 px-6 py-4 rounded-xl transition-all duration-300 font-semibold text-base tracking-wide border-2 border-transparent hover:border-blue-200 hover:shadow-md" 
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span className="text-2xl mr-3">📞</span>
              Contact
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative md:fixed top-0 left-0 w-full min-h-screen flex items-center justify-center z-10">
        {/* Background Image with sepia effect */}
        <div className="absolute inset-0 bg-gray-200">
          <div className="absolute inset-0">
            <div className="h-full w-full bg-[url('https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1920')] bg-cover bg-center opacity-40"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent"></div>
          </div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 py-24 md:py-20">
          <div className="max-w-4xl mx-auto text-center">
            {/* Logo */}
            <div className="mb-8 md:mt-0 flex justify-center items-center">
        <Image
                src="/LOGOPNG.png" 
                alt="Logo La Serrure de Paris" 
                width={384}
                height={384}
                className="w-48 h-48 md:w-96 md:h-96 object-contain"
              />
            </div>
            
            {/* Tagline */}
            <p className="text-base md:text-2xl font-semibold text-gray-800 mb-4">
              La Serrure, serrurier à Paris et en Seine-Saint-Denis, intervient 7j/7 pour vos urgences : ouverture de porte, changement de serrure, dépannage rapide et tarifs transparents.
            </p>
            
            {/* Buttons */}
            <div className="flex flex-col gap-4 items-center mb-10">
              {/* Top row: Orange and White buttons side by side */}
              <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-start">
                <a href="tel:+33664784213" className="text-white px-6 py-3 md:px-10 md:py-5 rounded-xl flex items-center justify-center gap-3 font-bold text-base md:text-xl transition shadow-lg" style={{background: 'linear-gradient(135deg, #ea580c 0%, #f59e0b 50%, #fb923c 100%)'}}>
                  <svg className="w-5 h-5 md:w-7 md:h-7" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
                  <span>06 64 78 42 13</span>
                </a>
                <button className="bg-white border-4 border-blue-600 text-blue-600 px-6 py-3 md:px-10 md:py-5 rounded-xl flex items-center justify-center gap-3 font-bold text-base md:text-xl hover:bg-blue-50 transition shadow-lg">
                  <span>Nos prestations</span>
                  <span className="text-2xl">→</span>
                </button>
              </div>
              
              {/* Bottom: Green button centered */}
              <div className="flex justify-center w-full">
                <a href="https://wa.me/33664784213" target="_blank" rel="noopener noreferrer" className="text-white px-6 py-3 md:px-10 md:py-5 rounded-xl flex items-center gap-3 font-bold text-base md:text-xl transition shadow-lg" style={{background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)'}}>
                  <span className="text-2xl md:text-3xl">💬</span>
                  <span>Contacter sur WhatsApp</span>
                </a>
              </div>
            </div>
            
            {/* Service Info */}
            <div className="flex flex-col gap-3 justify-center items-center text-gray-700">
              <div className="flex items-center gap-3 text-sm md:text-xl">
                <span className="text-red-500 text-xl md:text-2xl">✗</span>
                <span className="font-medium">Service d'urgence 7j/7 - même les jours fériés</span>
              </div>
              <div className="flex items-center gap-3 text-sm md:text-xl">
                <span className="text-yellow-500 text-xl md:text-2xl">⚡</span>
                <span className="font-medium">Intervention en moins de 30 minutes</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Qui sommes-nous Section */}
      <section id="about" className="py-2 md:py-16 bg-white relative z-20 scroll-mt-20 md:mt-[100vh]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Mobile: Accordéon */}
            <button 
              onClick={() => setIsAboutOpen(!isAboutOpen)}
              className="md:hidden w-full flex flex-col items-center gap-2 text-3xl font-bold mb-4 text-blue-800"
            >
              <span>Qui sommes-nous ?</span>
              <svg 
                className={`w-6 h-6 transition-transform duration-300 ${isAboutOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Desktop: Titre normal */}
            <h2 className="hidden md:block text-3xl md:text-5xl font-bold text-center mb-8 text-blue-800">Qui sommes-nous ?</h2>
            
            {/* Contenu avec animation */}
            <div className={`prose prose-lg max-w-none text-gray-700 space-y-4 md:block transition-all duration-500 ease-in-out overflow-hidden ${
              isAboutOpen 
                ? 'max-h-[2000px] opacity-100 pt-4 md:pt-0' 
                : 'max-h-0 opacity-0 md:max-h-none md:opacity-100'
            }`}>
              {isAboutOpen && (
                <>
                  <div className="md:hidden border-t border-gray-300 mb-4"></div>
                </>
              )}
              <p className="text-base md:text-xl leading-relaxed">
                Basée entre Paris et la Seine-Saint-Denis, La Serrure est une entreprise de serrurerie artisanale spécialisée dans le dépannage rapide et les interventions d'urgence. Nous mettons notre savoir-faire au service des particuliers et des professionnels pour l'ouverture de portes claquées, le remplacement de serrures, la pose de verrous ou encore le blindage de portes.
              </p>
              <p className="text-base md:text-xl leading-relaxed">
                Notre priorité : votre sécurité et votre tranquillité. Avec des interventions en moins de 30 minutes et des tarifs toujours annoncés à l'avance, nous garantissons un service honnête, efficace et sans mauvaise surprise.
              </p>
              <p className="text-base md:text-xl leading-relaxed">
                Que vous soyez à Paris (75), Montreuil, Pantin, Saint-Denis ou dans une commune voisine, vous pouvez compter sur un artisan serrurier de confiance, disponible 7j/7, y compris les week-ends et jours fériés.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="pt-2 pb-8 md:py-16 bg-white relative z-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-4 text-blue-800">Nos prestations & tarifs</h2>
          <p className="text-base md:text-xl text-center mb-6 md:mb-12 text-gray-700">Tarifs transparents et intervention rapide pour tous vos besoins de serrurerie</p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-amber-25 border border-gray-200 rounded-lg overflow-hidden shadow-lg relative flex flex-col h-full transition-transform duration-300 hover:scale-105 hover:shadow-xl">
              <div className="h-48 bg-amber-25 relative flex items-center justify-center">
                <Image src="/1.jpeg" alt="Porte" fill className="object-cover" />
                <span className="absolute top-4 right-4 bg-white px-4 py-2 rounded-lg font-bold z-10" style={{color: '#2563eb'}}>90€</span>
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-2xl font-bold mb-3 text-blue-800">Ouverture de porte claquée</h3>
                <p className="text-gray-700 mb-4 flex-grow">Vous êtes sorti en oubliant vos clés ? Pas de panique. Nous intervenons rapidement pour ouvrir la porte sans l'endommager.</p>
                <a href="#services" className="text-blue-700 hover:underline mb-4 inline-block">En savoir plus →</a>
                <a href="tel:+33664784213" className="w-full bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 font-semibold hover:bg-blue-600 transition mt-auto">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
                  <span>Nous contacter</span>
                </a>
              </div>
            </div>
            <div className="bg-amber-25 border border-gray-200 rounded-lg overflow-hidden shadow-lg relative flex flex-col h-full transition-transform duration-300 hover:scale-105 hover:shadow-xl">
              <div className="h-48 bg-amber-25 relative flex items-center justify-center">
                <Image src="/2.jpeg" alt="Porte blindée" fill className="object-cover" />
                <span className="absolute top-4 right-4 bg-white px-4 py-2 rounded-lg font-bold z-10" style={{color: '#2563eb'}}>120€</span>
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-2xl font-bold mb-3 text-blue-800">Ouverture de porte blindée claquée</h3>
                <p className="text-gray-700 mb-4 flex-grow">Même en cas de porte blindée claquée, notre équipement permet une ouverture fine, sans destruction.</p>
                <a href="#services" className="text-blue-700 hover:underline mb-4 inline-block">En savoir plus →</a>
                <a href="tel:+33664784213" className="w-full bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 font-semibold hover:bg-blue-600 transition mt-auto">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
                  <span>Nous contacter</span>
                </a>
              </div>
            </div>
            <div className="bg-amber-25 border border-gray-200 rounded-lg overflow-hidden shadow-lg relative flex flex-col h-full transition-transform duration-300 hover:scale-105 hover:shadow-xl">
              <div className="h-48 bg-amber-25 relative flex items-center justify-center">
                <Image src="/3.webp" alt="Clé" fill className="object-cover" />
                <span className="absolute top-4 right-4 bg-white px-4 py-2 rounded-lg font-bold z-10" style={{color: '#2563eb'}}>130€</span>
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-2xl font-bold mb-3 text-blue-800">Ouverture de porte simple fermée à clé</h3>
                <p className="text-gray-700 mb-4 flex-grow">Clé perdue ? Porte verrouillée ? Nous débloquons l'accès de manière propre, avec explication claire.</p>
                <a href="#services" className="text-blue-700 hover:underline mb-4 inline-block">En savoir plus →</a>
                <a href="tel:+33664784213" className="w-full bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 font-semibold hover:bg-blue-600 transition mt-auto">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
                  <span>Nous contacter</span>
                </a>
              </div>
            </div>
            <div className="bg-amber-25 border border-gray-200 rounded-lg overflow-hidden shadow-lg relative flex flex-col h-full transition-transform duration-300 hover:scale-105 hover:shadow-xl">
              <div className="h-48 bg-amber-25 relative flex items-center justify-center">
                <Image src="/4.webp" alt="Porte blindée fermée" fill className="object-cover" />
                <span className="absolute top-4 right-4 bg-white px-4 py-2 rounded-lg font-bold z-10" style={{color: '#2563eb'}}>170€</span>
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-2xl font-bold mb-3 text-blue-800">Ouverture de porte blindée fermée à clé</h3>
                <p className="text-gray-700 mb-4 flex-grow">Une situation délicate qui demande du matériel spécialisé et du savoir-faire. Sécurité maximale, intervention nette.</p>
                <a href="#services" className="text-blue-700 hover:underline mb-4 inline-block">En savoir plus →</a>
                <a href="tel:+33664784213" className="w-full bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 font-semibold hover:bg-blue-600 transition mt-auto">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
                  <span>Nous contacter</span>
                </a>
              </div>
            </div>
            <div className="bg-amber-25 border border-gray-200 rounded-lg overflow-hidden shadow-lg relative flex flex-col h-full transition-transform duration-300 hover:scale-105 hover:shadow-xl">
              <div className="h-48 bg-amber-25 relative flex items-center justify-center">
                <Image src="/5.webp" alt="Changement de serrure" fill className="object-cover" />
                <span className="absolute top-4 right-4 bg-white px-4 py-2 rounded-lg font-bold z-10" style={{color: '#2563eb'}}>À partir de 80€</span>
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-2xl font-bold mb-3 text-blue-800">Changement de serrure</h3>
                <p className="text-gray-700 mb-4 flex-grow">Serrure usée, cassée ou après effraction : nous remplaçons par du matériel de qualité, compatible avec vos besoins et votre budget.</p>
                <a href="#services" className="text-blue-700 hover:underline mb-4 inline-block">En savoir plus →</a>
                <a href="tel:+33664784213" className="w-full bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 font-semibold hover:bg-blue-600 transition mt-auto">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
                  <span>Nous contacter</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Service Section */}
      <section className="py-16 bg-gray-50 relative z-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-white rounded-2xl shadow-xl p-4 md:p-8" style={{background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)'}}>
            {/* Top Section */}
            <div className="text-center mb-4 md:mb-8">
              <h2 className="text-xl md:text-3xl font-bold mb-4 flex items-center justify-center gap-3">
                <span className="text-red-500 text-xl md:text-2xl">🔑⭐</span>
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
                <span className="text-xl" style={{color: '#f59e0b'}}>🕐</span>
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
      <section className="py-8 md:py-16 bg-amber-25 relative z-20">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-4 text-blue-800">Pourquoi choisir La Serrure de Paris ?</h2>
          <p className="text-base md:text-xl text-center text-gray-700 mb-6 md:mb-12 max-w-3xl mx-auto">
            Notre engagement : vous offrir un service de qualité avec transparence et professionnalisme
          </p>

          <div className="grid md:grid-cols-4 gap-4 md:gap-8">
            {/* Card 1: Réactivité */}
            <div className="bg-white rounded-xl p-6 text-center shadow-lg transition-transform duration-300 hover:scale-105 hover:shadow-xl">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{backgroundColor: '#f59e0b'}}>
                <span className="text-3xl text-white">⚡</span>
              </div>
              <h3 className="text-2xl font-bold mb-2 text-blue-800">Réactivité</h3>
              <p className="text-gray-700">Moins de 30 minutes sur site</p>
            </div>

            {/* Card 2: Honnêteté */}
            <div className="bg-white rounded-xl p-6 text-center shadow-lg transition-transform duration-300 hover:scale-105 hover:shadow-xl">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{backgroundColor: '#f59e0b'}}>
                <span className="text-3xl text-white">🤝</span>
              </div>
              <h3 className="text-2xl font-bold mb-2 text-blue-800">Honnêteté</h3>
              <p className="text-gray-700">Diagnostic clair, devis immédiat</p>
            </div>

            {/* Card 3: Efficacité */}
            <div className="bg-white rounded-xl p-6 text-center shadow-lg transition-transform duration-300 hover:scale-105 hover:shadow-xl">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{backgroundColor: '#f59e0b'}}>
                <span className="text-3xl text-white">🎯</span>
              </div>
              <h3 className="text-2xl font-bold mb-2 text-blue-800">Efficacité</h3>
              <p className="text-gray-700">Chaque geste compte, pas de perte de temps</p>
            </div>

            {/* Card 4: Artisan expérimenté */}
            <div className="bg-white rounded-xl p-6 text-center shadow-lg transition-transform duration-300 hover:scale-105 hover:shadow-xl">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{backgroundColor: '#f59e0b'}}>
                <span className="text-3xl text-white">🔧</span>
              </div>
              <h3 className="text-2xl font-bold mb-2 text-blue-800">Artisan expérimenté</h3>
              <p className="text-gray-700">Outillage pro et respect du matériel</p>
            </div>
          </div>
        </div>
      </section>

      {/* Zone d'intervention Section */}
      <section id="zone" className="py-8 md:py-16 bg-white relative z-20 scroll-mt-20">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-4 text-blue-800">Zone d'intervention</h2>
          <p className="text-base md:text-xl text-center text-gray-700 mb-6 md:mb-12 max-w-3xl mx-auto">
            Nous intervenons rapidement dans toute l'Île de France
          </p>

          <div className="grid md:grid-cols-2 gap-4 md:gap-8">
            {/* Left Content Block (Blue Card) */}
            <div className="relative rounded-2xl p-4 md:p-8 shadow-lg flex flex-col items-center justify-center text-center overflow-hidden h-full min-h-[300px] md:min-h-[400px]">
              {/* Background Image */}
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1920')] bg-cover bg-center blur-sm"></div>
                <div className="absolute inset-0 bg-blue-700 opacity-60"></div>
              </div>
              
              {/* Content */}
              <div className="relative z-10 text-white">
                <div className="text-4xl md:text-6xl mb-4" style={{color: '#f59e0b'}}>📍</div>
                <h3 className="text-xl md:text-3xl font-bold mb-2">Île de France</h3>
                <p className="text-base md:text-xl mb-4 md:mb-6">Intervention rapide dans toute la zone</p>
                <div className="px-6 md:px-8 py-3 md:py-4 rounded-full font-bold text-xl md:text-3xl mb-4 inline-flex items-center justify-center" style={{backgroundColor: '#f59e0b', opacity: 0.9}}>
                  &lt; 30 min
                </div>
                <p className="text-sm md:text-lg">Temps d'intervention moyen</p>
              </div>
            </div>

            {/* Right Content Block (White Card) */}
            <div className="bg-white rounded-2xl p-4 md:p-8 shadow-lg border border-gray-200">
              <h3 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-blue-800">Villes d'intervention principales</h3>
              <div className="grid grid-cols-2 gap-4 text-gray-700 text-base">
                <div className="space-y-2">
                  <p className="flex items-center gap-2"><span style={{color: '#f59e0b'}}>📍</span>Paris intra-muros (12e, 19e, 20e...)</p>
                  <p className="flex items-center gap-2"><span style={{color: '#f59e0b'}}>📍</span>Bobigny</p>
                  <p className="flex items-center gap-2"><span style={{color: '#f59e0b'}}>📍</span>Noisy-le-Sec</p>
                  <p className="flex items-center gap-2"><span style={{color: '#f59e0b'}}>📍</span>Bagnolet</p>
                  <p className="flex items-center gap-2"><span style={{color: '#f59e0b'}}>📍</span>Romainville</p>
                </div>
                <div className="space-y-2">
                  <p className="flex items-center gap-2"><span style={{color: '#f59e0b'}}>📍</span>Montreuil</p>
                  <p className="flex items-center gap-2"><span style={{color: '#f59e0b'}}>📍</span>Pantin</p>
                  <p className="flex items-center gap-2"><span style={{color: '#f59e0b'}}>📍</span>Saint-Denis</p>
                  <p className="flex items-center gap-2"><span style={{color: '#f59e0b'}}>📍</span>Les Lilas</p>
                  <p className="flex items-center gap-2"><span style={{color: '#f59e0b'}}>📍</span>Vincennes</p>
                </div>
              </div>
              <div className="bg-amber-25 rounded-xl p-6 mt-8">
                <p className="font-bold mb-2 text-gray-900">Zone élargie :</p>
                <p className="text-gray-700">Nous pouvons également intervenir dans les communes limitrophes. N'hésitez pas à nous contacter pour vérifier la faisabilité de votre demande.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Need Locksmith Now Section */}
      <section id="contact" className="py-8 md:py-16 bg-blue-700 text-white relative z-20 scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-4xl font-bold mb-4">Besoin d'un serrurier maintenant ?</h2>
            <p className="text-base md:text-xl mb-6 md:mb-8">Une urgence ? Un problème de serrure ? Nous sommes là pour vous aider !</p>
            
            {/* Availability Box */}
            <div className="bg-blue-700 rounded-xl p-4 md:p-8 mb-6 md:mb-12 inline-block">
              <div className="flex items-center gap-2 md:gap-4 justify-center">
                <span className="text-2xl md:text-4xl">🕐</span>
                <div className="text-left">
                  <p className="text-lg md:text-2xl font-bold">Disponible 7j/7</p>
                  <p className="text-base md:text-xl">24h/24</p>
                </div>
              </div>
            </div>

            {/* Call to Action Buttons */}
            <div className="space-y-4 mb-6 md:mb-8 max-w-xs mx-auto">
              <a href="tel:+33664784213" className="w-full text-white px-6 py-3 md:px-8 md:py-4 rounded-xl flex items-center justify-center gap-3 font-bold text-base md:text-lg transition shadow-lg" style={{background: 'linear-gradient(135deg, #ea580c 0%, #f59e0b 50%, #fb923c 100%)'}}>
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
                <span>06 64 78 42 13</span>
              </a>
              <a href="https://wa.me/33664784213" target="_blank" rel="noopener noreferrer" className="w-full text-white px-6 py-3 md:px-8 md:py-4 rounded-xl flex items-center justify-center gap-3 font-bold text-base md:text-lg transition shadow-lg" style={{background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)'}}>
                <span className="text-xl md:text-2xl">💬</span>
                <span>Contacter sur WhatsApp</span>
              </a>
            </div>

            {/* Service Promises */}
            <div className="text-sm md:text-lg space-x-4 md:space-x-6">
              <span className="inline-block">Appel gratuit</span>
              <span className="inline-block">-</span>
              <span className="inline-block">Devis immédiat</span>
              <span className="inline-block">-</span>
              <span className="inline-block">Intervention rapide</span>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact-form" className="py-8 md:py-16 bg-white relative z-20 scroll-mt-20 hidden md:block">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-6 md:mb-12 text-blue-800">Contactez-nous</h2>
          <div className="max-w-2xl mx-auto">
            <form className="space-y-6">
              <div>
                <label className="block mb-2 font-semibold text-gray-700">Nom complet</label>
                <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900" required />
              </div>
              <div>
                <label className="block mb-2 font-semibold text-gray-700">Téléphone</label>
                <input type="tel" className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900" required />
              </div>
              <div>
                <label className="block mb-2 font-semibold text-gray-700">Email</label>
                <input type="email" className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900" required />
              </div>
              <div>
                <label className="block mb-2 font-semibold text-gray-700">Message</label>
                <textarea rows={5} className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900" required></textarea>
              </div>
              <button type="submit" className="w-full bg-blue-700 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-600 transition">
                Envoyer la demande
              </button>
            </form>
            <div className="mt-12 text-center">
              <p className="text-xl font-bold mb-2 text-blue-800">Ou appelez-nous directement</p>
              <a href="tel:+33664784213" className="text-3xl font-bold text-blue-800 hover:underline">06 64 78 42 13</a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-3 relative z-20" style={{backgroundColor: '#1a1e29'}}>
        <div className="container mx-auto px-4">
          {/* Upper Section - Three Columns */}
          <div className="grid md:grid-cols-3 gap-8 md:gap-12 mb-8">
            {/* Left Column: Contact */}
            <div>
              <h3 className="text-xl font-bold mb-6 text-orange-400">Contactez-nous</h3>
              <div className="space-y-4">
                <a href="tel:+33664784213" className="flex items-center gap-3 hover:text-orange-400 transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center group-hover:bg-orange-600 transition-colors">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                    </svg>
                  </div>
                  <span className="font-medium">06 64 78 42 13</span>
                </a>
                <a href="mailto:la.serrure.93@gmail.com" className="flex items-center gap-3 hover:text-orange-400 transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center group-hover:bg-orange-600 transition-colors">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="font-medium">la.serrure.93@gmail.com</span>
                </a>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <span className="font-medium">Paris (75) & Seine-Saint-Denis (93)</span>
                </div>
              </div>
            </div>

            {/* Middle Column: Hours */}
            <div>
              <h3 className="text-xl font-bold mb-6 text-orange-400">Horaires</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="font-medium">Tous les jours</span>
                </div>
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 inline-block">
                  <p className="text-3xl font-bold text-white">24h/24</p>
                </div>
                <p className="text-gray-400">Y compris week-ends et jours fériés</p>
              </div>
            </div>

            {/* Right Column: Logo and Slogan */}
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-60 h-60 md:w-72 md:h-72 relative">
                  <Image src="/LOGOPNG.png" alt="Logo La Serrure de Paris" fill className="object-contain" />
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">Votre serrurier de confiance à Paris & Seine-Saint-Denis</p>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">SARL La Serrure de Paris - Siret : 123 456 789 00012</p>
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 hover:from-orange-500 hover:to-orange-600 flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-110"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
