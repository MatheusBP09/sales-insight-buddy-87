import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    console.log('Processing webhook request...');
    
    const payload = await req.json();
    console.log('Received payload:', JSON.stringify(payload, null, 2));

    // Extract data from webhook payload
    const {
      id: externalMeetingId,
      user_email,
      meeting_id,
      subject,
      start_time,
      end_time,
      join_url,
      participants,
      raw_content,
      corrected_transcript,
      executive_summary,
      processed_at
    } = payload.body;

    // Find user by email to get user_id
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('email', user_email)
      .limit(1);

    if (!profiles || profiles.length === 0) {
      console.error('User not found for email:', user_email);
      return new Response(
        JSON.stringify({ error: 'User not found', email: user_email }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = profiles[0].user_id;
    console.log('Found user:', userId, 'for email:', user_email);

    // Calculate duration in seconds
    const startDate = new Date(start_time);
    const endDate = new Date(end_time);
    const durationSeconds = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);

    // Create or update meeting record
    const meetingData = {
      user_id: userId,
      user_email,
      external_meeting_id: externalMeetingId,
      title: subject,
      meeting_type: 'sales_call',
      start_time,
      end_time,
      join_url,
      status: 'completed',
      duration_seconds: durationSeconds,
      raw_content,
      corrected_transcript,
      executive_summary,
      processed_at: new Date().toISOString()
    };

    console.log('Creating meeting with data:', meetingData);

    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .upsert(meetingData, { 
        onConflict: 'external_meeting_id',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (meetingError) {
      console.error('Error creating meeting:', meetingError);
      throw meetingError;
    }

    console.log('Meeting created/updated:', meeting.id);

    // Process participants
    if (participants && participants.length > 0) {
      const participantRecords = participants.map((email: string) => ({
        meeting_id: meeting.id,
        name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        email,
        company: email.split('@')[1],
        role: email === user_email ? 'host' : 'participant'
      }));

      const { error: participantError } = await supabase
        .from('meeting_participants')
        .upsert(participantRecords, { 
          onConflict: 'meeting_id,email',
          ignoreDuplicates: false 
        });

      if (participantError) {
        console.error('Error creating participants:', participantError);
        // Don't fail the whole process for participant errors
      } else {
        console.log('Participants created:', participantRecords.length);
      }
    }

    // Generate insights from executive summary
    if (executive_summary) {
      try {
        // Extract insights from executive summary using simple text parsing
        const insights = {
          meeting_id: meeting.id,
          sentiment: 'positive', // Default for now
          interest_score: 75, // Default score
          keywords: extractKeywords(executive_summary),
          opportunities: extractListFromText(executive_summary, ['oportunidade', 'opportunity', 'possibilidade']),
          commitments: extractListFromText(executive_summary, ['compromisso', 'commitment', 'decisão', 'ação']),
          next_steps: extractListFromText(executive_summary, ['próximo passo', 'next step', 'ação', 'seguimento']),
          pain_points: extractListFromText(executive_summary, ['problema', 'pain point', 'dificuldade', 'desafio']),
          risks: extractListFromText(executive_summary, ['risco', 'risk', 'preocupação', 'obstáculo']),
          value_proposition: extractValueProposition(executive_summary)
        };

        const { error: insightsError } = await supabase
          .from('meeting_insights')
          .upsert(insights, { 
            onConflict: 'meeting_id',
            ignoreDuplicates: false 
          });

        if (insightsError) {
          console.error('Error creating insights:', insightsError);
        } else {
          console.log('Insights created for meeting:', meeting.id);
        }
      } catch (insightError) {
        console.error('Error processing insights:', insightError);
        // Don't fail the whole process for insight errors
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        meeting_id: meeting.id,
        message: 'Meeting processed successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-meeting-webhook:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Helper functions for text analysis
function extractKeywords(text: string): string[] {
  const keywords = [];
  const commonTerms = [
    'vendas', 'consórcio', 'tech', 'desenvolvimento', 'sistema',
    'cadastro', 'cliente', 'processo', 'demonstração', 'reunião'
  ];
  
  const lowerText = text.toLowerCase();
  for (const term of commonTerms) {
    if (lowerText.includes(term)) {
      keywords.push(term);
    }
  }
  
  return keywords;
}

function extractListFromText(text: string, keywords: string[]): string[] {
  const results = [];
  const sentences = text.split(/[.!?]+/);
  
  for (const sentence of sentences) {
    const lowerSentence = sentence.toLowerCase();
    for (const keyword of keywords) {
      if (lowerSentence.includes(keyword.toLowerCase())) {
        results.push(sentence.trim());
        break;
      }
    }
  }
  
  return results.slice(0, 3); // Limit to 3 items
}

function extractValueProposition(text: string): string {
  const sentences = text.split(/[.!?]+/);
  
  // Look for sentences containing value-related terms
  const valueKeywords = ['benefício', 'vantagem', 'valor', 'solução', 'resultado'];
  
  for (const sentence of sentences) {
    const lowerSentence = sentence.toLowerCase();
    for (const keyword of valueKeywords) {
      if (lowerSentence.includes(keyword)) {
        return sentence.trim();
      }
    }
  }
  
  return 'Proposta de valor a ser definida';
}