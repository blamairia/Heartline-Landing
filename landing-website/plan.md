# Hearline Dashboard Database Integration Plan

**Created:** June 8, 2025  
**Project:** Hearline Subscription Management Platform  
**Status:** Template to Database Integration  

## 📋 Executive Summary

This plan outlines the complete transformation of the Hearline dashboard from hardcoded template data to a fully functional database-integrated subscription management system. All dashboard components currently use mock data arrays and need to be connected to the existing Prisma database schema.

## 🎯 Current State Analysis

### ✅ Completed Items
- Dashboard pages restructured for subscription management (Users, Add-ons, Billing)
- Comprehensive Prisma schema with subscription models
- Basic NextAuth authentication setup
- All UI components functioning with mock data
- Dashboard navigation and routing established

### 🔍 Template vs Functional Code Analysis

#### Dashboard Components with Mock Data

1. **`/src/components/dashboard/dashboard-stats.tsx`**
   - **Mock Data:** Hardcoded stats array with subscription metrics
   - **Database Integration Needed:** User counts, ECG quotas, subscription status, renewal dates

2. **`/src/components/dashboard/recent-activity.tsx`**
   - **Mock Data:** Static activities array (5 hardcoded activities)
   - **Database Integration Needed:** Real user actions, billing events, quota alerts

3. **`/src/components/dashboard/quick-actions.tsx`**
   - **Mock Data:** Static actions array with fixed URLs
   - **Database Integration Needed:** Dynamic links based on user subscription

4. **`/src/components/dashboard/subscription-card.tsx`**
   - **Mock Data:** Hardcoded subscription details and pricing
   - **Database Integration Needed:** User's actual subscription plan and usage

#### Dashboard Pages with Mock Data

5. **`/src/app/dashboard/users/page.tsx`**
   - **Mock Data:** users array (4 hardcoded team members)
   - **Database Integration Needed:** Organization users, roles, activity tracking

6. **`/src/app/dashboard/addons/page.tsx`**
   - **Mock Data:** activeAddons and availableAddons arrays
   - **Database Integration Needed:** User's active addons, available marketplace

7. **`/src/app/dashboard/billing/page.tsx`**
   - **Mock Data:** invoices and paymentMethods arrays
   - **Database Integration Needed:** Real billing history and payment methods

8. **`/src/app/dashboard/subscription/page.tsx`**
   - **Mock Data:** Hardcoded plan details and billing history
   - **Database Integration Needed:** User's subscription plan, usage metrics, billing

## 🗄️ Database Schema Alignment

### Existing Prisma Models (✅ Complete)
```prisma
- User (with subscription relationships)
- SubscriptionPlan (plan definitions)
- Subscription (user subscriptions)
- Addon (addon definitions)
- SubscriptionAddon (user's active addons)
- UsageRecord (usage tracking)
- ContactSubmission (support requests)
- Account/Session (NextAuth)
```

### Missing Database Elements

#### 1. **Activity Tracking System**
```prisma
model ActivityLog {
  id          String   @id @default(cuid())
  userId      String
  type        ActivityType
  title       String
  description String
  metadata    Json?
  createdAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id])
}

enum ActivityType {
  USER_LOGIN
  USER_INVITED
  ECG_ANALYSIS
  SUBSCRIPTION_CHANGE
  BILLING_EVENT
  QUOTA_WARNING
  SETTINGS_UPDATE
}
```

#### 2. **Payment Methods Management**
```prisma
model PaymentMethod {
  id          String  @id @default(cuid())
  userId      String
  type        String  // 'credit_card', 'bank_account'
  provider    String  // 'stripe', 'paypal'
  last4       String
  brand       String
  expiryMonth Int?
  expiryYear  Int?
  isDefault   Boolean @default(false)
  isActive    Boolean @default(true)
  user        User    @relation(fields: [userId], references: [id])
}
```

#### 3. **Organization Management**
```prisma
model Organization {
  id          String @id @default(cuid())
  name        String
  slug        String @unique
  ownerId     String
  createdAt   DateTime @default(now())
  owner       User   @relation("OrganizationOwner", fields: [ownerId], references: [id])
  members     OrganizationMember[]
}

model OrganizationMember {
  id             String       @id @default(cuid())
  organizationId String
  userId         String
  role           MemberRole   @default(MEMBER)
  joinedAt       DateTime     @default(now())
  organization   Organization @relation(fields: [organizationId], references: [id])
  user           User         @relation(fields: [userId], references: [id])
}

enum MemberRole {
  OWNER
  ADMIN
  MEMBER
  VIEWER
}
```

## 🔧 Implementation Roadmap

