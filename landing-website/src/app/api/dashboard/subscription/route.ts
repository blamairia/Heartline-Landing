import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma as db } from '@/lib/prisma';
import { users, subscriptions, subscriptionPlans, subscriptionAddons, subscriptionAddonInstances, activityLogs } from '../../../../../db/schema';
import { eq, and, desc, sql, inArray, sum } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [user] = await db.select().from(users).where(eq(users.email, session.user.email));

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get ALL user's subscriptions with plans (regardless of status)
    const userSubscriptions = await db
      .select({
        id: subscriptions.id,
        status: subscriptions.status,
        startDate: subscriptions.startDate,
        endDate: subscriptions.endDate,
        trialStart: subscriptions.trialStartDate,
        trialEnd: subscriptions.trialEndDate,
        autoRenew: subscriptions.autoRenew,
        createdAt: subscriptions.createdAt,
        updatedAt: subscriptions.updatedAt,
        cancelledAt: subscriptions.cancelledAt,
        cancellationReason: subscriptions.cancellationReason,
        paymentProvider: subscriptions.paymentProvider,
        offlinePaymentReference: subscriptions.offlinePaymentReference,
        planId: subscriptionPlans.id,
        planName: subscriptionPlans.name,
        planDisplayName: subscriptionPlans.displayName,
        planPrice: subscriptionPlans.price,
        planCurrency: subscriptionPlans.currency,
        planBillingCycle: subscriptionPlans.billingCycle,
        planFeatures: subscriptionPlans.features
      })
      .from(subscriptions)
      .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .where(eq(subscriptions.userId, user.id))
      .orderBy(desc(subscriptions.createdAt));

    // Get current active subscription (if any)
    const activeSubscription = userSubscriptions.find(
      (sub: any) => sub.status === 'ACTIVE' || sub.status === 'TRIALING'
    );

    // For each subscription, get its addons
    const subscriptionsWithAddons = await Promise.all(
      userSubscriptions.map(async (subscription: any) => {
        const subAddons = await db
          .select({
            id: subscriptionAddonInstances.id,
            quantity: subscriptionAddonInstances.quantity,
            priceAtPurchase: subscriptionAddonInstances.priceAtPurchase,
            status: subscriptionAddonInstances.status,
            startDate: subscriptionAddonInstances.startDate,
            endDate: subscriptionAddonInstances.endDate,
            addonId: subscriptionAddons.id,
            addonName: subscriptionAddons.name,
            addonDisplayName: subscriptionAddons.displayName,
            addonDescription: subscriptionAddons.description
          })
          .from(subscriptionAddonInstances)
          .innerJoin(subscriptionAddons, eq(subscriptionAddonInstances.addonId, subscriptionAddons.id))
          .where(eq(subscriptionAddonInstances.subscriptionId, subscription.id));

        return {
          ...subscription,
          addons: subAddons
        };
      })
    );

    return NextResponse.json({
      subscriptions: subscriptionsWithAddons,
      activeSubscription: activeSubscription ? {
        id: activeSubscription.id,
        status: activeSubscription.status,
        plan: {
          id: activeSubscription.planId,
          name: activeSubscription.planName,
          displayName: activeSubscription.planDisplayName,
          price: activeSubscription.planPrice,
          currency: activeSubscription.planCurrency,
          billingCycle: activeSubscription.planBillingCycle,
          features: activeSubscription.planFeatures
        },
        currentPeriodStart: activeSubscription.startDate,
        currentPeriodEnd: activeSubscription.endDate,
        trialStart: activeSubscription.trialStart,
        trialEnd: activeSubscription.trialEnd,
        autoRenew: activeSubscription.autoRenew,
        createdAt: activeSubscription.createdAt
      } : null,
      hasActiveSubscription: !!activeSubscription,
      totalSubscriptions: userSubscriptions.length,
      summary: {
        active: userSubscriptions.filter(s => s.status === 'ACTIVE').length,
        pending: userSubscriptions.filter(s => s.status === 'PENDING_ACTIVATION').length,
        cancelled: userSubscriptions.filter(s => s.status === 'CANCELLED').length,
        trialing: userSubscriptions.filter(s => s.status === 'TRIALING').length
      }
    });

  } catch (error) {
    console.error('Subscription API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, subscriptionId, planId } = body;

    const [user] = await db.select().from(users).where(eq(users.email, session.user.email));

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    switch (action) {
      case 'cancel':
        return await cancelSubscription(user.id);
      case 'toggle_auto_renew':
        return await toggleAutoRenew(user.id, subscriptionId);
      case 'change_plan':
        return await changePlan(user.id, planId);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Subscription Action Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function cancelSubscription(userId: string) {
  try {
    const activeSubscriptions = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          inArray(subscriptions.status, ['ACTIVE', 'TRIALING'])
        )
      );

    if (activeSubscriptions.length === 0) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    const subscription = activeSubscriptions[0];

    await db
      .update(subscriptions)
      .set({
        status: 'CANCELLED',
        autoRenew: false,
        updatedAt: new Date()
      })
      .where(eq(subscriptions.id, subscription.id));    // Log the activity
    await db.insert(activityLogs).values({
      userId,
      entityType: 'subscription', // Added missing entityType
      entityId: subscription.id, // Added missing entityId
      action: 'subscription_cancelled',
      description: 'User cancelled their subscription',
      metadata: { subscriptionId: subscription.id },
      createdAt: new Date()
    });

    return NextResponse.json({ 
      message: 'Subscription cancelled successfully',
      subscription: { ...subscription, status: 'CANCELLED', autoRenew: false }
    });

  } catch (error) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
  }
}

