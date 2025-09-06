CREATE TABLE IF NOT EXISTS "feedback_markers" (
	"id" serial PRIMARY KEY NOT NULL,
	"recording_id" integer NOT NULL,
	"timestamp" integer NOT NULL,
	"dimension" varchar(100) NOT NULL,
	"score" numeric(3, 2) NOT NULL,
	"feedback_text" text NOT NULL,
	"severity" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recording_results" ADD COLUMN "audio_url" varchar(255);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "feedback_markers" ADD CONSTRAINT "feedback_markers_recording_id_recordings_id_fk" FOREIGN KEY ("recording_id") REFERENCES "public"."recordings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_markers_recording_id_idx" ON "feedback_markers" USING btree ("recording_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_markers_recording_timestamp_idx" ON "feedback_markers" USING btree ("recording_id","timestamp");