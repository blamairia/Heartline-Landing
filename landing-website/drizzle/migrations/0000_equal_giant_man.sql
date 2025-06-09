CREATE TYPE "public"."addon_status" AS ENUM('ACTIVE', 'CANCELLED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."addon_type" AS ENUM('RECURRING', 'ONE_TIME');--> statement-breakpoint
CREATE TYPE "public"."billing_cycle" AS ENUM('ONCE', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMI_ANNUALLY', 'YEARLY', 'BIENNIALLY');--> statement-breakpoint
CREATE TYPE "public"."discount_type" AS ENUM('PERCENTAGE', 'FIXED_AMOUNT');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('DRAFT', 'OPEN', 'PAID', 'VOID', 'UNCOLLECTIBLE', 'PENDING_CONFIRMATION', 'REFUNDED', 'PARTIALLY_REFUNDED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('GENERAL', 'BILLING_ALERT', 'SUBSCRIPTION_UPDATE', 'NEW_FEATURE', 'SECURITY_ALERT', 'USAGE_ALERT');--> statement-breakpoint
CREATE TYPE "public"."payment_provider" AS ENUM('STRIPE', 'PAYPAL', 'PADDLE', 'OFFLINE_CASH', 'OFFLINE_BANK_TRANSFER', 'OFFLINE_CHECK', 'APPLE_IAP', 'GOOGLE_PLAY_BILLING', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'CHARGEBACK', 'AWAITING_ACTION');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('TRIALING', 'ACTIVE', 'PENDING_PAYMENT', 'PENDING_ACTIVATION', 'PAST_DUE', 'UNPAID', 'CANCELLED', 'EXPIRED', 'INCOMPLETE', 'INCOMPLETE_EXPIRED', 'PAUSED', 'DEACTIVATED');--> statement-breakpoint
CREATE TYPE "public"."team_role" AS ENUM('OWNER', 'ADMIN', 'MEMBER', 'BILLING_MANAGER', 'GUEST');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('USER', 'ADMIN', 'SUPER_ADMIN', 'SUPPORT_STAFF');--> statement-breakpoint
CREATE TABLE "account" (
	"id" varchar(30) PRIMARY KEY NOT NULL,
	"user_id" varchar(30) NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"provider_account_id" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(255),
	"scope" varchar(255),
	"id_token" text,
	"session_state" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" varchar(30) PRIMARY KEY NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" varchar(30),
	"action" varchar(255) NOT NULL,
	"target_entity_type" varchar(255),
	"target_entity_id" varchar(255),
	"details" jsonb,
	"ip_address" varchar(45),
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "coupon_redemption" (
	"id" varchar(30) PRIMARY KEY NOT NULL,
	"coupon_id" varchar(30) NOT NULL,
	"user_id" varchar(30) NOT NULL,
	"invoice_id" varchar(30),
	"subscription_id" varchar(30),
	"redeemed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"discount_amount_applied" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupon" (
	"id" varchar(30) PRIMARY KEY NOT NULL,
	"code" varchar(255) NOT NULL,
	"description" text,
	"discount_type" "discount_type" DEFAULT 'PERCENTAGE' NOT NULL,
	"discount_value" real NOT NULL,
	"max_redemptions" integer,
	"max_redemptions_per_user" integer DEFAULT 1 NOT NULL,
	"valid_from" timestamp with time zone,
	"valid_until" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"min_purchase_amount" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coupon_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "invoice_item" (
	"id" varchar(30) PRIMARY KEY NOT NULL,
	"invoice_id" varchar(30) NOT NULL,
	"product_id" varchar(255),
	"product_type" varchar(50),
	"description" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" integer NOT NULL,
	"total_amount" integer NOT NULL,
	"discount_amount" integer DEFAULT 0 NOT NULL,
	"tax_amount" integer DEFAULT 0 NOT NULL,
	"period_start_date" timestamp with time zone,
	"period_end_date" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice" (
	"id" varchar(30) PRIMARY KEY NOT NULL,
	"user_id" varchar(30) NOT NULL,
	"subscription_id" varchar(30),
	"team_id" varchar(30),
	"invoice_number" varchar(255) NOT NULL,
	"status" "invoice_status" DEFAULT 'DRAFT' NOT NULL,
	"amount_due" integer NOT NULL,
	"amount_paid" integer DEFAULT 0 NOT NULL,
	"amount_remaining" integer NOT NULL,
	"currency" varchar(10) NOT NULL,
	"issue_date" timestamp with time zone DEFAULT now() NOT NULL,
	"due_date" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"description" text,
	"payment_provider" "payment_provider",
	"payment_provider_invoice_id" varchar(255),
	"payment_attempt_count" integer DEFAULT 0 NOT NULL,
	"last_payment_error" text,
	"offline_payment_method" varchar(255),
	"offline_payment_reference" varchar(255),
	"pdf_url" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoice_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" varchar(30) PRIMARY KEY NOT NULL,
	"user_id" varchar(30) NOT NULL,
	"type" "notification_type" DEFAULT 'GENERAL' NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"link" text,
	"related_entity_type" varchar(255),
	"related_entity_id" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" varchar(30) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" varchar(30) PRIMARY KEY NOT NULL,
	"invoice_id" varchar(30) NOT NULL,
	"user_id" varchar(30) NOT NULL,
	"amount" integer NOT NULL,
	"currency" varchar(10) NOT NULL,
	"status" "payment_status" DEFAULT 'PENDING' NOT NULL,
	"payment_method_used" varchar(255),
	"payment_provider" "payment_provider",
	"payment_provider_transaction_id" varchar(255),
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"provider_responded_at" timestamp with time zone,
	"failure_reason" text,
	"refund_amount" integer,
	"refund_reason" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_payment_provider_transaction_id_unique" UNIQUE("payment_provider_transaction_id")
);
--> statement-breakpoint
CREATE TABLE "plan_coupons" (
	"subscription_plan_id" varchar(30) NOT NULL,
	"coupon_id" varchar(30) NOT NULL,
	CONSTRAINT "plan_coupons_subscription_plan_id_coupon_id_pk" PRIMARY KEY("subscription_plan_id","coupon_id")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" varchar(30) PRIMARY KEY NOT NULL,
	"session_token" varchar(255) NOT NULL,
	"user_id" varchar(30) NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "session_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "subscription_addon_instance" (
	"id" varchar(30) PRIMARY KEY NOT NULL,
	"subscription_id" varchar(30) NOT NULL,
	"addon_id" varchar(30) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"price_at_purchase" integer NOT NULL,
	"currency_at_purchase" varchar(10) NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone,
	"status" "addon_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_addon" (
	"id" varchar(30) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"description" text,
	"price" integer NOT NULL,
	"currency" varchar(10) DEFAULT 'usd' NOT NULL,
	"billing_cycle" "billing_cycle" NOT NULL,
	"type" "addon_type" DEFAULT 'RECURRING' NOT NULL,
	"features" jsonb,
	"stripe_price_id" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_addon_name_unique" UNIQUE("name"),
	CONSTRAINT "subscription_addon_stripe_price_id_unique" UNIQUE("stripe_price_id")
);
--> statement-breakpoint
CREATE TABLE "subscription_plan" (
	"id" varchar(30) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"description" text,
	"price" integer NOT NULL,
	"currency" varchar(10) DEFAULT 'usd' NOT NULL,
	"billing_cycle" "billing_cycle" DEFAULT 'MONTHLY' NOT NULL,
	"features" jsonb NOT NULL,
	"trial_days" integer,
	"stripe_price_id" varchar(255),
	"paypal_plan_id" varchar(255),
	"paddle_product_id" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"is_popular" boolean DEFAULT false NOT NULL,
	"display_order" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_plan_name_unique" UNIQUE("name"),
	CONSTRAINT "subscription_plan_stripe_price_id_unique" UNIQUE("stripe_price_id"),
	CONSTRAINT "subscription_plan_paypal_plan_id_unique" UNIQUE("paypal_plan_id"),
	CONSTRAINT "subscription_plan_paddle_product_id_unique" UNIQUE("paddle_product_id")
);
--> statement-breakpoint
CREATE TABLE "subscription_usage_record" (
	"id" varchar(30) PRIMARY KEY NOT NULL,
	"subscription_id" varchar(30) NOT NULL,
	"feature_slug" varchar(255) NOT NULL,
	"quantity_used" real NOT NULL,
	"record_date" timestamp with time zone NOT NULL,
	"description" text,
	"invoice_item_id" varchar(30),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription" (
	"id" varchar(30) PRIMARY KEY NOT NULL,
	"user_id" varchar(30) NOT NULL,
	"plan_id" varchar(30) NOT NULL,
	"team_id" varchar(30),
	"status" "subscription_status" DEFAULT 'PENDING_PAYMENT' NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone,
	"trial_start_date" timestamp with time zone,
	"trial_end_date" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancellation_reason" text,
	"cancellation_effective_date" timestamp with time zone,
	"auto_renew" boolean DEFAULT true NOT NULL,
	"payment_provider" "payment_provider",
	"payment_provider_subscription_id" varchar(255),
	"price_at_renewal" integer,
	"currency_at_renewal" varchar(10),
	"billing_cycle_at_renewal" "billing_cycle",
	"offline_payment_reference" varchar(255),
	"offline_payment_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_membership" (
	"id" varchar(30) PRIMARY KEY NOT NULL,
	"team_id" varchar(30) NOT NULL,
	"user_id" varchar(30) NOT NULL,
	"role" "team_role" DEFAULT 'MEMBER' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team" (
	"id" varchar(30) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255),
	"admin_id" varchar(30) NOT NULL,
	"billing_email" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "team_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" varchar(30) PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"email" varchar(255),
	"email_verified" timestamp with time zone,
	"image" text,
	"role" "user_role" DEFAULT 'USER' NOT NULL,
	"organization_id" varchar(30),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_token" (
	"identifier" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verification_token_identifier_token_pk" PRIMARY KEY("identifier","token"),
	CONSTRAINT "verification_token_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemption" ADD CONSTRAINT "coupon_redemption_coupon_id_coupon_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupon"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemption" ADD CONSTRAINT "coupon_redemption_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemption" ADD CONSTRAINT "coupon_redemption_invoice_id_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemption" ADD CONSTRAINT "coupon_redemption_subscription_id_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscription"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_item" ADD CONSTRAINT "invoice_item_invoice_id_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_subscription_id_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscription"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_invoice_id_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_coupons" ADD CONSTRAINT "plan_coupons_subscription_plan_id_subscription_plan_id_fk" FOREIGN KEY ("subscription_plan_id") REFERENCES "public"."subscription_plan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_coupons" ADD CONSTRAINT "plan_coupons_coupon_id_coupon_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupon"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_addon_instance" ADD CONSTRAINT "subscription_addon_instance_subscription_id_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscription"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_addon_instance" ADD CONSTRAINT "subscription_addon_instance_addon_id_subscription_addon_id_fk" FOREIGN KEY ("addon_id") REFERENCES "public"."subscription_addon"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_usage_record" ADD CONSTRAINT "subscription_usage_record_subscription_id_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscription"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_usage_record" ADD CONSTRAINT "subscription_usage_record_invoice_item_id_invoice_item_id_fk" FOREIGN KEY ("invoice_item_id") REFERENCES "public"."invoice_item"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_plan_id_subscription_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_membership" ADD CONSTRAINT "team_membership_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_membership" ADD CONSTRAINT "team_membership_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_admin_id_user_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "account_provider_provider_account_id_key" ON "account" USING btree ("provider","provider_account_id");--> statement-breakpoint
CREATE INDEX "audit_log_user_id_idx" ON "audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_log_action_idx" ON "audit_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_log_target_entity_idx" ON "audit_log" USING btree ("target_entity_type","target_entity_id");--> statement-breakpoint
CREATE INDEX "coupon_redemption_coupon_id_idx" ON "coupon_redemption" USING btree ("coupon_id");--> statement-breakpoint
CREATE INDEX "coupon_redemption_user_id_idx" ON "coupon_redemption" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "coupon_redemption_invoice_id_idx" ON "coupon_redemption" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "coupon_redemption_subscription_id_idx" ON "coupon_redemption" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "invoice_item_invoice_id_idx" ON "invoice_item" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "invoice_user_id_idx" ON "invoice" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "invoice_subscription_id_idx" ON "invoice" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "invoice_team_id_idx" ON "invoice" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "invoice_status_idx" ON "invoice" USING btree ("status");--> statement-breakpoint
CREATE INDEX "invoice_invoice_number_idx" ON "invoice" USING btree ("invoice_number");--> statement-breakpoint
CREATE INDEX "notification_user_id_idx" ON "notification" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_is_read_idx" ON "notification" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "payment_invoice_id_idx" ON "payment" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "payment_user_id_idx" ON "payment" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payment_payment_provider_transaction_id_idx" ON "payment" USING btree ("payment_provider_transaction_id");--> statement-breakpoint
CREATE INDEX "payment_status_idx" ON "payment" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sai_subscription_id_idx" ON "subscription_addon_instance" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "sai_addon_id_idx" ON "subscription_addon_instance" USING btree ("addon_id");--> statement-breakpoint
CREATE INDEX "sur_subscription_id_idx" ON "subscription_usage_record" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "sur_feature_slug_idx" ON "subscription_usage_record" USING btree ("feature_slug");--> statement-breakpoint
CREATE INDEX "sur_record_date_idx" ON "subscription_usage_record" USING btree ("record_date");--> statement-breakpoint
CREATE INDEX "subscription_user_id_idx" ON "subscription" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscription_plan_id_idx" ON "subscription" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "subscription_team_id_idx" ON "subscription" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "subscription_status_idx" ON "subscription" USING btree ("status");--> statement-breakpoint
CREATE INDEX "subscription_payment_provider_subscription_id_idx" ON "subscription" USING btree ("payment_provider_subscription_id");--> statement-breakpoint
CREATE UNIQUE INDEX "team_membership_team_id_user_id_key" ON "team_membership" USING btree ("team_id","user_id");--> statement-breakpoint
CREATE INDEX "team_membership_user_id_idx" ON "team_membership" USING btree ("user_id");