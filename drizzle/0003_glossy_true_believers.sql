CREATE TABLE IF NOT EXISTS "scheduled_memory" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"photoSrc" text NOT NULL,
	"caption" text,
	"sendAt" timestamp NOT NULL,
	"telegramChatId" text,
	"telegramLinkToken" text NOT NULL,
	"deliveryStatus" text DEFAULT 'pending' NOT NULL,
	"errorMessage" text,
	"retryCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"deliveredAt" timestamp,
	CONSTRAINT "scheduled_memory_telegramLinkToken_unique" UNIQUE("telegramLinkToken")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scheduled_memory" ADD CONSTRAINT "scheduled_memory_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
