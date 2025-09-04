export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          balance: number | null
          created_at: string
          credit_limit: number | null
          due_date: string | null
          due_day: number | null
          id: string
          name: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number | null
          created_at?: string
          credit_limit?: number | null
          due_date?: string | null
          due_day?: number | null
          id?: string
          name: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number | null
          created_at?: string
          credit_limit?: number | null
          due_date?: string | null
          due_day?: number | null
          id?: string
          name?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      business_unit_agents: {
        Row: {
          bu_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          webhook_url: string
        }
        Insert: {
          bu_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          webhook_url: string
        }
        Update: {
          bu_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_unit_agents_bu_id_fkey"
            columns: ["bu_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
        ]
      }
      business_units: {
        Row: {
          category: string | null
          color_class: string | null
          created_at: string
          description: string | null
          icon_url: string | null
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          color_class?: string | null
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id: string
          name: string
        }
        Update: {
          category?: string | null
          color_class?: string | null
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      course_progress: {
        Row: {
          completed_at: string
          created_at: string
          id: string
          module_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          id?: string
          module_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          id?: string
          module_id?: string
          user_id?: string
        }
        Relationships: []
      }
      course_videos: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number | null
          embed_code: string | null
          external_url: string | null
          id: string
          module_category: string
          platform_source: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_order: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          embed_code?: string | null
          external_url?: string | null
          id?: string
          module_category: string
          platform_source?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_order?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          embed_code?: string | null
          external_url?: string | null
          id?: string
          module_category?: string
          platform_source?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_order?: number | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          content: string | null
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      family_members: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      installments: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          id: string
          installment_number: number
          status: string
          transaction_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date: string
          id?: string
          installment_number: number
          status?: string
          transaction_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          id?: string
          installment_number?: number
          status?: string
          transaction_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "installments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_insights: {
        Row: {
          client_objections: string[] | null
          commitments: string[] | null
          created_at: string
          id: string
          interest_score: number | null
          keywords: string[] | null
          meeting_id: string
          next_steps: string[] | null
          opportunities: string[] | null
          pain_points: string[] | null
          risks: string[] | null
          sentiment: string | null
          updated_at: string
          value_proposition: string | null
        }
        Insert: {
          client_objections?: string[] | null
          commitments?: string[] | null
          created_at?: string
          id?: string
          interest_score?: number | null
          keywords?: string[] | null
          meeting_id: string
          next_steps?: string[] | null
          opportunities?: string[] | null
          pain_points?: string[] | null
          risks?: string[] | null
          sentiment?: string | null
          updated_at?: string
          value_proposition?: string | null
        }
        Update: {
          client_objections?: string[] | null
          commitments?: string[] | null
          created_at?: string
          id?: string
          interest_score?: number | null
          keywords?: string[] | null
          meeting_id?: string
          next_steps?: string[] | null
          opportunities?: string[] | null
          pain_points?: string[] | null
          risks?: string[] | null
          sentiment?: string | null
          updated_at?: string
          value_proposition?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_insights_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_participants: {
        Row: {
          company: string | null
          created_at: string
          email: string | null
          id: string
          meeting_id: string
          name: string
          role: string | null
          speaking_time_seconds: number | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          meeting_id: string
          name: string
          role?: string | null
          speaking_time_seconds?: number | null
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          meeting_id?: string
          name?: string
          role?: string | null
          speaking_time_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_participants_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          attachment_docx_name: string | null
          attachment_docx_url: string | null
          attachment_vtt_name: string | null
          attachment_vtt_url: string | null
          client_company: string | null
          corrected_transcript: string | null
          created_at: string
          duration_seconds: number | null
          end_time: string | null
          executive_summary: string | null
          external_meeting_id: string | null
          id: string
          join_url: string | null
          meeting_type: string
          processed_at: string | null
          raw_content: string | null
          start_time: string | null
          status: string
          title: string
          updated_at: string
          user_email: string | null
          user_id: string
        }
        Insert: {
          attachment_docx_name?: string | null
          attachment_docx_url?: string | null
          attachment_vtt_name?: string | null
          attachment_vtt_url?: string | null
          client_company?: string | null
          corrected_transcript?: string | null
          created_at?: string
          duration_seconds?: number | null
          end_time?: string | null
          executive_summary?: string | null
          external_meeting_id?: string | null
          id?: string
          join_url?: string | null
          meeting_type?: string
          processed_at?: string | null
          raw_content?: string | null
          start_time?: string | null
          status?: string
          title: string
          updated_at?: string
          user_email?: string | null
          user_id: string
        }
        Update: {
          attachment_docx_name?: string | null
          attachment_docx_url?: string | null
          attachment_vtt_name?: string | null
          attachment_vtt_url?: string | null
          client_company?: string | null
          corrected_transcript?: string | null
          created_at?: string
          duration_seconds?: number | null
          end_time?: string | null
          executive_summary?: string | null
          external_meeting_id?: string | null
          id?: string
          join_url?: string | null
          meeting_type?: string
          processed_at?: string | null
          raw_content?: string | null
          start_time?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_email?: string | null
          user_id?: string
        }
        Relationships: []
      }
      personal_notes: {
        Row: {
          content: string | null
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recordings: {
        Row: {
          created_at: string
          duration_seconds: number | null
          file_path: string | null
          file_size: number | null
          format: string | null
          id: string
          meeting_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          file_path?: string | null
          file_size?: number | null
          format?: string | null
          id?: string
          meeting_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          file_path?: string | null
          file_size?: number | null
          format?: string | null
          id?: string
          meeting_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recordings_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_log: {
        Row: {
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string | null
          category_id: string | null
          created_at: string
          description: string
          id: string
          installment_count: number | null
          installment_start_date: string | null
          is_installment: boolean | null
          is_recurring: boolean | null
          payer_member_id: string | null
          payment_method: string | null
          recurrence_end_date: string | null
          recurrence_type: string | null
          responsible_member_id: string | null
          total_amount: number
          transaction_date: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          category_id?: string | null
          created_at?: string
          description: string
          id?: string
          installment_count?: number | null
          installment_start_date?: string | null
          is_installment?: boolean | null
          is_recurring?: boolean | null
          payer_member_id?: string | null
          payment_method?: string | null
          recurrence_end_date?: string | null
          recurrence_type?: string | null
          responsible_member_id?: string | null
          total_amount: number
          transaction_date: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          category_id?: string | null
          created_at?: string
          description?: string
          id?: string
          installment_count?: number | null
          installment_start_date?: string | null
          is_installment?: boolean | null
          is_recurring?: boolean | null
          payer_member_id?: string | null
          payment_method?: string | null
          recurrence_end_date?: string | null
          recurrence_type?: string | null
          responsible_member_id?: string | null
          total_amount?: number
          transaction_date?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_payer_member_id_fkey"
            columns: ["payer_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_responsible_member_id_fkey"
            columns: ["responsible_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      transcriptions: {
        Row: {
          confidence_score: number | null
          content: string | null
          created_at: string
          id: string
          language: string | null
          recording_id: string
          status: string
          updated_at: string
        }
        Insert: {
          confidence_score?: number | null
          content?: string | null
          created_at?: string
          id?: string
          language?: string | null
          recording_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          confidence_score?: number | null
          content?: string | null
          created_at?: string
          id?: string
          language?: string | null
          recording_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transcriptions_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: false
            referencedRelation: "recordings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_workflows_created: {
        Row: {
          created_at: string
          file_name: string | null
          id: string
          updated_at: string
          user_id: string
          video_id: string
          workflow_json: Json | null
          workflows_count: number
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
          video_id: string
          workflow_json?: Json | null
          workflows_count?: number
        }
        Update: {
          created_at?: string
          file_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          video_id?: string
          workflow_json?: Json | null
          workflows_count?: number
        }
        Relationships: []
      }
      workflow_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      workflow_documentation: {
        Row: {
          content: string | null
          created_at: string
          id: string
          prerequisites: string[] | null
          setup_instructions: string | null
          updated_at: string
          workflow_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          prerequisites?: string[] | null
          setup_instructions?: string | null
          updated_at?: string
          workflow_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          prerequisites?: string[] | null
          setup_instructions?: string | null
          updated_at?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_documentation_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: true
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_favorites: {
        Row: {
          created_at: string
          id: string
          user_id: string
          workflow_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          workflow_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_favorites_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_files: {
        Row: {
          content: Json
          created_at: string
          file_size: number | null
          id: string
          workflow_id: string
        }
        Insert: {
          content: Json
          created_at?: string
          file_size?: number | null
          id?: string
          workflow_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          file_size?: number | null
          id?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_files_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: true
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          author: string | null
          category: string | null
          complexity_level: string | null
          created_at: string
          description: string | null
          file_path: string
          github_url: string | null
          id: string
          is_active: boolean | null
          n8n_version: string | null
          name: string
          node_count: number | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          author?: string | null
          category?: string | null
          complexity_level?: string | null
          created_at?: string
          description?: string | null
          file_path: string
          github_url?: string | null
          id?: string
          is_active?: boolean | null
          n8n_version?: string | null
          name: string
          node_count?: number | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          author?: string | null
          category?: string | null
          complexity_level?: string | null
          created_at?: string
          description?: string | null
          file_path?: string
          github_url?: string | null
          id?: string
          is_active?: boolean | null
          n8n_version?: string | null
          name?: string
          node_count?: number | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_workflow_documentation: {
        Args: { workflow_content: Json }
        Returns: string
      }
      get_course_leaderboard: {
        Args: Record<PropertyKey, never>
        Returns: {
          display_name: string
          rank: number
          score: number
          user_id: string
        }[]
      }
      get_user_leaderboard_position: {
        Args: { target_user_id: string }
        Returns: {
          course_rank: number
          course_score: number
          workflow_rank: number
          workflow_score: number
        }[]
      }
      get_workflow_leaderboard: {
        Args: Record<PropertyKey, never>
        Returns: {
          display_name: string
          rank: number
          score: number
          user_id: string
        }[]
      }
      log_security_event: {
        Args: { details?: Json; event_type: string; user_id?: string }
        Returns: undefined
      }
      validate_password_strength: {
        Args: { password: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
