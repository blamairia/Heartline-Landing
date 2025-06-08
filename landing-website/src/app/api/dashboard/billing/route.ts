import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        paymentMethods: {
          where: { isActive: true },
          orderBy: { isDefault: 'desc' }
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            subscription: {
              include: {
                plan: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }    // Format payment methods
    const paymentMethods = user.paymentMethods.map((pm: any) => ({
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
    }));    // Format invoices
    const invoices = user.invoices.map((invoice: any) => ({
      id: invoice.id,
      number: invoice.invoiceNumber,
      date: invoice.createdAt,
      dueDate: invoice.dueDate,
      amount: Number(invoice.amount),
      currency: invoice.currency,
      status: invoice.status,
      description: invoice.description || 
        `${invoice.subscription?.plan.displayName || 'Subscription'} - ${invoice.createdAt.toLocaleDateString()}`,
      paidAt: invoice.paidAt,
      downloadUrl: `/api/invoices/${invoice.id}/download` // Will implement later
    }));

    // Calculate billing summary
    const totalPaid = invoices
      .filter((inv: any) => inv.status === 'PAID')
      .reduce((sum: number, inv: any) => sum + inv.amount, 0);

    const pendingAmount = invoices
      .filter((inv: any) => inv.status === 'PENDING')
      .reduce((sum: number, inv: any) => sum + inv.amount, 0);    const overdueAmount = invoices
      .filter((inv: any) => inv.status === 'OVERDUE')
      .reduce((sum: number, inv: any) => sum + inv.amount, 0);

    return NextResponse.json({
      paymentMethods,
      invoices,
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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

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
    await prisma.paymentMethod.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false }
    });
  }

  const paymentMethod = await prisma.paymentMethod.create({
    data: {
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
    }
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId,
      entityType: 'payment_method',
      entityId: paymentMethod.id,
      action: 'PAYMENT_METHOD_ADDED',
      description: `Added payment method: ${type}`
    }
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
  await prisma.paymentMethod.updateMany({
    where: { userId, isDefault: true },
    data: { isDefault: false }
  });

  // Set new default
  const paymentMethod = await prisma.paymentMethod.update({
    where: { id: paymentMethodId, userId },
    data: { isDefault: true }
  });

  return NextResponse.json({
    message: 'Default payment method updated successfully'
  });
}

async function removePaymentMethod(userId: string, paymentMethodId: string) {
  const paymentMethod = await prisma.paymentMethod.update({
    where: { id: paymentMethodId, userId },
    data: { isActive: false }
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId,
      entityType: 'payment_method',
      entityId: paymentMethodId,
      action: 'PAYMENT_METHOD_REMOVED',
      description: `Removed payment method: ${paymentMethod.type}`
    }
  });

  return NextResponse.json({
    message: 'Payment method removed successfully'
  });
}
