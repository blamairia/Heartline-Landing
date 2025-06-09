import { Metadata } from 'next'
import { PricingFunctional } from '@/components/pricing/pricing-functional'

export const metadata: Metadata = {
  title: 'Pricing | Hearline',
  description: 'Choose the perfect plan for your medical practice.',
}

export default function PricingPage() {
  return <PricingFunctional />
}
