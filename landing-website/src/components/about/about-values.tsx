import { Card, CardContent } from '@/components/ui/card'
import { Shield, Users, Zap, Globe, Award, Heart } from 'lucide-react'

const values = [
  {
    icon: Shield,
    title: 'Patient Safety First',
    description: 'Every decision we make prioritizes patient safety and clinical accuracy above all else.',
    color: 'bg-red-100 text-red-600'
  },
  {
    icon: Users,
    title: 'Healthcare Partnership',
    description: 'We work alongside healthcare providers as partners, not just technology vendors.',
    color: 'bg-blue-100 text-blue-600'
  },
  {
    icon: Zap,
    title: 'Continuous Innovation',
    description: 'We constantly push the boundaries of what\'s possible in medical AI technology.',
    color: 'bg-yellow-100 text-yellow-600'
  },
  {
    icon: Globe,
    title: 'Global Accessibility',
    description: 'Quality cardiac care should be accessible to everyone, everywhere in the world.',
    color: 'bg-green-100 text-green-600'
  },
  {
    icon: Award,
    title: 'Clinical Excellence',
    description: 'We maintain the highest standards of clinical validation and regulatory compliance.',
    color: 'bg-purple-100 text-purple-600'
  },
  {
    icon: Heart,
    title: 'Compassionate Care',
    description: 'Behind every data point is a patient whose life we can help improve.',
    color: 'bg-pink-100 text-pink-600'
  }
]

export function AboutValues() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Values</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The principles that guide everything we do at Heartline, from product 
              development to customer relationships.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-8">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-6 ${value.color}`}>
                    <value.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{value.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Commitment Section */}
          <div className="mt-20 text-center">
            <div className="bg-white rounded-2xl p-8 lg:p-12 shadow-lg">
              <h3 className="text-3xl font-bold text-gray-900 mb-6">Our Commitment</h3>
              <div className="grid lg:grid-cols-3 gap-8 text-left">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">To Healthcare Providers</h4>
                  <p className="text-gray-600">
                    We provide reliable, accurate tools that integrate seamlessly into your 
                    workflow and enhance your clinical decision-making capabilities.
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">To Patients</h4>
                  <p className="text-gray-600">
                    We work tirelessly to ensure that our technology contributes to better 
                    health outcomes and improved quality of life for cardiac patients worldwide.
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">To Innovation</h4>
                  <p className="text-gray-600">
                    We invest heavily in research and development to stay at the forefront 
                    of medical AI and continue advancing the field.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
