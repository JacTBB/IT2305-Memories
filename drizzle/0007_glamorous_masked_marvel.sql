ALTER TABLE "person" ADD COLUMN "coverFaceId" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "person" ADD CONSTRAINT "person_coverFaceId_face_id_fk" FOREIGN KEY ("coverFaceId") REFERENCES "public"."face"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
