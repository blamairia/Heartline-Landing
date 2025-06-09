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
    const { subscriptionId, reason } = body;

    if (!subscriptionId) {
      return NextResponse.json({ 
        error: 'Subscription ID is required' 
      }, { status: 400 });
    }

    // Find the subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId: user.id
      },
      include: {
        plan: true
      }
    });

    if (!subscription) {
      return NextResponse.json({ 
        error: 'Subscription not found or does not belong to this user' 
      }, { status: 404 });
    }

    if (subscription.status !== 'ACTIVE') {
      return NextResponse.json({ 
        error: 'Subscription is not active and cannot be cancelled' 
      }, { status: 400 });
    }

    // Calculate cancellation date (end of current billing period)
    const cancellationDate = new Date(subscription.endDate);
    
    // Update subscription status
    const result = await prisma.$transaction(async (tx) => {
      // Update subscription
      const updatedSubscription = await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'CANCELLED',
          autoRenew: false,
          cancelledAt: new Date(),
          cancellationReason: reason || null
        }
      });

      // Create activity log
      await tx.activityLog.create({
        data: {
          userId: user.id,
          entityType: 'subscription',
          entityId: subscription.id,
          action: 'SUBSCRIPTION_CANCELLED',
          description: `Cancelled ${subscription.plan.displayName} subscription${reason ? `. Reason: ${reason}` : ''}`
        }
      });

      // Cancel any pending invoices
      await tx.invoice.updateMany({
        where: {
          subscriptionId: subscription.id,
          status: 'PENDING'
        },
        data: {
          status: 'CANCELLED'
        }
      });

      return updatedSubscription;
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: {
        subscriptionId: result.id,
        status: result.status,
        cancellationDate: cancellationDate.toISOString(),
        message: `Your subscription will remain active until ${cancellationDate.toLocaleDateString()}`
      }
    });

  } catch (error: any) {
    console.error('Subscription cancellation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to cancel subscription',
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}
