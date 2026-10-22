import { AudienceSection, CtaBanner, FaqSection, Footer, Header, Hero, LearningSection, PricingSection, RoadmapSection, TeamSection } from './components/site'
import { WhatsAppSupport } from './components/WhatsApp'

export default function HomePage() {
  return (
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
  )
}
