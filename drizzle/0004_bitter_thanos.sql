CREATE TABLE IF NOT EXISTS "memory_subscription" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"frequency" text NOT NULL,
	"timeOfDay" text NOT NULL,
	"dayOfWeek" integer,
	"dayOfMonth" integer,
	"telegramChatId" text,
	"telegramLinkToken" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"lastSentAt" timestamp,
	"lastSentPhotoSrc" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "memory_subscription_telegramLinkToken_unique" UNIQUE("telegramLinkToken")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "memory_subscription" ADD CONSTRAINT "memory_subscription_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
