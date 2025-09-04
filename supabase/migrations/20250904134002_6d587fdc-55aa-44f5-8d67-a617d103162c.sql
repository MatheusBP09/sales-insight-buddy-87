-- Create storage bucket for meeting attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('meeting-attachments', 'meeting-attachments', false);

-- Create RLS policies for meeting attachments
CREATE POLICY "Users can upload their own meeting attachments" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'meeting-attachments' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own meeting attachments" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'meeting-attachments' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own meeting attachments" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'meeting-attachments' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own meeting attachments" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'meeting-attachments' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add attachment columns to meetings table
ALTER TABLE public.meetings ADD COLUMN attachment_docx_url TEXT;
ALTER TABLE public.meetings ADD COLUMN attachment_vtt_url TEXT;
ALTER TABLE public.meetings ADD COLUMN attachment_docx_name TEXT;
ALTER TABLE public.meetings ADD COLUMN attachment_vtt_name TEXT;