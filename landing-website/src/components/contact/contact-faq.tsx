'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { HelpCircle, Plus, Minus } from 'lucide-react'
import { useState } from 'react'

const faqs = [
  {
    category: 'General',
    questions: [
      {
        question: 'What is Hearline and how does it work?',
        answer: 'Hearline is an AI-powered cardiac management platform that analyzes ECGs, automates workflows, and provides intelligent insights to healthcare providers. Our deep learning algorithms analyze cardiac rhythms with 99.2% accuracy, helping clinicians make faster, more accurate diagnoses.'
      },
      {
        question: 'Who can use Hearline?',
        answer: 'Hearline is designed for hospitals, clinics, cardiology practices, and healthcare systems of all sizes. Our platform serves cardiologists, cardiac nurses, ECG technicians, and healthcare administrators worldwide.'
      },
      {
        question: 'How quickly can I get started with Hearline?',
        answer: 'Implementation typically takes 2-4 weeks depending on your setup. We provide full onboarding support, training, and integration assistance to ensure a smooth transition.'
      }
    ]
  },
  {
    category: 'Technical',
    questions: [
      {
        question: 'Does Hearline integrate with existing EHR systems?',
        answer: 'Yes, Hearline integrates with major EHR systems including Epic, Cerner, AllScripts, and many others. We also offer API integration for custom systems.'
      },
      {
        question: 'What are the system requirements?',
        answer: 'Hearline is a cloud-based platform accessible through any modern web browser. For ECG devices, we support most major manufacturers and can integrate with existing equipment.'
      },
      {
        question: 'Is my data secure and HIPAA compliant?',
        answer: 'Absolutely. Hearline is fully HIPAA compliant with end-to-end encryption, secure data centers, and comprehensive audit trails. We maintain SOC 2 Type II certification and undergo regular security audits.'
      }
    ]
  },
  {
    category: 'Pricing & Support',
    questions: [
      {
        question: 'How is Hearline priced?',
        answer: 'We offer flexible subscription plans based on your patient volume and feature needs. Plans start at $299/month for small practices, with enterprise solutions available. Contact us for a custom quote.'
      },
      {
        question: 'What kind of support do you provide?',
        answer: 'We provide 24/7 technical support for critical issues, comprehensive training programs, dedicated customer success managers for enterprise clients, and extensive documentation and resources.'
      },
      {
        question: 'Do you offer a free trial?',
        answer: 'Yes, we offer a 30-day free trial with full access to our platform features. We also provide free demos and proof-of-concept deployments for qualified organizations.'
      }
    ]
  },
  {
    category: 'Implementation',
    questions: [
      {
        question: 'How long does implementation take?',
        answer: 'Standard implementation takes 2-4 weeks, including system integration, data migration, staff training, and go-live support. Complex enterprise deployments may take 6-8 weeks.'
      },
      {
        question: 'What training and support is included?',
        answer: 'We provide comprehensive training for all user roles, including live sessions, recorded materials, and hands-on practice environments. Ongoing support includes regular check-ins and advanced training sessions.'
      },
      {
        question: 'Can you help migrate our existing data?',
        answer: 'Yes, our implementation team assists with data migration from existing systems, ensuring historical ECG data and patient records are properly transferred and accessible in Hearline.'
      }
    ]
  }
]

export function ContactFAQ() {
  const [openItems, setOpenItems] = useState<string[]>([])

  const toggleItem = (id: string) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Can't find what you're looking for? Contact our team directly.
            </p>
          </div>

          <div className="space-y-8">
            {faqs.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary" className="text-sm">
                    {category.category}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  {category.questions.map((faq, questionIndex) => {
                    const itemId = `${categoryIndex}-${questionIndex}`
                    const isOpen = openItems.includes(itemId)
                    
                    return (
                      <Card key={questionIndex} className="overflow-hidden">
                        <CardHeader 
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => toggleItem(itemId)}
                        >
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-medium text-gray-900 pr-4">
                              {faq.question}
                            </CardTitle>
                            <div className="flex-shrink-0">
                              {isOpen ? (
                                <Minus className="w-5 h-5 text-gray-500" />
                              ) : (
                                <Plus className="w-5 h-5 text-gray-500" />
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        {isOpen && (
                          <CardContent className="pt-0">
                            <p className="text-gray-600 leading-relaxed">
                              {faq.answer}
                            </p>
                          </CardContent>
                        )}
                      </Card>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Contact CTA */}
          <div className="mt-12 text-center">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-8">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <HelpCircle className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Still have questions?
                </h3>
                <p className="text-gray-600 mb-6">
                  Our team is here to help. Get in touch and we'll respond within 24 hours.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Contact Support
                  </Button>
                  <Button variant="outline">
                    Schedule a Call
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