async function toggleAutoRenew(userId: string, subscriptionId: string) {
  try {
    const activeSubscriptions = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.id, subscriptionId),
          inArray(subscriptions.status, ['ACTIVE', 'TRIALING'])
        )
      );

    if (activeSubscriptions.length === 0) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    const subscription = activeSubscriptions[0];
    const newAutoRenew = !subscription.autoRenew;

    await db
      .update(subscriptions)
      .set({
        autoRenew: newAutoRenew,
        updatedAt: new Date()
      })
      .where(eq(subscriptions.id, subscriptionId));    // Log the activity
    await db.insert(activityLogs).values({
      userId,
      entityType: 'subscription', // Added missing entityType
      entityId: subscriptionId, // Added missing entityId
      action: newAutoRenew ? 'auto_renew_enabled' : 'auto_renew_disabled',
      description: `User ${newAutoRenew ? 'enabled' : 'disabled'} auto-renewal`,
      metadata: { subscriptionId },
      createdAt: new Date()
    });

    return NextResponse.json({ 
      message: `Auto-renewal ${newAutoRenew ? 'enabled' : 'disabled'}`,
      autoRenew: newAutoRenew 
    });

  } catch (error) {
    console.error('Toggle auto-renew error:', error);
    return NextResponse.json({ error: 'Failed to toggle auto-renewal' }, { status: 500 });
  }
}

async function changePlan(userId: string, newPlanId: string) {
  try {
    // Get user's active subscription
    const activeSubscriptions = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          inArray(subscriptions.status, ['ACTIVE', 'TRIALING'])
        )
      );

    if (activeSubscriptions.length === 0) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    const currentSubscription = activeSubscriptions[0];

    // Get the new plan details
    const [newPlan] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, newPlanId));

    if (!newPlan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Update the subscription
    await db
      .update(subscriptions)
      .set({
        planId: newPlanId,
        updatedAt: new Date()
      })
      .where(eq(subscriptions.id, currentSubscription.id));    // Log the activity
    await db.insert(activityLogs).values({
      userId,
      entityType: 'subscription', // Added missing entityType
      entityId: currentSubscription.id, // Added missing entityId
      action: 'plan_changed',
      description: `User changed to ${newPlan.displayName}`,
      metadata: { 
        subscriptionId: currentSubscription.id,
        oldPlanId: currentSubscription.planId,
        newPlanId: newPlanId
      },
      createdAt: new Date()
    });

    return NextResponse.json({ 
      message: 'Plan changed successfully',
      subscription: { 
        ...currentSubscription, 
        planId: newPlanId,
        plan: newPlan
      }
    });

  } catch (error) {
    console.error('Change plan error:', error);
    return NextResponse.json({ error: 'Failed to change plan' }, { status: 500 });
  }
}
