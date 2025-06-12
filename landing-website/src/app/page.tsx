'use client'; 

import { useSession } from 'next-auth/react'; 
import { HeroSection } from '@/components/marketing/hero-section'
import { FeaturesSection } from '@/components/marketing/features-section'
import { AIInnovationSection } from '@/components/marketing/ai-innovation-section'
import { PricingSection } from '@/components/marketing/pricing-section'
import { TestimonialsSection } from '@/components/marketing/testimonials-section'
import { CTASection } from '@/components/marketing/cta-section'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

export default function HomePage() {
  const { data: session, status } = useSession(); 
  const isAuthenticated = status === 'authenticated';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        <HeroSection />
        <AIInnovationSection />
        <FeaturesSection />
        <PricingSection isAuthenticated={isAuthenticated} />
        <TestimonialsSection />
        <CTASection />
      </main>
      
      <Footer />
    </div>
  )
}
