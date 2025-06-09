import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma as db } from '@/lib/prisma'
import { invoices, invoiceItems, subscriptions, subscriptionPlans } from '../../../../../db/schema'
import { eq } from 'drizzle-orm'

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

    const invoiceId = params.id

    // Get invoice with related data
    const [invoice] = await db
      .select({
        invoice: invoices,
        subscription: subscriptions,
        plan: subscriptionPlans
      })
      .from(invoices)
      .leftJoin(subscriptions, eq(invoices.subscriptionId, subscriptions.id))
      .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .where(eq(invoices.id, invoiceId))
      .limit(1)

    if (!invoice) {
      return NextResponse.json(
        { message: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Check if user owns this invoice
    if (invoice.invoice.userId !== session.user.id) {
      return NextResponse.json(
        { message: 'Access denied' },
        { status: 403 }
      )
    }

    // Get invoice items
    const items = await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoiceId))

    // Format response
    const response = {
      id: invoice.invoice.id,
      invoiceNumber: invoice.invoice.invoiceNumber,
      status: invoice.invoice.status,
      amount: invoice.invoice.amount,
      amountDue: invoice.invoice.amountDue,
      amountPaid: invoice.invoice.amountPaid,
      amountRemaining: invoice.invoice.amountRemaining,
      currency: invoice.invoice.currency,
      issueDate: invoice.invoice.issueDate.toISOString(),
      dueDate: invoice.invoice.dueDate?.toISOString(),
      description: invoice.invoice.description,
      subscription: invoice.subscription ? {
        id: invoice.subscription.id,
        plan: {
          displayName: invoice.plan?.displayName || 'Unknown Plan',
          billingCycle: invoice.plan?.billingCycle || 'MONTHLY'
        }
      } : null,
      invoiceItems: items.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.amount
      }))
    }

    return NextResponse.json(
      { invoice: response },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get invoice error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
