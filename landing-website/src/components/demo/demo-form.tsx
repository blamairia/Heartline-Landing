'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, Calendar, Users, Building, AlertCircle } from 'lucide-react'

const demoFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name must be less than 50 characters'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name must be less than 50 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  jobTitle: z.string().min(1, 'Job title is required').max(100, 'Job title must be less than 100 characters'),
  organizationName: z.string().min(1, 'Organization name is required').max(100, 'Organization name must be less than 100 characters'),
  organizationType: z.string().min(1, 'Please select an organization type'),
  organizationSize: z.string().min(1, 'Please select organization size'),
  currentECGSystem: z.string().optional(),
  primaryUseCase: z.string().min(1, 'Please select a primary use case'),
  interestedFeatures: z.array(z.string()).min(1, 'Please select at least one feature'),
  timeframe: z.string().min(1, 'Please select a timeframe'),
  preferredDemoType: z.string().min(1, 'Please select a demo type'),
  additionalRequirements: z.string().optional(),
  country: z.string().min(1, 'Country is required'),
})

type FormData = z.infer<typeof demoFormSchema>

export function DemoForm() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(demoFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      jobTitle: '',
      organizationName: '',
      organizationType: '',
      organizationSize: '',
      currentECGSystem: '',
      primaryUseCase: '',
      interestedFeatures: [],
      timeframe: '',
      preferredDemoType: '',
      additionalRequirements: '',
      country: 'Algeria'
    }
  })
  const watchedFeatures = watch('interestedFeatures')
  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to submit demo request')
      }

      setIsSubmitted(true)
      reset() // Reset form after successful submission
    } catch (error) {
      console.error('Error submitting demo request:', error)
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFeatureToggle = (feature: string) => {
    const currentFeatures = watchedFeatures || []
    const newFeatures = currentFeatures.includes(feature)
      ? currentFeatures.filter(f => f !== feature)
      : [...currentFeatures, feature]
    setValue('interestedFeatures', newFeatures)
  }

  if (isSubmitted) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">Demo Request Submitted!</h3>
          <p className="text-gray-600 mb-6">
            Thank you for your interest in Hearline. Our team will contact you within 24 hours to schedule your personalized demo.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Confirmation email will be sent to your address</li>
              <li>• Demo customized to your specific needs</li>
              <li>• 30-minute interactive session</li>
              <li>• Q&A with our cardiac AI specialists</li>
            </ul>
          </div>
          <Button onClick={() => setIsSubmitted(false)} variant="outline">
            Schedule Another Demo
          </Button>
        </div>
      </Card>
    )
  }

  const availableFeatures = [
    'AI ECG Analysis',
    'Patient Management',
    'Medication Database',
    'Real-time Monitoring',
    'Report Generation',
    'EHR Integration',
    'Mobile Access',
    'Analytics Dashboard'
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Request Your Demo
        </CardTitle>
        <CardDescription>
          Fill out the form below and we'll customize a demo to your specific needs and requirements.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                {...register('firstName')}
              />
              {errors.firstName && (
                <p className="text-sm text-red-600 mt-1">{errors.firstName.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                {...register('lastName')}
              />
              {errors.lastName && (
                <p className="text-sm text-red-600 mt-1">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
              )}
            </div>            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                {...register('phone')}
              />
              {errors.phone && (
                <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="country">Country *</Label>
            <Select onValueChange={(value) => setValue('country', value)} defaultValue="Algeria">
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Algeria">Algeria</SelectItem>
                <SelectItem value="United States">United States</SelectItem>
                <SelectItem value="Canada">Canada</SelectItem>
                <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                <SelectItem value="Germany">Germany</SelectItem>
                <SelectItem value="France">France</SelectItem>
                <SelectItem value="Australia">Australia</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.country && (
              <p className="text-sm text-red-600 mt-1">{errors.country.message}</p>
            )}
          </div>

          {/* Professional Information */}
          <div className="border-t pt-6">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Professional Information
            </h4>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="jobTitle">Job Title *</Label>
                <Input
                  id="jobTitle"
                  {...register('jobTitle')}
                  placeholder="e.g., Cardiologist, Head of Cardiology, IT Director"
                />
                {errors.jobTitle && (
                  <p className="text-sm text-red-600 mt-1">{errors.jobTitle.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Organization Information */}
          <div className="border-t pt-6">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Building className="w-4 h-4" />
              Organization Details
            </h4>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="organizationName">Organization Name *</Label>
                <Input
                  id="organizationName"
                  {...register('organizationName')}
                />
                {errors.organizationName && (
                  <p className="text-sm text-red-600 mt-1">{errors.organizationName.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">                <div>
                  <Label htmlFor="organizationType">Organization Type *</Label>
                  <Select onValueChange={(value) => setValue('organizationType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select organization type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hospital">Hospital</SelectItem>
                      <SelectItem value="clinic">Clinic</SelectItem>
                      <SelectItem value="cardiology-practice">Cardiology Practice</SelectItem>
                      <SelectItem value="health-system">Health System</SelectItem>
                      <SelectItem value="research-institution">Research Institution</SelectItem>
                      <SelectItem value="university">University/Academic</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.organizationType && (
                    <p className="text-sm text-red-600 mt-1">{errors.organizationType.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="organizationSize">Organization Size *</Label>
                  <Select onValueChange={(value) => setValue('organizationSize', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select organization size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-50">1-50 employees</SelectItem>
                      <SelectItem value="51-200">51-200 employees</SelectItem>
                      <SelectItem value="201-1000">201-1,000 employees</SelectItem>
                      <SelectItem value="1001-5000">1,001-5,000 employees</SelectItem>
                      <SelectItem value="5000+">5,000+ employees</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.organizationSize && (
                    <p className="text-sm text-red-600 mt-1">{errors.organizationSize.message}</p>
                  )}
                </div>
              </div>              <div>
                <Label htmlFor="currentECGSystem">Current ECG System (Optional)</Label>
                <Input
                  id="currentECGSystem"
                  {...register('currentECGSystem')}
                  placeholder="e.g., GE, Philips, Nihon Kohden"
                />
                {errors.currentECGSystem && (
                  <p className="text-sm text-red-600 mt-1">{errors.currentECGSystem.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Demo Requirements */}
          <div className="border-t pt-6">
            <h4 className="font-medium text-gray-900 mb-4">Demo Requirements</h4>

            <div className="space-y-4">              <div>
                <Label htmlFor="primaryUseCase">Primary Use Case *</Label>
                <Select onValueChange={(value) => setValue('primaryUseCase', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select primary use case" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ecg-analysis">ECG Analysis & Interpretation</SelectItem>
                    <SelectItem value="patient-management">Patient Management</SelectItem>
                    <SelectItem value="workflow-automation">Workflow Automation</SelectItem>
                    <SelectItem value="research-analytics">Research & Analytics</SelectItem>
                    <SelectItem value="ehr-integration">EHR Integration</SelectItem>
                    <SelectItem value="comprehensive-solution">Comprehensive Solution</SelectItem>
                  </SelectContent>
                </Select>
                {errors.primaryUseCase && (
                  <p className="text-sm text-red-600 mt-1">{errors.primaryUseCase.message}</p>
                )}
              </div>              <div>
                <Label>Interested Features *</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {availableFeatures.map((feature) => (
                    <div key={feature} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={feature}
                        checked={(watchedFeatures || []).includes(feature)}
                        onChange={() => handleFeatureToggle(feature)}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={feature} className="text-sm font-normal">
                        {feature}
                      </Label>
                    </div>
                  ))}
                </div>
                {errors.interestedFeatures && (
                  <p className="text-sm text-red-600 mt-1">{errors.interestedFeatures.message}</p>
                )}
              </div>              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="timeframe">Implementation Timeframe *</Label>
                  <Select onValueChange={(value) => setValue('timeframe', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate (within 1 month)</SelectItem>
                      <SelectItem value="1-3-months">1-3 months</SelectItem>
                      <SelectItem value="3-6-months">3-6 months</SelectItem>
                      <SelectItem value="6-12-months">6-12 months</SelectItem>
                      <SelectItem value="12+-months">12+ months</SelectItem>
                      <SelectItem value="exploring">Just exploring</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.timeframe && (
                    <p className="text-sm text-red-600 mt-1">{errors.timeframe.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="preferredDemoType">Preferred Demo Type *</Label>
                  <Select onValueChange={(value) => setValue('preferredDemoType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select demo type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="live-online">Live Online Demo</SelectItem>
                      <SelectItem value="on-site">On-site Demo</SelectItem>
                      <SelectItem value="recorded">Recorded Demo</SelectItem>
                      <SelectItem value="trial-access">Trial Access</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.preferredDemoType && (
                    <p className="text-sm text-red-600 mt-1">{errors.preferredDemoType.message}</p>
                  )}
                </div>
              </div>              <div>
                <Label htmlFor="additionalRequirements">Additional Requirements or Questions</Label>
                <Textarea
                  id="additionalRequirements"
                  {...register('additionalRequirements')}
                  placeholder="Tell us about specific challenges, integration requirements, or questions you have..."
                  rows={4}
                />
                {errors.additionalRequirements && (
                  <p className="text-sm text-red-600 mt-1">{errors.additionalRequirements.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                30-minute session
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Personalized demo
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Expert consultation
              </Badge>
            </div>
            
            <Button type="submit" disabled={isLoading} className="min-w-[140px]">
              {isLoading ? 'Submitting...' : 'Request Demo'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}