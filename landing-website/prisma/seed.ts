import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding…')

  // 1. ORGANIZATION
  let org = await prisma.organization.findFirst({
    where: { name: 'Heartline Medical Center' },
  })
  if (!org) {
    org = await prisma.organization.create({
      data: { name: 'Heartline Medical Center' },
    })
  }

  // 2. SUBSCRIPTION PLANS
  const basicPlan = await prisma.subscriptionPlan.upsert({
    where: { name: 'basic' },
    update: {},
    create: {
      name:         'basic',
      displayName:  'Basic Plan',
      description:  'Perfect for small clinics',
      price:        9900,
      currency:     'DZD',
      billingCycle: 'MONTHLY',
      features: {
        maxUsers:       5,
        maxECGAnalyses: 100,
        maxPatients:    500,
        supportLevel:   'email',
      },
      trialDays:    14,
      isActive:     true,
      isArchived:   false,
      isPopular:    false,
      displayOrder: 1,
    },
  })

  const professionalPlan = await prisma.subscriptionPlan.upsert({
    where: { name: 'professional' },
    update: {},
    create: {
      name:         'professional',
      displayName:  'Professional Plan',
      description:  'Ideal for growing practices',
      price:        29900,
      currency:     'DZD',
      billingCycle: 'MONTHLY',
      features: {
        maxUsers:       25,
        maxECGAnalyses: 1000,
        maxPatients:    2000,
        supportLevel:   'priority',
      },
      trialDays:    30,
      isActive:     true,
      isArchived:   false,
      isPopular:    true,
      displayOrder: 2,
    },
  })

  const enterprisePlan = await prisma.subscriptionPlan.upsert({
    where: { name: 'enterprise' },
    update: {},
    create: {
      name:         'enterprise',
      displayName:  'Enterprise Plan',
      description:  'For large healthcare institutions',
      price:        99900,
      currency:     'DZD',
      billingCycle: 'MONTHLY',
      features: {
        maxUsers:       'unlimited',
        maxECGAnalyses: 'unlimited',
        maxPatients:    'unlimited',
        supportLevel:   'dedicated',
      },
      trialDays:    null,
      isActive:     true,
      isArchived:   false,
      isPopular:    false,
      displayOrder: 3,
    },
  })

  // 3. SUBSCRIPTION ADDONS
  const advancedAnalysis = await prisma.subscriptionAddon.upsert({
    where: { name: 'advanced-analysis' },
    update: {},
    create: {
      name:         'advanced-analysis',
      displayName:  'Advanced ECG Analysis',
      description:  'AI-powered detailed ECG insights',
      price:        4900,
      currency:     'DZD',
      billingCycle: 'ONCE',
      type:         'ONE_TIME',
      features:     { aiAnalysis: true, riskAssessment: true, trendAnalysis: true },
      isActive:     true,
    },
  })

  const extraUsers = await prisma.subscriptionAddon.upsert({
    where: { name: 'extra-users' },
    update: {},
    create: {
      name:         'extra-users',
      displayName:  'Additional Users',
      description:  'Add more seats to your plan',
      price:        990,
      currency:     'DZD',
      billingCycle: 'MONTHLY',
      type:         'RECURRING',
      features:     { unit: 'user', billing: 'per_user_per_month' },
      isActive:     true,
    },
  })

  const apiAccess = await prisma.subscriptionAddon.upsert({
    where: { name: 'api-access' },
    update: {},
    create: {
      name:         'api-access',
      displayName:  'API Access',
      description:  'Full REST API & webhooks',
      price:        1990,
      currency:     'DZD',
      billingCycle: 'MONTHLY',
      type:         'RECURRING',
      features:     { restApi: true, webHooks: true, realTime: true },
      isActive:     true,
    },
  })

  // 4. COUPON
  const coupon = await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code:                  'WELCOME10',
      description:           '10% off your first month',
      discountType:          'PERCENTAGE',
      discountValue:         10,
      maxRedemptions:        1000,
      maxRedemptionsPerUser: 1,
      validFrom:             new Date(),
      validUntil:            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive:              true,
      minPurchaseAmount:     0,
      applicablePlans: {
        connect: [
          { id: basicPlan.id },
          { id: professionalPlan.id },
          { id: enterprisePlan.id },
        ],
      },
    },
  })

  // 5. USERS
  const admin = await prisma.user.upsert({
    where: { email: 'admin@Heartline.dz' },
    update: {},
    create: {
      name:           'System Administrator',
      email:          'admin@Heartline.dz',
      role:           'ADMIN',
      organizationId: org.id,
    },
  })

  const demo = await prisma.user.upsert({
    where: { email: 'demo@Heartline.dz' },
    update: {},
    create: {
      name:           'Dr. Ahmed Benaissa',
      email:          'demo@Heartline.dz',
      role:           'USER',
      organizationId: org.id,
    },
  })

  // 6. ACCOUNTS
  // 6. ACCOUNTS
await prisma.account.createMany({
  data: [
    {
      userId:            admin.id,
      type:              'oauth',
      provider:          'google',
      providerAccountId: 'google-admin-001',
    },
    {
      userId:            demo.id,
      type:              'oauth',
      provider:          'google',
      providerAccountId: 'google-demo-001',
    },
  ],
  skipDuplicates: true, // <-- this prevents unique constraint errors
})


  // 7. SESSIONS
  // 7. SESSIONS
const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
await prisma.session.createMany({
  data: [
    { sessionToken: 'sess-admin-001', userId: admin.id, expires: sessionExpiry },
    { sessionToken: 'sess-demo-001',  userId: demo.id,  expires: sessionExpiry },
  ],
  skipDuplicates: true, // prevents unique constraint errors on sessionToken
})

  // 8. VERIFICATION TOKEN
