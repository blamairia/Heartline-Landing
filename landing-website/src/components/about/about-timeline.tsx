import { Badge } from '@/components/ui/badge'
import { Calendar, Award, Users, Zap } from 'lucide-react'

const timelineEvents = [
  {
    year: '2020',
    quarter: 'Q1',
    title: 'Company Founded',
    description: 'Hearline established by leading cardiologists and AI researchers from Stanford and MIT.',
    icon: Users,
    type: 'founding'
  },
  {
    year: '2020',
    quarter: 'Q4',
    title: 'First AI Model',
    description: 'Developed initial ECG analysis algorithm with 95% accuracy using deep learning.',
    icon: Zap,
    type: 'technology'
  },
  {
    year: '2021',
    quarter: 'Q2',
    title: 'Clinical Validation',
    description: 'Completed clinical trials at 5 major medical centers with outstanding results.',
    icon: Award,
    type: 'milestone'
  },
  {
    year: '2021',
    quarter: 'Q4',
    title: 'Product Launch',
    description: 'Launched Hearline platform to first 50 healthcare partners across North America.',
    icon: Calendar,
    type: 'product'
  },
  {
    year: '2022',
    quarter: 'Q2',
    title: 'International Expansion',
    description: 'Extended services to Europe and Asia, serving 200+ healthcare facilities.',
    icon: Users,
    type: 'growth'
  },
  {
    year: '2022',
    quarter: 'Q4',
    title: 'Advanced Analytics',
    description: 'Introduced predictive analytics and risk stratification capabilities.',
    icon: Zap,
    type: 'technology'
  },
  {
    year: '2023',
    quarter: 'Q2',
    title: 'Major Milestone',
    description: 'Analyzed 5 million ECGs with 98.5% accuracy rate across global network.',
    icon: Award,
    type: 'milestone'
  },
  {
    year: '2023',
    quarter: 'Q4',
    title: 'AI Breakthrough',
    description: 'Achieved 99.2% accuracy with next-generation neural network architecture.',
    icon: Zap,
    type: 'technology'
  },
  {
    year: '2024',
    quarter: 'Q1',
    title: 'Global Recognition',
    description: 'Won "Best Medical AI Innovation" at Healthcare Technology Awards.',
    icon: Award,
    type: 'milestone'
  },
  {
    year: '2024',
    quarter: 'Q3',
    title: 'Platform Evolution',
    description: 'Launched comprehensive cardiac management suite with integrated workflow.',
    icon: Calendar,
    type: 'product'
  }
]

const typeColors: Record<string, string> = {
  founding: 'bg-purple-100 text-purple-600 border-purple-200',
  technology: 'bg-blue-100 text-blue-600 border-blue-200',
  milestone: 'bg-green-100 text-green-600 border-green-200',
  product: 'bg-orange-100 text-orange-600 border-orange-200',
  growth: 'bg-indigo-100 text-indigo-600 border-indigo-200'
}

export function AboutTimeline() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Journey</h2>
            <p className="text-xl text-gray-600">
              From startup to global leader in AI-powered cardiac care technology
            </p>
          </div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>

            <div className="space-y-8">
              {timelineEvents.map((event, index) => (
                <div key={index} className="relative flex items-start gap-6">
                  {/* Timeline Dot */}
                  <div className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center border-4 border-white shadow-lg ${typeColors[event.type]}`}>
                    <event.icon className="w-6 h-6" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 bg-gray-50 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs font-medium">
                          {event.year} {event.quarter}
                        </Badge>
                        <Badge variant="secondary" className={`text-xs ${typeColors[event.type]} border`}>
                          {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
                    <p className="text-gray-600">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Future Timeline Indicator */}
            <div className="relative flex items-start gap-6 mt-8">
              <div className="relative z-10 w-16 h-16 rounded-full flex items-center justify-center border-4 border-white shadow-lg bg-gradient-to-br from-blue-100 to-purple-100">
                <div className="w-3 h-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
              </div>
              <div className="flex-1 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-dashed border-blue-200">
                <h3 className="text-xl font-bold text-gray-900 mb-2">The Future</h3>
                <p className="text-gray-600">
                  We're continuing to innovate with new AI capabilities, expanding globally, 
                  and working towards our vision of universal access to expert cardiac care.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
