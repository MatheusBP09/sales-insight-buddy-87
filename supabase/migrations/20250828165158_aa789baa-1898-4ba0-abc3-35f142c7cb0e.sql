-- Create storage bucket for meeting recordings
INSERT INTO storage.buckets (id, name, public) 
VALUES ('meeting-recordings', 'meeting-recordings', false);

-- Create policies for meeting recordings storage
CREATE POLICY "Users can upload their own recordings" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'meeting-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own recordings" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'meeting-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own recordings" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'meeting-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own recordings" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'meeting-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);