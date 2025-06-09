import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma as db } from '@/lib/prisma';
import { users, subscriptions, subscriptionPlans, organizations, activityLogs } from '../../../../../db/schema';
import { eq, and, or, like, ilike, count, desc, inArray } from 'drizzle-orm';
import { hash } from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [user] = await db.select().from(users).where(eq(users.email, session.user.email));

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    // Build search conditions if search query is provided
    const searchConditions = search 
      ? or(
          ilike(users.name, `%${search}%`),
          ilike(users.email, `%${search}%`)
        )
      : undefined;

    // Get users with their subscriptions and organizations
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        organizationId: users.organizationId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        planName: subscriptionPlans.displayName,
        orgName: organizations.name
      })
      .from(users)
      .leftJoin(subscriptions, and(
        eq(subscriptions.userId, users.id),
        inArray(subscriptions.status, ['ACTIVE', 'TRIALING'])
      ))
      .leftJoin(subscriptionPlans, eq(subscriptionPlans.id, subscriptions.planId))
      .leftJoin(organizations, eq(organizations.id, users.organizationId))
      .where(searchConditions)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    // Get total count
    const [{ totalCount }] = await db
      .select({ totalCount: count() })
      .from(users)
      .where(searchConditions);

    const formattedUsers = allUsers.map((user: any) => ({
      id: user.id,
      name: user.name || 'Unknown User',
      email: user.email,
      role: user.role,
      status: 'Active', // Since we don't have isActive field, assume all users are active
      subscription: user.planName || 'No Subscription',
      organization: user.orgName || 'Individual',
      joinDate: user.createdAt,
      lastActive: user.updatedAt
    }));

    return NextResponse.json({
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Users API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' }, 
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

    const [adminUser] = await db.select().from(users).where(eq(users.email, session.user.email));

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      email, 
      name,
      role = 'USER',
      organizationId
    } = body;

    // Validate required fields
    if (!email || !name) {
      return NextResponse.json({ 
        error: 'Email and name are required' 
      }, { status: 400 });
    }

    // Check if user already exists
    const [existingUser] = await db.select().from(users).where(eq(users.email, email));

    if (existingUser) {
      return NextResponse.json({ 
        error: 'User with this email already exists' 
      }, { status: 400 });
    }

    // Create user
    const [newUser] = await db.insert(users).values({
      email,
      name,
      role,
      organizationId
    }).returning();

    // Log activity
    await db.insert(activityLogs).values({
      userId: adminUser.id,
      entityType: 'user',
      entityId: newUser.id,
      action: 'USER_CREATED',
      description: `Created new user: ${newUser.email}`
    });

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' }, 
      { status: 500 }
    );
  }
}
