// Dashboard API Types
export interface DashboardStat {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
  icon: string;
}

export interface DashboardStatsResponse {
  stats: DashboardStat[];
}

// Activity Types
export interface ActivityItem {
  id: string;
  user: string;
  action: string;
  time: Date;
  type: 'subscription' | 'billing' | 'user' | 'system';
}

export interface RecentActivityResponse {
  activities: ActivityItem[];
}

// User Management Types
export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN' | 'SUPPORT';
  status: 'Active' | 'Inactive';
  subscription: string;
  organization: string;
  joinDate: Date;
  lastActive: Date;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface UsersResponse {
  users: UserItem[];
  pagination: PaginationInfo;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: 'USER' | 'ADMIN' | 'SUPPORT';
  organization?: string;
  phone?: string;
  city?: string;
  wilaya?: string;
}

// Addon Types
export interface ActiveAddon {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  type: 'FEATURE' | 'USAGE' | 'INTEGRATION' | 'SUPPORT';
  quantity: number;
  isActive: boolean;
  addedDate: Date | undefined;
}

export interface AvailableAddon {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  type: 'FEATURE' | 'USAGE' | 'INTEGRATION' | 'SUPPORT';
  features: string[];
  popular: boolean;
}

export interface AddonsResponse {
  activeAddons: ActiveAddon[];
  availableAddons: AvailableAddon[];
  hasActiveSubscription: boolean;
}

export interface AddAddonRequest {
  addonId: string;
  quantity?: number;
}

// Billing Types
export interface PaymentMethod {
  id: string;
  type: 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_TRANSFER' | 'CCP_ACCOUNT' | 'PAYPAL';
  provider: string;
  last4?: string | null;
  brand?: string | null;
  expiryMonth?: number | null;
  expiryYear?: number | null;
  holderName?: string | null;
  bankName?: string | null;
  isDefault: boolean;
  display: string;
}

export interface Invoice {
  id: string;
  number: string;
  date: Date;
  dueDate: Date;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED';
  description: string;
  paidAt: Date | null;
  downloadUrl: string;
}

export interface BillingSummary {
  totalPaid: number;
  pendingAmount: number;
  overdueAmount: number;
  currency: string;
}

export interface BillingResponse {
  paymentMethods: PaymentMethod[];
  invoices: Invoice[];
  summary: BillingSummary;
}

export interface AddPaymentMethodRequest {
  action: 'add_payment_method';
  type: 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_TRANSFER' | 'CCP_ACCOUNT' | 'PAYPAL';
  provider: string;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  holderName?: string;
  bankName?: string;
  accountNumber?: string;
  isDefault?: boolean;
}

export interface SetDefaultPaymentMethodRequest {
  action: 'set_default_payment_method';
  paymentMethodId: string;
}

export interface RemovePaymentMethodRequest {
  action: 'remove_payment_method';
  paymentMethodId: string;
}

export type BillingRequest = AddPaymentMethodRequest | SetDefaultPaymentMethodRequest | RemovePaymentMethodRequest;

// Subscription Types
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  billingCycle: 'MONTHLY' | 'ANNUAL';
  features: any;
}

export interface SubscriptionAddon {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: 'FEATURE' | 'USAGE' | 'INTEGRATION' | 'SUPPORT';
}

export interface SubscriptionBilling {
  startDate: Date;
  endDate: Date | null;
  nextPaymentDate: Date | null;
  lastPaymentDate: Date | null;
  totalMonthlyCost: number;
  currency: string;
  autoRenew: boolean;
}

export interface SubscriptionTrial {
  isTrialUsed: boolean;
  trialStartDate: Date | null;
  trialEndDate: Date | null;
}

export interface SubscriptionUsage {
  feature: string;
  usage: number;
}

export interface Subscription {
  id: string;
  status: 'TRIAL' | 'ACTIVE' | 'INACTIVE' | 'CANCELLED' | 'EXPIRED' | 'PAST_DUE';
  plan: SubscriptionPlan;
  addons: SubscriptionAddon[];
  billing: SubscriptionBilling;
  trial: SubscriptionTrial;
  usage: SubscriptionUsage[];
}

export interface SubscriptionResponse {
  subscription: Subscription | null;
  hasActiveSubscription: boolean;
}

export interface CancelSubscriptionRequest {
  action: 'cancel_subscription';
}

export interface ToggleAutoRenewRequest {
  action: 'toggle_auto_renew';
  subscriptionId: string;
}

export interface ChangePlanRequest {
  action: 'change_plan';
  newPlanId: string;
}

export type SubscriptionRequest = CancelSubscriptionRequest | ToggleAutoRenewRequest | ChangePlanRequest;

// Error Response
export interface ErrorResponse {
  error: string;
}

// Success Response
export interface SuccessResponse {
  message: string;
  [key: string]: any;
}
