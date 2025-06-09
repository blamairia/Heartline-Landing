CREATE TABLE "contact_submission" (
	"id" varchar(30) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "amount" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "password" varchar(255);