import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma as db } from '@/lib/prisma'
import { invoices, invoiceItems, subscriptions } from '../../../../../../db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const subscriptionId = params.id

    // Verify the subscription belongs to the user
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(and(
        eq(subscriptions.id, subscriptionId),
        eq(subscriptions.userId, session.user.id)
      ))
      .limit(1)

    if (!subscription) {
      return NextResponse.json(
        { message: 'Subscription not found or access denied' },
        { status: 404 }
      )
    }

    // Get the invoice for this subscription
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.subscriptionId, subscriptionId))
      .limit(1)

    if (!invoice) {
      return NextResponse.json(
        { message: 'No invoice found for this subscription' },
        { status: 404 }
      )
    }

    // Get invoice items
    const items = await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoice.id))

    // Format response
    const response = {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      amount: invoice.amount,
      amountDue: invoice.amountDue,
      amountPaid: invoice.amountPaid,
      amountRemaining: invoice.amountRemaining,
      currency: invoice.currency,
      issueDate: invoice.issueDate.toISOString(),
      dueDate: invoice.dueDate?.toISOString(),
      description: invoice.description,
      paymentProvider: invoice.paymentProvider,
      userId: invoice.userId,
      subscriptionId: invoice.subscriptionId,
      invoiceItems: items.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.totalAmount
      }))
    }

    return NextResponse.json(
      { invoice: response },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get subscription invoice error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
