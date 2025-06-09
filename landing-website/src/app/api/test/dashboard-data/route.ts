import { NextRequest, NextResponse } from 'next/server'
import { prisma as db } from '@/lib/prisma'
import { users, subscriptions, subscriptionPlans } from '../../../../../db/schema'
import { eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    // Get sample dashboard data for testing
    const sampleUsers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt
    }).from(users).limit(5)

    const sampleSubscriptions = await db.select({
      id: subscriptions.id,
      status: subscriptions.status,
      startDate: subscriptions.startDate,
      endDate: subscriptions.endDate,
      planName: subscriptionPlans.displayName
    })
    .from(subscriptions)
    .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
    .limit(5)

    return NextResponse.json({
      message: 'Dashboard data test successful',
      data: {
        users: sampleUsers,
        subscriptions: sampleSubscriptions,
        stats: {
          totalUsers: sampleUsers.length,
          totalSubscriptions: sampleSubscriptions.length
        }
      }
    })  } catch (error) {
    console.error('Dashboard data test error:', error)
    return NextResponse.json(
      { message: 'Error fetching dashboard data', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}