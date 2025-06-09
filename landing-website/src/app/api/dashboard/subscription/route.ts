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

    // Get user's subscriptions with plans
    const userSubscriptions = await db
      .select({
        id: subscriptions.id,
        status: subscriptions.status,
        startDate: subscriptions.startDate,
        endDate: subscriptions.endDate,        trialStart: subscriptions.trialStartDate,
        trialEnd: subscriptions.trialEndDate,
        autoRenew: subscriptions.autoRenew,
        createdAt: subscriptions.createdAt,
        planId: subscriptionPlans.id,
        planName: subscriptionPlans.displayName,
        planPrice: subscriptionPlans.price,
        planCurrency: subscriptionPlans.currency,
        planBillingCycle: subscriptionPlans.billingCycle,
        planFeatures: subscriptionPlans.features
      })
      .from(subscriptions)
      .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .where(eq(subscriptions.userId, user.id))
      .orderBy(desc(subscriptions.createdAt));

    // Get current active subscription
    const activeSubscription = userSubscriptions.find(
      (sub: any) => sub.status === 'ACTIVE' || sub.status === 'TRIALING'
    );

    if (!activeSubscription) {
      return NextResponse.json({
        message: 'No active subscription found',
        subscription: null,
        allSubscriptions: userSubscriptions,
        addons: [],
        usage: []
      });
    }

    // Get subscription addon instances
    const subAddons = await db
      .select({
        id: subscriptionAddonInstances.id,
        quantity: subscriptionAddonInstances.quantity,
        priceAtPurchase: subscriptionAddonInstances.priceAtPurchase,
        status: subscriptionAddonInstances.status,
        startDate: subscriptionAddonInstances.startDate,
        endDate: subscriptionAddonInstances.endDate,
        addonName: subscriptionAddons.displayName,
        addonDescription: subscriptionAddons.description
      })
      .from(subscriptionAddonInstances)
      .innerJoin(subscriptionAddons, eq(subscriptionAddonInstances.addonId, subscriptionAddons.id))
      .where(
        and(
          eq(subscriptionAddonInstances.subscriptionId, activeSubscription.id),
          eq(subscriptionAddonInstances.status, 'ACTIVE')
        )
      );

    return NextResponse.json({
      subscription: {
        id: activeSubscription.id,
        status: activeSubscription.status,
        plan: {
          id: activeSubscription.planId,
          name: activeSubscription.planName,
          price: activeSubscription.planPrice,
          currency: activeSubscription.planCurrency,
          billingCycle: activeSubscription.planBillingCycle,
          features: activeSubscription.planFeatures
        },
        currentPeriodStart: activeSubscription.startDate,
        currentPeriodEnd: activeSubscription.endDate,        trialStart: activeSubscription.trialStart,
        trialEnd: activeSubscription.trialEnd,
        autoRenew: activeSubscription.autoRenew,
        createdAt: activeSubscription.createdAt
      },
      allSubscriptions: userSubscriptions.map((sub: any) => ({
        id: sub.id,
        status: sub.status,
        planName: sub.planName,
        createdAt: sub.createdAt
      })),
      addons: subAddons,
      usage: [] // Usage tracking can be implemented later
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
      .where(eq(subscriptions.id, subscription.id));

    // Log the activity
    await db.insert(activityLogs).values({
      userId,
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
      .where(eq(subscriptions.id, subscriptionId));

    // Log the activity
    await db.insert(activityLogs).values({
      userId,
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
      .where(eq(subscriptions.id, currentSubscription.id));

    // Log the activity
    await db.insert(activityLogs).values({
      userId,
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
