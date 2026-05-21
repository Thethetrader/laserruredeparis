import Navigation from "@/components/sections/Navigation";
import HeroSection from "@/components/sections/HeroSection";
import ProblemSection from "@/components/sections/ProblemSection";
import SolutionSection from "@/components/sections/SolutionSection";
import PillarsSection from "@/components/sections/PillarsSection";
import AutomationSection from "@/components/sections/AutomationSection";
import ShowcaseSection from "@/components/sections/ShowcaseSection";
import EmployeeSection from "@/components/sections/EmployeeSection";
import PricingSection from "@/components/sections/PricingSection";
import FAQSection from "@/components/sections/FAQSection";
import CTASection from "@/components/sections/CTASection";
import FooterSection from "@/components/sections/FooterSection";

export default function Home() {
  return (
    <>
      <Navigation />
      <main>
        <HeroSection />
        <ProblemSection />
        <SolutionSection />
        <PillarsSection />
        <AutomationSection />
        <ShowcaseSection />
        <EmployeeSection />
        <PricingSection />
        <FAQSection />
        <CTASection />
      </main>
      <FooterSection />
    </>
  );
}
