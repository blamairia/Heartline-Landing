import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }
    });

    const formattedPlans = plans.map(plan => ({
      id: plan.id,
      name: plan.name,
      displayName: plan.displayName,
      description: plan.description,
      price: Number(plan.price),
      currency: plan.currency,
      billingCycle: plan.billingCycle,
      features: plan.features,
      isPopular: plan.isPopular,
      sortOrder: plan.sortOrder
    }));

    return NextResponse.json({
      plans: formattedPlans
    });

  } catch (error) {
    console.error('Plans API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription plans' }, 
      { status: 500 }
    );
  }
}
