'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Calendar, Users, Building } from 'lucide-react'

export function DemoForm() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)  const [formData, setFormData] = useState({
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
    interestedFeatures: [] as string[],
    timeframe: '',
    preferredDemoType: '',
    additionalRequirements: '',
    country: 'Algeria'
  })
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to submit demo request')
      }

      const result = await response.json()
      setIsSubmitted(true)
    } catch (error) {
      console.error('Error submitting demo request:', error)
      // TODO: Show error message to user
    } finally {
      setIsLoading(false)
    }
  }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (isSubmitted) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">Demo Scheduled!</h3>
          <p className="text-gray-600 mb-6">
            Thank you for your interest in Hearline. Our team will contact you within 24 hours to confirm your demo details.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Confirmation email sent to {formData.email}</li>
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Schedule Your Demo
        </CardTitle>
        <CardDescription>
          Fill out the form below and we'll customize a demo to your specific needs.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
            />
          </div>

          {/* Organization Information */}
          <div className="border-t pt-6">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Building className="w-4 h-4" />
              Organization Details
            </h4>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="organization">Organization Name *</Label>
                <Input
                  id="organization"
                  value={formData.organization}
                  onChange={(e) => handleInputChange('organization', e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role">Your Role *</Label>
                  <Select onValueChange={(value) => handleInputChange('role', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cardiologist">Cardiologist</SelectItem>
                      <SelectItem value="nurse">Cardiac Nurse</SelectItem>
                      <SelectItem value="technician">ECG Technician</SelectItem>
                      <SelectItem value="administrator">Healthcare Administrator</SelectItem>
                      <SelectItem value="it-director">IT Director</SelectItem>
                      <SelectItem value="decision-maker">Decision Maker</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="organizationType">Organization Type *</Label>
                  <Select onValueChange={(value) => handleInputChange('organizationType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hospital">Hospital</SelectItem>
                      <SelectItem value="clinic">Clinic</SelectItem>
                      <SelectItem value="cardiology-practice">Cardiology Practice</SelectItem>
                      <SelectItem value="health-system">Health System</SelectItem>
                      <SelectItem value="research-institution">Research Institution</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="patientVolume">Monthly Patient Volume</Label>
                <Select onValueChange={(value) => handleInputChange('patientVolume', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select patient volume" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-100">1-100 patients</SelectItem>
                    <SelectItem value="101-500">101-500 patients</SelectItem>
                    <SelectItem value="501-1000">501-1,000 patients</SelectItem>
                    <SelectItem value="1001-5000">1,001-5,000 patients</SelectItem>
                    <SelectItem value="5000+">5,000+ patients</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Demo Preferences */}
          <div className="border-t pt-6">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Demo Preferences
            </h4>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="preferredDate">Preferred Date</Label>
                <Input
                  id="preferredDate"
                  type="date"
                  value={formData.preferredDate}
                  onChange={(e) => handleInputChange('preferredDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <Label htmlFor="preferredTime">Preferred Time</Label>
                <Select onValueChange={(value) => handleInputChange('preferredTime', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="9am">9:00 AM</SelectItem>
                    <SelectItem value="10am">10:00 AM</SelectItem>
                    <SelectItem value="11am">11:00 AM</SelectItem>
                    <SelectItem value="1pm">1:00 PM</SelectItem>
                    <SelectItem value="2pm">2:00 PM</SelectItem>
                    <SelectItem value="3pm">3:00 PM</SelectItem>
                    <SelectItem value="4pm">4:00 PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="specificInterests">Specific Areas of Interest</Label>
                <Textarea
                  id="specificInterests"
                  value={formData.specificInterests}
                  onChange={(e) => handleInputChange('specificInterests', e.target.value)}
                  placeholder="What aspects of Hearline are you most interested in? (e.g., AI diagnostics, workflow automation, reporting)"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="currentChallenges">Current Challenges</Label>
                <Textarea
                  id="currentChallenges"
                  value={formData.currentChallenges}
                  onChange={(e) => handleInputChange('currentChallenges', e.target.value)}
                  placeholder="What are your current challenges with cardiac care management?"
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                30-minute session
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Customized demo
              </Badge>
            </div>
            
            <Button type="submit" disabled={isLoading} className="min-w-[120px]">
              {isLoading ? 'Scheduling...' : 'Schedule Demo'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
