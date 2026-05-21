import Header from './components/Header';
import HeroSection from './components/HeroSection';
import PartnersSection from './components/PartnersSection';
import EcosystemSection from './components/EcosystemSection';
import ProgramsSection from './components/ProgramsSection';
import StaffSection from './components/StaffSection';
import ReviewsSection from './components/ReviewsSection';
import QualiopiStatsSection from './components/QualiopiStatsSection';
import SectionsGrid from './components/SectionsGrid';
import Footer from './components/Footer';

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <PartnersSection />
        <EcosystemSection />
        <ProgramsSection />
        <StaffSection />
        <ReviewsSection />
        <QualiopiStatsSection />
        <SectionsGrid />
      </main>
      <Footer />
    </>
  );
}
