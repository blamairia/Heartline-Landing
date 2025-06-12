'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Image from 'next/image'; // Import the Next.js Image component
import { 
  Heart, 
  Brain, 
  Users, 
  Pill, 
  Play,
  ArrowRight,
  Sparkles
} from 'lucide-react'

export function HeroSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.2,
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  }

  const features = [
    {
      icon: Brain,
      text: "AI ECG Analysis",
      color: "text-blue-600"
    },
    {
      icon: Pill,
      text: "7000+ Medications",
      color: "text-green-600"
    },
    {
      icon: Users,
      text: "Complete Practice Management",
      color: "text-purple-600"
    }
  ]

  const stats = [
    { number: "95%", label: "Faster Diagnosis" },
    { number: "7000+", label: "Medications" },
    { number: "9", label: "Cardiac Conditions" }
  ]

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Background Animation */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse" />
        <div className="absolute top-40 right-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000" />
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000" />
      </div>

      <div className="container mx-auto px-4 pt-20 pb-16 relative z-10">
        <motion.div
          className="grid lg:grid-cols-2 gap-12 items-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Left Column - Content */}
          <div className="text-center lg:text-left">
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Revolutionary AI Technology
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight"
            >
              Transform Your{' '}
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Cardiology Practice
              </span>{' '}
              with AI
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0"
            >
              Heartline combines cutting-edge AI ECG analysis with comprehensive patient management, 
              featuring 7000+ Algerian medications and real-time diagnostics to revolutionize 
              cardiovascular care.
            </motion.p>

            {/* Feature Pills */}
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap justify-center lg:justify-start gap-4 mb-8"
            >
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center px-4 py-2 bg-white rounded-full shadow-md border"
                >
                  <feature.icon className={`w-4 h-4 mr-2 ${feature.color}`} />
                  <span className="text-sm font-medium text-gray-700">
                    {feature.text}
                  </span>
                </div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12"
            >
              <Link href="/demo">
                <Button size="xl" className="group bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg">
                  <Play className="w-5 h-5 mr-2" />
                  Watch Demo
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="xl" variant="outline" className="border-2">
                  Learn More
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-3 gap-8 text-center lg:text-left"
            >
              {stats.map((stat, index) => (
                <div key={index}>
                  <div className="text-2xl lg:text-3xl font-bold text-primary mb-1">
                    {stat.number}
                  </div>
                  <div className="text-sm text-gray-600">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right Column - Visual */}
          <motion.div
            variants={itemVariants}
            className="relative"
          >
            <div className="relative">
              {/* Main Dashboard Preview */}
              <div className="relative z-10 bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Replace the placeholder div with the Image component */}
                <Image
                  src="/preview.png" // Path relative to the 'public' directory
                  alt="Hearline Dashboard Preview"
                  width={600} // Adjust width as needed for your layout
                  height={375} // Adjust height to maintain aspect ratio or fit layout
                  layout="responsive" // Makes the image scale with the container
                  priority // Consider adding priority if this image is above the fold
                  className="object-cover" // Ensures the image covers the area, might crop
                />
              </div>

              {/* Floating Cards */}
              <motion.div
                className="absolute -top-4 -left-4 bg-white rounded-xl shadow-lg p-4 border"
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Brain className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">AI Analysis</div>
                    <div className="text-xs text-gray-500">87% Confidence</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="absolute -bottom-4 -right-4 bg-white rounded-xl shadow-lg p-4 border"
                animate={{
                  y: [0, 10, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Pill className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Medication DB</div>
                    <div className="text-xs text-gray-500">7000+ Drugs</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="absolute top-1/2 -left-8 bg-white rounded-xl shadow-lg p-4 border"
                animate={{
                  x: [0, -5, 0],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 2
                }}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Patients</div>
                    <div className="text-xs text-gray-500">Real-time</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
