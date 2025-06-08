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
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }    // Get active subscription
    const activeSubscription = user.subscriptions.find(
      (sub: any) => sub.status === 'ACTIVE' || sub.status === 'TRIAL'
    );

    // Calculate total users (for admin dashboard)
    const totalUsers = user.role === 'ADMIN' 
      ? await prisma.user.count({ where: { isActive: true } })
      : 1;

    // Calculate active subscriptions
    const activeSubscriptions = user.role === 'ADMIN'
      ? await prisma.subscription.count({ 
          where: { 
            status: { in: ['ACTIVE', 'TRIAL'] } 
          } 
        })
      : activeSubscription ? 1 : 0;

    // Calculate total revenue (for admin)
    const totalRevenue = user.role === 'ADMIN'
      ? await prisma.invoice.aggregate({
          where: { status: 'PAID' },
          _sum: { amount: true }
        })
      : { _sum: { amount: 0 } };

    // Calculate active add-ons
    const activeAddons = activeSubscription?.addons?.length || 0;

    // Get usage statistics
    const currentMonth = new Date();
    currentMonth.setDate(1); // First day of current month
    
    const usageStats = await prisma.usageRecord.groupBy({
      by: ['featureType'],
      where: {
        userId: user.id,
        recordDate: {
          gte: currentMonth
        }
      },
      _sum: {
        usage: true
      }
    });

    const totalUsage = usageStats.reduce((sum: number, stat: any) => sum + (stat._sum.usage || 0), 0);

    const stats = [
      {
        title: user.role === 'ADMIN' ? 'Total Users' : 'Active Status',
        value: user.role === 'ADMIN' ? totalUsers.toString() : (activeSubscription ? 'Active' : 'Inactive'),
        change: user.role === 'ADMIN' ? '+12%' : '',
        trend: 'up' as const,
        icon: 'Users'
      },
      {
        title: user.role === 'ADMIN' ? 'Active Subscriptions' : 'Subscription Plan',
        value: user.role === 'ADMIN' 
          ? activeSubscriptions.toString() 
          : activeSubscription?.plan.displayName || 'No Plan',
        change: user.role === 'ADMIN' ? '+8%' : '',
        trend: 'up' as const,
        icon: 'CreditCard'
      },
      {
        title: user.role === 'ADMIN' ? 'Total Revenue' : 'Active Add-ons',
        value: user.role === 'ADMIN' 
          ? `${totalRevenue._sum.amount || 0} DZD`
          : activeAddons.toString(),
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
