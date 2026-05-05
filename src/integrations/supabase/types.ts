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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      approval_workflows: {
        Row: {
          actor_id: string
          created_at: string
          deadline: string | null
          entity_id: string
          entity_type: string
          from_status: string | null
          id: string
          organization_id: string
          project_id: string | null
          reason: string | null
          to_status: string
        }
        Insert: {
          actor_id: string
          created_at?: string
          deadline?: string | null
          entity_id: string
          entity_type: string
          from_status?: string | null
          id?: string
          organization_id: string
          project_id?: string | null
          reason?: string | null
          to_status: string
        }
        Update: {
          actor_id?: string
          created_at?: string
          deadline?: string | null
          entity_id?: string
          entity_type?: string
          from_status?: string | null
          id?: string
          organization_id?: string
          project_id?: string | null
          reason?: string | null
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_workflows_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_workflows_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          project_id: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          project_id?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          project_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          project_id: string
          report_index: number
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          project_id: string
          report_index?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          project_id?: string
          report_index?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exchange_rates: {
        Row: {
          created_at: string
          created_by: string | null
          from_currency: string
          id: string
          organization_id: string
          rate: number
          rate_date: string
          source: string
          to_currency: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          from_currency: string
          id?: string
          organization_id: string
          rate: number
          rate_date?: string
          source?: string
          to_currency: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          from_currency?: string
          id?: string
          organization_id?: string
          rate?: number
          rate_date?: string
          source?: string
          to_currency?: string
        }
        Relationships: [
          {
            foreignKeyName: "exchange_rates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      field_reports: {
        Row: {
          attachments: Json
          beneficiary_id: string
          created_at: string
          id: string
          indicators: Json
          narrative: string
          organization_id: string
          period_end: string
          period_start: string
          project_id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          attachments?: Json
          beneficiary_id: string
          created_at?: string
          id?: string
          indicators?: Json
          narrative?: string
          organization_id: string
          period_end: string
          period_start: string
          project_id: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          attachments?: Json
          beneficiary_id?: string
          created_at?: string
          id?: string
          indicators?: Json
          narrative?: string
          organization_id?: string
          period_end?: string
          period_start?: string
          project_id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      glossary: {
        Row: {
          created_at: string
          definition: string
          id: string
          module: string | null
          term: string
        }
        Insert: {
          created_at?: string
          definition: string
          id?: string
          module?: string | null
          term: string
        }
        Update: {
          created_at?: string
          definition?: string
          id?: string
          module?: string | null
          term?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          project_id: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string
          project_id?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          project_id?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_vouchers: {
        Row: {
          amount_eur: number | null
          amount_local: number
          bank_reference: string | null
          created_at: string
          created_by: string | null
          currency: string
          donor_reference: string | null
          exchange_rate: number | null
          id: string
          notes: string | null
          organization_id: string
          payment_date: string
          project_id: string
          report_id: string | null
          status: string
          updated_at: string
          voucher_number: string
        }
        Insert: {
          amount_eur?: number | null
          amount_local: number
          bank_reference?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          donor_reference?: string | null
          exchange_rate?: number | null
          id?: string
          notes?: string | null
          organization_id: string
          payment_date: string
          project_id: string
          report_id?: string | null
          status?: string
          updated_at?: string
          voucher_number: string
        }
        Update: {
          amount_eur?: number | null
          amount_local?: number
          bank_reference?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          donor_reference?: string | null
          exchange_rate?: number | null
          id?: string
          notes?: string | null
          organization_id?: string
          payment_date?: string
          project_id?: string
          report_id?: string | null
          status?: string
          updated_at?: string
          voucher_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_vouchers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_vouchers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_vouchers_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "periodic_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      periodic_reports: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          deadline_approval: string | null
          depenses: Json
          explanation: Json
          id: string
          organization_id: string
          period_end: string | null
          period_start: string | null
          previsions: Json
          project_id: string
          rejection_reason: string | null
          report_index: number
          status: string
          submitted_at: string | null
          submitted_by: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          deadline_approval?: string | null
          depenses?: Json
          explanation?: Json
          id?: string
          organization_id: string
          period_end?: string | null
          period_start?: string | null
          previsions?: Json
          project_id: string
          rejection_reason?: string | null
          report_index: number
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          deadline_approval?: string | null
          depenses?: Json
          explanation?: Json
          id?: string
          organization_id?: string
          period_end?: string | null
          period_start?: string | null
          previsions?: Json
          project_id?: string
          rejection_reason?: string | null
          report_index?: number
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "periodic_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "periodic_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_organization_id: string | null
          avatar_url: string | null
          created_at: string
          dark_mode: boolean
          first_name: string
          id: string
          last_name: string
          organization: string
          phone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active_organization_id?: string | null
          avatar_url?: string | null
          created_at?: string
          dark_mode?: boolean
          first_name?: string
          id?: string
          last_name?: string
          organization?: string
          phone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active_organization_id?: string | null
          avatar_url?: string | null
          created_at?: string
          dark_mode?: boolean
          first_name?: string
          id?: string
          last_name?: string
          organization?: string
          phone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_active_organization_id_fkey"
            columns: ["active_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      project_beneficiaries: {
        Row: {
          assigned_by: string | null
          beneficiary_id: string
          created_at: string
          id: string
          organization_id: string
          project_id: string
        }
        Insert: {
          assigned_by?: string | null
          beneficiary_id: string
          created_at?: string
          id?: string
          organization_id: string
          project_id: string
        }
        Update: {
          assigned_by?: string | null
          beneficiary_id?: string
          created_at?: string
          id?: string
          organization_id?: string
          project_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          amendements: Json
          archived: boolean
          bailleurs: Json
          budget_lines: Json
          color: Json
          convention: string
          created_at: string
          currency: string
          debut: string
          devise: string
          fiches: Json
          fin: string
          id: string
          indicators: Json
          infos: Json
          org: string
          org_type: string
          organization_id: string | null
          pays: string
          periodicite: string
          reports: Json
          risque: string
          taux: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amendements?: Json
          archived?: boolean
          bailleurs?: Json
          budget_lines?: Json
          color?: Json
          convention?: string
          created_at?: string
          currency?: string
          debut?: string
          devise?: string
          fiches?: Json
          fin?: string
          id?: string
          indicators?: Json
          infos?: Json
          org?: string
          org_type?: string
          organization_id?: string | null
          pays?: string
          periodicite?: string
          reports?: Json
          risque?: string
          taux?: number
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amendements?: Json
          archived?: boolean
          bailleurs?: Json
          budget_lines?: Json
          color?: Json
          convention?: string
          created_at?: string
          currency?: string
          debut?: string
          devise?: string
          fiches?: Json
          fin?: string
          id?: string
          indicators?: Json
          infos?: Json
          org?: string
          org_type?: string
          organization_id?: string | null
          pays?: string
          periodicite?: string
          reports?: Json
          risque?: string
          taux?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_organization: {
        Args: { _description?: string; _name: string; _slug: string }
        Returns: string
      }
      get_dashboard_metrics: {
        Args: { _org_id?: string; _pays?: string; _periodicite?: string }
        Returns: Json
      }
      get_user_org_ids: { Args: { _user_id: string }; Returns: string[] }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_org_admin: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_manager_or_admin: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_project_beneficiary: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "lecteur" | "beneficiaire"
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
    Enums: {
      app_role: ["admin", "manager", "lecteur", "beneficiaire"],
    },
  },
} as const
