# 🏥 Heartline - Landing Website & Subscription Platform

## 🌟 Professional Marketing Website with Subscription Management

This is the **marketing and subscription management platform** for Heartline, our AI-powered cardiology management system. This website is **separate from the main Flask application** and serves as:

- **🎯 Marketing Hub** - Client acquisition and lead generation
- **📊 Product Showcase** - Features and benefits presentation  
- **💰 Subscription Management** - Full subscription lifecycle with user accounts
- **🔐 Authentication System** - Login/Register with role-based access
- **👤 User Dashboard** - Subscription management and billing
- **👥 About Us** - Team and company information
- **📞 Contact & Support** - Communication channels
- **🚀 Investor Portal** - Investment opportunity presentation

## 🏗️ Technical Architecture

### **Frontend Framework: Next.js 14 with TypeScript**
- **Server-Side Rendering (SSR)** for SEO optimization
- **Static Site Generation (SSG)** for marketing pages
- **API Routes** for backend functionality
- **TypeScript** for type safety and better DX

### **UI Components: Shadcn/ui + Tailwind CSS**
- **Shadcn/ui** - Production-ready components
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Smooth animations
- **React Hook Form** - Form management with validation

### **Authentication: NextAuth.js**
- **Multiple Providers** - Email, Google, etc.
- **JWT Tokens** - Secure session management
- **Role-based Access** - User roles and permissions
- **Password Security** - Bcrypt hashing

### **Database: PostgreSQL with Drizzle ORM**
- **Drizzle ORM** - Modern, type-safe database operations
- **PostgreSQL** - Robust relational database
- **Database Migrations** - Version controlled schema with Drizzle Kit
- **Connection Pooling** - Optimized performance

### **Subscription Management Architecture**
- **User Account System** - Complete user lifecycle
- **Subscription Tiers** - Flexible plan management
- **Billing Cycles** - Monthly/Annual billing
- **Add-on System** - Extensible feature additions
- **Usage Tracking** - Feature usage monitoring
- **Payment Processing** - Stripe integration with cash payments for Algeria

## 🚀 Recent Major Update: Drizzle ORM Migration

**✅ Successfully migrated from Prisma to Drizzle ORM** (December 2024)

### Key Improvements:
- **Better Performance**: Direct SQL generation with zero runtime overhead
- **Enhanced Type Safety**: Full TypeScript inference across all database operations
- **Smaller Bundle Size**: Significantly reduced application size
- **Better Developer Experience**: Superior IDE support and debugging capabilities
- **Modern Architecture**: Latest ORM technology with SQL-like query building

### Migration Benefits:
```typescript
// Before (Prisma)
const user = await prisma.user.findUnique({ where: { email } });

// After (Drizzle) - More explicit and type-safe
const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
```

See [`DRIZZLE_MIGRATION_README.md`](./DRIZZLE_MIGRATION_README.md) for complete migration documentation.

## 📁 Project Structure

```
landing-website/
├── README.md                   # Project documentation
├── package.json               # Dependencies and scripts
├── next.config.js            # Next.js configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── migrations/           # Database migrations
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Homepage
│   │   ├── about/
│   │   │   └── page.tsx      # About page
│   │   ├── pricing/
│   │   │   └── page.tsx      # Pricing page
│   │   ├── contact/
│   │   │   └── page.tsx      # Contact page
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   │   └── page.tsx  # Login page
│   │   │   └── register/
│   │   │       └── page.tsx  # Register page
│   │   ├── dashboard/
│   │   │   ├── page.tsx      # User dashboard
│   │   │   ├── subscription/
│   │   │   │   └── page.tsx  # Subscription management
│   │   │   └── billing/
│   │   │       └── page.tsx  # Billing history
│   │   └── api/              # API routes
│   │       ├── auth/         # Authentication endpoints
│   │       ├── subscriptions/ # Subscription endpoints
│   │       └── users/        # User management endpoints
│   ├── components/           # Reusable UI components
│   │   ├── ui/              # Shadcn/ui components
│   │   ├── marketing/       # Marketing-specific components
│   │   ├── dashboard/       # Dashboard components
│   │   ├── auth/           # Authentication components
│   │   └── layout/         # Layout components
│   ├── lib/                # Utility functions and configurations
│   │   ├── auth.ts         # NextAuth configuration
│   │   ├── db.ts           # Database connection
│   │   ├── validations.ts  # Form validation schemas
│   │   └── utils.ts        # General utilities
│   ├── styles/             # Global styles
│   │   └── globals.css     # Global CSS with Tailwind
│   └── types/              # TypeScript type definitions
│       ├── auth.ts         # Authentication types
│       ├── subscription.ts # Subscription types
│       └── user.ts         # User types
├── public/                 # Static assets
│   ├── images/
│   │   ├── logo/          # Brand logos
│   │   ├── screenshots/   # Product screenshots
│   │   ├── icons/         # UI icons
│   │   └── team/          # Team photos
│   └── favicon.ico        # Site favicon
└── .env.local             # Environment variables
```

