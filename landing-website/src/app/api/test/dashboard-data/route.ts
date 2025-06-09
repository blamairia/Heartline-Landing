import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Temporary test endpoint - NO AUTHENTICATION REQUIRED
export async function GET() {
  try {
    // Test all the database queries without auth
    const [stats, activities, users, addons, billing, subscription] = await Promise.all([      // Stats query
      Promise.all([
        prisma.user.count(),
        prisma.subscription.count({ where: { status: 'ACTIVE' } }),
        prisma.invoice.aggregate({
          _sum: { amount: true }
        }),
        prisma.user.count({ where: { emailVerified: { not: null } } })
      ]),      // Activities query
      prisma.activityLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      }),

      // Users query
      prisma.user.findMany({
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          organization: true
        }
      }),

      // Addons query
      prisma.subscriptionAddon.findMany({
        include: {
          addon: true
        }
      }),

      // Billing query (mock for now)
      Promise.resolve([]),      // Subscription query
      prisma.subscription.findFirst({
        include: {
          plan: true,
          addons: {
            include: { addon: true }
          }
        }
      })
    ])

    const [totalUsers, activeSubscriptions, revenueResult, verifiedUsers] = stats

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        stats: {
          totalUsers,
          activeSubscriptions,
          totalRevenue: revenueResult._sum.amount || 0,
          conversionRate: totalUsers > 0 ? (verifiedUsers / totalUsers) * 100 : 0
        },        activities: activities.map((activity: any) => ({
          id: activity.id,
          type: activity.action,
          description: activity.description,
          timestamp: activity.createdAt,
          user: activity.user?.name || 'System'
        })),
        users: {
          users: users,
          pagination: {
            total: totalUsers,
            page: 1,
            limit: 5,
            hasMore: totalUsers > 5
          }
        },
        addons: {
          active: addons.filter((a: any) => a.isActive),
          available: addons
        },
        subscription: subscription ? {
          subscription,
          hasActiveSubscription: subscription.status === 'ACTIVE'
        } : {
          subscription: null,
          hasActiveSubscription: false
        }
      }
    })

  } catch (error: any) {
    console.error('Test endpoint error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        stack: error.stack 
      }, 
      { status: 500 }
    )
  }
}