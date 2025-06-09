import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { invoiceId, action } = body;

    if (!invoiceId || !action) {
      return NextResponse.json({ 
        error: 'Invoice ID and action are required' 
      }, { status: 400 });
    }

    // Get the invoice
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        userId: user.id
      },
      include: {
        subscription: {
          include: {
            plan: true
          }
        }
      }
    });

    if (!invoice) {
      return NextResponse.json({ 
        error: 'Invoice not found' 
      }, { status: 404 });
    }

    let result;

    switch (action) {
      case 'simulate_payment':
        if (invoice.status === 'PAID') {
          return NextResponse.json({ 
            error: 'Invoice is already paid' 
          }, { status: 400 });
        }

        result = await simulatePayment(invoice, user.id);
        break;

      case 'mark_overdue':
        if (invoice.status !== 'PENDING') {
          return NextResponse.json({ 
            error: 'Only pending invoices can be marked as overdue' 
          }, { status: 400 });
        }

        result = await markOverdue(invoice, user.id);
        break;

      case 'cancel_invoice':
        if (invoice.status === 'PAID') {
          return NextResponse.json({ 
            error: 'Cannot cancel a paid invoice' 
          }, { status: 400 });
        }

        result = await cancelInvoice(invoice, user.id);
        break;

      default:
        return NextResponse.json({ 
          error: 'Invalid action' 
        }, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Payment simulation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process payment action',
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}

async function simulatePayment(invoice: any, userId: string) {
  const result = await prisma.$transaction(async (tx) => {
    // Update invoice status
    const updatedInvoice = await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        metadata: {
          ...invoice.metadata,
          paymentSimulated: true,
          simulatedAt: new Date().toISOString()
        }
      }
    });

    // If subscription was inactive due to non-payment, reactivate it
    if (invoice.subscriptionId) {
      const subscription = await tx.subscription.findUnique({
        where: { id: invoice.subscriptionId }
      });

      if (subscription && subscription.status === 'PAST_DUE') {
        await tx.subscription.update({
          where: { id: invoice.subscriptionId },
          data: {
            status: 'ACTIVE',
            lastPaymentDate: new Date()
          }
        });
      }
    }

    // Log activity
    await tx.activityLog.create({
      data: {
        userId,
        entityType: 'invoice',
        entityId: invoice.id,
        action: 'PAYMENT_SUCCESSFUL',
        description: `Simulated payment of ${invoice.amount} ${invoice.currency} for invoice ${invoice.invoiceNumber}`
      }
    });

    return updatedInvoice;
  });

  return {
    success: true,
    message: 'Payment simulated successfully',
    invoice: {
      id: result.id,
      invoiceNumber: result.invoiceNumber,
      status: result.status,
      amount: Number(result.amount),
      currency: result.currency,
      paidAt: result.paidAt
    }
  };
}

async function markOverdue(invoice: any, userId: string) {
  const result = await prisma.$transaction(async (tx) => {
    // Update invoice status
    const updatedInvoice = await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        status: 'OVERDUE'
      }
    });

    // If there's a subscription, mark it as past due
    if (invoice.subscriptionId) {
      await tx.subscription.update({
        where: { id: invoice.subscriptionId },
        data: {
          status: 'PAST_DUE'
        }
      });

      // Log subscription status change
      await tx.activityLog.create({
        data: {
          userId,
          entityType: 'subscription',
          entityId: invoice.subscriptionId,
          action: 'SUBSCRIPTION_UPDATED',
          description: 'Subscription marked as past due due to overdue payment'
        }
      });
    }

    // Log activity
    await tx.activityLog.create({
      data: {
        userId,
        entityType: 'invoice',
        entityId: invoice.id,
        action: 'INVOICE_CREATED', // Using existing enum value
        description: `Invoice ${invoice.invoiceNumber} marked as overdue`
      }
    });

    return updatedInvoice;
  });

  return {
    success: true,
    message: 'Invoice marked as overdue',
    invoice: {
      id: result.id,
      invoiceNumber: result.invoiceNumber,
      status: result.status,
      amount: Number(result.amount),
      currency: result.currency
    }
  };
}

async function cancelInvoice(invoice: any, userId: string) {
  const result = await prisma.$transaction(async (tx) => {
    // Update invoice status
    const updatedInvoice = await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        status: 'CANCELLED'
      }
    });

    // If there's a subscription and it's not paid, cancel it too
    if (invoice.subscriptionId) {
      const subscription = await tx.subscription.findUnique({
        where: { id: invoice.subscriptionId }
      });

      if (subscription && ['TRIAL', 'ACTIVE'].includes(subscription.status)) {
        await tx.subscription.update({
          where: { id: invoice.subscriptionId },
          data: {
            status: 'CANCELLED',
            autoRenew: false
          }
        });

        // Log subscription cancellation
        await tx.activityLog.create({
          data: {
            userId,
            entityType: 'subscription',
            entityId: invoice.subscriptionId,
            action: 'SUBSCRIPTION_CANCELLED',
            description: 'Subscription cancelled due to invoice cancellation'
          }
        });
      }
    }

    // Log activity
    await tx.activityLog.create({
      data: {
        userId,
        entityType: 'invoice',
        entityId: invoice.id,
        action: 'INVOICE_CREATED', // Using existing enum value
        description: `Invoice ${invoice.invoiceNumber} cancelled`
      }
    });

    return updatedInvoice;
  });

  return {
    success: true,
    message: 'Invoice cancelled successfully',
    invoice: {
      id: result.id,
      invoiceNumber: result.invoiceNumber,
      status: result.status,
      amount: Number(result.amount),
      currency: result.currency
    }
  };
}
