import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma as db } from '@/lib/prisma';
import { 
  users, 
  paymentMethods, 
  invoices, 
  subscriptions, 
  subscriptionPlans,
  activityLogs,
  payments
} from '../../../../../db/schema';
import { eq, and, desc, count, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const [user] = await db.select().from(users).where(eq(users.email, session.user.email));

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get payment methods
    const userPaymentMethods = await db.select()
      .from(paymentMethods)
      .where(and(eq(paymentMethods.userId, user.id), eq(paymentMethods.isActive, true)))
      .orderBy(desc(paymentMethods.isDefault));

    // Get invoices with subscription details
    const userInvoices = await db.select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      amount: invoices.amountDue,
      currency: invoices.currency,
      status: invoices.status,
      description: invoices.description,
      dueDate: invoices.dueDate,
      paidAt: invoices.paidAt,
      createdAt: invoices.createdAt,
      planName: subscriptionPlans.displayName
    })
    .from(invoices)
    .leftJoin(subscriptions, eq(invoices.subscriptionId, subscriptions.id))
    .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
    .where(eq(invoices.userId, user.id))
    .orderBy(desc(invoices.createdAt))
    .limit(20);

    // Format payment methods
    const formattedPaymentMethods = userPaymentMethods.map((pm) => ({
      id: pm.id,
      type: pm.type,
      provider: pm.provider,
      last4: pm.last4,
      brand: pm.brand,
      expiryMonth: pm.expiryMonth,
      expiryYear: pm.expiryYear,
      holderName: pm.holderName,
      bankName: pm.bankName,
      isDefault: pm.isDefault,
      display: pm.type === 'CREDIT_CARD' || pm.type === 'DEBIT_CARD' 
        ? `${pm.brand?.toUpperCase()} •••• ${pm.last4}`
        : pm.type === 'BANK_TRANSFER'
        ? `${pm.bankName} - ${pm.accountNumber?.slice(-4)}`
        : pm.type === 'CCP_ACCOUNT'
        ? `CCP - ${pm.accountNumber?.slice(-4)}`
        : pm.provider
    }));

    // Format invoices
    const formattedInvoices = userInvoices.map((invoice) => ({
      id: invoice.id,
      number: invoice.invoiceNumber,
      date: invoice.createdAt,
      dueDate: invoice.dueDate,
      amount: Number(invoice.amount),
      currency: invoice.currency,
      status: invoice.status,
      description: invoice.description || 
        `${invoice.planName || 'Subscription'} - ${invoice.createdAt?.toLocaleDateString()}`,
      paidAt: invoice.paidAt,
      downloadUrl: `/api/invoices/${invoice.id}/download`
    }));

    // Calculate billing summary
    const totalPaid = formattedInvoices
      .filter((inv) => inv.status === 'PAID')
      .reduce((sum, inv) => sum + inv.amount, 0);

    const pendingAmount = formattedInvoices
      .filter((inv) => inv.status === 'OPEN')
      .reduce((sum, inv) => sum + inv.amount, 0);

    const overdueAmount = formattedInvoices
      .filter((inv) => inv.status === 'OPEN' && new Date(inv.dueDate!) < new Date())
      .reduce((sum, inv) => sum + inv.amount, 0);

    return NextResponse.json({
      paymentMethods: formattedPaymentMethods,
      invoices: formattedInvoices,
      summary: {
        totalPaid,
        pendingAmount,
        overdueAmount,
        currency: 'DZD'
      }
    });

  } catch (error) {
    console.error('Billing API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch billing information' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [user] = await db.select().from(users).where(eq(users.email, session.user.email));

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'add_payment_method':
        return await addPaymentMethod(user.id, data);
      case 'set_default_payment_method':
        return await setDefaultPaymentMethod(user.id, data.paymentMethodId);
      case 'remove_payment_method':
        return await removePaymentMethod(user.id, data.paymentMethodId);
      case 'process_payment':
        return await processPayment(user.id, data);
      case 'process_cash_payment':
        return await processCashPayment(user.id, data);
      case 'generate_invoice':
        return await generateInvoice(user.id, data);
      case 'auto_renew_subscription':
        return await processAutoRenewal(user.id, data);
      case 'cancel_invoice':
        return await cancelInvoice(user.id, data.invoiceId);
      case 'mark_overdue':
        return await markInvoicesOverdue();
      default:
        return NextResponse.json({ 
          error: 'Invalid action' 
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Billing POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process billing request' }, 
      { status: 500 }
    );
  }
}

async function addPaymentMethod(userId: string, data: any) {
  const {
    type,
    provider,
    last4,
    brand,
    expiryMonth,
    expiryYear,
    holderName,
    bankName,
    accountNumber,
    isDefault = false
  } = data;

  // If setting as default, remove default from other methods
  if (isDefault) {
    await db.update(paymentMethods)
      .set({ isDefault: false })
      .where(and(eq(paymentMethods.userId, userId), eq(paymentMethods.isDefault, true)));
  }

  const [paymentMethod] = await db.insert(paymentMethods).values({
    userId,
    type,
    provider,
    last4,
    brand,
    expiryMonth,
    expiryYear,
    holderName,
    bankName,
    accountNumber,
    isDefault,
    isActive: true
  }).returning();

  // Log activity
  await db.insert(activityLogs).values({
    userId,
    entityType: 'payment_method',
    entityId: paymentMethod.id,
    action: 'PAYMENT_METHOD_ADDED',
    description: `Added payment method: ${type}`
  });

  return NextResponse.json({
    message: 'Payment method added successfully',
    paymentMethod: {
      id: paymentMethod.id,
      type: paymentMethod.type,
      display: type === 'CREDIT_CARD' || type === 'DEBIT_CARD' 
        ? `${brand?.toUpperCase()} •••• ${last4}`
        : `${provider}`
    }
  });
}

async function setDefaultPaymentMethod(userId: string, paymentMethodId: string) {
  // Remove default from all payment methods
  await db.update(paymentMethods)
    .set({ isDefault: false })
    .where(and(eq(paymentMethods.userId, userId), eq(paymentMethods.isDefault, true)));

  // Set new default
  await db.update(paymentMethods)
    .set({ isDefault: true })
    .where(and(eq(paymentMethods.id, paymentMethodId), eq(paymentMethods.userId, userId)));

  return NextResponse.json({
    message: 'Default payment method updated successfully'
  });
}

async function removePaymentMethod(userId: string, paymentMethodId: string) {
  const [paymentMethod] = await db.update(paymentMethods)
    .set({ isActive: false })
    .where(and(eq(paymentMethods.id, paymentMethodId), eq(paymentMethods.userId, userId)))
    .returning();

  // Log activity
  await db.insert(activityLogs).values({
    userId,
    entityType: 'payment_method',
    entityId: paymentMethodId,
    action: 'PAYMENT_METHOD_REMOVED',
    description: `Removed payment method: ${paymentMethod.type}`
  });

  return NextResponse.json({
    message: 'Payment method removed successfully'
  });
}

// NEW: Real payment processing function
async function processPayment(userId: string, data: any) {
  const { invoiceId, paymentMethodId, amount, paymentType = 'ONLINE' } = data;

  try {
    // Get invoice
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
    
    if (!invoice || invoice.userId !== userId) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.status === 'PAID') {
      return NextResponse.json({ error: 'Invoice already paid' }, { status: 400 });
    }

    // Get payment method
    const [paymentMethod] = await db.select().from(paymentMethods)
      .where(and(eq(paymentMethods.id, paymentMethodId), eq(paymentMethods.userId, userId)));

    if (!paymentMethod) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 });
    }

    // For demo purposes, we'll simulate payment processing
    // In production, integrate with actual payment processors (Stripe, PayPal, local banks)
    const paymentSuccess = await simulatePaymentProcessing(paymentMethod, amount);

    if (!paymentSuccess.success) {
      return NextResponse.json({ 
        error: 'Payment failed', 
        details: paymentSuccess.error 
      }, { status: 400 });
    }    // Record payment
    const [payment] = await db.insert(payments).values({
      invoiceId,
      userId,
      amount: amount,
      currency: invoice.currency,
      status: 'SUCCEEDED',
      paymentMethodUsed: paymentMethod.type,
      paymentProvider: 'STRIPE', // Convert string to enum value
      paymentProviderTransactionId: paymentSuccess.transactionId,
      metadata: paymentSuccess.details
    }).returning();

    // Update invoice status
    await db.update(invoices)
      .set({ 
        status: 'PAID', 
        paidAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(invoices.id, invoiceId));

    // Log activity
    await db.insert(activityLogs).values({
      userId,
      entityType: 'payment',
      entityId: payment.id,
      action: 'PAYMENT_PROCESSED',
      description: `Payment of ${amount} ${invoice.currency} processed for invoice ${invoice.invoiceNumber}`
    });    return NextResponse.json({
      message: 'Payment processed successfully',
      payment: {
        id: payment.id,
        transactionId: payment.paymentProviderTransactionId,
        amount: payment.amount,
        status: payment.status
      }
    });

  } catch (error) {
    console.error('Payment processing error:', error);
    return NextResponse.json({ 
      error: 'Payment processing failed' 
    }, { status: 500 });
  }
}

