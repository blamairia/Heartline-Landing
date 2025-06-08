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
            addons: {
              include: {
                addon: true
              }
            }
          },
          where: {
            status: { in: ['ACTIVE', 'TRIAL'] }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all available addons
    const availableAddons = await prisma.addon.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });    // Get user's active subscription
    const activeSubscription = user.subscriptions[0];
    const userAddonIds = activeSubscription?.addons.map((sa: any) => sa.addonId) || [];

    // Format addons data
    const activeAddons = availableAddons
      .filter((addon: any) => userAddonIds.includes(addon.id))
      .map((addon: any) => {
        const subscriptionAddon = activeSubscription?.addons.find((sa: any) => sa.addonId === addon.id);
        return {
          id: addon.id,
          name: addon.displayName,
          description: addon.description,
          price: Number(addon.price),
          currency: addon.currency,
          type: addon.type,
          quantity: subscriptionAddon?.quantity || 1,
          isActive: subscriptionAddon?.isActive || false,
          addedDate: subscriptionAddon?.createdAt
        };
      });

    const availableAddonsFormatted = availableAddons
      .filter((addon: any) => !userAddonIds.includes(addon.id))
      .map((addon: any) => ({
        id: addon.id,
        name: addon.displayName,
        description: addon.description,
        price: Number(addon.price),
        currency: addon.currency,
        type: addon.type,
        features: addon.config ? Object.keys(addon.config as object) : [],
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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        subscriptions: {
          where: {
            status: { in: ['ACTIVE', 'TRIAL'] }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const activeSubscription = user.subscriptions[0];
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
    const addon = await prisma.addon.findFirst({
      where: { id: addonId, isActive: true }
    });

    if (!addon) {
      return NextResponse.json({ 
        error: 'Addon not found or inactive' 
      }, { status: 404 });
    }

    // Check if addon is already added
    const existingAddon = await prisma.subscriptionAddon.findUnique({
      where: {
        subscriptionId_addonId: {
          subscriptionId: activeSubscription.id,
          addonId: addonId
        }
      }
    });

    if (existingAddon) {
      return NextResponse.json({ 
        error: 'Addon already added to subscription' 
      }, { status: 400 });
    }

    // Add addon to subscription
    const subscriptionAddon = await prisma.subscriptionAddon.create({
      data: {
        subscriptionId: activeSubscription.id,
        addonId: addonId,
        quantity: quantity,
        isActive: true
      },
      include: {
        addon: true
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        entityType: 'addon',
        entityId: addonId,
        action: 'ADDON_ADDED',
        description: `Added addon: ${addon.displayName}`
      }
    });

    return NextResponse.json({
      message: 'Addon added successfully',
      addon: {
        id: subscriptionAddon.addon.id,
        name: subscriptionAddon.addon.displayName,
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