await prisma.verificationToken.createMany({
  data: [
    {
      identifier: demo.email!,
      token:      'verif-token-demo-001',
      expires:    new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  ],
  skipDuplicates: true,
})



  // 9. TEAM & MEMBERSHIP
  const team = await prisma.team.upsert({
    where: { slug: 'demo-team' },
    update: {},
    create: {
      name:         'Demo Team',
      slug:         'demo-team',
      adminId:      admin.id,
      billingEmail: admin.email!,
    },
  })

  // 9. TEAM MEMBERSHIP (avoid duplicates)
await prisma.teamMembership.createMany({
  data: [
    {
      teamId: team.id,
      userId: demo.id,
      role:   'OWNER',
    },
  ],
  skipDuplicates: true, // now valid on createMany
})


  // 10. SUBSCRIPTION
  const startDate = new Date()
  const endDate   = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  const subscription = await prisma.subscription.create({
    data: {
      userId:    demo.id,
      planId:    professionalPlan.id,
      teamId:    team.id,
      status:    'ACTIVE',
      startDate,
      endDate,
      autoRenew: true,
    },
  })

  // 11. SUBSCRIPTION ADDON INSTANCES
  const now = new Date()
  await prisma.subscriptionAddonInstance.createMany({
    data: [
      {
        subscriptionId:     subscription.id,
        addonId:            advancedAnalysis.id,
        quantity:           1,
        priceAtPurchase:    advancedAnalysis.price,
        currencyAtPurchase: advancedAnalysis.currency,
        startDate:          now,
        status:             'ACTIVE',
      },
      {
        subscriptionId:     subscription.id,
        addonId:            extraUsers.id,
        quantity:           3,
        priceAtPurchase:    extraUsers.price,
        currencyAtPurchase: extraUsers.currency,
        startDate:          now,
        status:             'ACTIVE',
      },
    ],
  })

  // 12. INVOICES
  // 12. INVOICES (use upsert to avoid unique violations)
const invoice1 = await prisma.invoice.upsert({
  where: { invoiceNumber: 'INV-2025-001' },
  update: {}, // nothing to change if it already exists
  create: {
    userId:         demo.id,
    subscriptionId: subscription.id,
    teamId:         team.id,
    invoiceNumber:  'INV-2025-001',
    status:         'PAID',
    amountDue:      38800,
    amountPaid:     38800,
    amountRemaining:0,
    currency:       'DZD',
    issueDate:      new Date(),
    dueDate:        new Date(),
    paidAt:         new Date(),
    description:    'Professional Plan + Add-ons',
  },
})

const invoice2 = await prisma.invoice.upsert({
  where: { invoiceNumber: 'INV-2025-002' },
  update: {},
  create: {
    userId:         demo.id,
    subscriptionId: subscription.id,
    teamId:         team.id,
    invoiceNumber:  'INV-2025-002',
    status:         'OPEN',
    amountDue:      38800,
    amountPaid:     0,
    amountRemaining:38800,
    currency:       'DZD',
    issueDate:      new Date(),
    dueDate:        new Date(),
    description:    'Professional Plan + Add-ons',
  },
})


  // 13. PAYMENTS
  await prisma.payment.create({
    data: {
      invoiceId: invoice1.id,
      userId:    demo.id,
      amount:    invoice1.amountDue,
      currency:  invoice1.currency,
      status:    'SUCCEEDED',
    },
  })
  // 13. INVOICE ITEMS


// 14. USAGE RECORDS
// Prepare usageBase (first day of current month)
const usageBase = new Date()
usageBase.setDate(1)

// 14. USAGE RECORDS
await prisma.subscriptionUsageRecord.createMany({
  data: [
    {
      subscriptionId: subscription.id,
      featureSlug:    'ecg_analyses',
      quantityUsed:   156,
      recordDate:     usageBase,
      description:    'Monthly ECG analyses count',
    },
    {
      subscriptionId: subscription.id,
      featureSlug:    'patient_creations',
      quantityUsed:    23,
      recordDate:     usageBase,
      description:    'Patient profiles created',
    },
  ],
})


// 15. NOTIFICATIONS
await prisma.notification.createMany({
  data: [
    {
      userId:             demo.id,
      type:               'BILLING_ALERT',
      title:              'Payment Due Soon',
      message:            'Your subscription payment is due in 3 days',
      isRead:             false,
      link:               'https://app.Heartline.io/billing',
      relatedEntityType:  'INVOICE',
      relatedEntityId:    invoice1.id,
    },
    {
      userId:             demo.id,
      type:               'NEW_FEATURE',
      title:              'New Feature Live',
      message:            'Advanced ECG Analysis risk assessment is now available',
      isRead:             false,
      link:               null,
      relatedEntityType:  null,
      relatedEntityId:    null,
    },
  ],
})

// 16. AUDIT LOGS
await prisma.auditLog.createMany({
  data: [
    {
      timestamp:         new Date(),
      userId:            admin.id,
      action:            'USER_CREATED',
      targetEntityType:  'User',
      targetEntityId:    demo.id,
      details:           { email: demo.email },
      ipAddress:         '127.0.0.1',
      userAgent:         'seed.ts script',
    },
    {
      timestamp:         new Date(),
      userId:            demo.id,
      action:            'SUBSCRIPTION_STARTED',
      targetEntityType:  'Subscription',
      targetEntityId:    subscription.id,
      details:           { plan: professionalPlan.name },
      ipAddress:         '127.0.0.1',
      userAgent:         'seed.ts script',
    },
  ],
})


  console.log('✅ Database seeding complete!')
}

main()
  .catch(e => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
