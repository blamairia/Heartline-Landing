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
    const { 
      planId, 
      addons = [], 
      billingAddress,
      paymentMethod,
      simulatePayment = true 
    } = body;

    // Validate required fields
    if (!planId || !billingAddress) {
      return NextResponse.json({ 
        error: 'Plan ID and billing address are required' 
      }, { status: 400 });
    }

    // Check if user already has an active subscription
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        status: { in: ['ACTIVE', 'TRIAL'] }
      }
    });

    if (existingSubscription) {
      return NextResponse.json({ 
        error: 'User already has an active subscription' 
      }, { status: 400 });
    }    // Get the subscription plan
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { name: planId }
    });

    if (!plan || !plan.isActive) {
      return NextResponse.json({ 
        error: 'Invalid or inactive subscription plan' 
      }, { status: 400 });
    }

    // Get addon details if specified
    let validAddons: any[] = [];
    if (addons.length > 0) {
      validAddons = await prisma.addon.findMany({
        where: {
          id: { in: addons.map((a: any) => a.addonId) },
          isActive: true
        }
      });

      if (validAddons.length !== addons.length) {
        return NextResponse.json({ 
          error: 'One or more addons are invalid or inactive' 
        }, { status: 400 });
      }
    }

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    
    if (plan.billingCycle === 'MONTHLY') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (plan.billingCycle === 'ANNUAL') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    const nextPaymentDate = new Date(endDate);

    // Calculate total cost
    const baseCost = Number(plan.price);
    const addonsCost = addons.reduce((sum: number, addon: any) => {
      const addonDetails = validAddons.find(a => a.id === addon.addonId);
      return sum + (Number(addonDetails?.price || 0) * (addon.quantity || 1));
    }, 0);
    
    const totalCost = baseCost + addonsCost;

    // Start database transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create subscription
      const subscription = await tx.subscription.create({
        data: {
          userId: user.id,
          planId: plan.id,
          status: 'ACTIVE',
          startDate,
          endDate,
          billingCycle: plan.billingCycle,
          autoRenew: true,
          nextPaymentDate,
          lastPaymentDate: startDate,
          paymentMethod: paymentMethod?.type || 'SIMULATED'
        }
      });

      // Add subscription addons if any
      if (validAddons.length > 0) {
        const subscriptionAddons = addons.map((addon: any) => ({
          subscriptionId: subscription.id,
          addonId: addon.addonId,
          quantity: addon.quantity || 1,
          isActive: true
        }));

        await tx.subscriptionAddon.createMany({
          data: subscriptionAddons
        });
      }

      // Create/update payment method if provided
      let savedPaymentMethod = null;
      if (paymentMethod) {
        // Set all other payment methods as non-default
        await tx.paymentMethod.updateMany({
          where: { userId: user.id, isDefault: true },
          data: { isDefault: false }
        });

        savedPaymentMethod = await tx.paymentMethod.create({
          data: {
            userId: user.id,
            type: paymentMethod.type,
            provider: paymentMethod.provider || 'simulated',
            last4: paymentMethod.last4,
            brand: paymentMethod.brand,
            expiryMonth: paymentMethod.expiryMonth,
            expiryYear: paymentMethod.expiryYear,
            holderName: paymentMethod.holderName,
            bankName: paymentMethod.bankName,
            accountNumber: paymentMethod.accountNumber,
            isDefault: true,
            isActive: true
          }
        });
      }

      // Update user with billing address
      await tx.user.update({
        where: { id: user.id },
        data: {
          firstName: billingAddress.firstName || user.firstName,
          lastName: billingAddress.lastName || user.lastName,
          phone: billingAddress.phone || user.phone,
          address: billingAddress.address,
          city: billingAddress.city,
          wilaya: billingAddress.wilaya,
          organization: billingAddress.organization || user.organization
        }
      });

      // Generate invoice
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      
      const invoice = await tx.invoice.create({
        data: {
          userId: user.id,
          subscriptionId: subscription.id,
          paymentMethodId: savedPaymentMethod?.id,
          invoiceNumber,
          amount: totalCost,
          currency: plan.currency,
          status: simulatePayment ? 'PAID' : 'PENDING',
          dueDate: simulatePayment ? startDate : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          paidAt: simulatePayment ? startDate : null,
          description: `${plan.displayName} subscription${validAddons.length > 0 ? ' with addons' : ''}`,
          metadata: {
            billingAddress,
            planDetails: {
              planId: plan.id,
              planName: plan.displayName,
              billingCycle: plan.billingCycle,
              addons: addons
            },
            paymentSimulated: simulatePayment
          }
        }
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          userId: user.id,
          entityType: 'subscription',
          entityId: subscription.id,
          action: 'SUBSCRIPTION_CREATED',
          description: `Created ${plan.displayName} subscription with ${simulatePayment ? 'simulated' : 'pending'} payment`
        }
      });

      if (simulatePayment) {
        await tx.activityLog.create({
          data: {
            userId: user.id,
            entityType: 'invoice',
            entityId: invoice.id,
            action: 'PAYMENT_SUCCESSFUL',
            description: `Simulated payment of ${totalCost} ${plan.currency} for invoice ${invoiceNumber}`
          }
        });
      }

      return {
        subscription,
        invoice,
        paymentMethod: savedPaymentMethod,
        totalCost
      };
    });

    return NextResponse.json({
      success: true,
      message: simulatePayment 
        ? 'Subscription created with simulated payment' 
        : 'Subscription created, payment pending',
      data: {
        subscriptionId: result.subscription.id,
        invoiceId: result.invoice.id,
        invoiceNumber: result.invoice.invoiceNumber,
        totalCost: result.totalCost,
        currency: plan.currency,
        paymentStatus: simulatePayment ? 'PAID' : 'PENDING',
        nextPaymentDate: nextPaymentDate.toISOString(),
        billingAddress,
        paymentMethod: result.paymentMethod ? {
          id: result.paymentMethod.id,
          type: result.paymentMethod.type,
          display: result.paymentMethod.type === 'CREDIT_CARD' || result.paymentMethod.type === 'DEBIT_CARD'
            ? `${result.paymentMethod.brand?.toUpperCase()} •••• ${result.paymentMethod.last4}`
            : result.paymentMethod.provider
        } : null
      }
    });

  } catch (error: any) {
    console.error('Subscription creation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create subscription',
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}