## 🗄️ Database Schema (Prisma)

```prisma
// User Management
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  name        String?
  role        Role     @default(USER)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  subscriptions Subscription[]
  sessions      Session[]
}

// Subscription Management  
model Subscription {
  id          String           @id @default(cuid())
  userId      String
  planId      String
  status      SubscriptionStatus
  startDate   DateTime
  endDate     DateTime?
  billingCycle BillingCycle
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
  
  // Relations
  user        User             @relation(fields: [userId], references: [id])
  plan        SubscriptionPlan @relation(fields: [planId], references: [id])
  addons      SubscriptionAddon[]
}

// Subscription Plans
model SubscriptionPlan {
  id          String   @id @default(cuid())
  name        String
  description String?
  price       Decimal
  currency    String   @default("DZD")
  features    Json     // Feature list as JSON
  maxPatients Int?
  maxECGAnalyses Int?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  subscriptions Subscription[]
}

// Add-on System for Future Extensions
model Addon {
  id          String   @id @default(cuid())
  name        String
  description String?
  price       Decimal
  currency    String   @default("DZD")
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  subscriptionAddons SubscriptionAddon[]
}

model SubscriptionAddon {
  id             String       @id @default(cuid())
  subscriptionId String
  addonId        String
  quantity       Int          @default(1)
  createdAt      DateTime     @default(now())
  
  // Relations
  subscription   Subscription @relation(fields: [subscriptionId], references: [id])
  addon          Addon        @relation(fields: [addonId], references: [id])
  
  @@unique([subscriptionId, addonId])
}

// Enums
enum Role {
  USER
  ADMIN
  SUPPORT
}

enum SubscriptionStatus {
  ACTIVE
  INACTIVE
  CANCELLED
  EXPIRED
  TRIAL
}

enum BillingCycle {
  MONTHLY
  ANNUAL
}
```

## 🛠️ Technology Stack

### **Core Framework**
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **React 18** - Latest React features

### **UI & Styling**
- **Shadcn/ui** - High-quality component library
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Animation library
- **Lucide React** - Beautiful icons

### **Authentication & Security**
- **NextAuth.js** - Complete authentication solution
- **Bcrypt** - Password hashing
- **JWT** - Secure token management
- **Zod** - Runtime type validation

### **Database & ORM**
- **PostgreSQL** - Production database
- **Prisma** - Type-safe ORM
- **Database Pooling** - Connection optimization

### **Forms & Validation**
- **React Hook Form** - Performant form library
- **Zod** - Schema validation
- **Form Validation** - Real-time validation

### **Development Tools**
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **TypeScript** - Static type checking

## 🚀 Quick Start

### **1. Initialize Next.js Project**
```bash
npx create-next-app@latest Heartline-landing --typescript --tailwind --eslint --app
cd Heartline-landing
```

### **2. Install Dependencies**
```bash
# UI Components
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-label @radix-ui/react-select @radix-ui/react-separator @radix-ui/react-slot @radix-ui/react-toast
npm install class-variance-authority clsx tailwind-merge lucide-react

# Authentication
npm install next-auth @auth/prisma-adapter bcryptjs
npm install @types/bcryptjs

# Database
npm install prisma @prisma/client
npm install @types/pg

# Forms & Validation
npm install react-hook-form @hookform/resolvers zod

# Animations
npm install framer-motion

# Utilities
npm install date-fns
```

