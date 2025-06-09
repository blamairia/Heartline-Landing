import { NextRequest, NextResponse } from 'next/server'
import { prisma as db } from '@/lib/prisma'
import { 
  users, 
  subscriptions, 
  subscriptionPlans, 
  payments, 
  invoices,
  subscriptionAddonInstances,
  activityLogs 
} from '@/../db/schema'
import { count, eq, sql, desc } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    // Get basic counts
    const [userCount] = await db.select({ count: count() }).from(users)
    const [subscriptionCount] = await db.select({ count: count() }).from(subscriptions)
    const [paymentCount] = await db.select({ count: count() }).from(payments)
    const [invoiceCount] = await db.select({ count: count() }).from(invoices)

    // Get recent data samples
    const recentUsers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    }).from(users).orderBy(desc(users.createdAt)).limit(5)

    const recentSubscriptions = await db.select({
      id: subscriptions.id,
      userId: subscriptions.userId,
      planId: subscriptions.planId,
      status: subscriptions.status,
      startDate: subscriptions.startDate,
      endDate: subscriptions.endDate,
      createdAt: subscriptions.createdAt,
    }).from(subscriptions).orderBy(desc(subscriptions.createdAt)).limit(5)

    const recentPayments = await db.select({
      id: payments.id,
      userId: payments.userId,
      amount: payments.amount,
      currency: payments.currency,
      status: payments.status,
      paymentProvider: payments.paymentProvider,
      createdAt: payments.createdAt,
    }).from(payments).orderBy(desc(payments.createdAt)).limit(5)

    // Get subscription stats by status
    const subscriptionStats = await db.select({
      status: subscriptions.status,
      count: count(),
    }).from(subscriptions).groupBy(subscriptions.status)

    // Get payment stats by status
    const paymentStats = await db.select({
      status: payments.status,
      count: count(),
    }).from(payments).groupBy(payments.status)

    // Get monthly revenue (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthlyRevenue = await db.select({
      month: sql<string>`to_char(${payments.createdAt}, 'YYYY-MM')`,
      revenue: sql<number>`sum(${payments.amount})`,
      count: count(),
    })
    .from(payments)
    .where(sql`${payments.createdAt} >= ${sixMonthsAgo} AND ${payments.status} = 'SUCCEEDED'`)
    .groupBy(sql`to_char(${payments.createdAt}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${payments.createdAt}, 'YYYY-MM')`)

    const dashboardData = {
      summary: {
        totalUsers: userCount.count,
        totalSubscriptions: subscriptionCount.count,
        totalPayments: paymentCount.count,
        totalInvoices: invoiceCount.count,
      },
      recent: {
        users: recentUsers,
        subscriptions: recentSubscriptions,
        payments: recentPayments,
      },
      stats: {
        subscriptionsByStatus: subscriptionStats,
        paymentsByStatus: paymentStats,
        monthlyRevenue: monthlyRevenue,
      },
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(dashboardData, { status: 200 })
  } catch (error) {
    console.error('Dashboard data error:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