// NEW: Invoice generation function
async function generateInvoice(userId: string, data: any) {
  const { subscriptionId, amount, description, dueDate } = data;

  try {    // Generate invoice number
    const [{ value: invoiceCount }] = await db.select({ value: count() }).from(invoices).where(eq(invoices.userId, userId));
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(4, '0')}`;    const [invoice] = await db.insert(invoices).values({
      userId,
      subscriptionId,
      invoiceNumber,
      amount: amount, // Added missing amount field
      amountDue: amount,
      amountRemaining: amount,
      currency: 'DZD',
      status: 'OPEN',
      description,
      dueDate: new Date(dueDate),
    }).returning();

    // Log activity
    await db.insert(activityLogs).values({
      userId,
      entityType: 'invoice',
      entityId: invoice.id,
      action: 'INVOICE_GENERATED',
      description: `Invoice ${invoiceNumber} generated for ${amount} DZD`
    });    return NextResponse.json({
      message: 'Invoice generated successfully',
      invoice: {
        id: invoice.id,
        number: invoice.invoiceNumber,
        amount: invoice.amountDue,
        status: invoice.status,
        dueDate: invoice.dueDate
      }
    });

  } catch (error) {
    console.error('Invoice generation error:', error);
    return NextResponse.json({ 
      error: 'Invoice generation failed' 
    }, { status: 500 });
  }
}

// Internal invoice generation function that returns the invoice object
async function generateInvoiceInternal(userId: string, data: any) {
  const { subscriptionId, amount, description, dueDate } = data;

  try {
    // Generate invoice number
    const [{ value: invoiceCount }] = await db.select({ value: count() }).from(invoices).where(eq(invoices.userId, userId));
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(4, '0')}`;    const [invoice] = await db.insert(invoices).values({
      userId,
      subscriptionId,
      invoiceNumber,
      amount: amount, // Added missing amount field
      amountDue: amount,
      amountRemaining: amount,
      currency: 'DZD',
      status: 'OPEN',
      description,
      dueDate: new Date(dueDate),
    }).returning();

    // Log activity
    await db.insert(activityLogs).values({
      userId,
      entityType: 'invoice',
      entityId: invoice.id,
      action: 'INVOICE_GENERATED',
      description: `Invoice ${invoiceNumber} generated for ${amount} DZD`
    });

    return invoice;

  } catch (error) {
    console.error('Invoice generation error:', error);
    throw error;
  }
}