### **3. Setup Shadcn/ui**
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input label select toast dialog dropdown-menu separator
```

### **4. Initialize Database**
```bash
npx prisma init
npx prisma migrate dev --name init
npx prisma generate
```

### **5. Environment Setup**
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/Heartline_landing"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Email (Optional)
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_FROM="noreply@Heartline.dz"
```

## 📱 Features Implementation Plan

### **Phase 1: Foundation (Week 1-2)**
- ✅ Next.js setup with TypeScript
- ✅ Shadcn/ui component library integration
- ✅ Database schema design and migration
- ✅ Basic authentication system
- ✅ Landing page with marketing content

### **Phase 2: Authentication System (Week 3)**
- 🔐 User registration and login
- 📧 Email verification
- 🔑 Password reset functionality
- 👤 User profile management
- 🛡️ Role-based access control

### **Phase 3: Subscription Management (Week 4-5)**
- 💳 Subscription plan display
- 📊 User dashboard
- 🔄 Subscription lifecycle management
- 📈 Usage tracking
- 📋 Billing history

### **Phase 4: Advanced Features (Week 6+)**
- 🔌 Add-on system architecture
- 📊 Analytics dashboard
- 📧 Email notifications
- 🎯 Marketing automation
- 🔍 SEO optimization

## 🎨 Design System

### **Brand Colors (Tailwind Custom)**
```css
/* tailwind.config.js */
colors: {
  primary: {
    50: '#eff6ff',
    500: '#667eea',
    600: '#5a67d8',
    700: '#4c51bf',
    900: '#2d3748'
  },
  medical: {
    blue: '#667eea',
    purple: '#764ba2',
    green: '#28a745',
    red: '#dc3545'
  }
}
```

### **Typography Scale**
- **Display**: 64px/72px - Hero headings
- **H1**: 48px/56px - Page titles
- **H2**: 36px/44px - Section headers  
- **H3**: 24px/32px - Subsection headers
- **Body**: 16px/24px - Regular text
- **Small**: 14px/20px - Secondary text

### **Component Library Structure**
```
components/
├── ui/                 # Shadcn/ui base components
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   └── ...
├── marketing/          # Marketing page components
│   ├── hero-section.tsx
│   ├── feature-grid.tsx
│   ├── pricing-table.tsx
│   └── testimonials.tsx
├── dashboard/          # User dashboard components
│   ├── subscription-card.tsx
│   ├── usage-stats.tsx
│   ├── billing-table.tsx
│   └── settings-panel.tsx
└── layout/            # Layout components
    ├── header.tsx
    ├── footer.tsx
    └── sidebar.tsx
```

## 🔐 Authentication Flow

### **User Registration Process**
1. **Email Registration** - User provides email and password
2. **Email Verification** - Verification link sent to email
3. **Profile Setup** - Basic profile information
4. **Plan Selection** - Choose subscription plan
5. **Account Activation** - Account ready for use

### **Login System**
- **Email/Password** - Standard authentication
- **Remember Me** - Persistent sessions
- **Password Reset** - Secure reset flow
- **Account Recovery** - Multi-step recovery

### **Role-based Access**
- **User** - Standard subscription access
- **Admin** - Full platform management
- **Support** - Customer support access

## 💰 Subscription Management System

### **Subscription Tiers**
```typescript
// Starter Plan
{
  name: "Starter",
  price: 15000, // DZD
  currency: "DZD",
  billingCycle: "MONTHLY",
  features: {
    maxPatients: 100,
    maxECGAnalyses: 50,
    basicSupport: true,
    advancedAnalytics: false,
    apiAccess: false
  }
}

// Professional Plan  
{
  name: "Professional",
  price: 35000, // DZD
  currency: "DZD", 
  billingCycle: "MONTHLY",
  features: {
    maxPatients: 500,
    maxECGAnalyses: -1, // Unlimited
    prioritySupport: true,
    advancedAnalytics: true,
    apiAccess: false
  }
}

// Enterprise Plan
{
  name: "Enterprise", 
  price: 75000, // DZD
  currency: "DZD",
  billingCycle: "MONTHLY", 
  features: {
    maxPatients: -1, // Unlimited
    maxECGAnalyses: -1, // Unlimited
    phoneSupport: true,
    customAnalytics: true,
    apiAccess: true,
    customIntegrations: true
  }
}
```

