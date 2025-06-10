import { db, pool } from '../db/client';
import {
  organizations,
  subscriptionPlans,
  subscriptionAddons,
  coupons,
  users,
  accounts,
  sessions,
  verificationTokens,
  teams,
  teamMemberships,
  subscriptions,
  subscriptionAddonInstances,
  invoices,
  invoiceItems, // Assuming you will create this table in schema.ts
  payments,
  subscriptionUsageRecords,
  notifications,
  auditLogs,
  planCoupons, // Junction table
} from '../db/schema';
import { createId } from '@paralleldrive/cuid2';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('🌱 Starting database seeding with Drizzle…');

  // 1. ORGANIZATION
  const [org] = await db.insert(organizations).values({
    name: 'Heartline Medical Center',
  }).onConflictDoUpdate({
    target: organizations.name, // Assuming name is unique or you have a unique constraint for upsert
    set: { name: 'Heartline Medical Center' }, // No actual change, just for upsert behavior
  }).returning();
  console.log('Organization seeded');

  // 2. SUBSCRIPTION PLANS
  const [basicPlan] = await db.insert(subscriptionPlans).values({
    name: 'basic',
    displayName: 'Basic Plan',
    description: 'Perfect for small clinics',
    price: 9900,
    currency: 'DZD',
    billingCycle: 'MONTHLY',
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
  }).onConflictDoUpdate({
    target: subscriptionPlans.name,
    set: { displayName: 'Basic Plan' } // Minimal update for upsert
  }).returning();

  const [professionalPlan] = await db.insert(subscriptionPlans).values({
    name: 'professional',
    displayName: 'Professional Plan',
    description: 'Ideal for growing practices',
    price: 29900,
    currency: 'DZD',
    billingCycle: 'MONTHLY',
    features: {
      maxUsers: 25,
      maxECGAnalyses: 1000,
      maxPatients: 2000,
      supportLevel: 'priority',
    },
    trialDays: 30,
    isActive: true,
    isArchived: false,
    isPopular: true,
    displayOrder: 2,
  }).onConflictDoUpdate({
    target: subscriptionPlans.name,
    set: { displayName: 'Professional Plan' }
  }).returning();

  const [enterprisePlan] = await db.insert(subscriptionPlans).values({
    name: 'enterprise',
    displayName: 'Enterprise Plan',
    description: 'For large healthcare institutions',
    price: 99900,
    currency: 'DZD',
    billingCycle: 'MONTHLY',
    features: {
      maxUsers: 'unlimited',
      maxECGAnalyses: 'unlimited',
      maxPatients: 'unlimited',
      supportLevel: 'dedicated',
    },
    trialDays: null,
    isActive: true,
    isArchived: false,
    isPopular: false,
    displayOrder: 3,
  }).onConflictDoUpdate({
    target: subscriptionPlans.name,
    set: { displayName: 'Enterprise Plan' }
  }).returning();
  console.log('Subscription plans seeded');

  // 3. SUBSCRIPTION ADDONS
  const [advancedAnalysis] = await db.insert(subscriptionAddons).values({
    name: 'advanced-analysis',
    displayName: 'Advanced ECG Analysis',
    description: 'AI-powered detailed ECG insights',
    price: 4900,
    currency: 'DZD',
    billingCycle: 'ONCE',
    type: 'ONE_TIME',
    features: { aiAnalysis: true, riskAssessment: true, trendAnalysis: true },
    isActive: true,
  }).onConflictDoUpdate({
    target: subscriptionAddons.name,
    set: { displayName: 'Advanced ECG Analysis' }
  }).returning();

  const [extraUsers] = await db.insert(subscriptionAddons).values({
    name: 'extra-users',
    displayName: 'Additional Users',
    description: 'Add more seats to your plan',
    price: 990,
    currency: 'DZD',
    billingCycle: 'MONTHLY',
    type: 'RECURRING',
    features: { unit: 'user', billing: 'per_user_per_month' },
    isActive: true,
  }).onConflictDoUpdate({
    target: subscriptionAddons.name,
    set: { displayName: 'Additional Users' }
  }).returning();

  const [apiAccess] = await db.insert(subscriptionAddons).values({
    name: 'api-access',
    displayName: 'API Access',
    description: 'Full REST API & webhooks',
    price: 1990,
    currency: 'DZD',
    billingCycle: 'MONTHLY',
    type: 'RECURRING',
    features: { restApi: true, webHooks: true, realTime: true },
    isActive: true,
  }).onConflictDoUpdate({
    target: subscriptionAddons.name,
    set: { displayName: 'API Access' }
  }).returning();
  console.log('Subscription addons seeded');

  // 4. COUPON
  const [coupon] = await db.insert(coupons).values({
    code: 'WELCOME10',
    description: '10% off your first month',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    maxRedemptions: 1000,
    maxRedemptionsPerUser: 1,
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    isActive: true,
    minPurchaseAmount: 0,
  }).onConflictDoUpdate({
    target: coupons.code,
    set: { description: '10% off your first month' }
  }).returning();

  // Link coupon to plans (many-to-many)
  await db.insert(planCoupons).values([
    { planId: basicPlan.id, couponId: coupon.id },
    { planId: professionalPlan.id, couponId: coupon.id },
    { planId: enterprisePlan.id, couponId: coupon.id },
  ]).onConflictDoNothing(); // Or specify target and do update if needed
  console.log('Coupon seeded and linked to plans');

  // 5. USERS
  const [admin] = await db.insert(users).values({
    name: 'System Administrator',
    email: 'admin@Heartline.dz',
    role: 'ADMIN',
    organizationId: org.id,
  }).onConflictDoUpdate({
    target: users.email,
    set: { name: 'System Administrator' }
  }).returning();

  const [demo] = await db.insert(users).values({
    name: 'Dr. Ahmed Benaissa',
    email: 'demo@Heartline.dz',
    role: 'USER',
    organizationId: org.id,
  }).onConflictDoUpdate({
    target: users.email,
    set: { name: 'Dr. Ahmed Benaissa' }
  }).returning();
  console.log('Users seeded');

  // 6. ACCOUNTS
  await db.insert(accounts).values([
    {
      userId: admin.id,
      type: 'oauth',
      provider: 'google',
      providerAccountId: 'google-admin-001',
    },
    {
      userId: demo.id,
      type: 'oauth',
      provider: 'google',
      providerAccountId: 'google-demo-001',
    },
  ]).onConflictDoNothing(); // Based on @@unique([provider, providerAccountId])
  console.log('Accounts seeded');

  // 7. SESSIONS
  const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values([
    { sessionToken: 'sess-admin-001', userId: admin.id, expires: sessionExpiry },
    { sessionToken: 'sess-demo-001',  userId: demo.id,  expires: sessionExpiry },
  ]).onConflictDoNothing(); // Based on unique sessionToken
  console.log('Sessions seeded');

  // 8. VERIFICATION TOKEN
  if (demo.email) { // Ensure email is not null
    await db.insert(verificationTokens).values([
      {
        identifier: demo.email,
        token: 'verif-token-demo-001',
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    ]).onConflictDoNothing(); // Based on unique token and @@unique([identifier, token])
  }
  console.log('Verification tokens seeded');

  // 9. TEAM & MEMBERSHIP
  const [team] = await db.insert(teams).values({
    name: 'Demo Team',
    slug: 'demo-team',
    adminId: admin.id,
    billingEmail: admin.email,
  }).onConflictDoUpdate({
    target: teams.slug, // Assuming slug is unique for upsert
    set: { name: 'Demo Team' }
  }).returning();

  await db.insert(teamMemberships).values([
    {
      teamId: team.id,
      userId: demo.id,
      role: 'OWNER',
    },
  ]).onConflictDoNothing(); // Based on @@unique([teamId, userId])
  console.log('Team and membership seeded');

  // 10. SUBSCRIPTION
  const startDate = new Date();
  const endDate   = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const [subscription] = await db.insert(subscriptions).values({
    userId:    demo.id,
    planId:    professionalPlan.id,
    teamId:    team.id,
    status:    'ACTIVE',
    startDate: startDate,
    endDate:   endDate,
    autoRenew: true,
  }).returning(); // Assuming no specific unique constraint for simple insert, or add onConflict
  console.log('Subscription seeded');

  // 11. SUBSCRIPTION ADDON INSTANCES
  const now = new Date();
  await db.insert(subscriptionAddonInstances).values([
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
  ]); // Assuming no specific unique constraint for simple insert, or add onConflict
  console.log('Subscription addon instances seeded');
  // 12. INVOICES
  const [invoice1] = await db.insert(invoices).values({
    userId:         demo.id,
    subscriptionId: subscription.id,
    teamId:         team.id,
    invoiceNumber:  'INV-2025-001',
    amount:         38800, // Added missing amount field
    status:         'PAID',
    amountDue:      38800, // professionalPlan.price (29900) + advancedAnalysis.price (4900) + extraUsers.price*3 (990*3=2970) = 37770. Original seed had 38800. Adjust if needed.
    amountPaid:     38800,
    amountRemaining:0,
    currency:       'DZD',
    issueDate:      new Date(),
    dueDate:        new Date(),
    paidAt:         new Date(),
    description:    'Professional Plan + Add-ons',
  }).onConflictDoUpdate({
    target: invoices.invoiceNumber,
    set: { status: 'PAID' }
  }).returning();
  const [invoice2] = await db.insert(invoices).values({
    userId:         demo.id,
    subscriptionId: subscription.id,
    teamId:         team.id,
    invoiceNumber:  'INV-2025-002',
    amount:         38800, // Added missing amount field
    status:         'OPEN',
    amountDue:      38800, // Same as above, adjust if needed
    amountPaid:     0,
    amountRemaining:38800,
    currency:       'DZD',
    issueDate:      new Date(),
    dueDate:        new Date(),
    description:    'Professional Plan + Add-ons',
  }).onConflictDoUpdate({
    target: invoices.invoiceNumber,
    set: { status: 'OPEN' }
  }).returning();
  console.log('Invoices seeded');

  // 13. INVOICE ITEMS (Example - adjust based on your actual logic)
  // For invoice1
  await db.insert(invoiceItems).values([
    {
      invoiceId: invoice1.id,
      productId: professionalPlan.id,
      productType: 'PLAN',
      description: `${professionalPlan.displayName} (${professionalPlan.billingCycle})`,
      quantity: 1,
      unitPrice: professionalPlan.price,
      totalAmount: professionalPlan.price,
    },
    {
      invoiceId: invoice1.id,
      productId: advancedAnalysis.id,
      productType: 'ADDON',
      description: advancedAnalysis.displayName,
      quantity: 1,
      unitPrice: advancedAnalysis.price,
      totalAmount: advancedAnalysis.price,
    },
    {
      invoiceId: invoice1.id,
      productId: extraUsers.id,
      productType: 'ADDON',
      description: extraUsers.displayName,
      quantity: 3,
      unitPrice: extraUsers.price,
      totalAmount: extraUsers.price * 3,
    },
  ]);
  // For invoice2 (similar items, or adjust as needed)
  await db.insert(invoiceItems).values([
    {
      invoiceId: invoice2.id,
      productId: professionalPlan.id,
      productType: 'PLAN',
      description: `${professionalPlan.displayName} (${professionalPlan.billingCycle})`,
      quantity: 1,
      unitPrice: professionalPlan.price,
      totalAmount: professionalPlan.price,
    },
    {
      invoiceId: invoice2.id,
      productId: advancedAnalysis.id,
      productType: 'ADDON',
      description: advancedAnalysis.displayName,
      quantity: 1,
      unitPrice: advancedAnalysis.price,
      totalAmount: advancedAnalysis.price,
    },
    {
      invoiceId: invoice2.id,
      productId: extraUsers.id,
      productType: 'ADDON',
      description: extraUsers.displayName,
      quantity: 3,
      unitPrice: extraUsers.price,
      totalAmount: extraUsers.price * 3,
    },
  ]);
  console.log('Invoice items seeded');

  // 14. PAYMENTS
  await db.insert(payments).values({
    invoiceId: invoice1.id,
    userId:    demo.id,
    amount:    invoice1.amountDue,
    currency:  invoice1.currency,
    status:    'SUCCEEDED',
  }); // Assuming no specific unique constraint for simple insert, or add onConflict
  console.log('Payments seeded');

  // 15. USAGE RECORDS
  const usageBase = new Date();
  usageBase.setDate(1);
  await db.insert(subscriptionUsageRecords).values([
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
  ]);
  console.log('Usage records seeded');

  // 16. NOTIFICATIONS
  await db.insert(notifications).values([
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
  ]);
  console.log('Notifications seeded');

  // 17. AUDIT LOGS
  await db.insert(auditLogs).values([
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
  ]);
  console.log('Audit logs seeded');

  console.log('✅ Database seeding complete with Drizzle!');
}

main()
  .catch(e => {
    console.error('❌ Drizzle seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    // Drizzle doesn\'t have a direct equivalent of prisma.$disconnect()
    // The connection pool is managed by `pg`. It will close when the script ends.
    // If you need to explicitly close, you might need to access the pool from client.ts
    // and call pool.end(), but typically not needed for a script.
    await pool.end(); // Explicitly close the connection pool
    console.log('Seeding script finished.');
  });
