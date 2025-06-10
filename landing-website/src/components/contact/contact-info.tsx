import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Headphones, 
  Calendar,
  MessageSquare,
  Users
} from 'lucide-react'

const contactMethods = [
  {
    icon: Phone,
    title: 'Phone Support',
    description: 'Speak directly with our team',
    details: '+1 (555) Heartline',
    available: 'Mon-Fri, 8AM-6PM EST',
    action: 'Call Now',
    color: 'bg-green-100 text-green-600'
  },
  {
    icon: Mail,
    title: 'Email Support',
    description: '24-hour response guarantee',
    details: 'hello@Heartline.ai',
    available: 'We respond within 24 hours',
    action: 'Send Email',
    color: 'bg-blue-100 text-blue-600'
  },
  {
    icon: Calendar,
    title: 'Schedule Demo',
    description: 'Personalized product walkthrough',
    details: 'Book a 30-minute session',
    available: 'Available worldwide',
    action: 'Book Demo',
    color: 'bg-purple-100 text-purple-600'
  },
  {
    icon: Headphones,
    title: 'Technical Support',
    description: 'For existing customers',
    details: 'support@Heartline.ai',
    available: '24/7 for critical issues',
    action: 'Get Help',
    color: 'bg-orange-100 text-orange-600'
  }
]

const offices = [
  {
    city: 'San Francisco',
    type: 'Headquarters',
    address: '123 Innovation Drive\nSan Francisco, CA 94107',
    phone: '+1 (555) 123-4567'
  },
  {
    city: 'Boston',
    type: 'Research Center',
    address: '456 Medical District\nBoston, MA 02115',
    phone: '+1 (555) 234-5678'
  },
  {
    city: 'London',
    type: 'European Office',
    address: '789 Health Tech Hub\nLondon, EC2A 4DP',
    phone: '+44 20 1234 5678'
  }
]

export function ContactInfo() {
  return (
    <div className="space-y-6">
      {/* Contact Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Get in Touch
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {contactMethods.map((method, index) => (
            <div key={index} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${method.color}`}>
                  <method.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{method.title}</h4>
                  <p className="text-sm text-gray-600 mb-1">{method.description}</p>
                  <p className="text-sm font-medium text-gray-900">{method.details}</p>
                  <p className="text-xs text-gray-500 mb-2">{method.available}</p>
                  <Button variant="outline" size="sm" className="text-xs">
                    {method.action}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Business Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-600" />
            Business Hours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Monday - Friday</span>
              <Badge variant="secondary">8:00 AM - 6:00 PM EST</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Saturday</span>
              <Badge variant="secondary">9:00 AM - 2:00 PM EST</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Sunday</span>
              <Badge variant="outline">Closed</Badge>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Emergency Support</span>
                <Badge variant="secondary" className="bg-red-100 text-red-600">
                  24/7 Available
                </Badge>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                For critical technical issues affecting patient care
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Office Locations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-red-600" />
            Our Offices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {offices.map((office, index) => (
              <div key={index} className="pb-4 border-b last:border-b-0 last:pb-0">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-900">{office.city}</h4>
                  <Badge variant="outline" className="text-xs">
                    {office.type}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 whitespace-pre-line mb-2">
                  {office.address}
                </p>
                <p className="text-sm text-blue-600">{office.phone}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Users className="w-5 h-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start" size="sm">
            📅 Schedule a Demo
          </Button>
          <Button variant="outline" className="w-full justify-start" size="sm">
            💰 Get Pricing Information
          </Button>
          <Button variant="outline" className="w-full justify-start" size="sm">
            📚 Download Resources
          </Button>
          <Button variant="outline" className="w-full justify-start" size="sm">
            🤝 Partnership Inquiry
          </Button>
        </CardContent>
      </Card>

      {/* Response Time Guarantee */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Clock className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h4 className="font-medium text-green-900">Response Guarantee</h4>
              <p className="text-sm text-green-800">
                We respond to all inquiries within 24 hours, often sooner.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
