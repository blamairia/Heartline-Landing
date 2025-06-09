import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma as db } from '@/lib/prisma'
import { subscriptions, payments, invoices } from '../../../../../db/schema'
import { eq, and } from 'drizzle-orm'

const processPaymentSchema = z.object({
  subscriptionId: z.string(),
  paymentMethodId: z.string(),
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  paymentProvider: z.enum(['STRIPE', 'PAYPAL', 'PADDLE', 'OFFLINE_CASH', 'OFFLINE_BANK_TRANSFER']).default('STRIPE'),
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
    const { subscriptionId, paymentMethodId, amount, currency, paymentProvider } = processPaymentSchema.parse(body)

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
    }    // Create an invoice first
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const [invoice] = await db.insert(invoices).values({
      userId: session.user.id,
      subscriptionId: subscriptionId,
      invoiceNumber,
      status: 'OPEN',
      amount: amount,
      amountDue: amount,
      amountRemaining: amount,
      currency: currency,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    }).returning()

    // Create payment record
    const [payment] = await db.insert(payments).values({
      invoiceId: invoice.id,
      userId: session.user.id,
      amount: amount,
      currency: currency,
      status: 'PENDING',
      paymentProvider: paymentProvider,
      paymentMethodUsed: paymentMethodId,
      metadata: { type: 'subscription_payment', subscriptionId },
    }).returning()

    // In a real implementation, you would process the payment with the payment provider here
    // For now, we'll simulate a successful payment
    
    // Update payment status to succeeded
    const [updatedPayment] = await db.update(payments)
      .set({
        status: 'SUCCEEDED',
        processedAt: new Date(),
      })
      .where(eq(payments.id, payment.id))
      .returning()

    // Update subscription status if it was pending payment
    if (subscription.status === 'PENDING_PAYMENT' || subscription.status === 'PAST_DUE') {
      await db.update(subscriptions)
        .set({ status: 'ACTIVE' })
        .where(eq(subscriptions.id, subscriptionId))
    }

    return NextResponse.json(
      { 
        message: 'Payment processed successfully',
        payment: updatedPayment
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Process payment error:', error)

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