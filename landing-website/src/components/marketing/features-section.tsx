'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Activity, Stethoscope, Clock, AlertTriangle, TrendingUp, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const features = [
  {
    icon: Activity,
    title: 'ECG Analysis',
    description: 'Advanced 12-lead ECG interpretation with arrhythmia detection, ST-segment analysis, and heart rate variability assessment.',
    benefits: ['Instant arrhythmia detection', 'ST-elevation identification', 'QT interval monitoring'],
    gradient: 'from-red-500 to-pink-500'
  },
  {
    icon: Stethoscope,
    title: 'Cardiac Imaging',
    description: 'AI-powered analysis of echocardiograms, cardiac MRI, and CT scans for comprehensive structural assessment.',
    benefits: ['Ejection fraction calculation', 'Wall motion analysis', 'Valve function assessment'],
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    icon: Clock,
    title: 'Real-time Monitoring',
    description: 'Continuous patient monitoring with intelligent alerts and automated risk stratification.',
    benefits: ['24/7 monitoring', 'Smart alert system', 'Risk score calculation'],
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    icon: AlertTriangle,
    title: 'Critical Alerts',
    description: 'Immediate notifications for life-threatening conditions with customizable escalation protocols.',
    benefits: ['Instant critical alerts', 'Escalation protocols', 'Mobile notifications'],
    gradient: 'from-orange-500 to-red-500'
  },
  {
    icon: TrendingUp,
    title: 'Predictive Analytics',
    description: 'Machine learning models that predict cardiac events and identify high-risk patients.',
    benefits: ['Event prediction', 'Risk stratification', 'Outcome forecasting'],
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    icon: FileText,
    title: 'Clinical Reports',
    description: 'Automated generation of comprehensive clinical reports with evidence-based recommendations.',
    benefits: ['Automated reporting', 'Clinical insights', 'Treatment recommendations'],
    gradient: 'from-indigo-500 to-blue-500'
  }
]

export function FeaturesSection() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
              Features
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Comprehensive{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">
                Cardiac Solutions
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From diagnosis to monitoring, our AI-powered platform provides everything 
              you need for advanced cardiac care.
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${feature.gradient} text-white group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-xl font-semibold text-gray-900">
                      {feature.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {feature.description}
                  </p>
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <li key={benefitIndex} className="flex items-center gap-2 text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-16 p-8 bg-gradient-to-r from-primary/5 to-blue-50 rounded-2xl"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Transform Your Cardiac Care?
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Join leading healthcare institutions that have already improved patient outcomes 
            with Heartline's AI-powered cardiac management system.
          </p>          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/demo">
              <Button className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium">
                Request Demo
              </Button>
            </Link>
            <Link href="#pricing">
              <Button variant="outline" className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                View Pricing
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
