import { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, Activity, FileText } from 'lucide-react'

export const metadata: Metadata = {
  title: 'ECG Analysis | Hearline Dashboard',
  description: 'Upload and analyze ECG files with AI-powered cardiac diagnostics.',
}

export default async function AnalyzePage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ECG Analysis
          </h1>
          <p className="text-gray-600">
            Upload ECG files for AI-powered analysis and diagnosis.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" />
                Upload ECG File
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Drop your ECG file here
                </h3>
                <p className="text-gray-600 mb-4">
                  Supports .dat, .txt, .csv formats
                </p>
                <Button>
                  Choose File
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-500" />
                Recent Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <FileText className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Patient #1234</h4>
                    <p className="text-sm text-gray-600">Normal sinus rhythm</p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <FileText className="w-4 h-4 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Patient #5678</h4>
                    <p className="text-sm text-gray-600">Atrial fibrillation detected</p>
                    <p className="text-xs text-gray-500">4 hours ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
