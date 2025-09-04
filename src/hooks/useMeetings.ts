import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface Meeting {
  id: string;
  title: string;
  client_company?: string;
  meeting_type: string;
  status: string;
  start_time?: string;
  end_time?: string;
  duration_seconds?: number;
  created_at: string;
  external_meeting_id?: string;
  user_email?: string;
  join_url?: string;
  raw_content?: string;
  corrected_transcript?: string;
  executive_summary?: string;
  processed_at?: string;
  attachment_docx_url?: string;
  attachment_vtt_url?: string;
  attachment_docx_name?: string;
  attachment_vtt_name?: string;
  meeting_insights?: Array<{
    interest_score?: number;
    sentiment?: string;
    keywords?: string[];
    opportunities?: string[];
    commitments?: string[];
    next_steps?: string[];
    pain_points?: string[];
    risks?: string[];
    value_proposition?: string;
  }>;
  meeting_participants?: Array<{
    name: string;
    role?: string;
    company?: string;
    email?: string;
  }>;
}

interface MeetingStats {
  totalMeetings: number;
  averageScore: number;
  conversionRate: number;
  averageDuration: number;
}

export const useMeetings = () => {
  const { toast } = useToast();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [stats, setStats] = useState<MeetingStats>({
    totalMeetings: 0,
    averageScore: 0,
    conversionRate: 0,
    averageDuration: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Fetch meetings with insights and participants
      const { data: meetingsData, error: meetingsError } = await supabase
        .from('meetings')
        .select(`
          *,
          meeting_insights (
            interest_score,
            sentiment,
            keywords,
            opportunities,
            commitments,
            next_steps,
            pain_points,
            risks,
            value_proposition
          ),
          meeting_participants (
            name,
            role,
            company,
            email
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (meetingsError) {
        console.error('Error fetching meetings:', meetingsError);
        throw meetingsError;
      }

      setMeetings(meetingsData || []);

      // Calculate stats
      const totalMeetings = meetingsData?.length || 0;
      const completedMeetings = meetingsData?.filter(m => m.status === 'completed') || [];
      
      const averageScore = completedMeetings.length > 0 
        ? Math.round(
            completedMeetings.reduce((sum, m) => 
              sum + (m.meeting_insights?.[0]?.interest_score || 0), 0
            ) / completedMeetings.length
          )
        : 0;

      const conversionRate = totalMeetings > 0 
        ? Math.round((completedMeetings.length / totalMeetings) * 100)
        : 0;

      const averageDuration = completedMeetings.length > 0
        ? Math.round(
            completedMeetings.reduce((sum, m) => 
              sum + (m.duration_seconds || 0), 0
            ) / completedMeetings.length / 60 // Convert to minutes
          )
        : 0;

      setStats({
        totalMeetings,
        averageScore,
        conversionRate,
        averageDuration
      });

      setError(null);
    } catch (error) {
      console.error('Error in fetchMeetings:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch meetings');
      toast({
        title: "Erro",
        description: "Falha ao carregar reuniões",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createMeeting = async (
    title: string, 
    clientCompany?: string, 
    meetingType: string = 'sales_call',
    additionalData?: {
      start_time?: string;
      end_time?: string;
      join_url?: string;
      executive_summary?: string;
      status?: string;
      attachment_docx_url?: string;
      attachment_vtt_url?: string;
      attachment_docx_name?: string;
      attachment_vtt_name?: string;
    }
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const meetingData = {
        user_id: user.id,
        title: title.trim(),
        client_company: clientCompany?.trim() || null,
        meeting_type: meetingType,
        status: additionalData?.status || 'scheduled',
        start_time: additionalData?.start_time || new Date().toISOString(),
        ...additionalData
      };

      const { data: meeting, error } = await supabase
        .from('meetings')
        .insert(meetingData)
        .select()
        .single();

      if (error) {
        console.error('Error creating meeting:', error);
        throw error;
      }

      console.log('Meeting created:', meeting.id);
      
      // Refresh meetings list
      await fetchMeetings();
      
      toast({
        title: "Reunião criada",
        description: "Nova reunião foi criada com sucesso"
      });

      return meeting;
    } catch (error) {
      console.error('Error in createMeeting:', error);
      toast({
        title: "Erro",
        description: "Falha ao criar reunião",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateMeeting = async (meetingId: string, updates: Partial<Meeting>) => {
    try {
      const { error } = await supabase
        .from('meetings')
        .update(updates)
        .eq('id', meetingId);

      if (error) {
        console.error('Error updating meeting:', error);
        throw error;
      }

      // Refresh meetings list
      await fetchMeetings();
    } catch (error) {
      console.error('Error in updateMeeting:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar reunião",
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteMeeting = async (meetingId: string) => {
    try {
      const { error } = await supabase
        .from('meetings')
        .delete()
        .eq('id', meetingId);

      if (error) {
        console.error('Error deleting meeting:', error);
        throw error;
      }

      // Refresh meetings list
      await fetchMeetings();
      
      toast({
        title: "Reunião excluída",
        description: "Reunião foi excluída com sucesso"
      });
    } catch (error) {
      console.error('Error in deleteMeeting:', error);
      toast({
        title: "Erro",
        description: "Falha ao excluir reunião",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Subscribe to real-time updates
  useEffect(() => {
    fetchMeetings();

    const channel = supabase
      .channel('meetings-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'meetings' 
        }, 
        () => {
          console.log('Meeting data changed, refreshing...');
          fetchMeetings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    meetings,
    stats,
    loading,
    error,
    fetchMeetings,
    createMeeting,
    updateMeeting,
    deleteMeeting
  };
};