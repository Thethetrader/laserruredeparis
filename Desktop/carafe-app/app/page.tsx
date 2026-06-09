import CustomCursor from "@/components/landing/CustomCursor";
import Navigation from "@/components/landing/sections/Navigation";
import HeroSection from "@/components/landing/sections/HeroSection";
import ProblemSection from "@/components/landing/sections/ProblemSection";
import PillarsSection from "@/components/landing/sections/PillarsSection";
import AppPreviewSection from "@/components/landing/sections/AppPreviewSection";
import PricingSection from "@/components/landing/sections/PricingSection";
import FAQSection from "@/components/landing/sections/FAQSection";
import CTASection from "@/components/landing/sections/CTASection";
import FooterSection from "@/components/landing/sections/FooterSection";

export default function Home() {
  return (
    <div data-theme="light" style={{ background: "#fafaf7" }}>
      <CustomCursor />
      <Navigation />
      <main>
        <HeroSection />
        <ProblemSection />
        <PillarsSection />
        <AppPreviewSection />
        <PricingSection />
        <FAQSection />
        <CTASection />
      </main>
      <FooterSection />
    </div>
  );
}
