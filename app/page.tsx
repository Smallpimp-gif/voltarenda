// Главная страница лендинга — просто композиция секций сверху вниз.

import { StickyHeader } from "@/components/sticky-header";
import { Hero } from "@/components/hero";
import { HowItWorksSection } from "@/components/how-it-works-section";
import { BikeSection } from "@/components/bike-section";
import { ConfiguratorSection } from "@/components/configurator-section";
import { TariffsSection } from "@/components/tariffs-section";
import { CalculatorSection } from "@/components/calculator-section";
import { CompareSection } from "@/components/compare-section";
import { TestimonialsSection } from "@/components/testimonials-section";
import { LocationSection } from "@/components/location-section";
import { FaqSection } from "@/components/faq-section";
import { TrustBar } from "@/components/trust-bar";
import { FooterSection } from "@/components/footer-section";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { TelegramButton } from "@/components/telegram-button";
import { CookieConsent } from "@/components/cookie-consent";
import { getAvailableBikes } from "@/lib/settings";

export default async function Home() {
  const availableBikes = getAvailableBikes();
  return (
    <>
      <StickyHeader />
      <main id="main" className="overflow-x-clip">
        <Hero availableBikes={availableBikes} />
        <HowItWorksSection />
        <BikeSection />
        <ConfiguratorSection />
        <TariffsSection />
        <CalculatorSection />
        <CompareSection />
        <TestimonialsSection />
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