### **Add-on System (Future)**
```typescript
// Future add-ons for extensibility
{
  name: "Advanced AI Models",
  price: 5000, // DZD per month
  description: "Access to latest AI models"
}

{
  name: "API Access",
  price: 10000, // DZD per month  
  description: "Full API access for integrations"
}

{
  name: "Custom Reports",
  price: 3000, // DZD per month
  description: "Custom reporting and analytics"
}
```

## 🚀 Development Workflow

### **1. Project Setup**
```bash
# Clone and setup
git clone <repository>
cd Heartline-landing
npm install

# Database setup
npx prisma migrate dev
npx prisma generate
npx prisma db seed

# Environment setup
cp .env.example .env.local
# Edit .env.local with your values

# Development server
npm run dev
```

### **2. Database Management**
```bash
# Create migration
npx prisma migrate dev --name "description"

# Reset database
npx prisma migrate reset

# Deploy to production
npx prisma migrate deploy

# Generate client
npx prisma generate

# Database studio
npx prisma studio
```

### **3. Code Quality**
```bash
# Linting
npm run lint
npm run lint:fix

# Type checking
npm run type-check

# Formatting
npm run format

# Testing
npm run test
npm run test:watch
```

## 📊 Analytics & Monitoring

### **User Analytics**
- **Registration Funnel** - Track conversion rates
- **Subscription Metrics** - Monitor plan adoption
- **Feature Usage** - Track feature engagement
- **Churn Analysis** - Identify retention issues

### **Performance Monitoring**
- **Page Load Times** - Core Web Vitals
- **API Response Times** - Backend performance
- **Error Tracking** - Bug monitoring
- **Uptime Monitoring** - Service availability

## 🚢 Deployment Strategy

### **Development Environment**
- **Local Development** - Next.js dev server
- **Database** - Local PostgreSQL
- **Authentication** - Development providers

### **Staging Environment**
- **Platform** - Vercel/Netlify staging
- **Database** - Staging PostgreSQL
- **Domain** - staging.Heartline.dz

### **Production Environment**
- **Platform** - Vercel/Netlify
- **Database** - Production PostgreSQL
- **CDN** - Global content delivery
- **Domain** - Heartline.dz

## 🎯 Target Audience & User Journey

### **Healthcare Providers**
1. **Discovery** - Land on marketing pages
2. **Education** - Learn about AI ECG features
3. **Trial** - Sign up for free trial
4. **Conversion** - Subscribe to paid plan
5. **Growth** - Upgrade plans and add features

### **Hospital Administrators**
1. **Research** - Compare with competitors
2. **Demo** - Request personalized demo
3. **Evaluation** - Trial with multiple users
4. **Procurement** - Enterprise sales process
5. **Implementation** - Onboarding and training

## 📋 Next Steps

### **Immediate Actions (This Week)**
1. **Initialize Next.js project** with TypeScript
2. **Setup Shadcn/ui** component library
3. **Create database schema** with Prisma
4. **Implement basic authentication** with NextAuth
5. **Build marketing homepage** with responsive design

### **Short-term Goals (Next 2 Weeks)**
1. **Complete authentication flow** (register/login/reset)
2. **Build user dashboard** with subscription management
3. **Create pricing pages** with plan comparison
4. **Implement subscription CRUD** operations
5. **Add email notifications** for account events

### **Medium-term Goals (Next Month)**
1. **Add billing history** and invoice generation
2. **Implement usage tracking** and limits
3. **Create admin dashboard** for subscription management
4. **Add comprehensive testing** suite
5. **Optimize SEO** and performance

---

*Built with ❤️ for revolutionizing cardiovascular healthcare in Algeria*

## 📞 Development Team Contact

- **Lead Developer**: [Your Name]
- **Email**: dev@Heartline.dz
- **Project Repository**: [GitHub Link]
- **Documentation**: [Docs Link]
