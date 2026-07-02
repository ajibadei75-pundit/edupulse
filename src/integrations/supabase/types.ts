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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          meta: Json | null
          target: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          meta?: Json | null
          target?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          meta?: Json | null
          target?: string | null
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      cbt_attempts: {
        Row: {
          answers: Json | null
          completed_at: string
          duration_seconds: number | null
          id: string
          score: number
          subject_id: string
          total: number
          user_id: string
        }
        Insert: {
          answers?: Json | null
          completed_at?: string
          duration_seconds?: number | null
          id?: string
          score?: number
          subject_id: string
          total?: number
          user_id: string
        }
        Update: {
          answers?: Json | null
          completed_at?: string
          duration_seconds?: number | null
          id?: string
          score?: number
          subject_id?: string
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cbt_attempts_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "cbt_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      cbt_questions: {
        Row: {
          correct_option: string
          created_at: string
          difficulty: string | null
          explanation: string | null
          id: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question: string
          subject_id: string
          year: number | null
        }
        Insert: {
          correct_option: string
          created_at?: string
          difficulty?: string | null
          explanation?: string | null
          id?: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question: string
          subject_id: string
          year?: number | null
        }
        Update: {
          correct_option?: string
          created_at?: string
          difficulty?: string | null
          explanation?: string | null
          id?: string
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          question?: string
          subject_id?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cbt_questions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "cbt_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      cbt_subjects: {
        Row: {
          created_at: string
          description: string | null
          exam_type: Database["public"]["Enums"]["exam_type"]
          id: string
          name: string
          question_count: number
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          exam_type: Database["public"]["Enums"]["exam_type"]
          id?: string
          name: string
          question_count?: number
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          exam_type?: Database["public"]["Enums"]["exam_type"]
          id?: string
          name?: string
          question_count?: number
          slug?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          course_id: string | null
          id: string
          issued_at: string
          title: string
          user_id: string
          verification_code: string
        }
        Insert: {
          course_id?: string | null
          id?: string
          issued_at?: string
          title: string
          user_id: string
          verification_code?: string
        }
        Update: {
          course_id?: string | null
          id?: string
          issued_at?: string
          title?: string
          user_id?: string
          verification_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          category: string | null
          comments_count: number
          content: string
          created_at: string
          id: string
          likes_count: number
          user_id: string
        }
        Insert: {
          category?: string | null
          comments_count?: number
          content: string
          created_at?: string
          id?: string
          likes_count?: number
          user_id: string
        }
        Update: {
          category?: string | null
          comments_count?: number
          content?: string
          created_at?: string
          id?: string
          likes_count?: number
          user_id?: string
        }
        Relationships: []
      }
      counseling_sessions: {
        Row: {
          counselor_id: string | null
          created_at: string
          id: string
          notes: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["session_status"]
          topic: string | null
          type: Database["public"]["Enums"]["counseling_type"]
          user_id: string
        }
        Insert: {
          counselor_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["session_status"]
          topic?: string | null
          type: Database["public"]["Enums"]["counseling_type"]
          user_id: string
        }
        Update: {
          counselor_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["session_status"]
          topic?: string | null
          type?: Database["public"]["Enums"]["counseling_type"]
          user_id?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          category: string
          cover_url: string | null
          created_at: string
          created_by: string | null
          department: string | null
          description: string | null
          duration_hours: number | null
          id: string
          is_published: boolean
          level: string | null
          slug: string
          title: string
        }
        Insert: {
          category: string
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          is_published?: boolean
          level?: string | null
          slug: string
          title: string
        }
        Update: {
          category?: string
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          is_published?: boolean
          level?: string | null
          slug?: string
          title?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          completed: boolean
          completed_at: string | null
          course_id: string
          enrolled_at: string
          id: string
          last_lesson_id: string | null
          progress: number
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          course_id: string
          enrolled_at?: string
          id?: string
          last_lesson_id?: string | null
          progress?: number
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          course_id?: string
          enrolled_at?: string
          id?: string
          last_lesson_id?: string | null
          progress?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_last_lesson_id_fkey"
            columns: ["last_lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      event_feedback: {
        Row: {
          comments: string | null
          created_at: string
          email: string | null
          event_id: string
          full_name: string | null
          id: string
          rating: number
          user_id: string | null
        }
        Insert: {
          comments?: string | null
          created_at?: string
          email?: string | null
          event_id: string
          full_name?: string | null
          id?: string
          rating: number
          user_id?: string | null
        }
        Update: {
          comments?: string | null
          created_at?: string
          email?: string | null
          event_id?: string
          full_name?: string | null
          id?: string
          rating?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_feedback_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          created_at: string
          email: string
          event_id: string
          full_name: string
          id: string
          phone: string | null
          responses: Json
          school: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          event_id: string
          full_name: string
          id?: string
          phone?: string | null
          responses?: Json
          school?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          event_id?: string
          full_name?: string
          id?: string
          phone?: string | null
          responses?: Json
          school?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          capacity: number | null
          cover_url: string | null
          created_at: string
          created_by: string | null
          custom_fields: Json
          description: string | null
          ends_at: string | null
          feedback_open: boolean
          id: string
          is_published: boolean
          location: string | null
          slug: string
          starts_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          custom_fields?: Json
          description?: string | null
          ends_at?: string | null
          feedback_open?: boolean
          id?: string
          is_published?: boolean
          location?: string | null
          slug: string
          starts_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          custom_fields?: Json
          description?: string | null
          ends_at?: string | null
          feedback_open?: boolean
          id?: string
          is_published?: boolean
          location?: string | null
          slug?: string
          starts_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      islamic_progress: {
        Row: {
          created_at: string
          id: string
          milestone: string
          notes: string | null
          program: string
          recorded_by: string | null
          score: number | null
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          milestone: string
          notes?: string | null
          program: string
          recorded_by?: string | null
          score?: number | null
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          milestone?: string
          notes?: string | null
          program?: string
          recorded_by?: string | null
          score?: number | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "islamic_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content: string | null
          course_id: string
          created_at: string
          id: string
          position: number
          title: string
          video_url: string | null
        }
        Insert: {
          content?: string | null
          course_id: string
          created_at?: string
          id?: string
          position?: number
          title: string
          video_url?: string | null
        }
        Update: {
          content?: string | null
          course_id?: string
          created_at?: string
          id?: string
          position?: number
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      library_bookmarks: {
        Row: {
          created_at: string
          id: string
          resource_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          resource_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          resource_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_bookmarks_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "library_resources"
            referencedColumns: ["id"]
          },
        ]
      }
      library_resources: {
        Row: {
          created_at: string
          description: string | null
          download_allowed: boolean
          external_url: string | null
          file_path: string | null
          id: string
          level: string | null
          resource_type: string
          subject: string | null
          title: string
          topic: string | null
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          download_allowed?: boolean
          external_url?: string | null
          file_path?: string | null
          id?: string
          level?: string | null
          resource_type?: string
          subject?: string | null
          title: string
          topic?: string | null
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          description?: string | null
          download_allowed?: boolean
          external_url?: string | null
          file_path?: string | null
          id?: string
          level?: string | null
          resource_type?: string
          subject?: string | null
          title?: string
          topic?: string | null
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      live_classes: {
        Row: {
          course_id: string | null
          created_at: string
          department: string | null
          description: string | null
          duration_minutes: number
          host_id: string
          id: string
          meeting_url: string
          starts_at: string
          subject: string | null
          title: string
          updated_at: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          department?: string | null
          description?: string | null
          duration_minutes?: number
          host_id: string
          id?: string
          meeting_url: string
          starts_at: string
          subject?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          department?: string | null
          description?: string | null
          duration_minutes?: number
          host_id?: string
          id?: string
          meeting_url?: string
          starts_at?: string
          subject?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_classes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      news_items: {
        Row: {
          body: string | null
          category: string | null
          cover_url: string | null
          excerpt: string | null
          id: string
          published_at: string
          slug: string
          title: string
        }
        Insert: {
          body?: string | null
          category?: string | null
          cover_url?: string | null
          excerpt?: string | null
          id?: string
          published_at?: string
          slug: string
          title: string
        }
        Update: {
          body?: string | null
          category?: string | null
          cover_url?: string | null
          excerpt?: string | null
          id?: string
          published_at?: string
          slug?: string
          title?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          read_at: string | null
          title: string
          url: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind: string
          read_at?: string | null
          title: string
          url?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          read_at?: string | null
          title?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      parent_links: {
        Row: {
          created_at: string
          id: string
          parent_id: string
          status: string
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          parent_id: string
          status?: string
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          parent_id?: string
          status?: string
          student_id?: string
        }
        Relationships: []
      }
      post_comments: {
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
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
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
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          bio: string | null
          country: string | null
          created_at: string
          department: string | null
          full_name: string | null
          goals: string | null
          id: string
          institution: string | null
          interests: string[] | null
          invite_code: string | null
          level: string | null
          phone: string | null
          school: string | null
          streak_days: number
          updated_at: string
        }
        Insert: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string
          department?: string | null
          full_name?: string | null
          goals?: string | null
          id: string
          institution?: string | null
          interests?: string[] | null
          invite_code?: string | null
          level?: string | null
          phone?: string | null
          school?: string | null
          streak_days?: number
          updated_at?: string
        }
        Update: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string
          department?: string | null
          full_name?: string | null
          goals?: string | null
          id?: string
          institution?: string | null
          interests?: string[] | null
          invite_code?: string | null
          level?: string | null
          phone?: string | null
          school?: string | null
          streak_days?: number
          updated_at?: string
        }
        Relationships: []
      }
      scholarships: {
        Row: {
          amount: string | null
          apply_url: string | null
          category: string | null
          created_at: string
          deadline: string | null
          description: string | null
          id: string
          slug: string
          sponsor: string | null
          title: string
        }
        Insert: {
          amount?: string | null
          apply_url?: string | null
          category?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          slug: string
          sponsor?: string | null
          title: string
        }
        Update: {
          amount?: string | null
          apply_url?: string | null
          category?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          slug?: string
          sponsor?: string | null
          title?: string
        }
        Relationships: []
      }
      school_courses: {
        Row: {
          course_name: string
          created_at: string
          faculty: string | null
          id: string
          jamb_cutoff: number
          min_waec_credits: number
          notes: string | null
          required_subjects: Json
          school_id: string
        }
        Insert: {
          course_name: string
          created_at?: string
          faculty?: string | null
          id?: string
          jamb_cutoff?: number
          min_waec_credits?: number
          notes?: string | null
          required_subjects?: Json
          school_id: string
        }
        Update: {
          course_name?: string
          created_at?: string
          faculty?: string | null
          id?: string
          jamb_cutoff?: number
          min_waec_credits?: number
          notes?: string | null
          required_subjects?: Json
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_courses_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          ownership: string | null
          short_name: string | null
          slug: string
          state: string | null
          type: string | null
          website: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          ownership?: string | null
          short_name?: string | null
          slug: string
          state?: string | null
          type?: string | null
          website?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          ownership?: string | null
          short_name?: string | null
          slug?: string
          state?: string | null
          type?: string | null
          website?: string | null
        }
        Relationships: []
      }
      site_feedback: {
        Row: {
          category: string | null
          created_at: string
          email: string | null
          id: string
          message: string
          page: string | null
          rating: number | null
          status: string
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          email?: string | null
          id?: string
          message: string
          page?: string | null
          rating?: number | null
          status?: string
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          email?: string | null
          id?: string
          message?: string
          page?: string | null
          rating?: number | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          address: string | null
          favicon_url: string | null
          id: boolean
          logo_url: string | null
          site_name: string
          support_email: string | null
          support_phone: string | null
          tagline: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          favicon_url?: string | null
          id?: boolean
          logo_url?: string | null
          site_name?: string
          support_email?: string | null
          support_phone?: string | null
          tagline?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          favicon_url?: string | null
          id?: boolean
          logo_url?: string | null
          site_name?: string
          support_email?: string | null
          support_phone?: string | null
          tagline?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      student_results: {
        Row: {
          created_at: string
          id: string
          jamb_score: number | null
          jamb_subjects: Json
          notes: string | null
          preferred_course: string | null
          preferred_state: string | null
          updated_at: string
          user_id: string
          waec_subjects: Json
        }
        Insert: {
          created_at?: string
          id?: string
          jamb_score?: number | null
          jamb_subjects?: Json
          notes?: string | null
          preferred_course?: string | null
          preferred_state?: string | null
          updated_at?: string
          user_id: string
          waec_subjects?: Json
        }
        Update: {
          created_at?: string
          id?: string
          jamb_score?: number | null
          jamb_subjects?: Json
          notes?: string | null
          preferred_course?: string | null
          preferred_state?: string | null
          updated_at?: string
          user_id?: string
          waec_subjects?: Json
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
      admin_search_users: {
        Args: { _q: string }
        Returns: {
          avatar_url: string
          full_name: string
          id: string
          roles: string[]
          school: string
        }[]
      }
      assign_user_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _target: string
        }
        Returns: undefined
      }
      gen_invite_code: { Args: never; Returns: string }
      get_cbt_leaderboard: {
        Args: { _limit?: number }
        Returns: {
          attempts: number
          avatar_url: string
          avg_score: number
          full_name: string
          school: string
          user_id: string
        }[]
      }
      get_my_private_profile: {
        Args: never
        Returns: {
          invite_code: string
          phone: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_approved: { Args: { _uid: string }; Returns: boolean }
      link_student_by_code: { Args: { _code: string }; Returns: string }
      revoke_user_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _target: string
        }
        Returns: undefined
      }
      set_student_approval: {
        Args: { _status: string; _student: string }
        Returns: undefined
      }
      verify_certificate: {
        Args: { _code: string }
        Returns: {
          holder_name: string
          issued_at: string
          title: string
        }[]
      }
    }
    Enums: {
      app_role:
        | "student"
        | "tutor"
        | "admin"
        | "super_admin"
        | "cbt_admin"
        | "content_admin"
        | "finance_admin"
        | "islamic_admin"
        | "parent"
        | "hod"
        | "islamic_organizer"
      counseling_type: "academic" | "career" | "admission" | "personal"
      exam_type:
        | "waec"
        | "jamb"
        | "neco"
        | "post_utme"
        | "professional"
        | "mock"
      session_status: "pending" | "confirmed" | "completed" | "cancelled"
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
      app_role: [
        "student",
        "tutor",
        "admin",
        "super_admin",
        "cbt_admin",
        "content_admin",
        "finance_admin",
        "islamic_admin",
        "parent",
        "hod",
        "islamic_organizer",
      ],
      counseling_type: ["academic", "career", "admission", "personal"],
      exam_type: ["waec", "jamb", "neco", "post_utme", "professional", "mock"],
      session_status: ["pending", "confirmed", "completed", "cancelled"],
    },
  },
} as const
