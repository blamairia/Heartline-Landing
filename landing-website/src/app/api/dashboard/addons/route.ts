import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma as db } from '@/lib/prisma';
import { 
  users, 
  subscriptions, 
  subscriptionAddons,
  subscriptionAddonInstances,
  activityLogs
} from '../../../../../db/schema';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user with active subscriptions and addons
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    const user = userResult[0];
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's active subscriptions
    const activeSubscriptions = await db
      .select()
      .from(subscriptions)
      .where(and(
        eq(subscriptions.userId, user.id),
        inArray(subscriptions.status, ['ACTIVE', 'TRIALING'])
      ));

    const activeSubscription = activeSubscriptions[0];

    // Get user's subscription addon instances if they have an active subscription
    let userSubscriptionAddonInstances: any[] = [];
    if (activeSubscription) {
      userSubscriptionAddonInstances = await db
        .select({
          addonId: subscriptionAddonInstances.addonId,
          quantity: subscriptionAddonInstances.quantity,
          status: subscriptionAddonInstances.status,
          createdAt: subscriptionAddonInstances.createdAt,
          addon: {
            id: subscriptionAddons.id,
            name: subscriptionAddons.name,
            displayName: subscriptionAddons.displayName,
            description: subscriptionAddons.description,
            price: subscriptionAddons.price,
            currency: subscriptionAddons.currency,
            type: subscriptionAddons.type,
            features: subscriptionAddons.features
          }
        })
        .from(subscriptionAddonInstances)
        .leftJoin(subscriptionAddons, eq(subscriptionAddonInstances.addonId, subscriptionAddons.id))
        .where(eq(subscriptionAddonInstances.subscriptionId, activeSubscription.id));
    }

    // Get all available addons
    const availableAddons = await db
      .select()
      .from(subscriptionAddons)
      .where(eq(subscriptionAddons.isActive, true))
      .orderBy(subscriptionAddons.name);

    const userAddonIds = userSubscriptionAddonInstances.map(sa => sa.addonId);

    // Format active addons data
    const activeAddons = userSubscriptionAddonInstances.map(sa => ({
      id: sa.addon.id,
      name: sa.addon.displayName,
      description: sa.addon.description,
      price: Number(sa.addon.price),
      currency: sa.addon.currency,
      type: sa.addon.type,
      quantity: sa.quantity,
      isActive: sa.status === 'ACTIVE',
      addedDate: sa.createdAt
    }));    // Format available addons (excluding user's active ones)
    const availableAddonsFormatted = availableAddons
      .filter((addon: typeof subscriptionAddons.$inferSelect) => !userAddonIds.includes(addon.id))
      .map((addon: typeof subscriptionAddons.$inferSelect) => ({
        id: addon.id,
        name: addon.displayName,
        description: addon.description,
        price: Number(addon.price),
        currency: addon.currency,
        type: addon.type,
        features: addon.features ? Object.keys(addon.features as object) : [],
        popular: false // Could be calculated based on usage statistics
      }));

    return NextResponse.json({
      activeAddons,
      availableAddons: availableAddonsFormatted,
      hasActiveSubscription: !!activeSubscription
    });

  } catch (error) {
    console.error('Addons API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch addons' }, 
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

    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    const user = userResult[0];
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const activeSubscriptionsResult = await db
      .select()
      .from(subscriptions)
      .where(and(
        eq(subscriptions.userId, user.id),
        inArray(subscriptions.status, ['ACTIVE', 'TRIALING'])
      ));

    const activeSubscription = activeSubscriptionsResult[0];
    if (!activeSubscription) {
      return NextResponse.json({ 
        error: 'Active subscription required to add addons' 
      }, { status: 400 });
    }

    const body = await request.json();
    const { addonId, quantity = 1 } = body;

    if (!addonId) {
      return NextResponse.json({ 
        error: 'Addon ID is required' 
      }, { status: 400 });
    }

    // Verify addon exists and is active
    const addonResult = await db
      .select()
      .from(subscriptionAddons)
      .where(and(
        eq(subscriptionAddons.id, addonId),
        eq(subscriptionAddons.isActive, true)
      ))
      .limit(1);

    const addon = addonResult[0];
    if (!addon) {
      return NextResponse.json({ 
        error: 'Addon not found or inactive' 
      }, { status: 404 });
    }

    // Check if addon instance already exists
    const existingAddonResult = await db
      .select()
      .from(subscriptionAddonInstances)
      .where(and(
        eq(subscriptionAddonInstances.subscriptionId, activeSubscription.id),
        eq(subscriptionAddonInstances.addonId, addonId)
      ))
      .limit(1);

    if (existingAddonResult.length > 0) {
      return NextResponse.json({ 
        error: 'Addon already added to subscription' 
      }, { status: 400 });
    }

    // Add addon instance to subscription
    const subscriptionAddonResult = await db
      .insert(subscriptionAddonInstances)
      .values({
        subscriptionId: activeSubscription.id,
        addonId: addonId,
        quantity: quantity,
        priceAtPurchase: addon.price,
        currencyAtPurchase: addon.currency,
        startDate: new Date(),
        status: 'ACTIVE'
      })
      .returning();

    const subscriptionAddon = subscriptionAddonResult[0];

    // Log activity
    await db
      .insert(activityLogs)
      .values({
        userId: user.id,
        entityType: 'addon',
        entityId: addonId,
        action: 'ADDON_ADDED',
        description: `Added addon: ${addon.displayName}`
      });

    return NextResponse.json({
      message: 'Addon added successfully',
      addon: {
        id: addon.id,
        name: addon.displayName,
        quantity: subscriptionAddon.quantity
      }
    });

  } catch (error) {
    console.error('Add addon error:', error);
    return NextResponse.json(
      { error: 'Failed to add addon' }, 
      { status: 500 }
    );
  }
}
