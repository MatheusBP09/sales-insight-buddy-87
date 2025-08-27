-- Create meetings table
CREATE TABLE public.meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  client_company TEXT,
  meeting_type TEXT NOT NULL DEFAULT 'sales_call',
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'recording', 'processing', 'completed', 'failed')),
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create recordings table
CREATE TABLE public.recordings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL,
  file_path TEXT,
  file_size INTEGER,
  duration_seconds INTEGER,
  format TEXT DEFAULT 'webm',
  status TEXT NOT NULL DEFAULT 'uploading' CHECK (status IN ('uploading', 'uploaded', 'processing', 'processed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transcriptions table
CREATE TABLE public.transcriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recording_id UUID NOT NULL,
  content TEXT,
  confidence_score DECIMAL(3,2),
  language TEXT DEFAULT 'pt',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meeting insights table
CREATE TABLE public.meeting_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL,
  client_objections TEXT[],
  commitments TEXT[],
  next_steps TEXT[],
  pain_points TEXT[],
  value_proposition TEXT,
  interest_score INTEGER CHECK (interest_score >= 0 AND interest_score <= 100),
  keywords TEXT[],
  sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  opportunities TEXT[],
  risks TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meeting participants table
CREATE TABLE public.meeting_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL,
  name TEXT NOT NULL,
  role TEXT,
  company TEXT,
  speaking_time_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for meetings
CREATE POLICY "Users can view their own meetings" ON public.meetings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own meetings" ON public.meetings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meetings" ON public.meetings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meetings" ON public.meetings
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for recordings
CREATE POLICY "Users can view recordings of their meetings" ON public.recordings
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.meetings 
    WHERE meetings.id = recordings.meeting_id 
    AND meetings.user_id = auth.uid()
  ));

CREATE POLICY "Users can create recordings for their meetings" ON public.recordings
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.meetings 
    WHERE meetings.id = recordings.meeting_id 
    AND meetings.user_id = auth.uid()
  ));

CREATE POLICY "Users can update recordings of their meetings" ON public.recordings
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.meetings 
    WHERE meetings.id = recordings.meeting_id 
    AND meetings.user_id = auth.uid()
  ));

-- Create RLS policies for transcriptions
CREATE POLICY "Users can view transcriptions of their recordings" ON public.transcriptions
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.recordings r
    JOIN public.meetings m ON r.meeting_id = m.id
    WHERE r.id = transcriptions.recording_id 
    AND m.user_id = auth.uid()
  ));

CREATE POLICY "Users can create transcriptions for their recordings" ON public.transcriptions
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.recordings r
    JOIN public.meetings m ON r.meeting_id = m.id
    WHERE r.id = transcriptions.recording_id 
    AND m.user_id = auth.uid()
  ));

CREATE POLICY "Users can update transcriptions of their recordings" ON public.transcriptions
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.recordings r
    JOIN public.meetings m ON r.meeting_id = m.id
    WHERE r.id = transcriptions.recording_id 
    AND m.user_id = auth.uid()
  ));

-- Create RLS policies for meeting insights
CREATE POLICY "Users can view insights of their meetings" ON public.meeting_insights
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.meetings 
    WHERE meetings.id = meeting_insights.meeting_id 
    AND meetings.user_id = auth.uid()
  ));

CREATE POLICY "Users can create insights for their meetings" ON public.meeting_insights
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.meetings 
    WHERE meetings.id = meeting_insights.meeting_id 
    AND meetings.user_id = auth.uid()
  ));

CREATE POLICY "Users can update insights of their meetings" ON public.meeting_insights
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.meetings 
    WHERE meetings.id = meeting_insights.meeting_id 
    AND meetings.user_id = auth.uid()
  ));

-- Create RLS policies for meeting participants
CREATE POLICY "Users can view participants of their meetings" ON public.meeting_participants
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.meetings 
    WHERE meetings.id = meeting_participants.meeting_id 
    AND meetings.user_id = auth.uid()
  ));

CREATE POLICY "Users can create participants for their meetings" ON public.meeting_participants
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.meetings 
    WHERE meetings.id = meeting_participants.meeting_id 
    AND meetings.user_id = auth.uid()
  ));

CREATE POLICY "Users can update participants of their meetings" ON public.meeting_participants
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.meetings 
    WHERE meetings.id = meeting_participants.meeting_id 
    AND meetings.user_id = auth.uid()
  ));

-- Add foreign key constraints
ALTER TABLE public.recordings ADD CONSTRAINT recordings_meeting_id_fkey 
  FOREIGN KEY (meeting_id) REFERENCES public.meetings(id) ON DELETE CASCADE;

ALTER TABLE public.transcriptions ADD CONSTRAINT transcriptions_recording_id_fkey 
  FOREIGN KEY (recording_id) REFERENCES public.recordings(id) ON DELETE CASCADE;

ALTER TABLE public.meeting_insights ADD CONSTRAINT meeting_insights_meeting_id_fkey 
  FOREIGN KEY (meeting_id) REFERENCES public.meetings(id) ON DELETE CASCADE;

ALTER TABLE public.meeting_participants ADD CONSTRAINT meeting_participants_meeting_id_fkey 
  FOREIGN KEY (meeting_id) REFERENCES public.meetings(id) ON DELETE CASCADE;

-- Create triggers for updated_at
CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_recordings_updated_at
  BEFORE UPDATE ON public.recordings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transcriptions_updated_at
  BEFORE UPDATE ON public.transcriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_meeting_insights_updated_at
  BEFORE UPDATE ON public.meeting_insights
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for recordings
INSERT INTO storage.buckets (id, name, public) 
VALUES ('meeting-recordings', 'meeting-recordings', false);

-- Create storage policies
CREATE POLICY "Users can upload recordings to their bucket" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'meeting-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own recordings" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'meeting-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own recordings" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'meeting-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own recordings" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'meeting-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);