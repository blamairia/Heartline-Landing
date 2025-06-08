'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Heart, Shield, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

const benefits = [
  {
    icon: Heart,
    title: 'Better Patient Outcomes',
    description: 'Improve diagnosis accuracy and reduce cardiac mortality rates'
  },
  {
    icon: Shield,
    title: 'Risk-Free Trial',
    description: '30-day money-back guarantee with full feature access'
  },
  {
    icon: Clock,
    title: 'Quick Implementation',
    description: 'Get started in minutes with our seamless onboarding'
  }
]

export function CTASection() {  return (
    <section className="py-20 bg-gradient-to-br from-primary to-blue-600 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/5 rounded-full blur-xl animate-pulse delay-500"></div>

      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Transform Your{' '}
              <span className="text-yellow-300">
                Cardiac Care
              </span>{' '}
              Today
            </h2>
            <p className="text-xl md:text-2xl text-blue-100 max-w-4xl mx-auto leading-relaxed">
              Join leading healthcare institutions worldwide in revolutionizing cardiac diagnosis 
              and patient monitoring with AI-powered precision.
            </p>
          </motion.div>
        </div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid md:grid-cols-3 gap-8 mb-12"
        >
          {benefits.map((benefit, index) => (
            <div key={index} className="text-center">
              <div className="inline-flex p-4 bg-white/10 rounded-2xl mb-4 backdrop-blur-sm">
                <benefit.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {benefit.title}
              </h3>
              <p className="text-blue-100">
                {benefit.description}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Main CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mb-12"
        >
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="bg-white text-primary hover:bg-gray-100 text-lg px-8 py-4 h-auto group">
              Start Your Free Trial
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white/30 text-white hover:bg-white/10 text-lg px-8 py-4 h-auto backdrop-blur-sm"
            >
              Schedule a Demo
            </Button>
          </div>
          <p className="text-blue-100 mt-4 text-sm">
            No credit card required • 30-day free trial • Setup in 5 minutes
          </p>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center"
        >
          <p className="text-blue-200 mb-6">
            Trusted by 500+ healthcare providers worldwide
          </p>
          
          {/* Logos placeholder - in real implementation, these would be actual client logos */}
          <div className="flex justify-center items-center gap-8 opacity-60">
            <div className="bg-white/20 px-6 py-3 rounded-lg backdrop-blur-sm">
              <span className="text-white font-semibold">Stanford Medical</span>
            </div>
            <div className="bg-white/20 px-6 py-3 rounded-lg backdrop-blur-sm">
              <span className="text-white font-semibold">Mayo Clinic</span>
            </div>
            <div className="bg-white/20 px-6 py-3 rounded-lg backdrop-blur-sm">
              <span className="text-white font-semibold">Johns Hopkins</span>
            </div>
            <div className="bg-white/20 px-6 py-3 rounded-lg backdrop-blur-sm">
              <span className="text-white font-semibold">Cleveland Clinic</span>
            </div>
          </div>
        </motion.div>

        {/* Urgency Element */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-12"
        >
          <div className="inline-flex items-center gap-2 bg-yellow-400 text-gray-900 px-4 py-2 rounded-full font-medium animate-pulse">
            <div className="w-2 h-2 bg-gray-900 rounded-full"></div>
            <span>Limited time: Get 2 months free on annual plans</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
