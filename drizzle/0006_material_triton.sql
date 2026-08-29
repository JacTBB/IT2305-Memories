CREATE TABLE IF NOT EXISTS "face_rejection" (
	"id" serial PRIMARY KEY NOT NULL,
	"faceId" integer NOT NULL,
	"personId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "face" ADD COLUMN "verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "face_rejection" ADD CONSTRAINT "face_rejection_faceId_face_id_fk" FOREIGN KEY ("faceId") REFERENCES "public"."face"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "face_rejection" ADD CONSTRAINT "face_rejection_personId_person_id_fk" FOREIGN KEY ("personId") REFERENCES "public"."person"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
