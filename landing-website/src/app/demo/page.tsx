import { Metadata } from 'next'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { DemoForm } from '@/components/demo/demo-form'
import { DemoFeatures } from '@/components/demo/demo-features'

export const metadata: Metadata = {
  title: 'Request Demo | Heartline',
  description: 'See Heartline AI-powered cardiac management system in action. Schedule a personalized demo.',
}

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main>
        {/* Header */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                See Heartline in Action
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Schedule a personalized demo and discover how our AI-powered platform 
                can transform your cardiac care workflow.
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Demo Form */}
            <div>
              <DemoForm />
            </div>

            {/* Features */}
            <div>
              <DemoFeatures />
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
