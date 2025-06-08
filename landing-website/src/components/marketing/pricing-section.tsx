'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Check, Star, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const plans = [
  {
    name: 'Essential',
    price: 299,
    description: 'Perfect for small practices and individual cardiologists',
    features: [
      'Up to 100 ECG analyses per month',
      'Basic cardiac imaging analysis',
      'Real-time monitoring for 5 patients',
      'Standard clinical reports',
      'Email support',
      'HIPAA compliance',
    ],
    limitations: [
      'No predictive analytics',
      'Limited integration options'
    ],
    popular: false,
    cta: 'Start Free Trial'
  },
  {
    name: 'Professional',
    price: 599,
    description: 'Ideal for cardiology departments and clinics',
    features: [
      'Up to 500 ECG analyses per month',
      'Advanced cardiac imaging with AI',
      'Real-time monitoring for 25 patients',
      'Comprehensive clinical reports',
      'Predictive analytics dashboard',
      'API integrations',
      'Priority phone support',
      'Custom alert protocols',
      'Team collaboration tools'
    ],
    limitations: [],
    popular: true,
    cta: 'Start Free Trial'
  },
  {
    name: 'Enterprise',
    price: null,
    description: 'For hospitals and large healthcare systems',
    features: [
      'Unlimited ECG analyses',
      'Full AI-powered cardiac suite',
      'Unlimited patient monitoring',
      'Advanced predictive analytics',
      'Custom integrations & APIs',
      'Dedicated account manager',
      '24/7 phone & chat support',
      'Custom training programs',
      'White-label options',
      'Advanced security features',
      'Multi-location support'
    ],
    limitations: [],
    popular: false,
    cta: 'Contact Sales'
  }
]

const addOns = [
  {
    name: 'Advanced Analytics',
    price: 99,
    description: 'Enhanced reporting and population health insights'
  },
  {
    name: 'Mobile App',
    price: 49,
    description: 'iOS and Android apps for on-the-go monitoring'
  },
  {
    name: 'Additional Storage',
    price: 29,
    description: 'Extra 1TB of secure cloud storage per month'
  }
]

export function PricingSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
              Pricing
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Choose Your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">
                Perfect Plan
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Flexible pricing options designed to scale with your practice. 
              Start with a 30-day free trial, no credit card required.
            </p>
          </motion.div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className={`h-full relative ${
                plan.popular 
                  ? 'border-primary shadow-xl scale-105' 
                  : 'border-gray-200 shadow-lg'
              } hover:shadow-xl transition-all duration-300`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      Most Popular
                    </span>
                  </div>
                )}
                
                <CardHeader className="text-center pb-8 pt-8">
                  <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </CardTitle>
                  <div className="mb-4">
                    {plan.price ? (
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold text-gray-900">
                          ${plan.price}
                        </span>
                        <span className="text-gray-600">/month</span>
                      </div>
                    ) : (
                      <div className="text-4xl font-bold text-gray-900">
                        Custom
                      </div>
                    )}
                  </div>
                  <p className="text-gray-600">
                    {plan.description}
                  </p>
                </CardHeader>

                <CardContent className="pt-0">
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                    {plan.limitations.map((limitation, limitIndex) => (
                      <li key={`limit-${limitIndex}`} className="flex items-start gap-3 opacity-50">
                        <div className="w-5 h-5 mt-0.5 flex-shrink-0 flex items-center justify-center">
                          <div className="w-3 h-0.5 bg-gray-400"></div>
                        </div>
                        <span className="text-gray-500">{limitation}</span>
                      </li>
                    ))}
                  </ul>                  <Link 
                    href={
                      plan.cta === 'Start Free Trial' 
                        ? '/auth/register' 
                        : plan.cta === 'Contact Sales' 
                        ? '/contact' 
                        : '/auth/register'
                    }
                    className="block w-full"
                  >
                    <Button 
                      className={`w-full ${
                        plan.popular 
                          ? 'bg-primary hover:bg-primary/90' 
                          : 'bg-gray-900 hover:bg-gray-800'
                      }`}
                      size="lg"
                    >
                      {plan.cta}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Add-ons Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white rounded-2xl p-8 shadow-lg"
        >
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Enhance Your Plan with Add-ons
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {addOns.map((addOn, index) => (
              <div key={index} className="text-center p-6 border border-gray-200 rounded-lg hover:border-primary transition-colors">
                <div className="text-2xl font-bold text-primary mb-2">
                  +${addOn.price}/mo
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  {addOn.name}
                </h4>
                <p className="text-gray-600 text-sm">
                  {addOn.description}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Money-back guarantee */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-12"
        >
          <div className="inline-flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-full">
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">30-day money-back guarantee</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
