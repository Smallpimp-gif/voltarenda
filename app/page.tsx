// Главная страница лендинга — просто композиция секций сверху вниз.

import { StickyHeader } from "@/components/sticky-header";
import { Hero } from "@/components/hero";
import { HowItWorksSection } from "@/components/how-it-works-section";
import { BikeSection } from "@/components/bike-section";
import { TariffsSection } from "@/components/tariffs-section";
import { CalculatorSection } from "@/components/calculator-section";
import { CompareSection } from "@/components/compare-section";
import { LocationSection } from "@/components/location-section";
import { FaqSection } from "@/components/faq-section";
import { TrustBar } from "@/components/trust-bar";
import { FooterSection } from "@/components/footer-section";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { TelegramButton } from "@/components/telegram-button";
import { CookieConsent } from "@/components/cookie-consent";

export default function Home() {
  return (
    <>
      <StickyHeader />
      <main id="main" className="overflow-x-clip">
        <Hero />
        <CalculatorSection />
        <HowItWorksSection />
        <BikeSection />
        <TariffsSection />
        <CompareSection />
        <LocationSection />
        <FaqSection />
        <TrustBar />
        <FooterSection />
      </main>
      <MobileBottomNav />
      <TelegramButton />
      <CookieConsent />
    </>
  );
}
