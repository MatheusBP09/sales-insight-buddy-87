-- Add unique constraint to external_meeting_id column in meetings table
-- This will allow the upsert operation with onConflict: 'external_meeting_id' to work properly
ALTER TABLE public.meetings ADD CONSTRAINT meetings_external_meeting_id_unique UNIQUE (external_meeting_id);