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

    // Extract meeting data from N8N webhook format
    let meetingData: any;
    
    if (payload.WEBHOOK_BODY) {
      // N8N webhook format - extract from WEBHOOK_BODY
      console.log('=== N8N WEBHOOK FORMAT DETECTED ===');
      const webhookBody = payload.WEBHOOK_BODY;
      
      meetingData = {
        meeting_id: webhookBody.online_meeting_id,
        title: webhookBody.event_subject,
        start_time: webhookBody.event_start,
        end_time: webhookBody.event_end,
        organizer: webhookBody.user_email,
        attendees: webhookBody.participants || [],
        transcript_segments: [], // Will be parsed from raw_content if available
        transcript_text: '', // Will be extracted from raw_content
        transcript_for_llm: '',
        source: webhookBody.type || 'n8n_webhook',
        raw_len: webhookBody.raw_content?.length || 0,
        meta_headers: payload.WEBHOOK_HEADERS
      };
      
      // Parse transcript segments from raw_content if available
      if (webhookBody.raw_content) {
        meetingData.transcript_text = webhookBody.raw_content;
        meetingData.transcript_for_llm = webhookBody.raw_content;
        
        // Parse VTT format to extract segments
        const segments = parseVTTContent(webhookBody.raw_content);
        meetingData.transcript_segments = segments;
      }
      
      console.log('Extracted meeting data from N8N webhook:', JSON.stringify(meetingData, null, 2));
    } else {
      // Direct format or array format
      meetingData = Array.isArray(payload) ? payload[0] : payload;
      console.log('=== DIRECT FORMAT ===');
      console.log('Meeting data:', JSON.stringify(meetingData, null, 2));
    }

    console.log('=== FINAL MEETING DATA ===');
    console.log('Available fields:', Object.keys(meetingData || {}));
    console.log('=== END MEETING DATA ===');
    
    // Validate required fields
    const requiredFields = ['meeting_id', 'title', 'organizer'];
    for (const field of requiredFields) {
      if (!meetingData[field]) {
        console.error(`Missing required field: ${field}`);
        console.error('Available fields:', Object.keys(meetingData || {}));
        throw new Error(`Missing required field: ${field}`);
      }
    }

    console.log('Processing meeting:', meetingData.meeting_id);
    const organizerEmail = meetingData.organizer;
    console.log('Looking up organizer:', organizerEmail);

    // Try to find existing user by email in profiles
    let { data: existingProfile } = await supabase
      .from('profiles')
      .select('user_id, email, full_name')
      .eq('email', organizerEmail)
      .single();

    let userId = existingProfile?.user_id;

    // If user doesn't exist, try to find any authenticated user to associate the meeting with
    if (!existingProfile) {
      console.log('Organizer not found in profiles, looking for any authenticated user to associate meeting');
      
      // Try to get any existing user from profiles as fallback
      const { data: fallbackProfile } = await supabase
        .from('profiles')
        .select('user_id, email, full_name')
        .limit(1)
        .single();

      if (fallbackProfile) {
        console.log('Using fallback user for meeting:', fallbackProfile.email);
        userId = fallbackProfile.user_id;
      } else {
        console.error('No authenticated users found in profiles table');
        throw new Error('Cannot associate meeting with any user - no profiles found');
      }
    }

    // Parse start/end times
    const startTime = meetingData.start_time ? new Date(meetingData.start_time) : null;
    const endTime = meetingData.end_time ? new Date(meetingData.end_time) : null;
    const duration = startTime && endTime ? Math.round((endTime.getTime() - startTime.getTime()) / 1000) : null;

    // Check if meeting already exists by external_meeting_id
    const { data: existingMeeting } = await supabase
      .from('meetings')
      .select('id, user_id')
      .eq('external_meeting_id', meetingData.meeting_id)
      .maybeSingle();

    let meeting;
    
    if (existingMeeting) {
      // Update existing meeting
      console.log('Meeting already exists, updating:', existingMeeting.id);
      const { data: updatedMeeting, error: updateError } = await supabase
        .from('meetings')
        .update({
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
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingMeeting.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating meeting:', updateError);
        throw new Error(`Failed to update meeting: ${updateError.message}`);
      }
      meeting = updatedMeeting;
      console.log('Meeting updated successfully:', meeting.id);
    } else {
      // Create new meeting record
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

      console.log('Inserting new meeting record:', meetingRecord.id);
      const { data: newMeeting, error: insertError } = await supabase
        .from('meetings')
        .insert(meetingRecord)
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting meeting:', insertError);
        throw new Error(`Failed to create meeting: ${insertError.message}`);
      }
      meeting = newMeeting;
      console.log('Meeting created successfully:', meeting.id);
    }

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

// Helper function to parse VTT content into transcript segments
function parseVTTContent(vttContent: string): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];
  
  if (!vttContent) return segments;
  
  // Split by empty lines to get individual segments
  const lines = vttContent.split('\n');
  let currentSegment: Partial<TranscriptSegment> = {};
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip WEBVTT header and empty lines
    if (!line || line === 'WEBVTT') continue;
    
    // Check if line contains timestamp (format: 00:00:07.756 --> 00:00:10.996)
    if (line.includes('-->')) {
      const [start, end] = line.split('-->').map(t => t.trim());
      currentSegment.start = start;
      currentSegment.end = end;
    }
    // Check if line contains speaker and text (format: <v Speaker>Text</v>)
    else if (line.startsWith('<v ') && line.endsWith('</v>')) {
      const match = line.match(/<v ([^>]+)>(.+)<\/v>/);
      if (match) {
        currentSegment.speaker = match[1].trim();
        currentSegment.text = match[2].trim();
        
        // If we have all required fields, add to segments
        if (currentSegment.start && currentSegment.end && currentSegment.speaker && currentSegment.text) {
          segments.push(currentSegment as TranscriptSegment);
          currentSegment = {};
        }
      }
    }
  }
  
  return segments;
}