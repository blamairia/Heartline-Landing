import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma as db } from '@/lib/prisma';
import { 
  users, 
  subscriptions, 
  subscriptionPlans,
  subscriptionAddonInstances,
  subscriptionAddons,
  invoices,
  payments,
  teamMemberships,
  teams
} from '../../../../../db/schema';
import { eq, and, desc, count, sql, sum, gte } from 'drizzle-orm';

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

    // Get user's subscriptions with plan details
    const userSubscriptions = await db.select({
      id: subscriptions.id,
      status: subscriptions.status,
      planName: subscriptionPlans.displayName,
      planId: subscriptions.planId
    })
    .from(subscriptions)
    .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
    .where(eq(subscriptions.userId, user.id));

    // Get active subscription
    const activeSubscription = userSubscriptions.find(
      (sub) => sub.status === 'ACTIVE' || sub.status === 'TRIALING'
    );    // Calculate total users (for admin dashboard)
    const totalUsers = user.role === 'ADMIN' 
      ? await db.select({ count: count() }).from(users)
      : [{ count: 1 }];

    // Calculate active subscriptions
    const activeSubscriptionsCount = user.role === 'ADMIN'
      ? await db.select({ count: count() }).from(subscriptions)
          .where(sql`${subscriptions.status} IN ('ACTIVE', 'TRIALING')`)
      : [{ count: activeSubscription ? 1 : 0 }];

    // Calculate total revenue (for admin)
    const revenueQuery = user.role === 'ADMIN'
      ? await db.select({ 
          total: sql<number>`COALESCE(SUM(${invoices.amountDue}), 0)` 
        }).from(invoices).where(eq(invoices.status, 'PAID'))
      : [{ total: 0 }];

    // Calculate active add-ons for user
    const activeAddons = activeSubscription ? 
      await db.select({ count: count() }).from(subscriptionAddonInstances)
        .where(and(
          eq(subscriptionAddonInstances.subscriptionId, activeSubscription.id),
          eq(subscriptionAddonInstances.status, 'ACTIVE')
        )) : [{ count: 0 }];

    // For now, we'll use placeholder usage data since usage tracking isn't fully implemented
    const totalUsage = 125; // Placeholder

    const stats = [
      {
        title: user.role === 'ADMIN' ? 'Total Users' : 'Active Status',
        value: user.role === 'ADMIN' ? totalUsers[0].count.toString() : (activeSubscription ? 'Active' : 'Inactive'),
        change: user.role === 'ADMIN' ? '+12%' : '',
        trend: 'up' as const,
        icon: 'Users'
      },
      {
        title: user.role === 'ADMIN' ? 'Active Subscriptions' : 'Subscription Plan',
        value: user.role === 'ADMIN' 
          ? activeSubscriptionsCount[0].count.toString() 
          : activeSubscription?.planName || 'No Plan',
        change: user.role === 'ADMIN' ? '+8%' : '',
        trend: 'up' as const,
        icon: 'CreditCard'
      },
      {
        title: user.role === 'ADMIN' ? 'Total Revenue' : 'Active Add-ons',
        value: user.role === 'ADMIN' 
          ? `${revenueQuery[0].total || 0} DZD`
          : activeAddons[0].count.toString(),
        change: user.role === 'ADMIN' ? '+15%' : '',
        trend: 'up' as const,
        icon: user.role === 'ADMIN' ? 'DollarSign' : 'Package'
      },
      {
        title: user.role === 'ADMIN' ? 'Monthly Active Users' : 'Monthly Usage',
        value: user.role === 'ADMIN' ? '1,234' : totalUsage.toString(),
        change: user.role === 'ADMIN' ? '+5%' : '',
        trend: 'up' as const,
        icon: 'TrendingUp'
      }
    ];

    return NextResponse.json({ stats });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' }, 
      { status: 500 }
    );
  }
}
