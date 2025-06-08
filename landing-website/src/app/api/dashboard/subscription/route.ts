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
        subscriptions: {
          include: {
            plan: true,
            addons: {
              include: {
                addon: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }    // Get current active subscription
    const activeSubscription = user.subscriptions.find(
      (sub: any) => sub.status === 'ACTIVE' || sub.status === 'TRIAL'
    );

    if (!activeSubscription) {
      return NextResponse.json({
        subscription: null,
        hasActiveSubscription: false
      });
    }

    // Calculate total monthly cost
    const baseCost = Number(activeSubscription.plan.price);
    const addonsCost = activeSubscription.addons
      .filter((sa: any) => sa.isActive)
      .reduce((sum: number, sa: any) => sum + (Number(sa.addon.price) * sa.quantity), 0);
    
    const totalMonthlyCost = baseCost + addonsCost;

    // Get usage statistics for current month
    const currentMonth = new Date();
    currentMonth.setDate(1);
    
    const usageStats = await prisma.usageRecord.groupBy({
      by: ['featureType'],
      where: {
        userId: user.id,
        subscriptionId: activeSubscription.id,
        recordDate: { gte: currentMonth }
      },
      _sum: { usage: true }
    });    const formattedUsage = usageStats.map((stat: any) => ({
      feature: stat.featureType,
      usage: stat._sum.usage || 0
    }));

    // Format subscription data
    const subscriptionData = {
      id: activeSubscription.id,
      status: activeSubscription.status,
      plan: {
        id: activeSubscription.plan.id,
        name: activeSubscription.plan.displayName,
        price: Number(activeSubscription.plan.price),
        currency: activeSubscription.plan.currency,
        billingCycle: activeSubscription.billingCycle,
        features: activeSubscription.plan.features
      },      addons: activeSubscription.addons
        .filter((sa: any) => sa.isActive)
        .map((sa: any) => ({
          id: sa.addon.id,
          name: sa.addon.displayName,
          price: Number(sa.addon.price),
          quantity: sa.quantity,
          type: sa.addon.type
        })),
      billing: {
        startDate: activeSubscription.startDate,
        endDate: activeSubscription.endDate,
        nextPaymentDate: activeSubscription.nextPaymentDate,
        lastPaymentDate: activeSubscription.lastPaymentDate,
        totalMonthlyCost,
        currency: activeSubscription.plan.currency,
        autoRenew: activeSubscription.autoRenew
      },
      trial: {
        isTrialUsed: activeSubscription.isTrialUsed,
        trialStartDate: activeSubscription.trialStartDate,
        trialEndDate: activeSubscription.trialEndDate
      },
      usage: formattedUsage
    };

    return NextResponse.json({
      subscription: subscriptionData,
      hasActiveSubscription: true
    });

  } catch (error) {
    console.error('Subscription API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription details' }, 
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
      case 'cancel_subscription':
        return await cancelSubscription(user.id);
      case 'toggle_auto_renew':
        return await toggleAutoRenew(user.id, data.subscriptionId);
      case 'change_plan':
        return await changePlan(user.id, data.newPlanId);
      default:
        return NextResponse.json({ 
          error: 'Invalid action' 
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Subscription POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process subscription request' }, 
      { status: 500 }
    );
  }
}

async function cancelSubscription(userId: string) {
  const activeSubscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: ['ACTIVE', 'TRIAL'] }
    }
  });

  if (!activeSubscription) {
    return NextResponse.json({ 
      error: 'No active subscription found' 
    }, { status: 404 });
  }

  // Update subscription status
  const updatedSubscription = await prisma.subscription.update({
    where: { id: activeSubscription.id },
    data: {
      status: 'CANCELLED',
      autoRenew: false,
      updatedAt: new Date()
    }
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId,
      entityType: 'subscription',
      entityId: activeSubscription.id,
      action: 'SUBSCRIPTION_CANCELLED',
      description: 'Subscription cancelled by user'
    }
  });

  return NextResponse.json({
    message: 'Subscription cancelled successfully',
    subscription: {
      id: updatedSubscription.id,
      status: updatedSubscription.status
    }
  });
}

async function toggleAutoRenew(userId: string, subscriptionId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: {
      id: subscriptionId,
      userId,
      status: { in: ['ACTIVE', 'TRIAL'] }
    }
  });

  if (!subscription) {
    return NextResponse.json({ 
      error: 'Subscription not found' 
    }, { status: 404 });
  }

  const updatedSubscription = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      autoRenew: !subscription.autoRenew,
      updatedAt: new Date()
    }
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId,
      entityType: 'subscription',
      entityId: subscriptionId,
      action: 'SUBSCRIPTION_UPDATED',
      description: `Auto-renew ${updatedSubscription.autoRenew ? 'enabled' : 'disabled'}`
    }
  });

  return NextResponse.json({
    message: `Auto-renew ${updatedSubscription.autoRenew ? 'enabled' : 'disabled'}`,
    autoRenew: updatedSubscription.autoRenew
  });
}

async function changePlan(userId: string, newPlanId: string) {
  // Verify the new plan exists
  const newPlan = await prisma.subscriptionPlan.findUnique({
    where: { id: newPlanId, isActive: true }
  });

  if (!newPlan) {
    return NextResponse.json({ 
      error: 'Plan not found' 
    }, { status: 404 });
  }

  // Find active subscription
  const activeSubscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: ['ACTIVE', 'TRIAL'] }
    }
  });

  if (!activeSubscription) {
    return NextResponse.json({ 
      error: 'No active subscription found' 
    }, { status: 404 });
  }

  // Update subscription plan
  const updatedSubscription = await prisma.subscription.update({
    where: { id: activeSubscription.id },
    data: {
      planId: newPlanId,
      updatedAt: new Date()
    },
    include: {
      plan: true
    }
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId,
      entityType: 'subscription',
      entityId: activeSubscription.id,
      action: 'SUBSCRIPTION_UPDATED',
      description: `Changed plan to: ${newPlan.displayName}`
    }
  });

  return NextResponse.json({
    message: 'Subscription plan updated successfully',
    subscription: {
      id: updatedSubscription.id,
      plan: {
        name: updatedSubscription.plan.displayName,
        price: Number(updatedSubscription.plan.price)
      }
    }
  });
}
