-- Update user role to admin
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'matheus.barbosa@tutorsparticipacoes.com';

-- Drop existing RLS policies for meetings
DROP POLICY IF EXISTS "Users can view their own meetings" ON meetings;
DROP POLICY IF EXISTS "Users can create their own meetings" ON meetings;
DROP POLICY IF EXISTS "Users can update their own meetings" ON meetings;
DROP POLICY IF EXISTS "Users can delete their own meetings" ON meetings;

-- Create new RLS policies that allow admins to see all meetings
CREATE POLICY "Admins can view all meetings" ON meetings
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  ) OR auth.uid() = user_id
);

CREATE POLICY "Users can create their own meetings" ON meetings
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update all meetings" ON meetings
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  ) OR auth.uid() = user_id
);

CREATE POLICY "Admins can delete all meetings" ON meetings
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  ) OR auth.uid() = user_id
);