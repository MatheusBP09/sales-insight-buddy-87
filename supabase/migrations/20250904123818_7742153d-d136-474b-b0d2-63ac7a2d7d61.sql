-- Update meetings table for webhook integration
ALTER TABLE public.meetings 
ADD COLUMN external_meeting_id TEXT,
ADD COLUMN join_url TEXT,
ADD COLUMN user_email TEXT,
ADD COLUMN raw_content TEXT,
ADD COLUMN corrected_transcript TEXT,
ADD COLUMN executive_summary TEXT,
ADD COLUMN processed_at TIMESTAMP WITH TIME ZONE;

-- Update meeting_participants to include speaking_time and better role tracking
ALTER TABLE public.meeting_participants 
ADD COLUMN email TEXT;

-- Add index for better performance on email lookups
CREATE INDEX idx_meetings_user_email ON public.meetings(user_email);
CREATE INDEX idx_meetings_external_id ON public.meetings(external_meeting_id);