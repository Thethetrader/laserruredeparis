import CustomCursor from "@/components/landing/CustomCursor";
import Navigation from "@/components/landing/sections/Navigation";
import HeroSection from "@/components/landing/sections/HeroSection";
import ProblemSection from "@/components/landing/sections/ProblemSection";
import PillarsSection from "@/components/landing/sections/PillarsSection";
import AutomationSection from "@/components/landing/sections/AutomationSection";
import ShowcaseSection from "@/components/landing/sections/ShowcaseSection";
import EmployeeSection from "@/components/landing/sections/EmployeeSection";
import PricingSection from "@/components/landing/sections/PricingSection";
import FAQSection from "@/components/landing/sections/FAQSection";
import CTASection from "@/components/landing/sections/CTASection";
import FooterSection from "@/components/landing/sections/FooterSection";

export default function Home() {
  return (
    <>
      <CustomCursor />
      <Navigation />
      <main>
        <HeroSection />
        <ProblemSection />
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
