import { Metadata } from 'next'
import { AboutHero } from '@/components/about/about-hero'
import { AboutMission } from '@/components/about/about-mission'
import { AboutTeam } from '@/components/about/about-team'
import { AboutTimeline } from '@/components/about/about-timeline'
import { AboutValues } from '@/components/about/about-values'

export const metadata: Metadata = {
  title: 'About Us | Hearline',
  description: 'Learn about Hearline\'s mission to revolutionize cardiac care through AI-powered technology and our commitment to improving patient outcomes.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <AboutHero />
      <AboutMission />
      <AboutValues />
      <AboutTimeline />
      <AboutTeam />
    </div>
  )
}
