import { Metadata } from 'next'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ContactHero } from '@/components/contact/contact-hero'
import { ContactForm } from '@/components/contact/contact-form'
import { ContactInfo } from '@/components/contact/contact-info'
import { ContactFAQ } from '@/components/contact/contact-faq'

export const metadata: Metadata = {
  title: 'Contact Us | Heartline',
  description: 'Get in touch with the Heartline team. We\'re here to help with questions about our AI-powered cardiac management platform.',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <ContactHero />
        <div className="container mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <ContactForm />
            </div>
            <div>
              <ContactInfo />
            </div>
          </div>
        </div>
        <ContactFAQ />
      </main>
      <Footer />
    </div>
  )
}
