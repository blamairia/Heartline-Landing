import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create organizations
  const organization = await prisma.organization.upsert({
    where: { slug: 'hearline-medical' },
    update: {},
    create: {
      name: 'Hearline Medical Center',
      slug: 'hearline-medical',
      description: 'Leading cardiovascular healthcare provider',
      website: 'https://hearlinemedical.com',
      email: 'contact@hearlinemedical.com',
      phone: '+213 21 123 456',
      address: '123 Medical Avenue',
      city: 'Algiers',
      wilaya: 'Algiers',
      isActive: true
    }
  })

  // Create subscription plans
  const basicPlan = await prisma.subscriptionPlan.upsert({
    where: { name: 'basic' },
    update: {},
    create: {
      name: 'basic',
      displayName: 'Basic Plan',
      description: 'Perfect for small clinics',
      price: 9900, // 99.00 DZD
      currency: 'DZD',
      billingCycle: 'MONTHLY',
      isActive: true,
      isPopular: false,
      features: {
        maxUsers: 5,
        maxECGAnalyses: 100,
        maxPatients: 500,
        features: ['Basic ECG Analysis', 'Patient Management', 'Basic Reports']
      },
      sortOrder: 1
    }
  })

  const professionalPlan = await prisma.subscriptionPlan.upsert({
    where: { name: 'professional' },
    update: {},
    create: {
      name: 'professional',
      displayName: 'Professional Plan',
      description: 'Ideal for growing practices',
      price: 29900, // 299.00 DZD
      currency: 'DZD',
      billingCycle: 'MONTHLY',
      isActive: true,
      isPopular: true,
      features: {
        maxUsers: 25,
        maxECGAnalyses: 1000,
        maxPatients: 2000,
        features: ['Advanced ECG Analysis', 'Patient Management', 'Advanced Reports', 'API Access', 'Priority Support']
      },
      sortOrder: 2
    }
  })

  const enterprisePlan = await prisma.subscriptionPlan.upsert({
    where: { name: 'enterprise' },
    update: {},
    create: {
      name: 'enterprise',
      displayName: 'Enterprise Plan',
      description: 'For large healthcare institutions',
      price: 99900, // 999.00 DZD
      currency: 'DZD',
      billingCycle: 'MONTHLY',
      isActive: true,
      isPopular: false,
      features: {
        maxUsers: 'unlimited',
        maxECGAnalyses: 'unlimited',
        maxPatients: 'unlimited',
        features: ['Advanced ECG Analysis', 'Patient Management', 'Advanced Reports', 'API Access', 'Priority Support', 'Custom Integrations', 'Dedicated Account Manager']
      },
      sortOrder: 3
    }
  })

  // Create addons
  const advancedAnalysisAddon = await prisma.addon.upsert({
    where: { name: 'advanced-analysis' },
    update: {},
    create: {
      name: 'advanced-analysis',
      displayName: 'Advanced ECG Analysis',
      description: 'AI-powered advanced ECG analysis with detailed insights',
      price: 4900, // 49.00 DZD
      currency: 'DZD',
      type: 'FEATURE',
      isActive: true,
      config: {
        features: ['AI Analysis', 'Risk Assessment', 'Trend Analysis']
      }
    }
  })

  const extraUsersAddon = await prisma.addon.upsert({
    where: { name: 'extra-users' },
    update: {},
    create: {
      name: 'extra-users',
      displayName: 'Additional Users',
      description: 'Add more users to your subscription',
      price: 990, // 9.90 DZD per user
      currency: 'DZD',
      type: 'USAGE',
      isActive: true,
      config: {
        unit: 'user',
        billing: 'per_user_per_month'
      }
    }
  })

  const apiAccessAddon = await prisma.addon.upsert({
    where: { name: 'api-access' },
    update: {},
    create: {
      name: 'api-access',
      displayName: 'API Access',
      description: 'Full API access for custom integrations',
      price: 1990, // 19.90 DZD
      currency: 'DZD',
      type: 'INTEGRATION',
      isActive: true,
      config: {
        features: ['REST API', 'WebHooks', 'Real-time Data']
      }
    }
  })

  // Create admin user
  const hashedAdminPassword = await hash('admin123!', 12)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@hearline.dz' },
    update: {},
    create: {
      email: 'admin@hearline.dz',
      password: hashedAdminPassword,
      name: 'System Administrator',
      firstName: 'System',
      lastName: 'Administrator',
      role: 'ADMIN',
      isActive: true,
      organizationId: organization.id,
      position: 'System Administrator',
      city: 'Algiers',
      wilaya: 'Algiers'
    }
  })

  // Create demo user
  const hashedUserPassword = await hash('demo123!', 12)
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@hearline.dz' },
    update: {},
    create: {
      email: 'demo@hearline.dz',
      password: hashedUserPassword,
      name: 'Dr. Ahmed Benaissa',
      firstName: 'Ahmed',
      lastName: 'Benaissa',
      role: 'USER',
      isActive: true,
      organizationId: organization.id,
      position: 'Cardiologist',
      phone: '+213 555 123 456',
      city: 'Algiers',
      wilaya: 'Algiers'
    }
  })

  // Create subscription for demo user
  const startDate = new Date()
  const endDate = new Date()
  endDate.setMonth(endDate.getMonth() + 1)

  const demoSubscription = await prisma.subscription.create({
    data: {
      userId: demoUser.id,
      planId: professionalPlan.id,
      status: 'ACTIVE',
      startDate,
      endDate,
      billingCycle: 'MONTHLY',
      autoRenew: true,
      nextPaymentDate: endDate
    }
  })

  // Add addons to demo subscription
  await prisma.subscriptionAddon.createMany({
    data: [
      {
        subscriptionId: demoSubscription.id,
        addonId: advancedAnalysisAddon.id,
        quantity: 1,
        isActive: true
      },
      {
        subscriptionId: demoSubscription.id,
        addonId: extraUsersAddon.id,
        quantity: 3,
        isActive: true
      }
    ]
  })

  // Create payment methods for demo user
  await prisma.paymentMethod.createMany({
    data: [
      {
        userId: demoUser.id,
        type: 'CREDIT_CARD',
        provider: 'stripe',
        last4: '4242',
        brand: 'visa',
        expiryMonth: 12,
        expiryYear: 2025,
        holderName: 'Dr. Ahmed Benaissa',
        isDefault: true,
        isActive: true
      },
      {
        userId: demoUser.id,
        type: 'CCP_ACCOUNT',
        provider: 'ccp',
        accountNumber: '1234567890',
        holderName: 'Dr. Ahmed Benaissa',
        isDefault: false,
        isActive: true
      }
    ]
  })

  // Create sample invoices
  await prisma.invoice.createMany({
    data: [
      {
        userId: demoUser.id,
        subscriptionId: demoSubscription.id,
        invoiceNumber: 'INV-2024-001',
        amount: 38800, // 388.00 DZD (299 + 49 + 3*9.90)
        currency: 'DZD',
        status: 'PAID',
        dueDate: new Date(),
        paidAt: new Date(),
        description: 'Professional Plan + Advanced Analysis + 3 Extra Users'
      },
      {
        userId: demoUser.id,
        subscriptionId: demoSubscription.id,
        invoiceNumber: 'INV-2024-002',
        amount: 38800,
        currency: 'DZD',
        status: 'PENDING',
        dueDate: endDate,
        description: 'Professional Plan + Advanced Analysis + 3 Extra Users'
      }
    ]
  })

  // Create activity logs
  await prisma.activityLog.createMany({
    data: [
      {
        userId: demoUser.id,
        entityType: 'subscription',
        entityId: demoSubscription.id,
        action: 'SUBSCRIPTION_CREATED',
        description: 'Subscribed to Professional Plan'
      },
      {
        userId: demoUser.id,
        entityType: 'addon',
        entityId: advancedAnalysisAddon.id,
        action: 'ADDON_ADDED',
        description: 'Added Advanced ECG Analysis addon'
      },
      {
        userId: demoUser.id,
        entityType: 'addon',
        entityId: extraUsersAddon.id,
        action: 'ADDON_ADDED',
        description: 'Added 3 additional users'
      },
      {
        userId: demoUser.id,
        entityType: 'payment',
        action: 'PAYMENT_SUCCESSFUL',
        description: 'Payment processed successfully for INV-2024-001'
      },
      {
        userId: adminUser.id,
        entityType: 'user',
        entityId: demoUser.id,
        action: 'USER_CREATED',
        description: 'Created new user: demo@hearline.dz'
      }
    ]
  })

  // Create usage records for demo user
  const usageStartDate = new Date()
  usageStartDate.setDate(1) // First day of current month

  await prisma.usageRecord.createMany({
    data: [
      {
        userId: demoUser.id,
        subscriptionId: demoSubscription.id,
        featureType: 'ECG_ANALYSIS',
        usage: 156,
        recordDate: usageStartDate
      },
      {
        userId: demoUser.id,
        subscriptionId: demoSubscription.id,
        featureType: 'PATIENT_CREATION',
        usage: 23,
        recordDate: usageStartDate
      },
      {
        userId: demoUser.id,
        subscriptionId: demoSubscription.id,
        featureType: 'REPORT_GENERATION',
        usage: 45,
        recordDate: usageStartDate
      },
      {
        userId: demoUser.id,
        subscriptionId: demoSubscription.id,
        featureType: 'PRESCRIPTION_CREATION',
        usage: 67,
        recordDate: usageStartDate
      }
    ]
  })

  // Create system notifications
  await prisma.systemNotification.createMany({
    data: [
      {
        userId: demoUser.id,
        type: 'BILLING',
        title: 'Payment Due Soon',
        message: 'Your subscription payment is due in 3 days',
        priority: 'NORMAL'
      },
      {
        userId: demoUser.id,
        type: 'FEATURE',
        title: 'New Feature Available',
        message: 'Advanced ECG Analysis now includes risk assessment',
        priority: 'LOW'
      },
      {
        type: 'ANNOUNCEMENT',
        title: 'System Maintenance',
        message: 'Scheduled maintenance on Sunday 2AM-4AM',
        priority: 'HIGH'
      }
    ]
  })

  console.log('✅ Database seeding completed!')
  console.log('\n📊 Created:')
  console.log('- 1 Organization')
  console.log('- 3 Subscription Plans')
  console.log('- 3 Addons')
  console.log('- 2 Users (admin@hearline.dz, demo@hearline.dz)')
  console.log('- 1 Active Subscription')
  console.log('- 2 Payment Methods')
  console.log('- 2 Invoices')
  console.log('- 5 Activity Log entries')
  console.log('- 4 Usage Records')
  console.log('- 3 System Notifications')
  console.log('\n🔑 Login credentials:')
  console.log('Admin: admin@hearline.dz / admin123!')
  console.log('Demo User: demo@hearline.dz / demo123!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
