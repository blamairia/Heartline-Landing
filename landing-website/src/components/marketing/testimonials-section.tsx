'use client'

import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const testimonials = [
  {
    name: 'Dr. Sarah Chen',
    title: 'Chief of Cardiology',
    hospital: 'Stanford Medical Center',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face',
    rating: 5,
    text: "Hearline has revolutionized our cardiac care workflow. The AI accuracy is remarkable - it caught a subtle MI that we initially missed. Our diagnosis time has decreased by 60%, and patient outcomes have significantly improved.",
    highlight: 'Decreased diagnosis time by 60%'
  },
  {
    name: 'Dr. Michael Rodriguez',
    title: 'Interventional Cardiologist',
    hospital: 'Mayo Clinic',
    image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face',
    rating: 5,
    text: "The predictive analytics feature is incredible. We've been able to identify high-risk patients 2-3 weeks before events occur, allowing us to intervene proactively. This technology is the future of cardiology.",
    highlight: 'Predicts events 2-3 weeks early'
  },
  {
    name: 'Dr. Emily Watson',
    title: 'Director of Cardiac ICU',
    hospital: 'Johns Hopkins Hospital',
    image: 'https://images.unsplash.com/photo-1594824947938-2dec368ac73c?w=400&h=400&fit=crop&crop=face',
    rating: 5,
    text: "The real-time monitoring capabilities have transformed our ICU operations. The intelligent alerts are precise - no false alarms, only genuine emergencies. Our response time to critical events has improved dramatically.",
    highlight: 'Eliminated false alarms'
  },
  {
    name: 'Dr. James Patterson',
    title: 'Chief Medical Officer',
    hospital: 'Cleveland Clinic',
    image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face',
    rating: 5,
    text: "Implementing Hearline across our network was seamless. The ROI has been exceptional - reduced readmissions, faster diagnoses, and improved patient satisfaction. Our cardiac mortality rates have dropped by 18%.",
    highlight: '18% reduction in cardiac mortality'
  },
  {
    name: 'Dr. Lisa Chang',
    title: 'Cardiac Electrophysiologist',
    hospital: 'Mass General Brigham',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face',
    rating: 5,
    text: "The arrhythmia detection is phenomenal. It identifies complex rhythm disorders that would take us hours to analyze manually. The automated reports are comprehensive and save us significant documentation time.",
    highlight: 'Saves hours of analysis time'
  },
  {
    name: 'Dr. Robert Kim',
    title: 'Director of Cardiology',
    hospital: 'UCLA Medical Center',
    image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face',
    rating: 5,
    text: "The team collaboration features have enhanced our multidisciplinary approach. Specialists can review cases remotely, and the secure sharing capabilities have improved our consultation efficiency by 40%.",
    highlight: '40% improvement in consultation efficiency'
  }
]

const stats = [
  { value: '98.5%', label: 'Customer Satisfaction' },
  { value: '500+', label: 'Healthcare Providers' },
  { value: '50k+', label: 'Patients Helped' },
  { value: '4.9/5', label: 'Average Rating' }
]

export function TestimonialsSection() {
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
              Testimonials
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Trusted by{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">
                Leading Cardiologists
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join hundreds of healthcare professionals who have transformed their 
              cardiac care with Hearline's AI-powered platform.
            </p>
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16"
        >
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                {stat.value}
              </div>
              <div className="text-gray-600 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <CardContent className="p-8">
                  {/* Quote Icon */}
                  <div className="text-primary/20 mb-4">
                    <Quote className="w-8 h-8" />
                  </div>

                  {/* Rating */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>

                  {/* Testimonial Text */}
                  <p className="text-gray-700 mb-6 leading-relaxed">
                    "{testimonial.text}"
                  </p>

                  {/* Highlight */}
                  <div className="bg-primary/5 text-primary px-3 py-2 rounded-lg text-sm font-medium mb-6">
                    {testimonial.highlight}
                  </div>

                  {/* Author */}
                  <div className="flex items-center gap-4">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-semibold text-gray-900">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {testimonial.title}
                      </div>
                      <div className="text-sm text-primary font-medium">
                        {testimonial.hospital}
                      </div>
                    </div>
                  </div>
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
            Join the Revolution in Cardiac Care
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            See why leading cardiologists trust Hearline to deliver exceptional patient outcomes. 
            Start your free trial today and experience the difference.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium">
              Start Free Trial
            </button>
            <button className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
              Schedule Demo
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
