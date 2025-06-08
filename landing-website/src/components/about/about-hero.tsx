import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Heart, Award, Users, Globe } from 'lucide-react'

const stats = [
  { value: '10M+', label: 'ECGs Analyzed', icon: Heart },
  { value: '500+', label: 'Healthcare Partners', icon: Users },
  { value: '25+', label: 'Countries Served', icon: Globe },
  { value: '99.2%', label: 'AI Accuracy Rate', icon: Award }
]

export function AboutHero() {
  return (
    <section className="relative bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-20">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-4">
            About Hearline
          </Badge>
          
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Revolutionizing Cardiac Care Through
            <span className="text-blue-600"> AI Innovation</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Founded by cardiologists and AI researchers, Hearline combines deep medical expertise 
            with cutting-edge artificial intelligence to transform how cardiac conditions are 
            diagnosed, monitored, and treated worldwide.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Our Story
            </Button>
            <Button size="lg" variant="outline">
              Meet the Team
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <stat.icon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200 rounded-full opacity-20 blur-3xl"></div>
      </div>
    </section>
  )
}
