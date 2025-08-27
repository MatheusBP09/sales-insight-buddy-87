import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const analyzeTranscription = async (transcription: string) => {
  const prompt = `
Analise a seguinte transcrição de uma reunião de vendas em português e extraia informações estruturadas:

TRANSCRIÇÃO:
${transcription}

Forneça uma análise JSON com as seguintes informações:
{
  "client_objections": ["objeção 1", "objeção 2"],
  "commitments": ["compromisso 1", "compromisso 2"],
  "next_steps": ["próximo passo 1", "próximo passo 2"],
  "pain_points": ["dor 1", "dor 2"],
  "value_proposition": "resumo da proposta de valor apresentada",
  "interest_score": número de 0-100 baseado no interesse demonstrado,
  "keywords": ["palavra-chave 1", "palavra-chave 2"],
  "sentiment": "positive", "negative", ou "neutral",
  "opportunities": ["oportunidade 1", "oportunidade 2"],
  "risks": ["risco 1", "risco 2"]
}

Responda apenas com o JSON válido, sem texto adicional.
`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Você é um analista especialista em vendas. Analise transcrições de reuniões e extraia insights relevantes em formato JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI API error:', errorText);
    throw new Error(`OpenAI API error: ${errorText}`);
  }

  const result = await response.json();
  const content = result.choices[0].message.content;
  
  try {
    return JSON.parse(content);
  } catch (e) {
    console.error('Failed to parse AI response:', content);
    // Return default structure if parsing fails
    return {
      client_objections: [],
      commitments: [],
      next_steps: [],
      pain_points: [],
      value_proposition: "Análise indisponível",
      interest_score: 50,
      keywords: [],
      sentiment: "neutral",
      opportunities: [],
      risks: []
    };
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { meetingId, transcriptionId } = await req.json();
    
    if (!meetingId) {
      throw new Error('Meeting ID is required');
    }

    console.log('Analyzing meeting:', meetingId);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get transcription content
    let transcriptionContent = '';
    
    if (transcriptionId) {
      const { data: transcription, error: transcriptionError } = await supabase
        .from('transcriptions')
        .select('content')
        .eq('id', transcriptionId)
        .single();
        
      if (transcriptionError) {
        console.error('Error fetching transcription:', transcriptionError);
        throw transcriptionError;
      }
      
      transcriptionContent = transcription.content || '';
    } else {
      // Get all transcriptions for this meeting
      const { data: recordings } = await supabase
        .from('recordings')
        .select('transcriptions(content)')
        .eq('meeting_id', meetingId);
        
      transcriptionContent = recordings
        ?.map(r => r.transcriptions?.map(t => t.content).join(' '))
        .join(' ') || '';
    }

    if (!transcriptionContent.trim()) {
      throw new Error('No transcription content found for analysis');
    }

    console.log('Transcription content length:', transcriptionContent.length);

    // Analyze with AI
    const insights = await analyzeTranscription(transcriptionContent);
    console.log('AI analysis completed');

    // Check if insights already exist
    const { data: existingInsights } = await supabase
      .from('meeting_insights')
      .select('id')
      .eq('meeting_id', meetingId)
      .single();

    let savedInsights;
    
    if (existingInsights) {
      // Update existing insights
      const { data, error } = await supabase
        .from('meeting_insights')
        .update({
          client_objections: insights.client_objections,
          commitments: insights.commitments,
          next_steps: insights.next_steps,
          pain_points: insights.pain_points,
          value_proposition: insights.value_proposition,
          interest_score: insights.interest_score,
          keywords: insights.keywords,
          sentiment: insights.sentiment,
          opportunities: insights.opportunities,
          risks: insights.risks,
        })
        .eq('meeting_id', meetingId)
        .select()
        .single();
        
      if (error) {
        console.error('Error updating insights:', error);
        throw error;
      }
      
      savedInsights = data;
    } else {
      // Create new insights
      const { data, error } = await supabase
        .from('meeting_insights')
        .insert({
          meeting_id: meetingId,
          client_objections: insights.client_objections,
          commitments: insights.commitments,
          next_steps: insights.next_steps,
          pain_points: insights.pain_points,
          value_proposition: insights.value_proposition,
          interest_score: insights.interest_score,
          keywords: insights.keywords,
          sentiment: insights.sentiment,
          opportunities: insights.opportunities,
          risks: insights.risks,
        })
        .select()
        .single();
        
      if (error) {
        console.error('Error creating insights:', error);
        throw error;
      }
      
      savedInsights = data;
    }

    // Update meeting status to completed
    await supabase
      .from('meetings')
      .update({ status: 'completed' })
      .eq('id', meetingId);

    console.log('Meeting analysis completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        insights: savedInsights
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-meeting function:', error);

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});