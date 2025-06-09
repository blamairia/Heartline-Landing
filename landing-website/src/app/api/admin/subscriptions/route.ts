import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma as db } from '@/lib/prisma'
import { subscriptions, subscriptionPlans, users, invoices } from '../../../../../db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    // Get all pending subscriptions with user and plan details
    const pendingSubscriptions = await db
      .select({
        subscription: subscriptions,
        user: {
          id: users.id,
          name: users.name,
          email: users.email
        },
        plan: {
          displayName: subscriptionPlans.displayName,
          price: subscriptionPlans.price,
          currency: subscriptionPlans.currency,
          billingCycle: subscriptionPlans.billingCycle
        },
        invoice: {
          id: invoices.id,
          invoiceNumber: invoices.invoiceNumber,
          amount: invoices.amount,
          currency: invoices.currency,
          issueDate: invoices.issueDate,
          dueDate: invoices.dueDate
        }
      })
      .from(subscriptions)
      .leftJoin(users, eq(subscriptions.userId, users.id))
      .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .leftJoin(invoices, eq(invoices.subscriptionId, subscriptions.id))
      .where(eq(subscriptions.status, 'PENDING_ACTIVATION'))

    return NextResponse.json(
      { subscriptions: pendingSubscriptions },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get pending subscriptions error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const { subscriptionId, action, notes } = await request.json()

    if (!subscriptionId || !action) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (action === 'approve') {
      // Activate the subscription
      await db
        .update(subscriptions)
        .set({ 
          status: 'ACTIVE',
          startDate: new Date()
        })
        .where(eq(subscriptions.id, subscriptionId))

      // Mark invoice as paid
      await db
        .update(invoices)
        .set({ 
          status: 'PAID',
          paidAt: new Date(),
          amountPaid: invoices.amount,
          amountRemaining: 0,
          notes: notes || 'Payment confirmed by admin'
        })
        .where(eq(invoices.subscriptionId, subscriptionId))

    } else if (action === 'reject') {
      // Cancel the subscription
      await db
        .update(subscriptions)
        .set({ 
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason: notes || 'Payment not received'
        })
        .where(eq(subscriptions.id, subscriptionId))

      // Mark invoice as void
      await db
        .update(invoices)
        .set({ 
          status: 'VOID',
          notes: notes || 'Subscription cancelled - payment not received'
        })
        .where(eq(invoices.subscriptionId, subscriptionId))
    }

    return NextResponse.json(
      { message: `Subscription ${action}d successfully` },
      { status: 200 }
    )
  } catch (error) {
    console.error('Update subscription error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
