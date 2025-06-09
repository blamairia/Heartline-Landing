import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma as db } from '@/lib/prisma'
import { subscriptions, subscriptionPlans, users, invoices, invoiceItems } from '../../../../../db/schema'
import { eq } from 'drizzle-orm'

const createSubscriptionSchema = z.object({
  planId: z.string(),
  paymentMethodId: z.string().optional(),
  billingAddress: z.object({
    firstName: z.string(),
    lastName: z.string(),
    phone: z.string(),
    organization: z.string().optional(),
    address: z.string(),
    city: z.string(),
    wilaya: z.string(),
  }).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }    const body = await request.json()
    const { planId, paymentMethodId, billingAddress } = createSubscriptionSchema.parse(body)

    console.log('Creating subscription for plan:', planId)
    console.log('Billing address:', billingAddress)

    // Get the subscription plan by name or id
    let [plan] = await db.select().from(subscriptionPlans).where(
      eq(subscriptionPlans.name, planId) // Look up by name first
    ).limit(1)
    
    // If not found by name, try by id
    if (!plan) {
      const planById = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, planId)).limit(1)
      plan = planById[0]
    }
    
    if (!plan) {
      console.log('Plan not found for planId:', planId)
      return NextResponse.json(
        { message: 'Subscription plan not found' },
        { status: 404 }
      )
    }

    console.log('Found plan:', plan.displayName)// Create the subscription
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
    }    // Create subscription with PENDING_ACTIVATION status for offline payment
    const [newSubscription] = await db.insert(subscriptions).values({
      userId: session.user.id,
      planId: plan.id, // Use the actual plan UUID, not the plan name
      status: 'PENDING_ACTIVATION', // Always pending activation for offline payments
      startDate,
      endDate,
      trialStartDate: trialEnd ? new Date() : null,
      trialEndDate: trialEnd,
      paymentProvider: 'OFFLINE_BANK_TRANSFER',
      autoRenew: false, // Offline payments don't auto-renew
    }).returning()

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
    
    // Calculate due date (30 days from issue)
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 30)

    // Create invoice for the subscription
    const [newInvoice] = await db.insert(invoices).values({
      userId: session.user.id,
      subscriptionId: newSubscription.id,
      invoiceNumber,
      status: 'OPEN',
      amount: plan.price,
      amountDue: plan.price,
      amountPaid: 0,
      amountRemaining: plan.price,
      currency: plan.currency || 'DZD',
      issueDate: new Date(),
      dueDate,
      description: `Subscription to ${plan.displayName} - ${plan.billingCycle}`,
      paymentProvider: 'OFFLINE_BANK_TRANSFER',
      offlinePaymentMethod: 'Bank Transfer',
    }).returning()

    // Create invoice item
    await db.insert(invoiceItems).values({
      invoiceId: newInvoice.id,
      description: `${plan.displayName} Subscription - ${plan.billingCycle}`,
      quantity: 1,
      unitPrice: plan.price,
      amount: plan.price,
      currency: plan.currency || 'DZD',
    })

    return NextResponse.json(
      { 
        message: 'Subscription created successfully - Invoice generated',
        subscription: newSubscription,
        invoice: newInvoice,
        redirectTo: `/invoice/${newInvoice.id}/confirm`
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