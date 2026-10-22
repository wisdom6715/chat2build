import { AudienceSection, CtaBanner, FaqSection, Footer, Header, Hero, LearningSection, PricingSection, RoadmapSection, TeamSection } from './components/site'
import { WhatsAppSupport } from './components/WhatsApp'
import { RegistrationProvider } from './components/RegistrationModal'

export default function HomePage() {
  return (
    <RegistrationProvider>
      <main>
        <Header />
        <Hero />
        <LearningSection />
        <RoadmapSection />
        <AudienceSection />
        <PricingSection />
        <TeamSection />
        <FaqSection />
        <CtaBanner />
        <Footer />
        <WhatsAppSupport />
      </main>
    </RegistrationProvider>
  )
}
