import {
  pgTable,
  varchar,
  timestamp,
  integer,
  boolean,
  jsonb,
  text,
  real,
  pgEnum,
  primaryKey,
  uniqueIndex,
  index,
  foreignKey,
  AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2'; // Or use 'cuid' if you prefer v1

// ----------------------------
// ENUMS
// ----------------------------

export const userRoleEnum = pgEnum('user_role', ['USER', 'ADMIN', 'SUPER_ADMIN', 'SUPPORT_STAFF']);
export const billingCycleEnum = pgEnum('billing_cycle', ['ONCE', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMI_ANNUALLY', 'YEARLY', 'BIENNIALLY']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['TRIALING', 'ACTIVE', 'PENDING_PAYMENT', 'PENDING_ACTIVATION', 'PAST_DUE', 'UNPAID', 'CANCELLED', 'EXPIRED', 'INCOMPLETE', 'INCOMPLETE_EXPIRED', 'PAUSED', 'DEACTIVATED']);
export const addonStatusEnum = pgEnum('addon_status', ['ACTIVE', 'CANCELLED', 'EXPIRED']);
export const addonTypeEnum = pgEnum('addon_type', ['RECURRING', 'ONE_TIME']);
export const invoiceStatusEnum = pgEnum('invoice_status', ['DRAFT', 'OPEN', 'PAID', 'VOID', 'UNCOLLECTIBLE', 'PENDING_CONFIRMATION', 'REFUNDED', 'PARTIALLY_REFUNDED', 'FAILED']);
export const paymentStatusEnum = pgEnum('payment_status', ['PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'CHARGEBACK', 'AWAITING_ACTION']);
export const paymentProviderEnum = pgEnum('payment_provider', ['STRIPE', 'PAYPAL', 'PADDLE', 'OFFLINE_CASH', 'OFFLINE_BANK_TRANSFER', 'OFFLINE_CHECK', 'APPLE_IAP', 'GOOGLE_PLAY_BILLING', 'OTHER']);
export const teamRoleEnum = pgEnum('team_role', ['OWNER', 'ADMIN', 'MEMBER', 'BILLING_MANAGER', 'GUEST']);
export const discountTypeEnum = pgEnum('discount_type', ['PERCENTAGE', 'FIXED_AMOUNT']);
export const notificationTypeEnum = pgEnum('notification_type', ['GENERAL', 'BILLING_ALERT', 'SUBSCRIPTION_UPDATE', 'NEW_FEATURE', 'SECURITY_ALERT', 'USAGE_ALERT']);

// ----------------------------
// TABLES
// ----------------------------

export const organizations = pgTable('organization', {
  id: varchar('id', { length: 30 }).primaryKey().$defaultFn(() => createId()),
  name: varchar('name', { length: 255 }).unique().notNull(), // Added .unique()
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
});

export const users = pgTable('user', {
  id: varchar('id', { length: 30 }).primaryKey().$defaultFn(() => createId()),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).unique(),
  password: varchar('password', { length: 255 }),
  emailVerified: timestamp('email_verified', { mode: 'date', withTimezone: true }),
  image: text('image'),
  role: userRoleEnum('role').default('USER').notNull(),
  isActive: boolean('is_active').default(true).notNull(), // Added isActive field
  organizationId: varchar('organization_id', { length: 30 }).references(() => organizations.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
});

export const accounts = pgTable('account', {
  id: varchar('id', { length: 30 }).primaryKey().$defaultFn(() => createId()),
  userId: varchar('user_id', { length: 30 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 255 }).notNull(),
  provider: varchar('provider', { length: 255 }).notNull(),
  providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: varchar('token_type', { length: 255 }),
  scope: varchar('scope', { length: 255 }),
  id_token: text('id_token'),
  session_state: varchar('session_state', { length: 255 }),
}, (table) => ({
  providerProviderAccountIdUnique: uniqueIndex('account_provider_provider_account_id_key').on(table.provider, table.providerAccountId),
}));

export const sessions = pgTable('session', {
  id: varchar('id', { length: 30 }).primaryKey().$defaultFn(() => createId()),
  sessionToken: varchar('session_token', { length: 255 }).unique().notNull(),
  userId: varchar('user_id', { length: 30 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date', withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable('verification_token', {
  identifier: varchar('identifier', { length: 255 }).notNull(),
  token: varchar('token', { length: 255 }).unique().notNull(),
  expires: timestamp('expires', { mode: 'date', withTimezone: true }).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.identifier, table.token] }),
}));

export const passwordResetTokens = pgTable('password_reset_token', {
  id: varchar('id', { length: 30 }).primaryKey().$defaultFn(() => createId()),
  email: varchar('email', { length: 255 }).notNull(),
  token: varchar('token', { length: 255 }).unique().notNull(),
  expires: timestamp('expires', { mode: 'date', withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
});

export const subscriptionPlans = pgTable('subscription_plan', {
  id: varchar('id', { length: 30 }).primaryKey().$defaultFn(() => createId()),
  name: varchar('name', { length: 255 }).unique().notNull(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  description: text('description'),
  price: integer('price').notNull(),
  currency: varchar('currency', { length: 10 }).default('usd').notNull(),
  billingCycle: billingCycleEnum('billing_cycle').default('MONTHLY').notNull(),
  features: jsonb('features').notNull(),
  trialDays: integer('trial_days'),
  stripePriceId: varchar('stripe_price_id', { length: 255 }).unique(),
  paypalPlanId: varchar('paypal_plan_id', { length: 255 }).unique(),
  paddleProductId: varchar('paddle_product_id', { length: 255 }).unique(),
  isActive: boolean('is_active').default(true).notNull(),
  isArchived: boolean('is_archived').default(false).notNull(),
  isPopular: boolean('is_popular').default(false).notNull(),
  displayOrder: integer('display_order'),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
});

export const teams = pgTable('team', {
  id: varchar('id', { length: 30 }).primaryKey().$defaultFn(() => createId()),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).unique(),
  adminId: varchar('admin_id', { length: 30 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  billingEmail: varchar('billing_email', { length: 255 }),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
});

export const subscriptions = pgTable('subscription', {
  id: varchar('id', { length: 30 }).primaryKey().$defaultFn(() => createId()),
  userId: varchar('user_id', { length: 30 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  planId: varchar('plan_id', { length: 30 }).notNull().references(() => subscriptionPlans.id, { onDelete: 'cascade' }), // Prisma has onDelete: Cascade, but for plan changes, RESTRICT or SET NULL might be safer. Sticking to schema.
  teamId: varchar('team_id', { length: 30 }).references(() => teams.id, { onDelete: 'set null' }),
  status: subscriptionStatusEnum('status').default('PENDING_PAYMENT').notNull(),
  startDate: timestamp('start_date', { mode: 'date', withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { mode: 'date', withTimezone: true }),
  trialStartDate: timestamp('trial_start_date', { mode: 'date', withTimezone: true }),
  trialEndDate: timestamp('trial_end_date', { mode: 'date', withTimezone: true }),
  cancelledAt: timestamp('cancelled_at', { mode: 'date', withTimezone: true }),
  cancellationReason: text('cancellation_reason'),
  cancellationEffectiveDate: timestamp('cancellation_effective_date', { mode: 'date', withTimezone: true }),
  autoRenew: boolean('auto_renew').default(true).notNull(),
  paymentProvider: paymentProviderEnum('payment_provider'),
  paymentProviderSubscriptionId: varchar('payment_provider_subscription_id', { length: 255 }),
  priceAtRenewal: integer('price_at_renewal'),
  currencyAtRenewal: varchar('currency_at_renewal', { length: 10 }),
  billingCycleAtRenewal: billingCycleEnum('billing_cycle_at_renewal'),
  offlinePaymentReference: varchar('offline_payment_reference', { length: 255 }),
  offlinePaymentNotes: text('offline_payment_notes'),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  userIdx: index('subscription_user_id_idx').on(table.userId),
  planIdx: index('subscription_plan_id_idx').on(table.planId),
  teamIdx: index('subscription_team_id_idx').on(table.teamId),
  statusIdx: index('subscription_status_idx').on(table.status),
  paymentProviderSubscriptionIdx: index('subscription_payment_provider_subscription_id_idx').on(table.paymentProviderSubscriptionId),
}));

export const subscriptionAddons = pgTable('subscription_addon', {
  id: varchar('id', { length: 30 }).primaryKey().$defaultFn(() => createId()),
  name: varchar('name', { length: 255 }).unique().notNull(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  description: text('description'),
  price: integer('price').notNull(),
  currency: varchar('currency', { length: 10 }).default('usd').notNull(),
  billingCycle: billingCycleEnum('billing_cycle').notNull(),
  type: addonTypeEnum('type').default('RECURRING').notNull(),
  features: jsonb('features'),
  stripePriceId: varchar('stripe_price_id', { length: 255 }).unique(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
});

export const subscriptionAddonInstances = pgTable('subscription_addon_instance', {
  id: varchar('id', { length: 30 }).primaryKey().$defaultFn(() => createId()),
  subscriptionId: varchar('subscription_id', { length: 30 }).notNull().references(() => subscriptions.id, { onDelete: 'cascade' }),
  addonId: varchar('addon_id', { length: 30 }).notNull().references(() => subscriptionAddons.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').default(1).notNull(),
  priceAtPurchase: integer('price_at_purchase').notNull(),
  currencyAtPurchase: varchar('currency_at_purchase', { length: 10 }).notNull(),
  startDate: timestamp('start_date', { mode: 'date', withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { mode: 'date', withTimezone: true }),
  status: addonStatusEnum('status').default('ACTIVE').notNull(),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  subscriptionIdx: index('sai_subscription_id_idx').on(table.subscriptionId),
  addonIdx: index('sai_addon_id_idx').on(table.addonId),
}));

export const invoices = pgTable('invoice', {
  id: varchar('id', { length: 30 }).primaryKey().$defaultFn(() => createId()),
  userId: varchar('user_id', { length: 30 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  subscriptionId: varchar('subscription_id', { length: 30 }).references(() => subscriptions.id, { onDelete: 'set null' }),
  teamId: varchar('team_id', { length: 30 }).references(() => teams.id, { onDelete: 'set null' }),
  invoiceNumber: varchar('invoice_number', { length: 255 }).unique().notNull(),
  status: invoiceStatusEnum('status').default('DRAFT').notNull(),
  amount: integer('amount').notNull(),
  amountDue: integer('amount_due').notNull(),
  amountPaid: integer('amount_paid').default(0).notNull(),
  amountRemaining: integer('amount_remaining').notNull(),
  currency: varchar('currency', { length: 10 }).notNull(),
  issueDate: timestamp('issue_date', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  dueDate: timestamp('due_date', { mode: 'date', withTimezone: true }),
  paidAt: timestamp('paid_at', { mode: 'date', withTimezone: true }),
  closedAt: timestamp('closed_at', { mode: 'date', withTimezone: true }),
  description: text('description'),
  paymentProvider: paymentProviderEnum('payment_provider'),
  paymentProviderInvoiceId: varchar('payment_provider_invoice_id', { length: 255 }),
  paymentAttemptCount: integer('payment_attempt_count').default(0).notNull(),
  lastPaymentError: text('last_payment_error'),
  offlinePaymentMethod: varchar('offline_payment_method', { length: 255 }),
  offlinePaymentReference: varchar('offline_payment_reference', { length: 255 }),
  pdfUrl: text('pdf_url'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  userIdx: index('invoice_user_id_idx').on(table.userId),
  subscriptionIdx: index('invoice_subscription_id_idx').on(table.subscriptionId),
  teamIdx: index('invoice_team_id_idx').on(table.teamId),
  statusIdx: index('invoice_status_idx').on(table.status),
  invoiceNumberIdx: index('invoice_invoice_number_idx').on(table.invoiceNumber), // unique constraint already creates an index
}));

export const invoiceItems = pgTable('invoice_item', {
  id: varchar('id', { length: 30 }).primaryKey().$defaultFn(() => createId()),
  invoiceId: varchar('invoice_id', { length: 30 }).notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  productId: varchar('product_id', { length: 255 }), // Assuming product IDs are strings
  productType: varchar('product_type', { length: 50 }), // e.g., 'PLAN', 'ADDON'
  description: text('description').notNull(),
  quantity: integer('quantity').default(1).notNull(),
  unitPrice: integer('unit_price').notNull(),
  totalAmount: integer('total_amount').notNull(),
  discountAmount: integer('discount_amount').default(0).notNull(),
  taxAmount: integer('tax_amount').default(0).notNull(),
  periodStartDate: timestamp('period_start_date', { mode: 'date', withTimezone: true }),
  periodEndDate: timestamp('period_end_date', { mode: 'date', withTimezone: true }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  invoiceIdx: index('invoice_item_invoice_id_idx').on(table.invoiceId),
}));

export const payments = pgTable('payment', {
  id: varchar('id', { length: 30 }).primaryKey().$defaultFn(() => createId()),
  invoiceId: varchar('invoice_id', { length: 30 }).notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 30 }).notNull().references(() => users.id, { onDelete: 'no action' }), // Prisma: NoAction
  amount: integer('amount').notNull(),
  currency: varchar('currency', { length: 10 }).notNull(),
  status: paymentStatusEnum('status').default('PENDING').notNull(),
  paymentMethodUsed: varchar('payment_method_used', { length: 255 }),
  paymentProvider: paymentProviderEnum('payment_provider'),
  paymentProviderTransactionId: varchar('payment_provider_transaction_id', { length: 255 }).unique(),
  processedAt: timestamp('processed_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  providerRespondedAt: timestamp('provider_responded_at', { mode: 'date', withTimezone: true }),
  failureReason: text('failure_reason'),
  refundAmount: integer('refund_amount'),
  refundReason: text('refund_reason'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  invoiceIdx: index('payment_invoice_id_idx').on(table.invoiceId),
  userIdx: index('payment_user_id_idx').on(table.userId),
  paymentProviderTransactionIdx: index('payment_payment_provider_transaction_id_idx').on(table.paymentProviderTransactionId), // unique constraint already creates an index
  statusIdx: index('payment_status_idx').on(table.status),
}));

export const teamMemberships = pgTable('team_membership', {
  id: varchar('id', { length: 30 }).primaryKey().$defaultFn(() => createId()),
  teamId: varchar('team_id', { length: 30 }).notNull().references(() => teams.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 30 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: teamRoleEnum('role').default('MEMBER').notNull(),
  joinedAt: timestamp('joined_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  teamUserUnique: uniqueIndex('team_membership_team_id_user_id_key').on(table.teamId, table.userId),
  userIdx: index('team_membership_user_id_idx').on(table.userId),
}));

export const coupons = pgTable('coupon', {
  id: varchar('id', { length: 30 }).primaryKey().$defaultFn(() => createId()),
  code: varchar('code', { length: 255 }).unique().notNull(),
  description: text('description'),
  discountType: discountTypeEnum('discount_type').default('PERCENTAGE').notNull(),
  discountValue: real('discount_value').notNull(), // Prisma Float -> Drizzle real
  maxRedemptions: integer('max_redemptions'),
  maxRedemptionsPerUser: integer('max_redemptions_per_user').default(1).notNull(),
  validFrom: timestamp('valid_from', { mode: 'date', withTimezone: true }),
  validUntil: timestamp('valid_until', { mode: 'date', withTimezone: true }),
  isActive: boolean('is_active').default(true).notNull(),
  minPurchaseAmount: integer('min_purchase_amount'),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
});

// Junction table for Coupon <-> SubscriptionPlan (many-to-many)
export const planCoupons = pgTable('plan_coupons', {
  planId: varchar('subscription_plan_id', { length: 30 }).notNull().references(() => subscriptionPlans.id, { onDelete: 'cascade' }),
  couponId: varchar('coupon_id', { length: 30 }).notNull().references(() => coupons.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.planId, table.couponId] }),
}));


export const couponRedemptions = pgTable('coupon_redemption', {
  id: varchar('id', { length: 30 }).primaryKey().$defaultFn(() => createId()),
  couponId: varchar('coupon_id', { length: 30 }).notNull().references(() => coupons.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 30 }).notNull().references(() => users.id, { onDelete: 'no action' }),
  invoiceId: varchar('invoice_id', { length: 30 }).references(() => invoices.id, { onDelete: 'set null' }),
  subscriptionId: varchar('subscription_id', { length: 30 }).references(() => subscriptions.id, { onDelete: 'set null' }),
  redeemedAt: timestamp('redeemed_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  discountAmountApplied: integer('discount_amount_applied').notNull(),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  couponIdx: index('coupon_redemption_coupon_id_idx').on(table.couponId),
  userIdx: index('coupon_redemption_user_id_idx').on(table.userId),
  invoiceIdx: index('coupon_redemption_invoice_id_idx').on(table.invoiceId),
  subscriptionIdx: index('coupon_redemption_subscription_id_idx').on(table.subscriptionId),
}));

export const subscriptionUsageRecords = pgTable('subscription_usage_record', {
  id: varchar('id', { length: 30 }).primaryKey().$defaultFn(() => createId()),
  subscriptionId: varchar('subscription_id', { length: 30 }).notNull().references(() => subscriptions.id, { onDelete: 'cascade' }),
  featureSlug: varchar('feature_slug', { length: 255 }).notNull(),
  quantityUsed: real('quantity_used').notNull(),
  recordDate: timestamp('record_date', { mode: 'date', withTimezone: true }).notNull(),
  description: text('description'),
  invoiceItemId: varchar('invoice_item_id', { length: 30 }).references(() => invoiceItems.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  subscriptionIdx: index('sur_subscription_id_idx').on(table.subscriptionId),
  featureSlugIdx: index('sur_feature_slug_idx').on(table.featureSlug),
  recordDateIdx: index('sur_record_date_idx').on(table.recordDate),
}));

export const notifications = pgTable('notification', {
  id: varchar('id', { length: 30 }).primaryKey().$defaultFn(() => createId()),
  userId: varchar('user_id', { length: 30 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: notificationTypeEnum('type').default('GENERAL').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  readAt: timestamp('read_at', { mode: 'date', withTimezone: true }),
  link: text('link'),
  relatedEntityType: varchar('related_entity_type', { length: 255 }),
  relatedEntityId: varchar('related_entity_id', { length: 255 }),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  userIdx: index('notification_user_id_idx').on(table.userId),
  isReadIdx: index('notification_is_read_idx').on(table.isRead),
}));

export const auditLogs = pgTable('audit_log', {
  id: varchar('id', { length: 30 }).primaryKey().$defaultFn(() => createId()),
  timestamp: timestamp('timestamp', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  userId: varchar('user_id', { length: 30 }).references(() => users.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 255 }).notNull(),
  targetEntityType: varchar('target_entity_type', { length: 255 }),
  targetEntityId: varchar('target_entity_id', { length: 255 }),
  details: jsonb('details'),
  ipAddress: varchar('ip_address', { length: 45 }), // For IPv6
  userAgent: text('user_agent'),
}, (table) => ({
  userIdx: index('audit_log_user_id_idx').on(table.userId),
  actionIdx: index('audit_log_action_idx').on(table.action),
  targetIdx: index('audit_log_target_entity_idx').on(table.targetEntityType, table.targetEntityId),
}));

export const paymentMethods = pgTable('payment_method', {
  id: varchar('id', { length: 30 }).primaryKey().$defaultFn(() => createId()),
  userId: varchar('user_id', { length: 30 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(), // CREDIT_CARD, DEBIT_CARD, BANK_TRANSFER, CCP_ACCOUNT, etc.
  provider: varchar('provider', { length: 100 }), // VISA, MASTERCARD, CIB, BEA, etc.
  last4: varchar('last4', { length: 4 }),
  brand: varchar('brand', { length: 50 }),
  expiryMonth: integer('expiry_month'),
  expiryYear: integer('expiry_year'),
  holderName: varchar('holder_name', { length: 255 }),
  bankName: varchar('bank_name', { length: 255 }),
  accountNumber: varchar('account_number', { length: 255 }),
  isDefault: boolean('is_default').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  userIdx: index('payment_method_user_id_idx').on(table.userId),
  isDefaultIdx: index('payment_method_is_default_idx').on(table.isDefault),
}));

export const activityLogs = pgTable('activity_log', {
  id: varchar('id', { length: 30 }).primaryKey().$defaultFn(() => createId()),
  userId: varchar('user_id', { length: 30 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  entityType: varchar('entity_type', { length: 100 }).notNull(), // payment, invoice, subscription, etc.
  entityId: varchar('entity_id', { length: 30 }),
  action: varchar('action', { length: 100 }).notNull(), // PAYMENT_PROCESSED, INVOICE_GENERATED, etc.
  description: text('description'),
  metadata: jsonb('metadata'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdx: index('activity_log_user_id_idx').on(table.userId),
  entityIdx: index('activity_log_entity_idx').on(table.entityType, table.entityId),
  actionIdx: index('activity_log_action_idx').on(table.action),
}));

// ----------------------------
// Contact submissions table (before relations)
// ----------------------------

export const contactSubmissions = pgTable('contact_submission', {
  id: varchar('id', { length: 30 }).primaryKey().$defaultFn(() => createId()),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
});

// ----------------------------
// RELATIONS
// ----------------------------

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  accounts: many(accounts),
  sessions: many(sessions),
  subscriptions: many(subscriptions),
  invoices: many(invoices),
  teamMemberships: many(teamMemberships),
  createdTeams: many(teams, { relationName: 'TeamAdmin' }), // To match Prisma's relation name
  notifications: many(notifications),
  payments: many(payments, { relationName: 'UserPayments' }),
  paymentMethods: many(paymentMethods),
  activityLogs: many(activityLogs),
  couponRedemptions: many(couponRedemptions, { relationName: 'UserCouponRedemptions' }),
  auditLogs: many(auditLogs, { relationName: 'UserAuditLogs' }),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const subscriptionPlansRelations = relations(subscriptionPlans, ({ many }) => ({
  subscriptions: many(subscriptions),
  planCoupons: many(planCoupons), // For the join table
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  admin: one(users, {
    fields: [teams.adminId],
    references: [users.id],
    relationName: 'TeamAdmin',
  }),
  members: many(teamMemberships),
  subscriptions: many(subscriptions),
  invoices: many(invoices),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [subscriptions.planId],
    references: [subscriptionPlans.id],
  }),
  team: one(teams, {
    fields: [subscriptions.teamId],
    references: [teams.id],
  }),
  invoices: many(invoices),
  addons: many(subscriptionAddonInstances),
  usageRecords: many(subscriptionUsageRecords),
  couponRedemptions: many(couponRedemptions, {relationName: 'SubscriptionCouponRedemptions'}),
}));

export const subscriptionAddonsRelations = relations(subscriptionAddons, ({ many }) => ({
  instances: many(subscriptionAddonInstances),
}));

export const subscriptionAddonInstancesRelations = relations(subscriptionAddonInstances, ({ one }) => ({
  subscription: one(subscriptions, {
    fields: [subscriptionAddonInstances.subscriptionId],
    references: [subscriptions.id],
  }),
  addon: one(subscriptionAddons, {
    fields: [subscriptionAddonInstances.addonId],
    references: [subscriptionAddons.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  user: one(users, {
    fields: [invoices.userId],
    references: [users.id],
  }),
  subscription: one(subscriptions, {
    fields: [invoices.subscriptionId],
    references: [subscriptions.id],
  }),
  team: one(teams, {
    fields: [invoices.teamId],
    references: [teams.id],
  }),
  items: many(invoiceItems),
  payments: many(payments),
  couponRedemptions: many(couponRedemptions, {relationName: 'InvoiceCouponRedemptions'}),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one, many }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
  usageRecords: many(subscriptionUsageRecords, { relationName: 'UsageInvoiceItem' }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
    relationName: 'UserPayments',
  }),
}));

export const teamMembershipsRelations = relations(teamMemberships, ({ one }) => ({
  team: one(teams, {
    fields: [teamMemberships.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [teamMemberships.userId],
    references: [users.id],
  }),
}));

export const couponsRelations = relations(coupons, ({ many }) => ({
  planCoupons: many(planCoupons), // For the join table
  redemptions: many(couponRedemptions),
}));

// Relations for the join table planCoupons
export const planCouponsRelations = relations(planCoupons, ({ one }) => ({
  subscriptionPlan: one(subscriptionPlans, {
    fields: [planCoupons.planId],
    references: [subscriptionPlans.id],
  }),
  coupon: one(coupons, {
    fields: [planCoupons.couponId],
    references: [coupons.id],
  }),
}));


export const couponRedemptionsRelations = relations(couponRedemptions, ({ one }) => ({
  coupon: one(coupons, {
    fields: [couponRedemptions.couponId],
    references: [coupons.id],
  }),
  user: one(users, {
    fields: [couponRedemptions.userId],
    references: [users.id],
    relationName: 'UserCouponRedemptions',
  }),
  invoice: one(invoices, {
    fields: [couponRedemptions.invoiceId],
    references: [invoices.id],
    relationName: 'InvoiceCouponRedemptions',
  }),
  subscription: one(subscriptions, {
    fields: [couponRedemptions.subscriptionId],
    references: [subscriptions.id],
    relationName: 'SubscriptionCouponRedemptions',
  }),
}));

export const subscriptionUsageRecordsRelations = relations(subscriptionUsageRecords, ({ one }) => ({
  subscription: one(subscriptions, {
    fields: [subscriptionUsageRecords.subscriptionId],
    references: [subscriptions.id],
  }),
  invoiceItem: one(invoiceItems, {
    fields: [subscriptionUsageRecords.invoiceItemId],
    references: [invoiceItems.id],
    relationName: 'UsageInvoiceItem',
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
    relationName: 'UserAuditLogs',
  }),
}));

export const paymentMethodsRelations = relations(paymentMethods, ({ one }) => ({
  user: one(users, {
    fields: [paymentMethods.userId],
    references: [users.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export const contactSubmissionsRelations = relations(contactSubmissions, ({ one }) => ({
  // No direct relations yet, but can be linked to users if needed in the future
}));

