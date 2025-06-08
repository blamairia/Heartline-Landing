import { Badge } from '@/components/ui/badge'
import { Mail, Phone, MessageCircle } from 'lucide-react'

export function ContactHero() {
  return (
    <section className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            Contact Us
          </Badge>
          
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Get in Touch with 
            <span className="text-blue-600"> Our Team</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Have questions about Hearline? Need technical support? Want to schedule a demo? 
            We're here to help and typically respond within 24 hours.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="flex items-center gap-2 text-gray-600">
              <Phone className="w-5 h-5 text-blue-600" />
              <span>+1 (555) HEARLINE</span>
            </div>
            <div className="hidden sm:block w-px h-6 bg-gray-300"></div>
            <div className="flex items-center gap-2 text-gray-600">
              <Mail className="w-5 h-5 text-blue-600" />
              <span>hello@hearline.ai</span>
            </div>
            <div className="hidden sm:block w-px h-6 bg-gray-300"></div>
            <div className="flex items-center gap-2 text-gray-600">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              <span>24h response time</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
