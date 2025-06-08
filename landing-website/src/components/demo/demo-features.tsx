import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Brain, 
  Zap, 
  Shield, 
  BarChart3, 
  Clock, 
  Users, 
  CheckCircle,
  Play,
  Stethoscope,
  TrendingUp,
  AlertTriangle,
  Database
} from 'lucide-react'

const demoFeatures = [
  {
    icon: Brain,
    title: 'AI-Powered ECG Analysis',
    description: 'See our advanced neural networks analyze ECGs in real-time with 99.2% accuracy',
    highlights: ['Real-time analysis', 'Pattern recognition', 'Anomaly detection'],
    duration: '5 min'
  },
  {
    icon: Zap,
    title: 'Automated Workflow',
    description: 'Experience seamless integration with your existing systems and automated reporting',
    highlights: ['EHR integration', 'Auto-reporting', 'Smart alerts'],
    duration: '5 min'
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Explore comprehensive dashboards and predictive analytics for better outcomes',
    highlights: ['Predictive models', 'Trend analysis', 'Custom reports'],
    duration: '10 min'
  },
  {
    icon: Shield,
    title: 'Compliance & Security',
    description: 'Learn about our HIPAA-compliant, enterprise-grade security features',
    highlights: ['HIPAA compliant', 'End-to-end encryption', 'Audit trails'],
    duration: '5 min'
  }
]

const benefits = [
  {
    icon: Clock,
    title: 'Save 4+ Hours Daily',
    description: 'Automate routine ECG analysis and reduce manual review time'
  },
  {
    icon: TrendingUp,
    title: '99.2% Accuracy',
    description: 'Industry-leading AI accuracy with continuous learning capabilities'
  },
  {
    icon: Users,
    title: 'Improved Patient Care',
    description: 'Faster diagnosis and treatment recommendations for better outcomes'
  },
  {
    icon: Database,
    title: 'Seamless Integration',
    description: 'Works with your existing EHR systems and workflow'
  }
]

const testimonialPreview = {
  quote: "The demo showed us exactly how Hearline could transform our cardiology department. The AI accuracy was impressive and the workflow integration was seamless.",
  author: "Dr. Sarah Chen",
  role: "Chief of Cardiology",
  organization: "Metro General Hospital"
}

export function DemoFeatures() {
  return (
    <div className="space-y-8">
      {/* What You'll See */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5 text-blue-600" />
            What You'll See in the Demo
          </CardTitle>
          <CardDescription>
            A comprehensive 30-minute walkthrough of Hearline's key capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {demoFeatures.map((feature, index) => (
              <div key={index} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{feature.title}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {feature.duration}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{feature.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {feature.highlights.map((highlight, idx) => (
                      <div key={idx} className="flex items-center gap-1 text-xs text-gray-500">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        {highlight}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Benefits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-green-600" />
            Key Benefits You'll Discover
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 text-sm">{benefit.title}</h4>
                  <p className="text-xs text-gray-600 mt-1">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Testimonial Preview */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <blockquote className="text-gray-700 mb-4 italic">
              "{testimonialPreview.quote}"
            </blockquote>
            <div className="text-sm">
              <div className="font-medium text-gray-900">{testimonialPreview.author}</div>
              <div className="text-gray-600">{testimonialPreview.role}</div>
              <div className="text-gray-500">{testimonialPreview.organization}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demo Guarantee */}
      <Card className="border-2 border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-green-900 mb-2">Our Demo Promise</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Customized to your specific use case
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Real data scenarios (anonymized)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Direct access to our AI specialists
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Implementation roadmap discussion
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card className="bg-gray-50">
        <CardContent className="p-6 text-center">
          <h4 className="font-medium text-gray-900 mb-2">Questions before the demo?</h4>
          <p className="text-sm text-gray-600 mb-4">
            Our team is here to help you prepare for the most valuable demo experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center text-sm">
            <a href="mailto:demo@hearline.ai" className="text-blue-600 hover:underline">
              demo@hearline.ai
            </a>
            <span className="hidden sm:inline text-gray-400">|</span>
            <a href="tel:+1-555-HEARLINE" className="text-blue-600 hover:underline">
              +1 (555) HEARLINE
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
