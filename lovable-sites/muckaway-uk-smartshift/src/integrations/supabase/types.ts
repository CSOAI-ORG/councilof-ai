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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      accounting_connections: {
        Row: {
          access_token: string | null
          active: boolean | null
          company_id: string | null
          company_name: string | null
          connected_at: string | null
          id: string
          last_sync_at: string | null
          provider: string
          refresh_token: string | null
          token_expires_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          active?: boolean | null
          company_id?: string | null
          company_name?: string | null
          connected_at?: string | null
          id?: string
          last_sync_at?: string | null
          provider: string
          refresh_token?: string | null
          token_expires_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          active?: boolean | null
          company_id?: string | null
          company_name?: string | null
          connected_at?: string | null
          id?: string
          last_sync_at?: string | null
          provider?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      aggregate_sale_items: {
        Row: {
          delivered_quantity: number | null
          depot_id: string
          id: string
          material_type_id: string
          quantity_tonnes: number
          sale_id: string
          total_price: number
          unit_price: number
        }
        Insert: {
          delivered_quantity?: number | null
          depot_id: string
          id?: string
          material_type_id: string
          quantity_tonnes: number
          sale_id: string
          total_price: number
          unit_price: number
        }
        Update: {
          delivered_quantity?: number | null
          depot_id?: string
          id?: string
          material_type_id?: string
          quantity_tonnes?: number
          sale_id?: string
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "aggregate_sale_items_depot_id_fkey"
            columns: ["depot_id"]
            isOneToOne: false
            referencedRelation: "depots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aggregate_sale_items_material_type_id_fkey"
            columns: ["material_type_id"]
            isOneToOne: false
            referencedRelation: "material_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aggregate_sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "aggregate_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      aggregate_sales: {
        Row: {
          created_at: string
          currency: string | null
          customer_id: string | null
          delivery_address: string | null
          delivery_date: string | null
          id: string
          notes: string | null
          sale_date: string
          sale_number: string
          status: string | null
          total_amount: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          customer_id?: string | null
          delivery_address?: string | null
          delivery_date?: string | null
          id?: string
          notes?: string | null
          sale_date?: string
          sale_number: string
          status?: string | null
          total_amount?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          customer_id?: string | null
          delivery_address?: string | null
          delivery_date?: string | null
          id?: string
          notes?: string | null
          sale_date?: string
          sale_number?: string
          status?: string | null
          total_amount?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aggregate_sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_conversation_sessions: {
        Row: {
          context: Json | null
          created_at: string
          id: string
          last_activity: string
          message_count: number | null
          session_id: string
          summary: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string
          id?: string
          last_activity?: string
          message_count?: number | null
          session_id: string
          summary?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string
          id?: string
          last_activity?: string
          message_count?: number | null
          session_id?: string
          summary?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_feedback: {
        Row: {
          context: Json | null
          corrected_response: string | null
          created_at: string
          feedback_type: string
          feedback_value: string | null
          id: string
          interaction_id: string | null
          original_response: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          corrected_response?: string | null
          created_at?: string
          feedback_type: string
          feedback_value?: string | null
          id?: string
          interaction_id?: string | null
          original_response?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          corrected_response?: string | null
          created_at?: string
          feedback_type?: string
          feedback_value?: string | null
          id?: string
          interaction_id?: string | null
          original_response?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_feedback_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "ai_interactions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_interactions: {
        Row: {
          content: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
          session_id: string
          tool_calls: Json | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
          session_id: string
          tool_calls?: Json | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          session_id?: string
          tool_calls?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_learning_patterns: {
        Row: {
          created_at: string
          id: string
          last_updated: string
          occurrence_count: number | null
          pattern_key: string
          pattern_type: string
          pattern_value: Json
          success_rate: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_updated?: string
          occurrence_count?: number | null
          pattern_key: string
          pattern_type: string
          pattern_value: Json
          success_rate?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          last_updated?: string
          occurrence_count?: number | null
          pattern_key?: string
          pattern_type?: string
          pattern_value?: Json
          success_rate?: number | null
        }
        Relationships: []
      }
      ai_outcomes: {
        Row: {
          created_at: string
          id: string
          interaction_id: string | null
          job_id: string | null
          metadata: Json | null
          outcome_type: string
          outcome_value: number | null
          quote_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          interaction_id?: string | null
          job_id?: string | null
          metadata?: Json | null
          outcome_type: string
          outcome_value?: number | null
          quote_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          interaction_id?: string | null
          job_id?: string | null
          metadata?: Json | null
          outcome_type?: string
          outcome_value?: number | null
          quote_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_outcomes_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "ai_interactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_outcomes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_outcomes_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          country: string | null
          created_at: string
          device_type: string | null
          event_name: string
          event_type: string
          id: string
          page_path: string | null
          properties: Json | null
          referrer: string | null
          region: string | null
          request_hash: string | null
          session_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name: string
          event_type: string
          id?: string
          page_path?: string | null
          properties?: Json | null
          referrer?: string | null
          region?: string | null
          request_hash?: string | null
          session_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          event_type?: string
          id?: string
          page_path?: string | null
          properties?: Json | null
          referrer?: string | null
          region?: string | null
          request_hash?: string | null
          session_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          active: boolean | null
          created_at: string
          expires_at: string | null
          id: string
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          permissions: Json | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          expires_at?: string | null
          id?: string
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          permissions?: Json | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          expires_at?: string | null
          id?: string
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          permissions?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      archived_records: {
        Row: {
          anonymized: boolean | null
          archived_at: string | null
          archived_by: string | null
          archived_data: Json
          created_at: string | null
          id: string
          original_id: string
          original_table: string
          reason: string | null
          retention_expires_at: string | null
        }
        Insert: {
          anonymized?: boolean | null
          archived_at?: string | null
          archived_by?: string | null
          archived_data: Json
          created_at?: string | null
          id?: string
          original_id: string
          original_table: string
          reason?: string | null
          retention_expires_at?: string | null
        }
        Update: {
          anonymized?: boolean | null
          archived_at?: string | null
          archived_by?: string | null
          archived_data?: Json
          created_at?: string | null
          id?: string
          original_id?: string
          original_table?: string
          reason?: string | null
          retention_expires_at?: string | null
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          featured_image_url: string | null
          id: string
          is_active: boolean | null
          meta_description: string | null
          meta_title: string | null
          name: string
          parent_id: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          featured_image_url?: string | null
          id?: string
          is_active?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          parent_id?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          featured_image_url?: string | null
          id?: string
          is_active?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          parent_id?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string | null
          canonical_url: string | null
          category_id: string | null
          content: string
          created_at: string | null
          excerpt: string | null
          external_links: string[] | null
          featured_image_alt: string | null
          featured_image_url: string | null
          id: string
          internal_links: string[] | null
          is_featured: boolean | null
          is_pillar_content: boolean | null
          keywords: string[] | null
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          reading_time_minutes: number | null
          schema_type: string | null
          slug: string
          status: string | null
          structured_data: Json | null
          title: string
          updated_at: string | null
          view_count: number | null
          word_count: number | null
        }
        Insert: {
          author_id?: string | null
          canonical_url?: string | null
          category_id?: string | null
          content: string
          created_at?: string | null
          excerpt?: string | null
          external_links?: string[] | null
          featured_image_alt?: string | null
          featured_image_url?: string | null
          id?: string
          internal_links?: string[] | null
          is_featured?: boolean | null
          is_pillar_content?: boolean | null
          keywords?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          reading_time_minutes?: number | null
          schema_type?: string | null
          slug: string
          status?: string | null
          structured_data?: Json | null
          title: string
          updated_at?: string | null
          view_count?: number | null
          word_count?: number | null
        }
        Update: {
          author_id?: string | null
          canonical_url?: string | null
          category_id?: string | null
          content?: string
          created_at?: string | null
          excerpt?: string | null
          external_links?: string[] | null
          featured_image_alt?: string | null
          featured_image_url?: string | null
          id?: string
          internal_links?: string[] | null
          is_featured?: boolean | null
          is_pillar_content?: boolean | null
          keywords?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          reading_time_minutes?: number | null
          schema_type?: string | null
          slug?: string
          status?: string | null
          structured_data?: Json | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_documents: {
        Row: {
          created_at: string
          document_number: string | null
          document_type: string
          file_url: string | null
          id: string
          issuing_authority: string | null
          status: string | null
          updated_at: string
          user_id: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          document_number?: string | null
          document_type: string
          file_url?: string | null
          id?: string
          issuing_authority?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          document_number?: string | null
          document_type?: string
          file_url?: string | null
          id?: string
          issuing_authority?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      customer_portal_access: {
        Row: {
          access_token: string
          active: boolean | null
          created_at: string
          customer_id: string
          email: string
          expires_at: string | null
          id: string
          last_login: string | null
          token_hash: string | null
        }
        Insert: {
          access_token: string
          active?: boolean | null
          created_at?: string
          customer_id: string
          email: string
          expires_at?: string | null
          id?: string
          last_login?: string | null
          token_hash?: string | null
        }
        Update: {
          access_token?: string
          active?: boolean | null
          created_at?: string
          customer_id?: string
          email?: string
          expires_at?: string | null
          id?: string
          last_login?: string | null
          token_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_portal_access_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_risk_assessments: {
        Row: {
          assessment_notes: string | null
          created_at: string | null
          customer_id: string
          flagged_reasons: string[] | null
          id: string
          last_assessment_at: string | null
          manual_override: boolean | null
          override_by: string | null
          override_reason: string | null
          risk_level: Database["public"]["Enums"]["risk_level"] | null
          risk_score: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assessment_notes?: string | null
          created_at?: string | null
          customer_id: string
          flagged_reasons?: string[] | null
          id?: string
          last_assessment_at?: string | null
          manual_override?: boolean | null
          override_by?: string | null
          override_reason?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          risk_score?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assessment_notes?: string | null
          created_at?: string | null
          customer_id?: string
          flagged_reasons?: string[] | null
          id?: string
          last_assessment_at?: string | null
          manual_override?: boolean | null
          override_by?: string | null
          override_reason?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          risk_score?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_risk_assessments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_transactions: {
        Row: {
          amount: number
          created_at: string | null
          customer_id: string
          id: string
          job_id: string | null
          notes: string | null
          reference: string | null
          running_balance: number | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          customer_id: string
          id?: string
          job_id?: string | null
          notes?: string | null
          reference?: string | null
          running_balance?: number | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          customer_id?: string
          id?: string
          job_id?: string | null
          notes?: string | null
          reference?: string | null
          running_balance?: number | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_transactions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          anonymized: boolean | null
          archived_at: string | null
          company_name: string | null
          contact_name: string | null
          created_at: string
          credit_limit: number | null
          credit_terms_days: number | null
          current_balance: number | null
          email: string | null
          id: string
          last_activity_at: string | null
          payment_terms: string | null
          phone: string | null
          postcode: string | null
          profile_id: string | null
          retention_expires_at: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          anonymized?: boolean | null
          archived_at?: string | null
          company_name?: string | null
          contact_name?: string | null
          created_at?: string
          credit_limit?: number | null
          credit_terms_days?: number | null
          current_balance?: number | null
          email?: string | null
          id?: string
          last_activity_at?: string | null
          payment_terms?: string | null
          phone?: string | null
          postcode?: string | null
          profile_id?: string | null
          retention_expires_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          anonymized?: boolean | null
          archived_at?: string | null
          company_name?: string | null
          contact_name?: string | null
          created_at?: string
          credit_limit?: number | null
          credit_terms_days?: number | null
          current_balance?: number | null
          email?: string | null
          id?: string
          last_activity_at?: string | null
          payment_terms?: string | null
          phone?: string | null
          postcode?: string | null
          profile_id?: string | null
          retention_expires_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      data_access_audit: {
        Row: {
          action_type: string
          created_at: string | null
          id: string
          ip_address: string | null
          resource_details: Json | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          resource_details?: Json | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          resource_details?: Json | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      data_retention_policies: {
        Row: {
          active: boolean | null
          applies_to_region: string | null
          created_at: string | null
          description: string | null
          id: string
          legal_basis: string
          retention_action: Database["public"]["Enums"]["retention_action"]
          retention_years: number
          table_name: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          applies_to_region?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          legal_basis: string
          retention_action?: Database["public"]["Enums"]["retention_action"]
          retention_years?: number
          table_name: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          applies_to_region?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          legal_basis?: string
          retention_action?: Database["public"]["Enums"]["retention_action"]
          retention_years?: number
          table_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      data_subject_requests: {
        Row: {
          cooling_off_ends_at: string | null
          created_at: string | null
          description: string | null
          export_expires_at: string | null
          exported_data_url: string | null
          id: string
          notes: string | null
          processed_at: string | null
          processed_by: string | null
          request_type: Database["public"]["Enums"]["data_request_type"]
          requester_email: string
          requester_name: string
          requester_phone: string | null
          status: Database["public"]["Enums"]["data_request_status"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cooling_off_ends_at?: string | null
          created_at?: string | null
          description?: string | null
          export_expires_at?: string | null
          exported_data_url?: string | null
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          request_type: Database["public"]["Enums"]["data_request_type"]
          requester_email: string
          requester_name: string
          requester_phone?: string | null
          status?: Database["public"]["Enums"]["data_request_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cooling_off_ends_at?: string | null
          created_at?: string | null
          description?: string | null
          export_expires_at?: string | null
          exported_data_url?: string | null
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          request_type?: Database["public"]["Enums"]["data_request_type"]
          requester_email?: string
          requester_name?: string
          requester_phone?: string | null
          status?: Database["public"]["Enums"]["data_request_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      depots: {
        Row: {
          active: boolean | null
          address: string | null
          capacity_tonnes: number | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          current_utilization: number | null
          depot_type: string | null
          id: string
          name: string
          postcode: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          address?: string | null
          capacity_tonnes?: number | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          current_utilization?: number | null
          depot_type?: string | null
          id?: string
          name: string
          postcode?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          address?: string | null
          capacity_tonnes?: number | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          current_utilization?: number | null
          depot_type?: string | null
          id?: string
          name?: string
          postcode?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      driver_daily_checks: {
        Row: {
          brakes_working: boolean | null
          check_date: string
          created_at: string
          defects_noted: string | null
          driver_id: string
          driver_signature: string | null
          fluid_levels_ok: boolean | null
          fuel_level: number | null
          grab_arm_operation: boolean | null
          horn_working: boolean | null
          hydraulics_working: boolean | null
          id: string
          lights_working: boolean | null
          load_securing_equipment: boolean | null
          mirrors_clean: boolean | null
          odometer_reading: number | null
          seatbelt_working: boolean | null
          steering_responsive: boolean | null
          tailgate_operation: boolean | null
          tyres_condition: boolean | null
          vehicle_clean: boolean | null
          vehicle_id: string
        }
        Insert: {
          brakes_working?: boolean | null
          check_date?: string
          created_at?: string
          defects_noted?: string | null
          driver_id: string
          driver_signature?: string | null
          fluid_levels_ok?: boolean | null
          fuel_level?: number | null
          grab_arm_operation?: boolean | null
          horn_working?: boolean | null
          hydraulics_working?: boolean | null
          id?: string
          lights_working?: boolean | null
          load_securing_equipment?: boolean | null
          mirrors_clean?: boolean | null
          odometer_reading?: number | null
          seatbelt_working?: boolean | null
          steering_responsive?: boolean | null
          tailgate_operation?: boolean | null
          tyres_condition?: boolean | null
          vehicle_clean?: boolean | null
          vehicle_id: string
        }
        Update: {
          brakes_working?: boolean | null
          check_date?: string
          created_at?: string
          defects_noted?: string | null
          driver_id?: string
          driver_signature?: string | null
          fluid_levels_ok?: boolean | null
          fuel_level?: number | null
          grab_arm_operation?: boolean | null
          horn_working?: boolean | null
          hydraulics_working?: boolean | null
          id?: string
          lights_working?: boolean | null
          load_securing_equipment?: boolean | null
          mirrors_clean?: boolean | null
          odometer_reading?: number | null
          seatbelt_working?: boolean | null
          steering_responsive?: boolean | null
          tailgate_operation?: boolean | null
          tyres_condition?: boolean | null
          vehicle_clean?: boolean | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_daily_checks_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_daily_checks_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          active: boolean | null
          created_at: string
          id: string
          licence_expiry: string | null
          licence_number: string | null
          name: string
          phone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          id?: string
          licence_expiry?: string | null
          licence_number?: string | null
          name: string
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string
          id?: string
          licence_expiry?: string | null
          licence_number?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          email_type: string
          id: string
          metadata: Json | null
          recipient_email: string
          sent_at: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          email_type: string
          id?: string
          metadata?: Json | null
          recipient_email: string
          sent_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          email_type?: string
          id?: string
          metadata?: Json | null
          recipient_email?: string
          sent_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      environmental_metrics: {
        Row: {
          calculated_at: string | null
          id: string
          job_id: string | null
          methodology: string | null
          metric_type: string
          unit: string
          user_id: string
          value: number
        }
        Insert: {
          calculated_at?: string | null
          id?: string
          job_id?: string | null
          methodology?: string | null
          metric_type: string
          unit: string
          user_id: string
          value: number
        }
        Update: {
          calculated_at?: string | null
          id?: string
          job_id?: string | null
          methodology?: string | null
          metric_type?: string
          unit?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "environmental_metrics_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      exit_intent_events: {
        Row: {
          created_at: string
          email_captured: boolean | null
          event_type: string
          id: string
          page_path: string | null
          quote_saved: boolean | null
          session_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email_captured?: boolean | null
          event_type: string
          id?: string
          page_path?: string | null
          quote_saved?: boolean | null
          session_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email_captured?: boolean | null
          event_type?: string
          id?: string
          page_path?: string | null
          quote_saved?: boolean | null
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      generated_reports: {
        Row: {
          created_at: string
          data: Json | null
          date_range_end: string | null
          date_range_start: string | null
          file_url: string | null
          format: string
          id: string
          report_type: string
          schedule_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          date_range_end?: string | null
          date_range_start?: string | null
          file_url?: string | null
          format?: string
          id?: string
          report_type: string
          schedule_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          date_range_end?: string | null
          date_range_start?: string | null
          file_url?: string | null
          format?: string
          id?: string
          report_type?: string
          schedule_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_reports_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "report_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      hazardous_consignment_notes: {
        Row: {
          anonymized: boolean | null
          archived_at: string | null
          carrier_licence: string | null
          carrier_name: string
          consignment_number: string
          container_type: string | null
          created_at: string
          destination_address: string
          destination_permit: string | null
          destination_site_name: string
          ewc_code: string
          hazard_codes: string[] | null
          id: string
          job_id: string | null
          physical_form: string | null
          producer_address: string
          producer_name: string
          quantity_tonnes: number
          retention_expires_at: string | null
          section_a_date: string | null
          section_a_signature: string | null
          section_b_date: string | null
          section_b_signature: string | null
          section_c_date: string | null
          section_c_signature: string | null
          section_d_date: string | null
          section_d_signature: string | null
          section_e_date: string | null
          section_e_signature: string | null
          special_handling_requirements: string | null
          status: string | null
          updated_at: string
          user_id: string | null
          waste_description: string
        }
        Insert: {
          anonymized?: boolean | null
          archived_at?: string | null
          carrier_licence?: string | null
          carrier_name: string
          consignment_number: string
          container_type?: string | null
          created_at?: string
          destination_address: string
          destination_permit?: string | null
          destination_site_name: string
          ewc_code: string
          hazard_codes?: string[] | null
          id?: string
          job_id?: string | null
          physical_form?: string | null
          producer_address: string
          producer_name: string
          quantity_tonnes: number
          retention_expires_at?: string | null
          section_a_date?: string | null
          section_a_signature?: string | null
          section_b_date?: string | null
          section_b_signature?: string | null
          section_c_date?: string | null
          section_c_signature?: string | null
          section_d_date?: string | null
          section_d_signature?: string | null
          section_e_date?: string | null
          section_e_signature?: string | null
          special_handling_requirements?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
          waste_description: string
        }
        Update: {
          anonymized?: boolean | null
          archived_at?: string | null
          carrier_licence?: string | null
          carrier_name?: string
          consignment_number?: string
          container_type?: string | null
          created_at?: string
          destination_address?: string
          destination_permit?: string | null
          destination_site_name?: string
          ewc_code?: string
          hazard_codes?: string[] | null
          id?: string
          job_id?: string | null
          physical_form?: string | null
          producer_address?: string
          producer_name?: string
          quantity_tonnes?: number
          retention_expires_at?: string | null
          section_a_date?: string | null
          section_a_signature?: string | null
          section_b_date?: string | null
          section_b_signature?: string | null
          section_c_date?: string | null
          section_c_signature?: string | null
          section_d_date?: string | null
          section_d_signature?: string | null
          section_e_date?: string | null
          section_e_signature?: string | null
          special_handling_requirements?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
          waste_description?: string
        }
        Relationships: [
          {
            foreignKeyName: "hazardous_consignment_notes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_syncs: {
        Row: {
          accounting_connection_id: string | null
          amount: number | null
          created_at: string | null
          error_message: string | null
          external_invoice_id: string | null
          external_invoice_number: string | null
          id: string
          job_id: string | null
          status: string | null
          synced_at: string | null
          user_id: string
        }
        Insert: {
          accounting_connection_id?: string | null
          amount?: number | null
          created_at?: string | null
          error_message?: string | null
          external_invoice_id?: string | null
          external_invoice_number?: string | null
          id?: string
          job_id?: string | null
          status?: string | null
          synced_at?: string | null
          user_id: string
        }
        Update: {
          accounting_connection_id?: string | null
          amount?: number | null
          created_at?: string | null
          error_message?: string | null
          external_invoice_id?: string | null
          external_invoice_number?: string | null
          id?: string
          job_id?: string | null
          status?: string | null
          synced_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_syncs_accounting_connection_id_fkey"
            columns: ["accounting_connection_id"]
            isOneToOne: false
            referencedRelation: "accounting_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_syncs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_assignments: {
        Row: {
          assigned_date: string
          created_at: string
          driver_id: string | null
          id: string
          job_id: string
          notes: string | null
          status: string | null
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          assigned_date?: string
          created_at?: string
          driver_id?: string | null
          id?: string
          job_id: string
          notes?: string | null
          status?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          assigned_date?: string
          created_at?: string
          driver_id?: string | null
          id?: string
          job_id?: string
          notes?: string | null
          status?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_assignments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_assignments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_assignments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_transactions: {
        Row: {
          created_at: string
          fee_amount: number
          id: string
          job_id: string | null
          processed_at: string | null
          status: string
          stripe_invoice_id: string | null
          tier: string
          user_id: string
        }
        Insert: {
          created_at?: string
          fee_amount: number
          id?: string
          job_id?: string | null
          processed_at?: string | null
          status?: string
          stripe_invoice_id?: string | null
          tier: string
          user_id: string
        }
        Update: {
          created_at?: string
          fee_amount?: number
          id?: string
          job_id?: string | null
          processed_at?: string | null
          status?: string
          stripe_invoice_id?: string | null
          tier?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_transactions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          anonymized: boolean | null
          archived_at: string | null
          collection_date: string | null
          completed_date: string | null
          contamination_level: string | null
          created_at: string
          currency: string | null
          customer_id: string | null
          destination_depot_id: string | null
          disposal_cost: number | null
          disposal_method: string | null
          driver_id: string | null
          estimated_tonnage: number | null
          estimated_volume: number | null
          ewc_code: string | null
          haulage_cost: number | null
          id: string
          landfill_tax_amount: number | null
          material_type: string
          notes: string | null
          processed_to_stock: boolean | null
          quote_amount: number | null
          retention_expires_at: string | null
          scheduled_date: string | null
          site_address: string
          site_id: string | null
          site_postcode: string | null
          spoil_type: string | null
          status: string | null
          total_price: number | null
          updated_at: string
          user_id: string
          vehicle_id: string | null
          volume_tonnes: number
        }
        Insert: {
          anonymized?: boolean | null
          archived_at?: string | null
          collection_date?: string | null
          completed_date?: string | null
          contamination_level?: string | null
          created_at?: string
          currency?: string | null
          customer_id?: string | null
          destination_depot_id?: string | null
          disposal_cost?: number | null
          disposal_method?: string | null
          driver_id?: string | null
          estimated_tonnage?: number | null
          estimated_volume?: number | null
          ewc_code?: string | null
          haulage_cost?: number | null
          id?: string
          landfill_tax_amount?: number | null
          material_type: string
          notes?: string | null
          processed_to_stock?: boolean | null
          quote_amount?: number | null
          retention_expires_at?: string | null
          scheduled_date?: string | null
          site_address: string
          site_id?: string | null
          site_postcode?: string | null
          spoil_type?: string | null
          status?: string | null
          total_price?: number | null
          updated_at?: string
          user_id: string
          vehicle_id?: string | null
          volume_tonnes: number
        }
        Update: {
          anonymized?: boolean | null
          archived_at?: string | null
          collection_date?: string | null
          completed_date?: string | null
          contamination_level?: string | null
          created_at?: string
          currency?: string | null
          customer_id?: string | null
          destination_depot_id?: string | null
          disposal_cost?: number | null
          disposal_method?: string | null
          driver_id?: string | null
          estimated_tonnage?: number | null
          estimated_volume?: number | null
          ewc_code?: string | null
          haulage_cost?: number | null
          id?: string
          landfill_tax_amount?: number | null
          material_type?: string
          notes?: string | null
          processed_to_stock?: boolean | null
          quote_amount?: number | null
          retention_expires_at?: string | null
          scheduled_date?: string | null
          site_address?: string
          site_id?: string | null
          site_postcode?: string | null
          spoil_type?: string | null
          status?: string | null
          total_price?: number | null
          updated_at?: string
          user_id?: string
          vehicle_id?: string | null
          volume_tonnes?: number
        }
        Relationships: [
          {
            foreignKeyName: "jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_destination_depot_id_fkey"
            columns: ["destination_depot_id"]
            isOneToOne: false
            referencedRelation: "depots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_magnet_downloads: {
        Row: {
          company: string | null
          downloaded_at: string | null
          email: string
          id: string
          ip_hash: string | null
          lead_magnet_id: string
          name: string | null
          source_page: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          company?: string | null
          downloaded_at?: string | null
          email: string
          id?: string
          ip_hash?: string | null
          lead_magnet_id: string
          name?: string | null
          source_page?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          company?: string | null
          downloaded_at?: string | null
          email?: string
          id?: string
          ip_hash?: string | null
          lead_magnet_id?: string
          name?: string | null
          source_page?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_magnet_downloads_lead_magnet_id_fkey"
            columns: ["lead_magnet_id"]
            isOneToOne: false
            referencedRelation: "lead_magnets"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_magnets: {
        Row: {
          created_at: string | null
          description: string | null
          download_count: number | null
          email_body: string | null
          email_subject: string | null
          file_url: string | null
          id: string
          is_active: boolean | null
          landing_page_content: string | null
          magnet_type: string
          name: string
          slug: string
          tags: string[] | null
          thank_you_content: string | null
          thumbnail_url: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          download_count?: number | null
          email_body?: string | null
          email_subject?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          landing_page_content?: string | null
          magnet_type: string
          name: string
          slug: string
          tags?: string[] | null
          thank_you_content?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          download_count?: number | null
          email_body?: string | null
          email_subject?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          landing_page_content?: string | null
          magnet_type?: string
          name?: string
          slug?: string
          tags?: string[] | null
          thank_you_content?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          company: string | null
          converted_at: string | null
          created_at: string
          email: string
          id: string
          lead_type: string
          name: string | null
          notes: string | null
          phone: string | null
          quote_data: Json | null
          source_page: string | null
          status: string
          updated_at: string
          user_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          company?: string | null
          converted_at?: string | null
          created_at?: string
          email: string
          id?: string
          lead_type?: string
          name?: string | null
          notes?: string | null
          phone?: string | null
          quote_data?: Json | null
          source_page?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          company?: string | null
          converted_at?: string | null
          created_at?: string
          email?: string
          id?: string
          lead_type?: string
          name?: string | null
          notes?: string | null
          phone?: string | null
          quote_data?: Json | null
          source_page?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      licence_verifications: {
        Row: {
          created_at: string | null
          expiry_date: string | null
          id: string
          licence_number: string
          licence_tier: Database["public"]["Enums"]["licence_tier"] | null
          raw_response: Json | null
          registered_holder: string | null
          updated_at: string | null
          user_id: string
          verification_date: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Insert: {
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          licence_number: string
          licence_tier?: Database["public"]["Enums"]["licence_tier"] | null
          raw_response?: Json | null
          registered_holder?: string | null
          updated_at?: string | null
          user_id: string
          verification_date?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Update: {
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          licence_number?: string
          licence_tier?: Database["public"]["Enums"]["licence_tier"] | null
          raw_response?: Json | null
          registered_holder?: string | null
          updated_at?: string | null
          user_id?: string
          verification_date?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Relationships: []
      }
      material_types: {
        Row: {
          active: boolean | null
          category: string | null
          code: string
          created_at: string
          default_buy_price: number | null
          default_sell_price: number | null
          description: string | null
          ewc_code: string | null
          id: string
          name: string
          requires_testing: boolean | null
          unit: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          category?: string | null
          code: string
          created_at?: string
          default_buy_price?: number | null
          default_sell_price?: number | null
          description?: string | null
          ewc_code?: string | null
          id?: string
          name: string
          requires_testing?: boolean | null
          unit?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          category?: string | null
          code?: string
          created_at?: string
          default_buy_price?: number | null
          default_sell_price?: number | null
          description?: string | null
          ewc_code?: string | null
          id?: string
          name?: string
          requires_testing?: boolean | null
          unit?: string | null
          user_id?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          active: boolean | null
          email: string
          id: string
          name: string | null
          source_page: string | null
          subscribed_at: string
          unsubscribed_at: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          active?: boolean | null
          email: string
          id?: string
          name?: string | null
          source_page?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          active?: boolean | null
          email?: string
          id?: string
          name?: string | null
          source_page?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_compliance_alerts: boolean | null
          email_job_updates: boolean | null
          email_payment_updates: boolean | null
          email_usage_warnings: boolean | null
          email_visual_test_alerts: boolean | null
          id: string
          inapp_compliance_alerts: boolean | null
          inapp_job_updates: boolean | null
          inapp_payment_updates: boolean | null
          inapp_usage_warnings: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_compliance_alerts?: boolean | null
          email_job_updates?: boolean | null
          email_payment_updates?: boolean | null
          email_usage_warnings?: boolean | null
          email_visual_test_alerts?: boolean | null
          id?: string
          inapp_compliance_alerts?: boolean | null
          inapp_job_updates?: boolean | null
          inapp_payment_updates?: boolean | null
          inapp_usage_warnings?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_compliance_alerts?: boolean | null
          email_job_updates?: boolean | null
          email_payment_updates?: boolean | null
          email_usage_warnings?: boolean | null
          email_visual_test_alerts?: boolean | null
          id?: string
          inapp_compliance_alerts?: boolean | null
          inapp_job_updates?: boolean | null
          inapp_payment_updates?: boolean | null
          inapp_usage_warnings?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string | null
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          read?: boolean | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount: number
          created_at: string
          currency: string
          customer_email: string | null
          id: string
          metadata: Json | null
          product_id: string | null
          product_name: string | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          customer_email?: string | null
          id?: string
          metadata?: Json | null
          product_id?: string | null
          product_name?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          customer_email?: string | null
          id?: string
          metadata?: Json | null
          product_id?: string | null
          product_name?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          preferred_language: string | null
          region: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          preferred_language?: string | null
          region?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          preferred_language?: string | null
          region?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          id: string
          material_type_id: string
          purchase_order_id: string
          quantity_tonnes: number
          received_quantity: number | null
          total_price: number
          unit_price: number
        }
        Insert: {
          id?: string
          material_type_id: string
          purchase_order_id: string
          quantity_tonnes: number
          received_quantity?: number | null
          total_price: number
          unit_price: number
        }
        Update: {
          id?: string
          material_type_id?: string
          purchase_order_id?: string
          quantity_tonnes?: number
          received_quantity?: number | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_material_type_id_fkey"
            columns: ["material_type_id"]
            isOneToOne: false
            referencedRelation: "material_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string
          currency: string | null
          delivery_depot_id: string | null
          id: string
          notes: string | null
          order_date: string
          po_number: string
          status: string | null
          supplier_id: string
          total_amount: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          delivery_depot_id?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          po_number: string
          status?: string | null
          supplier_id: string
          total_amount?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          delivery_depot_id?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          po_number?: string
          status?: string | null
          supplier_id?: string
          total_amount?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_delivery_depot_id_fkey"
            columns: ["delivery_depot_id"]
            isOneToOne: false
            referencedRelation: "depots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          anonymized: boolean | null
          archived_at: string | null
          contamination_level: string | null
          converted_to_job_id: string | null
          created_at: string
          currency: string | null
          disposal_cost: number | null
          ewc_code: string | null
          expires_at: string | null
          haulage_cost: number | null
          id: string
          landfill_tax: number | null
          material_type: string
          retention_expires_at: string | null
          risk_level: string | null
          site_postcode: string | null
          source: string | null
          total_price: number | null
          user_id: string | null
          volume_tonnes: number
        }
        Insert: {
          anonymized?: boolean | null
          archived_at?: string | null
          contamination_level?: string | null
          converted_to_job_id?: string | null
          created_at?: string
          currency?: string | null
          disposal_cost?: number | null
          ewc_code?: string | null
          expires_at?: string | null
          haulage_cost?: number | null
          id?: string
          landfill_tax?: number | null
          material_type: string
          retention_expires_at?: string | null
          risk_level?: string | null
          site_postcode?: string | null
          source?: string | null
          total_price?: number | null
          user_id?: string | null
          volume_tonnes: number
        }
        Update: {
          anonymized?: boolean | null
          archived_at?: string | null
          contamination_level?: string | null
          converted_to_job_id?: string | null
          created_at?: string
          currency?: string | null
          disposal_cost?: number | null
          ewc_code?: string | null
          expires_at?: string | null
          haulage_cost?: number | null
          id?: string
          landfill_tax?: number | null
          material_type?: string
          retention_expires_at?: string | null
          risk_level?: string | null
          site_postcode?: string | null
          source?: string | null
          total_price?: number | null
          user_id?: string | null
          volume_tonnes?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotes_converted_to_job_id_fkey"
            columns: ["converted_to_job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      report_schedules: {
        Row: {
          active: boolean | null
          created_at: string
          email_recipients: string[] | null
          filters: Json | null
          frequency: string
          id: string
          last_run_at: string | null
          next_run_at: string | null
          report_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          email_recipients?: string[] | null
          filters?: Json | null
          frequency?: string
          id?: string
          last_run_at?: string | null
          next_run_at?: string | null
          report_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          email_recipients?: string[] | null
          filters?: Json | null
          frequency?: string
          id?: string
          last_run_at?: string | null
          next_run_at?: string | null
          report_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      route_plans: {
        Row: {
          created_at: string | null
          driver_id: string | null
          estimated_duration_mins: number | null
          id: string
          optimized_route: Json | null
          plan_date: string
          status: string | null
          total_distance_km: number | null
          user_id: string
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string | null
          driver_id?: string | null
          estimated_duration_mins?: number | null
          id?: string
          optimized_route?: Json | null
          plan_date: string
          status?: string | null
          total_distance_km?: number | null
          user_id: string
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string | null
          driver_id?: string | null
          estimated_duration_mins?: number | null
          id?: string
          optimized_route?: Json | null
          plan_date?: string
          status?: string | null
          total_distance_km?: number | null
          user_id?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "route_plans_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_plans_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_quotes: {
        Row: {
          converted: boolean | null
          converted_at: string | null
          created_at: string
          email: string
          estimated_price: number | null
          expires_at: string | null
          id: string
          material_type: string | null
          quote_data: Json
          reminded_at: string | null
          source: string | null
          volume_tonnes: number | null
        }
        Insert: {
          converted?: boolean | null
          converted_at?: string | null
          created_at?: string
          email: string
          estimated_price?: number | null
          expires_at?: string | null
          id?: string
          material_type?: string | null
          quote_data: Json
          reminded_at?: string | null
          source?: string | null
          volume_tonnes?: number | null
        }
        Update: {
          converted?: boolean | null
          converted_at?: string | null
          created_at?: string
          email?: string
          estimated_price?: number | null
          expires_at?: string | null
          id?: string
          material_type?: string | null
          quote_data?: Json
          reminded_at?: string | null
          source?: string | null
          volume_tonnes?: number | null
        }
        Relationships: []
      }
      schedule_blocks: {
        Row: {
          block_type: string | null
          color: string | null
          created_at: string | null
          driver_id: string | null
          end_time: string
          id: string
          job_id: string | null
          notes: string | null
          start_time: string
          user_id: string
          vehicle_id: string | null
        }
        Insert: {
          block_type?: string | null
          color?: string | null
          created_at?: string | null
          driver_id?: string | null
          end_time: string
          id?: string
          job_id?: string | null
          notes?: string | null
          start_time: string
          user_id: string
          vehicle_id?: string | null
        }
        Update: {
          block_type?: string | null
          color?: string | null
          created_at?: string | null
          driver_id?: string | null
          end_time?: string
          id?: string
          job_id?: string | null
          notes?: string | null
          start_time?: string
          user_id?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_blocks_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_blocks_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_blocks_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_landing_pages: {
        Row: {
          content: string
          conversion_count: number | null
          created_at: string | null
          faq_items: Json | null
          featured_image_url: string | null
          headline: string
          hero_cta_text: string | null
          hero_cta_url: string | null
          id: string
          is_active: boolean | null
          is_noindex: boolean | null
          keywords: string[] | null
          meta_description: string | null
          meta_title: string | null
          page_type: string
          schema_type: string | null
          slug: string
          structured_data: Json | null
          subheadline: string | null
          testimonial_ids: string[] | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          content: string
          conversion_count?: number | null
          created_at?: string | null
          faq_items?: Json | null
          featured_image_url?: string | null
          headline: string
          hero_cta_text?: string | null
          hero_cta_url?: string | null
          id?: string
          is_active?: boolean | null
          is_noindex?: boolean | null
          keywords?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          page_type: string
          schema_type?: string | null
          slug: string
          structured_data?: Json | null
          subheadline?: string | null
          testimonial_ids?: string[] | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          content?: string
          conversion_count?: number | null
          created_at?: string | null
          faq_items?: Json | null
          featured_image_url?: string | null
          headline?: string
          hero_cta_text?: string | null
          hero_cta_url?: string | null
          id?: string
          is_active?: boolean | null
          is_noindex?: boolean | null
          keywords?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          page_type?: string
          schema_type?: string | null
          slug?: string
          structured_data?: Json | null
          subheadline?: string | null
          testimonial_ids?: string[] | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      sites: {
        Row: {
          access_notes: string | null
          address: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          customer_id: string | null
          id: string
          name: string
          postcode: string | null
          updated_at: string
        }
        Insert: {
          access_notes?: string | null
          address?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          name: string
          postcode?: string | null
          updated_at?: string
        }
        Update: {
          access_notes?: string | null
          address?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          name?: string
          postcode?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sites_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_levels: {
        Row: {
          depot_id: string
          id: string
          last_stocktake_date: string | null
          material_type_id: string
          max_stock_level: number | null
          min_stock_level: number | null
          quantity_tonnes: number | null
          reserved_quantity: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          depot_id: string
          id?: string
          last_stocktake_date?: string | null
          material_type_id: string
          max_stock_level?: number | null
          min_stock_level?: number | null
          quantity_tonnes?: number | null
          reserved_quantity?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          depot_id?: string
          id?: string
          last_stocktake_date?: string | null
          material_type_id?: string
          max_stock_level?: number | null
          min_stock_level?: number | null
          quantity_tonnes?: number | null
          reserved_quantity?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_levels_depot_id_fkey"
            columns: ["depot_id"]
            isOneToOne: false
            referencedRelation: "depots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_levels_material_type_id_fkey"
            columns: ["material_type_id"]
            isOneToOne: false
            referencedRelation: "material_types"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          created_by: string | null
          depot_id: string
          id: string
          material_type_id: string
          movement_type: string
          notes: string | null
          quantity_tonnes: number
          source_id: string | null
          source_type: string | null
          total_value: number | null
          unit_price: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          depot_id: string
          id?: string
          material_type_id: string
          movement_type: string
          notes?: string | null
          quantity_tonnes: number
          source_id?: string | null
          source_type?: string | null
          total_value?: number | null
          unit_price?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          depot_id?: string
          id?: string
          material_type_id?: string
          movement_type?: string
          notes?: string | null
          quantity_tonnes?: number
          source_id?: string | null
          source_type?: string | null
          total_value?: number | null
          unit_price?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_depot_id_fkey"
            columns: ["depot_id"]
            isOneToOne: false
            referencedRelation: "depots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_material_type_id_fkey"
            columns: ["material_type_id"]
            isOneToOne: false
            referencedRelation: "material_types"
            referencedColumns: ["id"]
          },
        ]
      }
      subcontractor_jobs: {
        Row: {
          agreed_rate: number | null
          completion_notes: string | null
          created_at: string | null
          id: string
          job_id: string
          quoted_rate: number | null
          status: string | null
          subcontractor_id: string
          user_id: string
        }
        Insert: {
          agreed_rate?: number | null
          completion_notes?: string | null
          created_at?: string | null
          id?: string
          job_id: string
          quoted_rate?: number | null
          status?: string | null
          subcontractor_id: string
          user_id: string
        }
        Update: {
          agreed_rate?: number | null
          completion_notes?: string | null
          created_at?: string | null
          id?: string
          job_id?: string
          quoted_rate?: number | null
          status?: string | null
          subcontractor_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcontractor_jobs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcontractor_jobs_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors"
            referencedColumns: ["id"]
          },
        ]
      }
      subcontractors: {
        Row: {
          active: boolean | null
          company_name: string
          contact_name: string | null
          created_at: string | null
          email: string | null
          id: string
          licence_expiry: string | null
          notes: string | null
          phone: string | null
          rate_per_hour: number | null
          rate_per_tonne: number | null
          rating: number | null
          regions_covered: string[] | null
          service_types: string[] | null
          updated_at: string | null
          user_id: string
          waste_carrier_licence: string | null
        }
        Insert: {
          active?: boolean | null
          company_name: string
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          licence_expiry?: string | null
          notes?: string | null
          phone?: string | null
          rate_per_hour?: number | null
          rate_per_tonne?: number | null
          rating?: number | null
          regions_covered?: string[] | null
          service_types?: string[] | null
          updated_at?: string | null
          user_id: string
          waste_carrier_licence?: string | null
        }
        Update: {
          active?: boolean | null
          company_name?: string
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          licence_expiry?: string | null
          notes?: string | null
          phone?: string | null
          rate_per_hour?: number | null
          rate_per_tonne?: number | null
          rating?: number | null
          regions_covered?: string[] | null
          service_types?: string[] | null
          updated_at?: string | null
          user_id?: string
          waste_carrier_licence?: string | null
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          active: boolean | null
          address: string | null
          company_name: string
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          notes: string | null
          payment_terms: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          address?: string | null
          company_name: string
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          address?: string | null
          company_name?: string
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_requests: {
        Row: {
          assigned_to: string | null
          company: string | null
          conversation_transcript: Json | null
          created_at: string
          email: string
          id: string
          message: string
          metadata: Json | null
          name: string | null
          phone: string | null
          priority: string | null
          request_type: string
          resolved_at: string | null
          source_page: string | null
          status: string
          subject: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          company?: string | null
          conversation_transcript?: Json | null
          created_at?: string
          email: string
          id?: string
          message: string
          metadata?: Json | null
          name?: string | null
          phone?: string | null
          priority?: string | null
          request_type?: string
          resolved_at?: string | null
          source_page?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          company?: string | null
          conversation_transcript?: Json | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          metadata?: Json | null
          name?: string | null
          phone?: string | null
          priority?: string | null
          request_type?: string
          resolved_at?: string | null
          source_page?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      suspicious_activity_log: {
        Row: {
          activity_type: string
          created_at: string | null
          customer_id: string | null
          description: string
          detected_at: string | null
          id: string
          job_id: string | null
          metadata: Json | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          severity: Database["public"]["Enums"]["risk_level"] | null
          status: Database["public"]["Enums"]["activity_status"] | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          customer_id?: string | null
          description: string
          detected_at?: string | null
          id?: string
          job_id?: string | null
          metadata?: Json | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: Database["public"]["Enums"]["risk_level"] | null
          status?: Database["public"]["Enums"]["activity_status"] | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          customer_id?: string | null
          description?: string
          detected_at?: string | null
          id?: string
          job_id?: string | null
          metadata?: Json | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: Database["public"]["Enums"]["risk_level"] | null
          status?: Database["public"]["Enums"]["activity_status"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suspicious_activity_log_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suspicious_activity_log_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      sustainability_reports: {
        Row: {
          co2_saved_kg: number | null
          created_at: string | null
          id: string
          landfill_tonnage: number | null
          recycled_tonnage: number | null
          recycling_rate_percent: number | null
          report_data: Json | null
          report_period_end: string
          report_period_start: string
          total_tonnage: number | null
          user_id: string
        }
        Insert: {
          co2_saved_kg?: number | null
          created_at?: string | null
          id?: string
          landfill_tonnage?: number | null
          recycled_tonnage?: number | null
          recycling_rate_percent?: number | null
          report_data?: Json | null
          report_period_end: string
          report_period_start: string
          total_tonnage?: number | null
          user_id: string
        }
        Update: {
          co2_saved_kg?: number | null
          created_at?: string | null
          id?: string
          landfill_tonnage?: number | null
          recycled_tonnage?: number | null
          recycling_rate_percent?: number | null
          report_data?: Json | null
          report_period_end?: string
          report_period_start?: string
          total_tonnage?: number | null
          user_id?: string
        }
        Relationships: []
      }
      terms_acceptances: {
        Row: {
          accepted_at: string
          consent_types: Json | null
          dpa_version: string | null
          id: string
          ip_address: string | null
          privacy_version: string | null
          region_detected: string | null
          terms_version: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          accepted_at?: string
          consent_types?: Json | null
          dpa_version?: string | null
          id?: string
          ip_address?: string | null
          privacy_version?: string | null
          region_detected?: string | null
          terms_version: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          accepted_at?: string
          consent_types?: Json | null
          dpa_version?: string | null
          id?: string
          ip_address?: string | null
          privacy_version?: string | null
          region_detected?: string | null
          terms_version?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      usage_records: {
        Row: {
          ai_requests_count: number | null
          created_at: string | null
          id: string
          jobs_count: number | null
          period_end: string
          period_start: string
          storage_bytes_used: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_requests_count?: number | null
          created_at?: string | null
          id?: string
          jobs_count?: number | null
          period_end: string
          period_start: string
          storage_bytes_used?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_requests_count?: number | null
          created_at?: string | null
          id?: string
          jobs_count?: number | null
          period_end?: string
          period_start?: string
          storage_bytes_used?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_segments: {
        Row: {
          computed_at: string
          confidence_score: number | null
          expires_at: string | null
          id: string
          metadata: Json | null
          segment_type: string
          segment_value: string
          user_id: string
        }
        Insert: {
          computed_at?: string
          confidence_score?: number | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          segment_type: string
          segment_value: string
          user_id: string
        }
        Update: {
          computed_at?: string
          confidence_score?: number | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          segment_type?: string
          segment_value?: string
          user_id?: string
        }
        Relationships: []
      }
      vehicle_locations: {
        Row: {
          accuracy: number | null
          heading: number | null
          id: string
          latitude: number
          longitude: number
          recorded_at: string | null
          speed: number | null
          user_id: string
          vehicle_id: string
        }
        Insert: {
          accuracy?: number | null
          heading?: number | null
          id?: string
          latitude: number
          longitude: number
          recorded_at?: string | null
          speed?: number | null
          user_id: string
          vehicle_id: string
        }
        Update: {
          accuracy?: number | null
          heading?: number | null
          id?: string
          latitude?: number
          longitude?: number
          recorded_at?: string | null
          speed?: number | null
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_locations_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          active: boolean | null
          capacity_tonnes: number | null
          created_at: string
          id: string
          last_service: string | null
          mot_expiry: string | null
          next_service_due: string | null
          registration: string
          updated_at: string
          user_id: string | null
          vehicle_type: string | null
        }
        Insert: {
          active?: boolean | null
          capacity_tonnes?: number | null
          created_at?: string
          id?: string
          last_service?: string | null
          mot_expiry?: string | null
          next_service_due?: string | null
          registration: string
          updated_at?: string
          user_id?: string | null
          vehicle_type?: string | null
        }
        Update: {
          active?: boolean | null
          capacity_tonnes?: number | null
          created_at?: string
          id?: string
          last_service?: string | null
          mot_expiry?: string | null
          next_service_due?: string | null
          registration?: string
          updated_at?: string
          user_id?: string | null
          vehicle_type?: string | null
        }
        Relationships: []
      }
      visual_test_baselines: {
        Row: {
          created_at: string
          id: string
          route_path: string
          screenshot_data: string | null
          screenshot_url: string | null
          updated_at: string
          user_id: string | null
          version: number
          viewport: string
        }
        Insert: {
          created_at?: string
          id?: string
          route_path: string
          screenshot_data?: string | null
          screenshot_url?: string | null
          updated_at?: string
          user_id?: string | null
          version?: number
          viewport?: string
        }
        Update: {
          created_at?: string
          id?: string
          route_path?: string
          screenshot_data?: string | null
          screenshot_url?: string | null
          updated_at?: string
          user_id?: string | null
          version?: number
          viewport?: string
        }
        Relationships: []
      }
      visual_test_notification_recipients: {
        Row: {
          active: boolean | null
          created_at: string
          email: string
          id: string
          name: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          email: string
          id?: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      visual_test_results: {
        Row: {
          baseline_id: string | null
          created_at: string
          current_screenshot_data: string | null
          diff_screenshot_data: string | null
          error_message: string | null
          id: string
          load_time_ms: number | null
          pixel_diff_percentage: number | null
          route_path: string
          status: string
          test_run_id: string
          user_id: string | null
          viewport: string
        }
        Insert: {
          baseline_id?: string | null
          created_at?: string
          current_screenshot_data?: string | null
          diff_screenshot_data?: string | null
          error_message?: string | null
          id?: string
          load_time_ms?: number | null
          pixel_diff_percentage?: number | null
          route_path: string
          status?: string
          test_run_id: string
          user_id?: string | null
          viewport?: string
        }
        Update: {
          baseline_id?: string | null
          created_at?: string
          current_screenshot_data?: string | null
          diff_screenshot_data?: string | null
          error_message?: string | null
          id?: string
          load_time_ms?: number | null
          pixel_diff_percentage?: number | null
          route_path?: string
          status?: string
          test_run_id?: string
          user_id?: string | null
          viewport?: string
        }
        Relationships: [
          {
            foreignKeyName: "visual_test_results_baseline_id_fkey"
            columns: ["baseline_id"]
            isOneToOne: false
            referencedRelation: "visual_test_baselines"
            referencedColumns: ["id"]
          },
        ]
      }
      visual_test_runs: {
        Row: {
          completed_at: string | null
          failed_tests: number | null
          id: string
          new_tests: number | null
          passed_tests: number | null
          started_at: string
          status: string
          total_tests: number | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          failed_tests?: number | null
          id?: string
          new_tests?: number | null
          passed_tests?: number | null
          started_at?: string
          status?: string
          total_tests?: number | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          failed_tests?: number | null
          id?: string
          new_tests?: number | null
          passed_tests?: number | null
          started_at?: string
          status?: string
          total_tests?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      waste_carrier_licences: {
        Row: {
          created_at: string | null
          customer_id: string | null
          expiry_date: string
          id: string
          is_verified: boolean | null
          last_verified_at: string | null
          licence_number: string
          licence_tier: Database["public"]["Enums"]["licence_tier"]
          registered_holder: string
          updated_at: string | null
          user_id: string
          verification_id: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          expiry_date: string
          id?: string
          is_verified?: boolean | null
          last_verified_at?: string | null
          licence_number: string
          licence_tier: Database["public"]["Enums"]["licence_tier"]
          registered_holder: string
          updated_at?: string | null
          user_id: string
          verification_id?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          expiry_date?: string
          id?: string
          is_verified?: boolean | null
          last_verified_at?: string | null
          licence_number?: string
          licence_tier?: Database["public"]["Enums"]["licence_tier"]
          registered_holder?: string
          updated_at?: string | null
          user_id?: string
          verification_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "waste_carrier_licences_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waste_carrier_licences_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "licence_verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json | null
          response_body: string | null
          response_status: number | null
          success: boolean | null
          webhook_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: Json | null
          response_body?: string | null
          response_status?: number | null
          success?: boolean | null
          webhook_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json | null
          response_body?: string | null
          response_status?: number | null
          success?: boolean | null
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          active: boolean | null
          created_at: string
          events: string[] | null
          id: string
          last_triggered_at: string | null
          name: string
          secret: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          events?: string[] | null
          id?: string
          last_triggered_at?: string | null
          name: string
          secret: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          events?: string[] | null
          id?: string
          last_triggered_at?: string | null
          name?: string
          secret?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      weighbridge_tickets: {
        Row: {
          created_at: string
          gross_weight: number
          id: string
          job_assignment_id: string | null
          net_weight: number
          ocr_confidence: number | null
          processed_by_ocr: boolean | null
          tare_weight: number
          ticket_date: string
          ticket_image_url: string | null
          ticket_number: string
          verified: boolean | null
          weighbridge_name: string
        }
        Insert: {
          created_at?: string
          gross_weight: number
          id?: string
          job_assignment_id?: string | null
          net_weight: number
          ocr_confidence?: number | null
          processed_by_ocr?: boolean | null
          tare_weight: number
          ticket_date: string
          ticket_image_url?: string | null
          ticket_number: string
          verified?: boolean | null
          weighbridge_name: string
        }
        Update: {
          created_at?: string
          gross_weight?: number
          id?: string
          job_assignment_id?: string | null
          net_weight?: number
          ocr_confidence?: number | null
          processed_by_ocr?: boolean | null
          tare_weight?: number
          ticket_date?: string
          ticket_image_url?: string | null
          ticket_number?: string
          verified?: boolean | null
          weighbridge_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "weighbridge_tickets_job_assignment_id_fkey"
            columns: ["job_assignment_id"]
            isOneToOne: false
            referencedRelation: "job_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      activity_status:
        | "pending_review"
        | "dismissed"
        | "confirmed_fraud"
        | "under_investigation"
      app_role: "admin" | "moderator" | "user"
      data_request_status:
        | "pending"
        | "processing"
        | "completed"
        | "rejected"
        | "expired"
      data_request_type:
        | "subject_access"
        | "deletion"
        | "portability"
        | "rectification"
        | "restriction"
      licence_tier: "upper" | "lower"
      retention_action: "archive" | "anonymize" | "delete"
      risk_level: "low" | "medium" | "high" | "critical"
      verification_status:
        | "valid"
        | "expired"
        | "suspended"
        | "not_found"
        | "pending"
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
      activity_status: [
        "pending_review",
        "dismissed",
        "confirmed_fraud",
        "under_investigation",
      ],
      app_role: ["admin", "moderator", "user"],
      data_request_status: [
        "pending",
        "processing",
        "completed",
        "rejected",
        "expired",
      ],
      data_request_type: [
        "subject_access",
        "deletion",
        "portability",
        "rectification",
        "restriction",
      ],
      licence_tier: ["upper", "lower"],
      retention_action: ["archive", "anonymize", "delete"],
      risk_level: ["low", "medium", "high", "critical"],
      verification_status: [
        "valid",
        "expired",
        "suspended",
        "not_found",
        "pending",
      ],
    },
  },
} as const
