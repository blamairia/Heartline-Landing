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
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get activity logs based on user role
    const activities = user.role === 'ADMIN' 
      ? await prisma.activityLog.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                name: true,
                email: true,
                firstName: true,
                lastName: true
              }
            }
          }
        })
      : await prisma.activityLog.findMany({
          where: { userId: user.id },
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                name: true,
                email: true,
                firstName: true,
                lastName: true
              }
            }
          }
        });    // Format activities for the frontend
    const formattedActivities = activities.map((activity: any) => {
      const userName = activity.user.name || 
                      `${activity.user.firstName || ''} ${activity.user.lastName || ''}`.trim() ||
                      activity.user.email;

      return {
        id: activity.id,
        user: userName,
        action: activity.description,
        time: activity.createdAt,
        type: getActivityTypeDisplay(activity.action)
      };
    });

    return NextResponse.json({ activities: formattedActivities });

  } catch (error) {
    console.error('Recent activity error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent activity' }, 
      { status: 500 }
    );
  }
}

function getActivityTypeDisplay(actionType: string): 'subscription' | 'billing' | 'user' | 'system' {
  if (actionType.includes('SUBSCRIPTION') || actionType.includes('ADDON')) {
    return 'subscription';
  }
  if (actionType.includes('PAYMENT') || actionType.includes('INVOICE')) {
    return 'billing';
  }
  if (actionType.includes('USER') || actionType.includes('PROFILE') || actionType.includes('PASSWORD')) {
    return 'user';
  }
  return 'system';
}