// Payment simulation function (replace with real payment processor integration)
async function simulatePaymentProcessing(paymentMethod: any, amount: number) {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Simulate success/failure based on payment method type
  const successRate = paymentMethod.type === 'CREDIT_CARD' ? 0.95 : 
                     paymentMethod.type === 'BANK_TRANSFER' ? 0.85 : 0.90;

  const isSuccess = Math.random() < successRate;

  if (isSuccess) {
    return {
      success: true,
      transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      details: {
        processor: paymentMethod.provider || 'INTERNAL',
        processingTime: '1.2s',
        fees: amount * 0.025, // 2.5% processing fee
        netAmount: amount * 0.975
      }
    };
  } else {
    return {
      success: false,
      error: 'Payment declined by processor',
      code: 'INSUFFICIENT_FUNDS'
    };
  }
}

// NEW: Cash payment processing function for Algerian market
async function processCashPayment(userId: string, data: any) {
  const { invoiceId, amount, reference, location, receivedBy } = data;

  try {
    // Get invoice
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
    
    if (!invoice || invoice.userId !== userId) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.status === 'PAID') {
      return NextResponse.json({ error: 'Invoice already paid' }, { status: 400 });
    }    // Record cash payment
    const [payment] = await db.insert(payments).values({
      invoiceId,
      userId,
      amount: amount,
      currency: invoice.currency,
      status: 'SUCCEEDED',
      paymentMethodUsed: 'CASH',
      paymentProvider: 'OTHER',
      paymentProviderTransactionId: `CASH_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      metadata: {
        cashPayment: true,
        reference,
        location,
        receivedBy,
        processedAt: new Date().toISOString()
      }
    }).returning();

    // Update invoice status
    await db.update(invoices)
      .set({ 
        status: 'PAID', 
        paidAt: new Date(),
        amountPaid: amount,
        amountRemaining: invoice.amountDue - amount,
        offlinePaymentMethod: 'CASH',
        offlinePaymentReference: reference,
        updatedAt: new Date()
      })
      .where(eq(invoices.id, invoiceId));

    // Log activity
    await db.insert(activityLogs).values({
      userId,
      entityType: 'payment',
      entityId: payment.id,
      action: 'CASH_PAYMENT_PROCESSED',
      description: `Cash payment of ${amount} ${invoice.currency} received for invoice ${invoice.invoiceNumber}`
    });

    return NextResponse.json({
      message: 'Cash payment processed successfully',
      payment: {
        id: payment.id,
        transactionId: payment.paymentProviderTransactionId,
        amount: payment.amount,
        status: payment.status,
        reference
      }
    });

  } catch (error) {
    console.error('Cash payment processing error:', error);
    return NextResponse.json({ 
      error: 'Cash payment processing failed' 
    }, { status: 500 });
  }
}

// NEW: Auto-renewal processing for subscriptions
async function processAutoRenewal(userId: string, data: any) {
  const { subscriptionId } = data;

  try {    // Get subscription with plan details
    const [subscription] = await db.select({
      id: subscriptions.id,
      userId: subscriptions.userId,
      planId: subscriptions.planId,
      status: subscriptions.status,
      endDate: subscriptions.endDate,
      autoRenew: subscriptions.autoRenew,
      planPrice: subscriptionPlans.price,
      planCurrency: subscriptionPlans.currency,
      planName: subscriptionPlans.displayName
    })
    .from(subscriptions)
    .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
    .where(and(eq(subscriptions.id, subscriptionId), eq(subscriptions.userId, userId)));

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    if (!subscription.autoRenew) {
      return NextResponse.json({ error: 'Auto-renewal is disabled' }, { status: 400 });
    }    // Generate renewal invoice
    const invoiceResult = await generateInvoiceInternal(userId, {
      subscriptionId,
      amount: subscription.planPrice,
      description: `Auto-renewal: ${subscription.planName}`,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    });

    // Try to process payment with default payment method
    const defaultPaymentMethods = await db.select()
      .from(paymentMethods)
      .where(and(
        eq(paymentMethods.userId, userId), 
        eq(paymentMethods.isDefault, true),
        eq(paymentMethods.isActive, true)
      ));

    if (defaultPaymentMethods.length > 0) {
      // Attempt automatic payment
      await processPayment(userId, {
        invoiceId: invoiceResult.id,
        paymentMethodId: defaultPaymentMethods[0].id,
        amount: subscription.planPrice
      });
    }

    return NextResponse.json({
      message: 'Auto-renewal processed successfully',
      renewal: {
        invoiceId: invoiceResult.id,
        amount: subscription.planPrice,
        dueDate: invoiceResult.dueDate
      }
    });

  } catch (error) {
    console.error('Auto-renewal processing error:', error);
    return NextResponse.json({ 
      error: 'Auto-renewal processing failed' 
    }, { status: 500 });
  }
}

// NEW: Cancel invoice function
async function cancelInvoice(userId: string, invoiceId: string) {
  try {
    const [invoice] = await db.select().from(invoices)
      .where(and(eq(invoices.id, invoiceId), eq(invoices.userId, userId)));

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.status === 'PAID') {
      return NextResponse.json({ error: 'Cannot cancel paid invoice' }, { status: 400 });
    }

    // Update invoice to void status
    await db.update(invoices)
      .set({ 
        status: 'VOID',
        updatedAt: new Date()
      })
      .where(eq(invoices.id, invoiceId));

    // Log activity
    await db.insert(activityLogs).values({
      userId,
      entityType: 'invoice',
      entityId: invoiceId,
      action: 'INVOICE_CANCELLED',
      description: `Invoice ${invoice.invoiceNumber} was cancelled`
    });

    return NextResponse.json({
      message: 'Invoice cancelled successfully'
    });

  } catch (error) {
    console.error('Invoice cancellation error:', error);
    return NextResponse.json({ 
      error: 'Invoice cancellation failed' 
    }, { status: 500 });
  }
}

// NEW: Mark overdue invoices function (can be called via cron job)
async function markInvoicesOverdue() {
  try {
    const now = new Date();
    
    // Find all open invoices past due date
    const overdueInvoices = await db.select()
      .from(invoices)
      .where(and(
        eq(invoices.status, 'OPEN'),
        sql`${invoices.dueDate} < ${now}`
      ));

    if (overdueInvoices.length === 0) {
      return NextResponse.json({
        message: 'No overdue invoices found',
        count: 0
      });
    }

    // Update all overdue invoices
    await db.update(invoices)
      .set({ 
        status: 'UNCOLLECTIBLE',
        updatedAt: now
      })
      .where(and(
        eq(invoices.status, 'OPEN'),
        sql`${invoices.dueDate} < ${now}`
      ));

    // Log activities for each overdue invoice
    for (const invoice of overdueInvoices) {
      await db.insert(activityLogs).values({
        userId: invoice.userId,
        entityType: 'invoice',
        entityId: invoice.id,
        action: 'INVOICE_MARKED_OVERDUE',
        description: `Invoice ${invoice.invoiceNumber} marked as overdue`
      });
    }

    return NextResponse.json({
      message: `${overdueInvoices.length} invoices marked as overdue`,
      count: overdueInvoices.length
    });

  } catch (error) {
    console.error('Mark overdue invoices error:', error);
    return NextResponse.json({ 
      error: 'Failed to mark overdue invoices' 
    }, { status: 500 });
  }
}
