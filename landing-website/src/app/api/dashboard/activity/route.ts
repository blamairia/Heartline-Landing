import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma as db } from '@/lib/prisma';
import { users, activityLogs } from '../../../../../db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
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
    }    // Get activity logs based on user role
    const activities = user.role === 'ADMIN' 
      ? await db
          .select({
            id: activityLogs.id,
            description: activityLogs.description,
            action: activityLogs.action,
            createdAt: activityLogs.createdAt,
            user: {
              name: users.name,
              email: users.email
            }
          })
          .from(activityLogs)
          .leftJoin(users, eq(activityLogs.userId, users.id))
          .orderBy(desc(activityLogs.createdAt))
          .limit(10)
      : await db
          .select({
            id: activityLogs.id,
            description: activityLogs.description,
            action: activityLogs.action,
            createdAt: activityLogs.createdAt,
            user: {
              name: users.name,
              email: users.email
            }
          })
          .from(activityLogs)
          .leftJoin(users, eq(activityLogs.userId, users.id))
          .where(eq(activityLogs.userId, user.id))
          .orderBy(desc(activityLogs.createdAt))
          .limit(10);

    // Format activities for the frontend
    const formattedActivities = activities.map((activity) => {
      const userName = activity.user?.name || activity.user?.email || 'Unknown User';

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
