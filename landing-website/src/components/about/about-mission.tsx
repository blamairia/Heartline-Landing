import { Card, CardContent } from '@/components/ui/card'
import { Heart, Target, Lightbulb } from 'lucide-react'

export function AboutMission() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              To democratize access to world-class cardiac care by making AI-powered 
              diagnostic tools accessible to healthcare providers everywhere.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Mission */}
            <Card className="border-2 border-red-100 bg-red-50/50">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Heart className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Mission</h3>
                <p className="text-gray-600 leading-relaxed">
                  Empower healthcare providers with AI-driven insights that improve 
                  cardiac care outcomes while reducing diagnostic time and costs.
                </p>
              </CardContent>
            </Card>

            {/* Vision */}
            <Card className="border-2 border-blue-100 bg-blue-50/50">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Target className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Vision</h3>
                <p className="text-gray-600 leading-relaxed">
                  A world where every patient has access to expert-level cardiac 
                  diagnosis regardless of their location or healthcare setting.
                </p>
              </CardContent>
            </Card>

            {/* Innovation */}
            <Card className="border-2 border-green-100 bg-green-50/50">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Lightbulb className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Innovation</h3>
                <p className="text-gray-600 leading-relaxed">
                  Continuously advancing AI technology through research partnerships 
                  and real-world clinical validation to stay at the forefront.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Story Section */}
          <div className="mt-20 bg-gray-50 rounded-2xl p-8 lg:p-12">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h3>
                <div className="space-y-4 text-gray-600">
                  <p>
                    Hearline was born from a simple observation: while AI was transforming 
                    many industries, healthcare providers still struggled with manual, 
                    time-intensive cardiac diagnosis processes.
                  </p>
                  <p>
                    Founded in 2020 by a team of cardiologists and AI researchers from 
                    leading medical institutions, we set out to bridge this gap by creating 
                    the world's most accurate and accessible AI-powered ECG analysis platform.
                  </p>
                  <p>
                    Today, our platform serves healthcare providers across 25+ countries, 
                    analyzing millions of ECGs and helping improve patient outcomes through 
                    faster, more accurate cardiac diagnostics.
                  </p>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <h4 className="text-xl font-semibold text-gray-900 mb-6">Key Milestones</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    <div>
                      <div className="font-medium text-gray-900">2020 - Founded</div>
                      <div className="text-sm text-gray-600">Company established by medical AI experts</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    <div>
                      <div className="font-medium text-gray-900">2021 - First Product</div>
                      <div className="text-sm text-gray-600">AI ECG analysis platform launched</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    <div>
                      <div className="font-medium text-gray-900">2023 - Global Expansion</div>
                      <div className="text-sm text-gray-600">Serving 500+ healthcare facilities worldwide</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                    <div>
                      <div className="font-medium text-gray-900">2024 - Next Generation</div>
                      <div className="text-sm text-gray-600">Advanced AI platform with 99.2% accuracy</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
