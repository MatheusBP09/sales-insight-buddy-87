-- Create business units table
CREATE TABLE public.business_units (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  email_patterns TEXT[] DEFAULT '{}',
  color TEXT DEFAULT '#6366f1',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default business units
INSERT INTO public.business_units (name, display_name, description, email_patterns, color) VALUES
('wealth', 'Wealth Management', 'Gestão de patrimônio e investimentos', '{wealth,gestao,investimentos}', '#10b981'),
('credito', 'Crédito', 'Operações de crédito e financiamento', '{credito,credit}', '#3b82f6'),
('hedge', 'Hedge Fund', 'Fundos de investimento alternativos', '{hedge,fund}', '#8b5cf6'),
('agro', 'Agronegócio', 'Investimentos em agronegócio', '{agro,agronegocio}', '#f59e0b'),
('seguros', 'Seguros', 'Produtos de seguros e proteção', '{seguros,insurance}', '#ef4444'),
('outros', 'Outros', 'Outras áreas de negócio', '{}', '#6b7280');

-- Create meeting types enum
CREATE TYPE public.meeting_type AS ENUM (
  'sales_meeting',
  'client_meeting', 
  'internal',
  'company_wide',
  'vendor_partner',
  'training_workshop',
  'support_ticket',
  'finance_billing',
  'hiring_interview',
  'other'
);

-- Update meetings table with new fields
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS business_unit TEXT REFERENCES public.business_units(name);
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS organizer_name TEXT;
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS organizer_email TEXT;
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS word_count INTEGER;
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS quality_score INTEGER;
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS sentiment_score DECIMAL;
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS playbook_score DECIMAL;
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS engagement_score DECIMAL;
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS external_participant_count INTEGER DEFAULT 0;
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS total_participant_count INTEGER DEFAULT 0;

-- Drop existing enum constraint and recreate with new values
ALTER TABLE public.meetings ALTER COLUMN meeting_type DROP DEFAULT;
ALTER TABLE public.meetings ALTER COLUMN meeting_type TYPE TEXT;
ALTER TABLE public.meetings ALTER COLUMN meeting_type SET DEFAULT 'other';

-- Create playbook rules table
CREATE TABLE public.playbook_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_type TEXT NOT NULL,
  rule_name TEXT NOT NULL,
  rule_description TEXT,
  keywords TEXT[] DEFAULT '{}',
  weight DECIMAL DEFAULT 1.0,
  min_score INTEGER DEFAULT 0,
  max_score INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  business_unit TEXT REFERENCES public.business_units(name),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user profiles with business units
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_unit TEXT REFERENCES public.business_units(name) DEFAULT 'outros';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Create meeting keywords table for extracted keywords
CREATE TABLE public.meeting_keywords (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  frequency INTEGER DEFAULT 1,
  relevance_score DECIMAL DEFAULT 0,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meeting analytics table for detailed metrics
CREATE TABLE public.meeting_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  total_words INTEGER DEFAULT 0,
  average_sentence_length DECIMAL DEFAULT 0,
  questions_asked INTEGER DEFAULT 0,
  action_items_identified INTEGER DEFAULT 0,
  next_steps_defined BOOLEAN DEFAULT false,
  objections_handled INTEGER DEFAULT 0,
  decision_points INTEGER DEFAULT 0,
  follow_up_scheduled BOOLEAN DEFAULT false,
  agenda_followed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.business_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playbook_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for business_units
CREATE POLICY "Anyone can view business units" ON public.business_units FOR SELECT USING (true);
CREATE POLICY "Admins can modify business units" ON public.business_units FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Create RLS policies for playbook_rules  
CREATE POLICY "Anyone can view playbook rules" ON public.playbook_rules FOR SELECT USING (true);
CREATE POLICY "Admins can modify playbook rules" ON public.playbook_rules FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Create RLS policies for meeting_keywords
CREATE POLICY "Users can view keywords for their meetings" ON public.meeting_keywords FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.meetings WHERE id = meeting_keywords.meeting_id AND user_id = auth.uid())
);
CREATE POLICY "Users can create keywords for their meetings" ON public.meeting_keywords FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.meetings WHERE id = meeting_keywords.meeting_id AND user_id = auth.uid())
);

-- Create RLS policies for meeting_analytics
CREATE POLICY "Users can view analytics for their meetings" ON public.meeting_analytics FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.meetings WHERE id = meeting_analytics.meeting_id AND user_id = auth.uid())
);
CREATE POLICY "Users can create analytics for their meetings" ON public.meeting_analytics FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.meetings WHERE id = meeting_analytics.meeting_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update analytics for their meetings" ON public.meeting_analytics FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.meetings WHERE id = meeting_analytics.meeting_id AND user_id = auth.uid())
);

-- Create indexes for performance
CREATE INDEX idx_meetings_business_unit ON public.meetings(business_unit);
CREATE INDEX idx_meetings_meeting_type ON public.meetings(meeting_type);
CREATE INDEX idx_meetings_created_at ON public.meetings(created_at);
CREATE INDEX idx_meeting_keywords_meeting_id ON public.meeting_keywords(meeting_id);
CREATE INDEX idx_meeting_keywords_keyword ON public.meeting_keywords(keyword);
CREATE INDEX idx_profiles_business_unit ON public.profiles(business_unit);

-- Create trigger for updated_at
CREATE TRIGGER update_business_units_updated_at
  BEFORE UPDATE ON public.business_units
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_playbook_rules_updated_at
  BEFORE UPDATE ON public.playbook_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_meeting_analytics_updated_at
  BEFORE UPDATE ON public.meeting_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();