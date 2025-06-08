import { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Users, Search, Plus, Eye, Edit } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Patients | Hearline Dashboard',
  description: 'Manage your patients in the Hearline system.',
}

const mockPatients = [
  {
    id: 1,
    name: 'John Doe',
    age: 45,
    gender: 'Male',
    lastVisit: '2024-06-05',
    status: 'Active',
    riskLevel: 'Low',
    phone: '+1 (555) 123-4567'
  },
  {
    id: 2,
    name: 'Jane Smith',
    age: 62,
    gender: 'Female',
    lastVisit: '2024-06-07',
    status: 'Active',
    riskLevel: 'High',
    phone: '+1 (555) 987-6543'
  },
  {
    id: 3,
    name: 'Michael Johnson',
    age: 38,
    gender: 'Male',
    lastVisit: '2024-05-28',
    status: 'Inactive',
    riskLevel: 'Medium',
    phone: '+1 (555) 456-7890'
  }
]

export default async function PatientsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Patients
              </h1>
              <p className="text-gray-600">
                Manage and monitor your patients.
              </p>
            </div>
            <Link href="/dashboard/patients/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Patient
              </Button>
            </Link>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input placeholder="Search patients..." className="pl-10" />
            </div>
            <Button variant="outline">
              Filters
            </Button>
          </div>
        </div>

        {/* Patients Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Patient List ({mockPatients.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Age</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Gender</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Last Visit</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Risk Level</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mockPatients.map((patient) => (
                    <tr key={patient.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-900">{patient.name}</div>
                          <div className="text-sm text-gray-600">{patient.phone}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-700">{patient.age}</td>
                      <td className="py-3 px-4 text-gray-700">{patient.gender}</td>
                      <td className="py-3 px-4 text-gray-700">{patient.lastVisit}</td>
                      <td className="py-3 px-4">
                        <Badge variant={
                          patient.riskLevel === 'High' ? 'destructive' :
                          patient.riskLevel === 'Medium' ? 'secondary' : 'default'
                        }>
                          {patient.riskLevel}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={patient.status === 'Active' ? 'default' : 'secondary'}>
                          {patient.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
