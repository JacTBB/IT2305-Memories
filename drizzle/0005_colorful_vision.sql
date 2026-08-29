CREATE TABLE IF NOT EXISTS "face" (
	"id" serial PRIMARY KEY NOT NULL,
	"photoSrc" text NOT NULL,
	"personId" integer,
	"descriptor" json NOT NULL,
	"box" json NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "person" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "face" ADD CONSTRAINT "face_personId_person_id_fk" FOREIGN KEY ("personId") REFERENCES "public"."person"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
