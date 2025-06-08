import { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Download, Calendar, Filter, Plus } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Reports | Hearline Dashboard',
  description: 'Generate and manage clinical reports.',
}

const mockReports = [
  {
    id: 1,
    title: 'Weekly Cardiac Summary',
    description: 'Comprehensive cardiac analysis for the week',
    date: '2024-06-08',
    type: 'Weekly',
    status: 'Generated',
    patients: 45
  },
  {
    id: 2,
    title: 'Monthly Patient Overview',
    description: 'Monthly overview of all patients',
    date: '2024-06-01',
    type: 'Monthly',
    status: 'Generated',
    patients: 156
  },
  {
    id: 3,
    title: 'Critical Alerts Report',
    description: 'Summary of critical alerts and interventions',
    date: '2024-06-07',
    type: 'Alert',
    status: 'Generated',
    patients: 8
  }
]

export default async function ReportsPage() {
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
                Reports
              </h1>
              <p className="text-gray-600">
                Generate and manage clinical reports and summaries.
              </p>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              Date Range
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        {/* Quick Generate */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-2 border-dashed border-primary/20 hover:border-primary/40 transition-colors cursor-pointer">
            <CardContent className="p-6 text-center">
              <FileText className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Weekly Summary</h3>
              <p className="text-sm text-gray-600 mb-4">Generate weekly cardiac analysis</p>
              <Button size="sm">Generate</Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-dashed border-blue-200 hover:border-blue-400 transition-colors cursor-pointer">
            <CardContent className="p-6 text-center">
              <FileText className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Patient Report</h3>
              <p className="text-sm text-gray-600 mb-4">Individual patient summary</p>
              <Button size="sm" variant="outline">Generate</Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-dashed border-green-200 hover:border-green-400 transition-colors cursor-pointer">
            <CardContent className="p-6 text-center">
              <FileText className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Analytics Report</h3>
              <p className="text-sm text-gray-600 mb-4">Performance and trends analysis</p>
              <Button size="sm" variant="outline">Generate</Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Recent Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{report.title}</h4>
                      <p className="text-sm text-gray-600 mb-1">{report.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Generated: {report.date}</span>
                        <span>Type: {report.type}</span>
                        <span>Patients: {report.patients}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
