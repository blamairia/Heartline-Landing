import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma as db } from '@/lib/prisma'
import { subscriptions, activityLogs } from '../../../../../db/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { subscriptionId } = await request.json()

    if (!subscriptionId) {
      return NextResponse.json(
        { message: 'Subscription ID is required' },
        { status: 400 }
      )
    }

    // Find the subscription
    const [subscription] = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.id, subscriptionId))
      .limit(1)

    if (!subscription || subscription.userId !== session.user.id) {
      return NextResponse.json(
        { message: 'Subscription not found' },
        { status: 404 }
      )
    }

    // Update subscription status
    await db.update(subscriptions)
      .set({ 
        status: 'CANCELLED',
        autoRenew: false,
        updatedAt: new Date()
      })
      .where(eq(subscriptions.id, subscriptionId))

    // Log activity
    await db.insert(activityLogs).values({
      userId: session.user.id,
      entityType: 'subscription',
      entityId: subscriptionId,
      action: 'subscription_cancelled',
      description: 'User cancelled their subscription',
      metadata: { subscriptionId },
    })

    return NextResponse.json(
      { message: 'Subscription cancelled successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}