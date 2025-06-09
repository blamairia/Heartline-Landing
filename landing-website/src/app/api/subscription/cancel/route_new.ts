import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma as db } from '@/lib/prisma'
import { subscriptions } from '../../../../../db/schema'
import { eq, and } from 'drizzle-orm'

const cancelSubscriptionSchema = z.object({
  subscriptionId: z.string(),
  reason: z.string().optional(),
  effectiveDate: z.string().datetime().optional(), // ISO date string
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { subscriptionId, reason, effectiveDate } = cancelSubscriptionSchema.parse(body)

    // Check if subscription exists and belongs to user
    const [subscription] = await db.select()
      .from(subscriptions)
      .where(and(
        eq(subscriptions.id, subscriptionId),
        eq(subscriptions.userId, session.user.id)
      ))
      .limit(1)
    
    if (!subscription) {
      return NextResponse.json(
        { message: 'Subscription not found' },
        { status: 404 }
      )
    }

    if (subscription.status === 'CANCELLED' || subscription.cancelledAt) {
      return NextResponse.json(
        { message: 'Subscription is already cancelled' },
        { status: 400 }
      )
    }

    // Cancel the subscription
    const cancellationDate = new Date()
    const effectiveCancellationDate = effectiveDate ? new Date(effectiveDate) : cancellationDate

    const [updatedSubscription] = await db.update(subscriptions)
      .set({
        status: 'CANCELLED',
        cancelledAt: cancellationDate,
        cancellationReason: reason,
        cancellationEffectiveDate: effectiveCancellationDate,
        autoRenew: false,
      })
      .where(eq(subscriptions.id, subscriptionId))
      .returning()

    return NextResponse.json(
      { 
        message: 'Subscription cancelled successfully',
        subscription: updatedSubscription
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Cancel subscription error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid input data', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
