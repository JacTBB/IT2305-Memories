CREATE TABLE IF NOT EXISTS "reaction" (
	"id" serial PRIMARY KEY NOT NULL,
	"photoId" text NOT NULL,
	"emoji" text NOT NULL,
	"ip" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scrapbook" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"title" text NOT NULL,
	"data" text NOT NULL,
	"thumbnail" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scrapbook" ADD CONSTRAINT "scrapbook_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
