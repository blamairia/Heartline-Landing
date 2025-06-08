'use client'

import { useEffect, useState } from 'react'
import { Users, CreditCard, Package, Settings, UserPlus, ExternalLink, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RecentActivityResponse, ActivityItem } from '@/types/api'

// Icon mapping for different activity types
const activityIcons = {
  subscription: Package,
  billing: CreditCard,
  user: Users,
  system: Settings
}

export function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchActivity() {
      try {
        setLoading(true)
        const response = await fetch('/api/dashboard/activity')
        
        if (!response.ok) {
          throw new Error('Failed to fetch recent activity')
        }
        
        const data: RecentActivityResponse = await response.json()
        setActivities(data.activities)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        console.error('Error fetching recent activity:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchActivity()
  }, [])

  const getTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMs = now.getTime() - new Date(date).getTime()
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours} hours ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays} days ago`
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-start gap-3 animate-pulse">
                <div className="rounded-full bg-gray-200 h-8 w-8"></div>
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">Error loading recent activity: {error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-muted-foreground text-sm">No recent activity</p>
          ) : (
            activities.map((activity) => {
              const IconComponent = activityIcons[activity.type] || Activity
              
              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="flex-shrink-0 p-2 rounded-lg bg-muted">
                    <IconComponent className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {activity.user}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {activity.action}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {getTimeAgo(activity.time)}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
        
        {activities.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <button className="text-sm text-primary hover:text-primary/80 font-medium">
              View all activity →
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