### Phase 1: Database Extensions (Week 1)
**Priority:** High  
**Estimated Time:** 3-4 days

#### 1.1 Schema Updates
- [ ] Add ActivityLog model for activity tracking
- [ ] Add PaymentMethod model for billing management
- [ ] Add Organization and OrganizationMember models
- [ ] Update User model with organization relationships
- [ ] Create database migration scripts

#### 1.2 Seed Data Creation
- [ ] Create subscription plans seed data
- [ ] Create addon definitions seed data
- [ ] Create sample organizations and users
- [ ] Create sample activity logs
- [ ] Create payment method templates

### Phase 2: API Endpoints Development (Week 2)
**Priority:** High  
**Estimated Time:** 5-6 days

#### 2.1 Dashboard Statistics API
**File:** `/src/app/api/dashboard/stats/route.ts`
```typescript
// GET /api/dashboard/stats
// Returns: user count, ECG quota usage, subscription status, renewal info
```

#### 2.2 Activity Feed API
**File:** `/src/app/api/dashboard/activity/route.ts`
```typescript
// GET /api/dashboard/activity
// Returns: paginated user activities with filtering
```

#### 2.3 User Management APIs
**Files:** 
- `/src/app/api/dashboard/users/route.ts`
- `/src/app/api/dashboard/users/[id]/route.ts`
- `/src/app/api/dashboard/users/invite/route.ts`

#### 2.4 Subscription Management APIs
**Files:**
- `/src/app/api/dashboard/subscription/route.ts`
- `/src/app/api/dashboard/subscription/upgrade/route.ts`
- `/src/app/api/dashboard/subscription/cancel/route.ts`

#### 2.5 Addons Management APIs
**Files:**
- `/src/app/api/dashboard/addons/route.ts`
- `/src/app/api/dashboard/addons/[id]/route.ts`

#### 2.6 Billing & Payment APIs
**Files:**
- `/src/app/api/dashboard/billing/invoices/route.ts`
- `/src/app/api/dashboard/billing/payment-methods/route.ts`

### Phase 3: Component Integration (Week 3)
**Priority:** High  
**Estimated Time:** 4-5 days

#### 3.1 Dashboard Statistics Component
**File:** `/src/components/dashboard/dashboard-stats.tsx`
- [ ] Replace hardcoded stats with API call to `/api/dashboard/stats`
- [ ] Add loading states and error handling
- [ ] Implement real-time updates

#### 3.2 Recent Activity Component
**File:** `/src/components/dashboard/recent-activity.tsx`
- [ ] Replace mock activities with API call to `/api/dashboard/activity`
- [ ] Add pagination and filtering
- [ ] Implement real-time activity updates

#### 3.3 Quick Actions Component
**File:** `/src/components/dashboard/quick-actions.tsx`
- [ ] Make actions dynamic based on user subscription
- [ ] Add conditional rendering based on permissions
- [ ] Integrate with user's current plan features

#### 3.4 Subscription Card Component
**File:** `/src/components/dashboard/subscription-card.tsx`
- [ ] Fetch real subscription data from API
- [ ] Display actual usage and billing information
- [ ] Add upgrade/downgrade functionality

### Phase 4: Page Integration (Week 4)
**Priority:** High  
**Estimated Time:** 5-6 days

#### 4.1 Users Management Page
**File:** `/src/app/dashboard/users/page.tsx`
- [ ] Replace mock users with API integration
- [ ] Implement user invitation system
- [ ] Add role management functionality
- [ ] Implement user search and filtering

#### 4.2 Add-ons Management Page
**File:** `/src/app/dashboard/addons/page.tsx`
- [ ] Connect to addon APIs
- [ ] Implement addon activation/deactivation
- [ ] Add usage tracking and billing integration
- [ ] Create addon marketplace functionality

#### 4.3 Billing Management Page
**File:** `/src/app/dashboard/billing/page.tsx`
- [ ] Integrate with payment method APIs
- [ ] Connect to invoice history
- [ ] Implement payment method management
- [ ] Add billing notifications system

#### 4.4 Subscription Management Page
**File:** `/src/app/dashboard/subscription/page.tsx`
- [ ] Display real subscription data
- [ ] Implement plan upgrade/downgrade
- [ ] Add usage analytics
- [ ] Integrate billing history

### Phase 5: Advanced Features (Week 5)
**Priority:** Medium  
**Estimated Time:** 4-5 days

#### 5.1 Real-time Updates
- [ ] Implement WebSocket connections for live updates
- [ ] Add subscription to activity feeds
- [ ] Real-time quota and usage updates

