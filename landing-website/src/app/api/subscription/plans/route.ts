import { NextRequest, NextResponse } from 'next/server'
import { prisma as db } from '@/lib/prisma'
import { subscriptionPlans } from '../../../../../db/schema'

export async function GET(request: NextRequest) {
  try {
    // Get all active subscription plans
    const plans = await db.select().from(subscriptionPlans)

    return NextResponse.json(
      { plans },
      { status: 200 }
    )
  } catch (error) {
    console.error('Subscription plans error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}