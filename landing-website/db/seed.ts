import { db } from './client';
import { 
  organizations, 
  subscriptionPlans, 
  subscriptionAddons, 
  users, 
  subscriptions,
  teams,
  teamMemberships
} from './schema';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Starting database seeding…');

  try {
    // 1. ORGANIZATION
    let org = await db.select().from(organizations).where(eq(organizations.name, 'Heartline Medical Center'));
    
    if (org.length === 0) {
      const [newOrg] = await db.insert(organizations).values({
        id: createId(),
        name: 'Heartline Medical Center',
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      org = [newOrg];
    }

    console.log('✅ Organization seeded');

    // 2. SUBSCRIPTION PLANS
    const basicPlanData = {
      id: createId(),
      name: 'basic',
      displayName: 'Basic Plan',
      description: 'Perfect for small clinics',
      price: 9900,
      currency: 'DZD',
      billingCycle: 'MONTHLY' as const,
      features: {
        maxUsers: 5,
        maxECGAnalyses: 100,
        maxPatients: 500,
        supportLevel: 'email',
      },
      trialDays: 14,
      isActive: true,
      isArchived: false,
      isPopular: false,
      displayOrder: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const professionalPlanData = {
      id: createId(),
      name: 'professional',
      displayName: 'Professional Plan',
      description: 'Ideal for growing practices',
      price: 29900,
      currency: 'DZD',
      billingCycle: 'MONTHLY' as const,
      features: {
        maxUsers: 20,
        maxECGAnalyses: 500,
        maxPatients: 2000,
        supportLevel: 'priority',
      },
      trialDays: 14,
      isActive: true,
      isArchived: false,
      isPopular: true,
      displayOrder: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const enterprisePlanData = {
      id: createId(),
      name: 'enterprise',
      displayName: 'Enterprise Plan',
      description: 'For large medical institutions',
      price: 59900,
      currency: 'DZD',
      billingCycle: 'MONTHLY' as const,
      features: {
        maxUsers: -1,
        maxECGAnalyses: -1,
        maxPatients: -1,
        supportLevel: 'phone',
      },
      trialDays: 30,
      isActive: true,
      isArchived: false,
      isPopular: false,
      displayOrder: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Check if plans exist and insert if not
    const existingBasicPlan = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.name, 'basic'));
    let basicPlan = existingBasicPlan[0];
    
    if (!basicPlan) {
      const [newBasicPlan] = await db.insert(subscriptionPlans).values(basicPlanData).returning();
      basicPlan = newBasicPlan;
    }

    const existingProfessionalPlan = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.name, 'professional'));
    let professionalPlan = existingProfessionalPlan[0];
    
    if (!professionalPlan) {
      const [newProfessionalPlan] = await db.insert(subscriptionPlans).values(professionalPlanData).returning();
      professionalPlan = newProfessionalPlan;
    }

    const existingEnterprisePlan = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.name, 'enterprise'));
    let enterprisePlan = existingEnterprisePlan[0];
    
    if (!enterprisePlan) {
      const [newEnterprisePlan] = await db.insert(subscriptionPlans).values(enterprisePlanData).returning();
      enterprisePlan = newEnterprisePlan;
    }

    console.log('✅ Subscription plans seeded');

    // 3. SUBSCRIPTION ADDONS
    const prioritySupportAddon = {
      id: createId(),
      name: 'priority-support',
      displayName: 'Priority Support',
      description: 'Get priority customer support with faster response times',
      price: 4900,
      currency: 'DZD',
      billingCycle: 'MONTHLY' as const,
      category: 'support' as const,
      isActive: true,
      displayOrder: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const advancedAnalyticsAddon = {
      id: createId(),
      name: 'advanced-analytics',
      displayName: 'Advanced Analytics',
      description: 'Advanced reporting and analytics dashboard',
      price: 9900,
      currency: 'DZD',
      billingCycle: 'MONTHLY' as const,
      category: 'analytics' as const,
      isActive: true,
      displayOrder: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const existingPrioritySupport = await db.select().from(subscriptionAddons).where(eq(subscriptionAddons.name, 'priority-support'));
    if (existingPrioritySupport.length === 0) {
      await db.insert(subscriptionAddons).values(prioritySupportAddon);
    }

    const existingAdvancedAnalytics = await db.select().from(subscriptionAddons).where(eq(subscriptionAddons.name, 'advanced-analytics'));
    if (existingAdvancedAnalytics.length === 0) {
      await db.insert(subscriptionAddons).values(advancedAnalyticsAddon);
    }

    console.log('✅ Subscription addons seeded');

    // 4. ADMIN USER
    const adminEmail = 'admin@Heartline.com';
    const existingAdmin = await db.select().from(users).where(eq(users.email, adminEmail));
    
    if (existingAdmin.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      const [adminUser] = await db.insert(users).values({
        id: createId(),
        name: 'System Administrator',
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN',
        emailVerified: new Date(),
        organizationId: org[0].id,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      console.log('✅ Admin user created');
    }

    // 5. DEMO USER
    const demoEmail = 'demo@Heartline.com';
    const existingDemo = await db.select().from(users).where(eq(users.email, demoEmail));
    
    if (existingDemo.length === 0) {
      const hashedDemoPassword = await bcrypt.hash('demo123', 12);
      
      const [demoUser] = await db.insert(users).values({
        id: createId(),
        name: 'Demo User',
        email: demoEmail,
        password: hashedDemoPassword,
        role: 'USER',
        emailVerified: new Date(),
        organizationId: org[0].id,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();      // Create demo subscription
      await db.insert(subscriptions).values({
        id: createId(),        userId: demoUser.id,
        planId: basicPlan.id,
        status: 'TRIALING',
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        trialStartDate: new Date(),
        trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log('✅ Demo user and subscription created');
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('Test credentials:');
    console.log('📧 Admin: admin@Heartline.com / admin123');
    console.log('📧 Demo: demo@Heartline.com / demo123');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    process.exit(0);
  });