#### 5.2 Notification System
- [ ] Email notifications for billing events
- [ ] In-app notifications for quota warnings
- [ ] Subscription renewal reminders

#### 5.3 Analytics Dashboard
- [ ] Usage analytics charts
- [ ] Performance metrics
- [ ] Cost analysis tools

## 📊 Detailed API Specifications

### Dashboard Statistics API
```typescript
// GET /api/dashboard/stats
interface DashboardStats {
  activeUsers: {
    current: number;
    total: number;
    change: string;
    changeType: 'increase' | 'decrease' | 'neutral';
  };
  ecgQuota: {
    used: number;
    total: number;
    percentage: number;
    resetDate: string;
  };
  subscription: {
    status: 'active' | 'inactive' | 'trial' | 'expired';
    plan: string;
    renewalDate: string;
    autoRenew: boolean;
  };
  billing: {
    nextPaymentDate: string;
    nextPaymentAmount: number;
    outstandingBalance: number;
  };
}
```

### Activity Feed API
```typescript
// GET /api/dashboard/activity?page=1&limit=10&type=billing
interface ActivityResponse {
  activities: Activity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}
```

### User Management API
```typescript
// GET /api/dashboard/users
interface UsersResponse {
  users: OrganizationUser[];
  stats: {
    total: number;
    active: number;
    admins: number;
    pendingInvites: number;
  };
}

interface OrganizationUser {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  status: 'active' | 'inactive' | 'pending';
  lastActive: string;
  ecgCount: number;
  joinedAt: string;
}
```

## 🔐 Security Considerations

### Authentication & Authorization
- [ ] Implement organization-based access control
- [ ] Add role-based permissions for different dashboard sections
- [ ] Secure API endpoints with proper authentication
- [ ] Implement rate limiting for sensitive operations

### Data Privacy
- [ ] Ensure GDPR compliance for user data
- [ ] Implement audit logging for sensitive operations
- [ ] Add data encryption for payment information
- [ ] Secure API responses (no sensitive data exposure)

## 🧪 Testing Strategy

### Unit Tests
- [ ] API endpoint tests for all new routes
- [ ] Component integration tests with mock data
- [ ] Database model tests and relationships
- [ ] Authentication and authorization tests

### Integration Tests
- [ ] End-to-end dashboard functionality
- [ ] Payment flow testing
- [ ] User invitation and role management
- [ ] Subscription upgrade/downgrade flows

### Performance Tests
- [ ] API response time optimization
- [ ] Database query performance
- [ ] Frontend rendering performance
- [ ] Real-time update performance

## 📈 Migration Strategy

### Data Migration Plan
1. **Phase 1:** Create new database tables
2. **Phase 2:** Migrate existing user data to new schema
3. **Phase 3:** Create sample subscription data
4. **Phase 4:** Set up default plans and addons
5. **Phase 5:** Generate historical activity data

### Deployment Strategy
1. **Development:** Complete integration in development environment
2. **Staging:** Deploy to staging for comprehensive testing
3. **Production:** Gradual rollout with feature flags
4. **Monitoring:** Real-time monitoring and alerting setup

## 🎯 Success Metrics

### Technical Metrics
- [ ] All dashboard components connected to database
- [ ] API response times < 200ms
- [ ] Zero hardcoded mock data remaining
- [ ] 100% test coverage for new APIs

### User Experience Metrics
- [ ] Dashboard load time < 2 seconds
- [ ] Real-time updates working correctly
- [ ] Subscription management flows functional
- [ ] Billing integration working end-to-end

## 📝 Documentation Requirements

### Technical Documentation
- [ ] API documentation for all endpoints
- [ ] Database schema documentation
- [ ] Component integration guides
- [ ] Deployment and maintenance guides

### User Documentation
- [ ] Dashboard user guide
- [ ] Subscription management guide
- [ ] Billing and payment guides
- [ ] Troubleshooting documentation

## 🚀 Next Steps

### Immediate Actions (This Week)
1. **Database Schema Updates** - Add missing models for activities, payments, organizations
2. **Seed Data Creation** - Create realistic sample data for development
3. **API Foundation** - Set up basic API structure and authentication

### Week 1 Priorities
1. Implement dashboard stats API
2. Create activity logging system
3. Set up user management APIs
4. Begin component integration

### Success Criteria
- All mock data replaced with database calls
- Real user authentication and organization support
- Functional subscription and billing management
- Scalable architecture for future features

---

**Document Version:** 1.0  
**Last Updated:** June 8, 2025  
**Next Review:** June 15, 2025  
**Owner:** Development Team  
**Status:** Ready for Implementation
