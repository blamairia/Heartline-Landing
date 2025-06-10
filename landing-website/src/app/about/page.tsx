import { Metadata } from 'next'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { AboutHero } from '@/components/about/about-hero'
import { AboutMission } from '@/components/about/about-mission'
import { AboutTeam } from '@/components/about/about-team'
import { AboutTimeline } from '@/components/about/about-timeline'
import { AboutValues } from '@/components/about/about-values'

export const metadata: Metadata = {
  title: 'About Us | Heartline',
  description: 'Learn about Heartline\'s mission to revolutionize cardiac care through AI-powered technology and our commitment to improving patient outcomes.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <AboutHero />
        <AboutMission />
        <AboutValues />
        <AboutTimeline />
        <AboutTeam />
      </main>
      <Footer />
    </div>
  )
}
