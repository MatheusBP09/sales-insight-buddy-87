-- Update meetings table with new fields (if not exists)
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS business_unit TEXT;
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS organizer_name TEXT;
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS organizer_email TEXT;
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS word_count INTEGER;
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS quality_score INTEGER;
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS sentiment_score DECIMAL;
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS playbook_score DECIMAL;
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS engagement_score DECIMAL;
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS external_participant_count INTEGER DEFAULT 0;
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS total_participant_count INTEGER DEFAULT 0;

-- Update meeting_type to be text instead of enum
ALTER TABLE public.meetings ALTER COLUMN meeting_type TYPE TEXT;

-- Update profiles table with new fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_unit TEXT DEFAULT 'outros';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Create playbook rules table if not exists
CREATE TABLE IF NOT EXISTS public.playbook_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_type TEXT NOT NULL,
  rule_name TEXT NOT NULL,
  rule_description TEXT,
  keywords TEXT[] DEFAULT '{}',
  weight DECIMAL DEFAULT 1.0,
  min_score INTEGER DEFAULT 0,
  max_score INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  business_unit TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meeting keywords table if not exists
CREATE TABLE IF NOT EXISTS public.meeting_keywords (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  frequency INTEGER DEFAULT 1,
  relevance_score DECIMAL DEFAULT 0,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meeting analytics table if not exists
CREATE TABLE IF NOT EXISTS public.meeting_analytics (
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

-- Enable RLS on new tables if not already enabled
ALTER TABLE public.playbook_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies if not exists
DO $$ 
BEGIN
  -- Playbook rules policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'playbook_rules' AND policyname = 'Anyone can view playbook rules') THEN
    CREATE POLICY "Anyone can view playbook rules" ON public.playbook_rules FOR SELECT USING (true);
  END IF;
  
  -- Meeting keywords policies  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'meeting_keywords' AND policyname = 'Users can view keywords for their meetings') THEN
    CREATE POLICY "Users can view keywords for their meetings" ON public.meeting_keywords FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.meetings WHERE id = meeting_keywords.meeting_id AND user_id = auth.uid())
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'meeting_keywords' AND policyname = 'Users can create keywords for their meetings') THEN
    CREATE POLICY "Users can create keywords for their meetings" ON public.meeting_keywords FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM public.meetings WHERE id = meeting_keywords.meeting_id AND user_id = auth.uid())
    );
  END IF;

  -- Meeting analytics policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'meeting_analytics' AND policyname = 'Users can view analytics for their meetings') THEN
    CREATE POLICY "Users can view analytics for their meetings" ON public.meeting_analytics FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.meetings WHERE id = meeting_analytics.meeting_id AND user_id = auth.uid())
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'meeting_analytics' AND policyname = 'Users can create analytics for their meetings') THEN
    CREATE POLICY "Users can create analytics for their meetings" ON public.meeting_analytics FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM public.meetings WHERE id = meeting_analytics.meeting_id AND user_id = auth.uid())
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'meeting_analytics' AND policyname = 'Users can update analytics for their meetings') THEN
    CREATE POLICY "Users can update analytics for their meetings" ON public.meeting_analytics FOR UPDATE USING (
      EXISTS (SELECT 1 FROM public.meetings WHERE id = meeting_analytics.meeting_id AND user_id = auth.uid())
    );
  END IF;
END $$;

-- Create indexes for performance if not exists
CREATE INDEX IF NOT EXISTS idx_meetings_business_unit ON public.meetings(business_unit);
CREATE INDEX IF NOT EXISTS idx_meetings_meeting_type ON public.meetings(meeting_type);
CREATE INDEX IF NOT EXISTS idx_meetings_created_at ON public.meetings(created_at);
CREATE INDEX IF NOT EXISTS idx_meeting_keywords_meeting_id ON public.meeting_keywords(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_keywords_keyword ON public.meeting_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_profiles_business_unit ON public.profiles(business_unit);

-- Insert sample playbook rules
INSERT INTO public.playbook_rules (meeting_type, rule_name, rule_description, keywords, weight, business_unit) VALUES
('sales_meeting', 'Descoberta de Necessidades', 'Identificar as necessidades do cliente através de perguntas abertas', '{"necessidade", "problema", "desafio", "objetivo"}', 0.25, null),
('sales_meeting', 'Apresentação de Valor', 'Apresentar proposta de valor alinhada às necessidades', '{"solução", "benefício", "valor", "roi"}', 0.25, null),
('sales_meeting', 'Tratamento de Objeções', 'Responder adequadamente às objeções do cliente', '{"preço", "orçamento", "prazo", "concorrência"}', 0.25, null),
('sales_meeting', 'Próximos Passos', 'Definir claramente os próximos passos e cronograma', '{"próximos passos", "follow up", "prazo", "cronograma"}', 0.25, null),
('client_meeting', 'Escuta Ativa', 'Demonstrar escuta ativa das demandas do cliente', '{"entendi", "compreendo", "pode explicar", "como assim"}', 0.4, null),
('client_meeting', 'Resolução de Problemas', 'Propor soluções efetivas para os problemas apresentados', '{"solução", "resolver", "alternativa", "proposta"}', 0.4, null),
('client_meeting', 'Follow-up Definido', 'Agendar próximos contatos ou ações', '{"vamos agendar", "próximo contato", "retorno", "feedback"}', 0.2, null)
ON CONFLICT DO NOTHING;