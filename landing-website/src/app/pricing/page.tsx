import { Metadata } from 'next'
import { PricingContent } from '@/components/pricing/pricing-content'

export const metadata: Metadata = {
  title: 'Pricing | Hearline',
  description: 'Choose the perfect plan for your medical practice.',
}

export default function PricingPage() {
  return <PricingContent />
}
