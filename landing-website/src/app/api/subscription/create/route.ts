import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma as db } from '@/lib/prisma'
import { subscriptions, subscriptionPlans, users } from '../../../../../db/schema'
import { eq } from 'drizzle-orm'

const createSubscriptionSchema = z.object({
  planId: z.string(),
  paymentMethodId: z.string().optional(),
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
    const { planId, paymentMethodId } = createSubscriptionSchema.parse(body)

    // Get the subscription plan
    const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, planId)).limit(1)
    
    if (!plan) {
      return NextResponse.json(
        { message: 'Subscription plan not found' },
        { status: 404 }
      )
    }    // Create the subscription
    const trialEnd = plan.trialDays ? new Date(Date.now() + plan.trialDays * 24 * 60 * 60 * 1000) : null
    const startDate = new Date()
    const endDate = new Date()
    
    // Calculate billing period end date based on billing cycle
    switch (plan.billingCycle) {
      case 'MONTHLY':
        endDate.setMonth(endDate.getMonth() + 1)
        break
      case 'YEARLY':
        endDate.setFullYear(endDate.getFullYear() + 1)
        break
      case 'QUARTERLY':
        endDate.setMonth(endDate.getMonth() + 3)
        break
      default:
        endDate.setMonth(endDate.getMonth() + 1)
    }

    const [newSubscription] = await db.insert(subscriptions).values({
      userId: session.user.id,
      planId: planId,
      status: trialEnd ? 'TRIALING' : 'ACTIVE',
      startDate,
      endDate,
      trialStartDate: trialEnd ? new Date() : null,
      trialEndDate: trialEnd,
    }).returning()

    return NextResponse.json(
      { 
        message: 'Subscription created successfully',
        subscription: newSubscription
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create subscription error:', error)

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