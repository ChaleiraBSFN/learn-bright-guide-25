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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      ad_rewards: {
        Row: {
          credits_granted: number
          id: string
          user_id: string
          watched_at: string
        }
        Insert: {
          credits_granted?: number
          id?: string
          user_id: string
          watched_at?: string
        }
        Update: {
          credits_granted?: number
          id?: string
          user_id?: string
          watched_at?: string
        }
        Relationships: []
      }
      ai_config: {
        Row: {
          config_data: Json
          created_at: string
          id: string
          section: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          config_data?: Json
          created_at?: string
          id?: string
          section: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          config_data?: Json
          created_at?: string
          id?: string
          section?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      ai_response_cache: {
        Row: {
          cache_key: string
          created_at: string
          endpoint: string
          expires_at: string
          hits: number
          id: string
          response: Json
        }
        Insert: {
          cache_key: string
          created_at?: string
          endpoint: string
          expires_at?: string
          hits?: number
          id?: string
          response: Json
        }
        Update: {
          cache_key?: string
          created_at?: string
          endpoint?: string
          expires_at?: string
          hits?: number
          id?: string
          response?: Json
        }
        Relationships: []
      }
      carousel_items: {
        Row: {
          active: boolean
          color_theme: string
          created_at: string
          created_by: string | null
          description: string
          detail: string
          examples: string[]
          icon: string
          id: string
          item_key: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          color_theme?: string
          created_at?: string
          created_by?: string | null
          description: string
          detail?: string
          examples?: string[]
          icon?: string
          id?: string
          item_key: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          color_theme?: string
          created_at?: string
          created_by?: string | null
          description?: string
          detail?: string
          examples?: string[]
          icon?: string
          id?: string
          item_key?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      classroom_answers: {
        Row: {
          answers: Json
          classroom_id: string
          created_at: string
          id: string
          material_id: string
          score: number | null
          student_id: string
        }
        Insert: {
          answers?: Json
          classroom_id: string
          created_at?: string
          id?: string
          material_id: string
          score?: number | null
          student_id: string
        }
        Update: {
          answers?: Json
          classroom_id?: string
          created_at?: string
          id?: string
          material_id?: string
          score?: number | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classroom_answers_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_answers_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "classroom_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_answers_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "classroom_students"
            referencedColumns: ["id"]
          },
        ]
      }
      classroom_live_state: {
        Row: {
          classroom_id: string
          is_live: boolean
          material_id: string | null
          section_index: number
          updated_at: string
        }
        Insert: {
          classroom_id: string
          is_live?: boolean
          material_id?: string | null
          section_index?: number
          updated_at?: string
        }
        Update: {
          classroom_id?: string
          is_live?: boolean
          material_id?: string | null
          section_index?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classroom_live_state_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: true
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_live_state_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "classroom_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      classroom_materials: {
        Row: {
          classroom_id: string
          content: Json
          created_at: string
          id: string
          title: string
          type: string
        }
        Insert: {
          classroom_id: string
          content?: Json
          created_at?: string
          id?: string
          title: string
          type?: string
        }
        Update: {
          classroom_id?: string
          content?: Json
          created_at?: string
          id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "classroom_materials_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
        ]
      }
      classroom_messages: {
        Row: {
          author_name: string
          classroom_id: string
          created_at: string
          id: string
          message: string
          student_id: string | null
          teacher_id: string | null
        }
        Insert: {
          author_name: string
          classroom_id: string
          created_at?: string
          id?: string
          message: string
          student_id?: string | null
          teacher_id?: string | null
        }
        Update: {
          author_name?: string
          classroom_id?: string
          created_at?: string
          id?: string
          message?: string
          student_id?: string | null
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classroom_messages_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_messages_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "classroom_students"
            referencedColumns: ["id"]
          },
        ]
      }
      classroom_students: {
        Row: {
          classroom_id: string
          display_name: string
          id: string
          joined_at: string
          last_seen_at: string
          session_token: string
        }
        Insert: {
          classroom_id: string
          display_name: string
          id?: string
          joined_at?: string
          last_seen_at?: string
          session_token?: string
        }
        Update: {
          classroom_id?: string
          display_name?: string
          id?: string
          joined_at?: string
          last_seen_at?: string
          session_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "classroom_students_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
        ]
      }
      classrooms: {
        Row: {
          created_at: string
          id: string
          is_open: boolean
          join_key: string
          name: string
          subject: string | null
          teacher_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_open?: boolean
          join_key: string
          name: string
          subject?: string | null
          teacher_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_open?: boolean
          join_key?: string
          name?: string
          subject?: string | null
          teacher_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      community_buddies: {
        Row: {
          amount: number
          author_id: string
          created_at: string
          donor_id: string
          id: string
          post_id: string
        }
        Insert: {
          amount?: number
          author_id: string
          created_at?: string
          donor_id: string
          id?: string
          post_id: string
        }
        Update: {
          amount?: number
          author_id?: string
          created_at?: string
          donor_id?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_buddies_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          buddy_count: number
          comment_count: number
          content: string | null
          created_at: string
          id: string
          image_url: string | null
          like_count: number
          title: string
          type: string
          user_id: string
        }
        Insert: {
          buddy_count?: number
          comment_count?: number
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          like_count?: number
          title: string
          type: string
          user_id: string
        }
        Update: {
          buddy_count?: number
          comment_count?: number
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          like_count?: number
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      engine_notices: {
        Row: {
          created_at: string
          engine_key: string
          engine_name: string
          id: string
          notice_message: string | null
          show_banner: boolean
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          engine_key: string
          engine_name: string
          id?: string
          notice_message?: string | null
          show_banner?: boolean
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          engine_key?: string
          engine_name?: string
          id?: string
          notice_message?: string | null
          show_banner?: boolean
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      feature_purchases: {
        Row: {
          created_at: string
          expires_at: string | null
          feature_type: string
          id: string
          purchased_at: string | null
          status: string
          stripe_payment_id: string | null
          study_content_id: string | null
          study_topic: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          feature_type: string
          id?: string
          purchased_at?: string | null
          status?: string
          stripe_payment_id?: string | null
          study_content_id?: string | null
          study_topic: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          feature_type?: string
          id?: string
          purchased_at?: string | null
          status?: string
          stripe_payment_id?: string | null
          study_content_id?: string | null
          study_topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promo_banners: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          cta_label: string
          daily_end_minutes: number | null
          daily_start_minutes: number | null
          days_of_week: number[] | null
          description: string
          end_at: string | null
          icon: string
          id: string
          max_per_day: number | null
          max_per_week: number | null
          route: string
          sort_order: number
          start_at: string | null
          title: string
          variant: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          cta_label?: string
          daily_end_minutes?: number | null
          daily_start_minutes?: number | null
          days_of_week?: number[] | null
          description: string
          end_at?: string | null
          icon?: string
          id?: string
          max_per_day?: number | null
          max_per_week?: number | null
          route?: string
          sort_order?: number
          start_at?: string | null
          title: string
          variant?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          cta_label?: string
          daily_end_minutes?: number | null
          daily_start_minutes?: number | null
          days_of_week?: number[] | null
          description?: string
          end_at?: string | null
          icon?: string
          id?: string
          max_per_day?: number | null
          max_per_week?: number | null
          route?: string
          sort_order?: number
          start_at?: string | null
          title?: string
          variant?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          request_count: number
          user_id: string
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          request_count?: number
          user_id: string
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          request_count?: number
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      section_flags: {
        Row: {
          created_at: string
          cta_label: string | null
          cta_url: string | null
          enabled: boolean
          id: string
          message: string
          section_key: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          enabled?: boolean
          id?: string
          message?: string
          section_key: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          enabled?: boolean
          id?: string
          message?: string
          section_key?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      site_visits: {
        Row: {
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          ip_country: string | null
          page_views: number | null
          search_queries: string[] | null
          session_id: string
          started_at: string
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          ip_country?: string | null
          page_views?: number | null
          search_queries?: string[] | null
          session_id: string
          started_at?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          ip_country?: string | null
          page_views?: number | null
          search_queries?: string[] | null
          session_id?: string
          started_at?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      study_group_invites: {
        Row: {
          created_at: string
          group_id: string
          id: string
          invite_email: string | null
          invite_token: string
          invited_by: string
          status: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          invite_email?: string | null
          invite_token?: string
          invited_by: string
          status?: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          invite_email?: string | null
          invite_token?: string
          invited_by?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_group_invites_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      study_group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      study_group_messages: {
        Row: {
          created_at: string
          group_id: string
          id: string
          image_url: string | null
          message: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          image_url?: string | null
          message?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          image_url?: string | null
          message?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_group_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      study_groups: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          max_members: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          max_members?: number
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          max_members?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          credits_period: string | null
          expires_at: string | null
          id: string
          pix_payment_proof: string | null
          plan_type: string
          price_id: string | null
          starts_at: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_period?: string | null
          expires_at?: string | null
          id?: string
          pix_payment_proof?: string | null
          plan_type?: string
          price_id?: string | null
          starts_at?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_period?: string | null
          expires_at?: string | null
          id?: string
          pix_payment_proof?: string | null
          plan_type?: string
          price_id?: string | null
          starts_at?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          admin_id: string | null
          created_at: string
          id: string
          is_admin_reply: boolean
          message: string
          user_id: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string
          id?: string
          is_admin_reply?: boolean
          message: string
          user_id: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string
          id?: string
          is_admin_reply?: boolean
          message?: string
          user_id?: string
        }
        Relationships: []
      }
      update_notices: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          id: string
          message: string
          title: string
          type: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          message: string
          title: string
          type?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: number
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: number
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: number
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          created_at: string
          credits_remaining: number
          id: string
          total_earned: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_remaining?: number
          id?: string
          total_earned?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_remaining?: number
          id?: string
          total_earned?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_history: {
        Row: {
          content: Json | null
          created_at: string
          id: string
          level: string | null
          topic: string
          type: string
          user_id: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          id?: string
          level?: string | null
          topic: string
          type: string
          user_id: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          id?: string
          level?: string | null
          topic?: string
          type?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_credits: {
        Args: { _amount: number; _user_id: string }
        Returns: number
      }
      admin_set_test_buddy: { Args: { _enable: boolean }; Returns: boolean }
      approve_feature_purchase: {
        Args: { _purchase_id: string }
        Returns: {
          created_at: string
          expires_at: string | null
          feature_type: string
          id: string
          purchased_at: string | null
          status: string
          stripe_payment_id: string | null
          study_content_id: string | null
          study_topic: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "feature_purchases"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      approve_subscription: {
        Args: { _subscription_id: string }
        Returns: {
          created_at: string
          credits_period: string | null
          expires_at: string | null
          id: string
          pix_payment_proof: string | null
          plan_type: string
          price_id: string | null
          starts_at: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "subscriptions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      check_rate_limit: {
        Args: {
          _endpoint: string
          _max_requests?: number
          _user_id: string
          _window_minutes?: number
        }
        Returns: boolean
      }
      claim_ad_reward: { Args: never; Returns: Json }
      classroom_join: {
        Args: { _display_name: string; _join_key: string }
        Returns: Json
      }
      classroom_leave: {
        Args: { _classroom_id: string; _session_token: string }
        Returns: Json
      }
      classroom_peek: { Args: { _join_key: string }; Returns: Json }
      classroom_send_message: {
        Args: {
          _classroom_id: string
          _message: string
          _session_token: string
        }
        Returns: Json
      }
      classroom_state: {
        Args: { _classroom_id: string; _session_token: string }
        Returns: Json
      }
      classroom_student_id: {
        Args: { _classroom_id: string; _session_token: string }
        Returns: string
      }
      classroom_submit_answers: {
        Args: {
          _answers: Json
          _classroom_id: string
          _material_id: string
          _score: number
          _session_token: string
        }
        Returns: Json
      }
      cleanup_expired_ai_cache: { Args: never; Returns: undefined }
      cleanup_old_classroom_students: { Args: never; Returns: undefined }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      create_pending_subscription: {
        Args: never
        Returns: {
          created_at: string
          credits_period: string | null
          expires_at: string | null
          id: string
          pix_payment_proof: string | null
          plan_type: string
          price_id: string | null
          starts_at: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "subscriptions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      donate_buddy: {
        Args: { _amount?: number; _post_id: string }
        Returns: number
      }
      get_credits: { Args: { _user_id: string }; Returns: number }
      get_group_member_history: {
        Args: { _group_id: string }
        Returns: {
          created_at: string
          display_name: string
          id: string
          level: string
          topic: string
          type: string
        }[]
      }
      get_online_now: {
        Args: { _window_seconds?: number }
        Returns: {
          online_count: number
          registered_count: number
        }[]
      }
      get_pending_feature_purchases: {
        Args: never
        Returns: {
          created_at: string
          feature_type: string
          id: string
          payment_proof: string
          status: string
          study_topic: string
          user_email: string
          user_id: string
        }[]
      }
      get_pending_subscriptions: {
        Args: never
        Returns: {
          created_at: string
          id: string
          pix_payment_proof: string
          plan_type: string
          status: string
          user_email: string
          user_id: string
        }[]
      }
      get_public_ranking: {
        Args: { _limit?: number }
        Returns: {
          achievement_count: number
          display_name: string
          user_id: string
        }[]
      }
      get_public_stats: {
        Args: never
        Returns: {
          studies_count: number
          users_count: number
        }[]
      }
      get_rate_limit_remaining: {
        Args: {
          _endpoint: string
          _max_requests?: number
          _user_id: string
          _window_minutes?: number
        }
        Returns: number
      }
      get_site_analytics: {
        Args: never
        Returns: {
          duration_seconds: number
          ended_at: string
          id: string
          is_registered: boolean
          page_views: number
          search_queries: string[]
          session_id: string
          started_at: string
          user_agent: string
          user_email: string
          user_id: string
        }[]
      }
      grant_achievement: {
        Args: { _achievement_id: number; _user_id: string }
        Returns: undefined
      }
      grant_buddy_monthly_credits: {
        Args: { _amount?: number; _period: string; _user_id: string }
        Returns: number
      }
      has_feature_access: {
        Args: { _feature_type: string; _study_topic: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_test_buddy: { Args: { _user_id: string }; Returns: boolean }
      is_buddy: { Args: { _user_id: string }; Returns: boolean }
      is_classroom_teacher: {
        Args: { _classroom_id: string }
        Returns: boolean
      }
      is_group_admin: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      is_group_member: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      sync_buddy_subscription: {
        Args: {
          _expires_at: string
          _price_id?: string
          _status: string
          _stripe_customer_id?: string
          _stripe_subscription_id?: string
          _user_id: string
        }
        Returns: undefined
      }
      track_site_visit: {
        Args: {
          _search_query?: string
          _session_id: string
          _user_agent?: string
        }
        Returns: string
      }
      use_credit: { Args: { _user_id: string }; Returns: number }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
