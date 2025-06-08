import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Linkedin, Twitter, Mail } from 'lucide-react'

const leadership = [
  {
    name: 'Dr. Sarah Chen',
    role: 'CEO & Co-Founder',
    bio: 'Former Chief of Cardiology at Stanford Medical Center with 15+ years in interventional cardiology and AI research.',
    education: 'MD Harvard, PhD Stanford',
    specialties: ['Interventional Cardiology', 'Medical AI', 'Clinical Research'],
    linkedin: '#',
    twitter: '#',
    email: 'sarah.chen@hearline.ai'
  },
  {
    name: 'Dr. Michael Rodriguez',
    role: 'CTO & Co-Founder',
    bio: 'Former Principal Scientist at Google Health, specialized in deep learning applications for medical imaging.',
    education: 'PhD MIT, MS Stanford',
    specialties: ['Machine Learning', 'Medical Imaging', 'Neural Networks'],
    linkedin: '#',
    twitter: '#',
    email: 'michael.rodriguez@hearline.ai'
  },
  {
    name: 'Dr. Emily Thompson',
    role: 'Chief Medical Officer',
    bio: 'Board-certified cardiologist and former director of cardiac electrophysiology at Mayo Clinic.',
    education: 'MD Johns Hopkins, Fellowship Mayo Clinic',
    specialties: ['Electrophysiology', 'Arrhythmia Management', 'Clinical Validation'],
    linkedin: '#',
    twitter: '#',
    email: 'emily.thompson@hearline.ai'
  },
  {
    name: 'James Park',
    role: 'VP of Engineering',
    bio: 'Former Senior Engineering Manager at Apple Health, expert in scalable healthcare technology platforms.',
    education: 'MS Computer Science UC Berkeley',
    specialties: ['Healthcare Tech', 'Platform Architecture', 'Mobile Health'],
    linkedin: '#',
    twitter: '#',
    email: 'james.park@hearline.ai'
  }
]

const advisors = [
  {
    name: 'Dr. Robert Kim',
    role: 'Medical Advisory Board',
    affiliation: 'Director of Cardiology, Cleveland Clinic'
  },
  {
    name: 'Dr. Lisa Wang',
    role: 'AI Advisory Board',
    affiliation: 'Professor of AI, Stanford University'
  },
  {
    name: 'David Johnson',
    role: 'Healthcare Strategy Advisor',
    affiliation: 'Former VP, Philips Healthcare'
  }
]

export function AboutTeam() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Meet Our Team</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A diverse team of medical professionals, AI researchers, and technology experts 
              united by our mission to transform cardiac care.
            </p>
          </div>

          {/* Leadership Team */}
          <div className="mb-20">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Leadership Team</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
              {leadership.map((leader, index) => (
                <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-0">
                    <div className="p-8">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-xl font-bold text-gray-900">{leader.name}</h4>
                          <p className="text-blue-600 font-medium">{leader.role}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Linkedin className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Mail className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-4 leading-relaxed">{leader.bio}</p>
                      
                      <div className="mb-4">
                        <Badge variant="outline" className="text-xs mb-2">
                          {leader.education}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {leader.specialties.map((specialty, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Advisory Board */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Advisory Board</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {advisors.map((advisor, index) => (
                <Card key={index} className="text-center">
                  <CardContent className="p-6">
                    <h4 className="font-semibold text-gray-900 mb-2">{advisor.name}</h4>
                    <p className="text-sm text-blue-600 mb-2">{advisor.role}</p>
                    <p className="text-sm text-gray-600">{advisor.affiliation}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Company Culture */}
          <div className="bg-white rounded-2xl p-8 lg:p-12">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">Join Our Mission</h3>
              <p className="text-xl text-gray-600">
                We're always looking for talented individuals who share our passion for 
                improving healthcare through technology.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 mb-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🌍</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Global Impact</h4>
                <p className="text-sm text-gray-600">Work on technology that improves lives worldwide</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🚀</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Innovation</h4>
                <p className="text-sm text-gray-600">Push the boundaries of medical AI technology</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🤝</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Collaboration</h4>
                <p className="text-sm text-gray-600">Work with leading medical and AI experts</p>
              </div>
            </div>

            <div className="text-center">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                View Open Positions
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
