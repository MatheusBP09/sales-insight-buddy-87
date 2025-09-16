import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TranscriptSegment {
  start: string;
  end: string;
  speaker: string;
  text: string;
}

interface MeetingPayload {
  meeting_id: string;
  title: string;
  start_time: string;
  end_time: string;
  organizer: string;
  attendees: string[];
  transcript_segments: TranscriptSegment[];
  transcript_text: string;
  transcript_for_llm?: string;
  source?: string;
  raw_len?: number;
  meta_headers?: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== INGEST MEETING DATA WEBHOOK ===');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request body
    const payload = await req.json();
    console.log('=== RAW PAYLOAD RECEIVED ===');
    console.log('Payload type:', typeof payload);
    console.log('Is array:', Array.isArray(payload));
    console.log('Payload content:', JSON.stringify(payload, null, 2));
    console.log('=== END RAW PAYLOAD ===');

    // Handle array payload (from n8n)
    const meetingData: MeetingPayload = Array.isArray(payload) ? payload[0] : payload;
    console.log('=== EXTRACTED MEETING DATA ===');
    console.log('Meeting data:', JSON.stringify(meetingData, null, 2));
    console.log('Available fields:', Object.keys(meetingData || {}));
    console.log('=== END MEETING DATA ===');
    
    // Validate required fields
    const requiredFields = ['meeting_id', 'title', 'organizer', 'attendees', 'transcript_segments'];
    for (const field of requiredFields) {
      if (!meetingData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    console.log('Processing meeting:', meetingData.meeting_id);

    // Extract organizer email and find/create user
    const organizerEmail = meetingData.organizer;
    console.log('Looking up organizer:', organizerEmail);

    // Try to find existing user by email in profiles
    let { data: existingProfile } = await supabase
      .from('profiles')
      .select('user_id, email, full_name')
      .eq('email', organizerEmail)
      .single();

    let userId = existingProfile?.user_id;

    // If user doesn't exist, create temporary profile
    if (!existingProfile) {
      console.log('Creating temporary profile for unregistered user:', organizerEmail);
      
      // Generate a UUID for temporary user
      const tempUserId = crypto.randomUUID();
      
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: tempUserId,
          email: organizerEmail,
          full_name: organizerEmail.split('@')[0], // Use email prefix as name
          role: 'temp_user'
        });

      if (profileError) {
        console.error('Error creating temporary profile:', profileError);
        // For now, continue without creating profile - just use email
        userId = tempUserId;
      } else {
        console.log('Created temporary profile with ID:', tempUserId);
        userId = tempUserId;
      }
    }

    // Parse start/end times
    const startTime = meetingData.start_time ? new Date(meetingData.start_time) : null;
    const endTime = meetingData.end_time ? new Date(meetingData.end_time) : null;
    const duration = startTime && endTime ? Math.round((endTime.getTime() - startTime.getTime()) / 1000) : null;

    // Create meeting record
    const meetingRecord = {
      id: crypto.randomUUID(), // Generate new UUID for internal use
      user_id: userId,
      external_meeting_id: meetingData.meeting_id,
      title: meetingData.title,
      start_time: startTime?.toISOString(),
      end_time: endTime?.toISOString(),
      duration_seconds: duration,
      organizer_email: organizerEmail,
      organizer_name: organizerEmail.split('@')[0],
      raw_content: meetingData.transcript_segments?.map(s => 
        `${s.start} --> ${s.end}\n<v ${s.speaker}>${s.text}</v>`
      ).join('\n\n') || '',
      corrected_transcript: meetingData.transcript_text || '',
      total_participant_count: meetingData.attendees?.length || 0,
      external_participant_count: meetingData.attendees?.length || 0,
      status: 'completed',
      meeting_type: 'teams_meeting',
      business_unit: meetingData.source || 'teams_daily_processor_raw_v2',
      processed_at: new Date().toISOString()
    };

    console.log('Inserting meeting record:', meetingRecord.id);
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .insert(meetingRecord)
      .select()
      .single();

    if (meetingError) {
      console.error('Error inserting meeting:', meetingError);
      throw new Error(`Failed to create meeting: ${meetingError.message}`);
    }

    console.log('Meeting created successfully:', meeting.id);

    // Process participants
    if (meetingData.attendees && meetingData.attendees.length > 0) {
      const participants = meetingData.attendees.map(name => ({
        meeting_id: meeting.id,
        name: name.trim(),
        email: name.includes('@') ? name : null,
        role: name === organizerEmail ? 'organizer' : 'attendee',
        speaking_time_seconds: 0 // Will be calculated if needed
      }));

      console.log('Inserting participants:', participants.length);
      const { error: participantsError } = await supabase
        .from('meeting_participants')
        .insert(participants);

      if (participantsError) {
        console.error('Error inserting participants:', participantsError);
        // Continue even if participants fail
      } else {
        console.log('Participants inserted successfully');
      }
    }

    // Calculate speaking time per participant from segments
    if (meetingData.transcript_segments && meetingData.transcript_segments.length > 0) {
      const speakingTimes: Record<string, number> = {};
      
      for (const segment of meetingData.transcript_segments) {
        const startSeconds = parseTimeToSeconds(segment.start);
        const endSeconds = parseTimeToSeconds(segment.end);
        const duration = Math.max(0, endSeconds - startSeconds);
        
        speakingTimes[segment.speaker] = (speakingTimes[segment.speaker] || 0) + duration;
      }

      // Update participant speaking times
      for (const [speaker, speakingTime] of Object.entries(speakingTimes)) {
        await supabase
          .from('meeting_participants')
          .update({ speaking_time_seconds: Math.round(speakingTime) })
          .eq('meeting_id', meeting.id)
          .eq('name', speaker);
      }

      console.log('Updated speaking times for participants');
    }

    console.log('Meeting processing completed successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      meeting_id: meeting.id,
      external_meeting_id: meetingData.meeting_id,
      message: 'Meeting data ingested successfully' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing meeting webhook:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to parse time strings like "00:04:25.029" to seconds
function parseTimeToSeconds(timeStr: string): number {
  const parts = timeStr.split(':');
  if (parts.length !== 3) return 0;
  
  const hours = parseFloat(parts[0]) || 0;
  const minutes = parseFloat(parts[1]) || 0;
  const seconds = parseFloat(parts[2]) || 0;
  
  return hours * 3600 + minutes * 60 + seconds;
}