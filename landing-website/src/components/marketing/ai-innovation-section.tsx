'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Brain, Heart, BarChart3, Shield, Zap, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const features = [
  {
    icon: Brain,
    title: 'Advanced AI Analysis',
    description: 'Our proprietary AI algorithms analyze ECGs, echocardiograms, and cardiac imaging with 98.5% accuracy, detecting subtle patterns that human eyes might miss.',
    color: 'text-primary'
  },
  {
    icon: Heart,
    title: 'Real-time Monitoring',
    description: 'Continuous cardiac monitoring with instant alerts for critical conditions, ensuring immediate intervention when needed.',
    color: 'text-red-500'
  },
  {
    icon: BarChart3,
    title: 'Predictive Analytics',
    description: 'Machine learning models predict cardiac events up to 30 days in advance, enabling proactive patient care and prevention.',
    color: 'text-blue-500'
  },
  {
    icon: Shield,
    title: 'HIPAA Compliant',
    description: 'Enterprise-grade security with end-to-end encryption, ensuring patient data privacy and regulatory compliance.',
    color: 'text-green-500'
  },
  {
    icon: Zap,
    title: 'Instant Insights',
    description: 'Get comprehensive cardiac assessments in under 30 seconds, dramatically reducing diagnosis time and improving workflow.',
    color: 'text-yellow-500'
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Seamless collaboration tools for cardiac teams, with secure sharing and real-time consultations across departments.',
    color: 'text-purple-500'
  }
]

const stats = [
  { value: '98.5%', label: 'Diagnostic Accuracy' },
  { value: '30s', label: 'Average Analysis Time' },
  { value: '50+', label: 'Healthcare Partners' },
  { value: '10k+', label: 'Patients Monitored' }
]

export function AIInnovationSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
              AI Innovation
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              The Future of{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">
                Cardiac Care
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powered by cutting-edge artificial intelligence, Hearline transforms cardiac diagnosis 
              and monitoring with unprecedented accuracy and speed.
            </p>
          </motion.div>
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20"
        >
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                {stat.value}
              </div>
              <div className="text-gray-600 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <CardContent className="p-8">
                  <div className={`inline-flex p-3 rounded-lg bg-gray-50 ${feature.color} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-16"
        >
          <Link href="/demo">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              See AI in Action
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
