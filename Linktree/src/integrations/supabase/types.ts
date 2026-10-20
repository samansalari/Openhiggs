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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          link_id: string | null
          referrer: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          link_id?: string | null
          referrer?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          link_id?: string | null
          referrer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "links"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          position: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          position?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          position?: number
        }
        Relationships: []
      }
      links: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_featured: boolean
          is_visible: boolean
          open_new_tab: boolean
          position: number
          thumbnail_url: string | null
          title: string
          url: string
          use_favicon: boolean
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_featured?: boolean
          is_visible?: boolean
          open_new_tab?: boolean
          position?: number
          thumbnail_url?: string | null
          title: string
          url: string
          use_favicon?: boolean
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_featured?: boolean
          is_visible?: boolean
          open_new_tab?: boolean
          position?: number
          thumbnail_url?: string | null
          title?: string
          url?: string
          use_favicon?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "links_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profile: {
        Row: {
          accent_color: string
          avatar_url: string | null
          background_style: string
          bio: string
          cv_path: string | null
          headline: string
          id: number
          location: string | null
          name: string
          seo_description: string | null
          seo_title: string | null
          show_categories: boolean
          theme: string
          updated_at: string
        }
        Insert: {
          accent_color?: string
          avatar_url?: string | null
          background_style?: string
          bio?: string
          cv_path?: string | null
          headline?: string
          id?: number
          location?: string | null
          name?: string
          seo_description?: string | null
          seo_title?: string | null
          show_categories?: boolean
          theme?: string
          updated_at?: string
        }
        Update: {
          accent_color?: string
          avatar_url?: string | null
          background_style?: string
          bio?: string
          cv_path?: string | null
          headline?: string
          id?: number
          location?: string | null
          name?: string
          seo_description?: string | null
          seo_title?: string | null
          show_categories?: boolean
          theme?: string
          updated_at?: string
        }
        Relationships: []
      }
      quiz: {
        Row: {
          id: number
          is_enabled: boolean
          option_a: string
          option_b: string
          option_c: string
          poster_url: string | null
          question: string
          reveal_answer: boolean
          round: number
          subtitle: string
          title: string
          updated_at: string
          video_url: string | null
          wrong_message: string
        }
        Insert: {
          id?: number
          is_enabled?: boolean
          option_a?: string
          option_b?: string
          option_c?: string
          poster_url?: string | null
          question?: string
          reveal_answer?: boolean
          round?: number
          subtitle?: string
          title?: string
          updated_at?: string
          video_url?: string | null
          wrong_message?: string
        }
        Update: {
          id?: number
          is_enabled?: boolean
          option_a?: string
          option_b?: string
          option_c?: string
          poster_url?: string | null
          question?: string
          reveal_answer?: boolean
          round?: number
          subtitle?: string
          title?: string
          updated_at?: string
          video_url?: string | null
          wrong_message?: string
        }
        Relationships: []
      }
      quiz_answer: {
        Row: {
          correct_option: string | null
          id: number
        }
        Insert: {
          correct_option?: string | null
          id?: number
        }
        Update: {
          correct_option?: string | null
          id?: number
        }
        Relationships: []
      }
      quiz_votes: {
        Row: {
          choice: string
          created_at: string
          id: string
          voter_hash: string
        }
        Insert: {
          choice: string
          created_at?: string
          id?: string
          voter_hash: string
        }
        Update: {
          choice?: string
          created_at?: string
          id?: string
          voter_hash?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          count: number
          key: string
          window_start: string
        }
        Insert: {
          count?: number
          key: string
          window_start: string
        }
        Update: {
          count?: number
          key?: string
          window_start?: string
        }
        Relationships: []
      }
      social_links: {
        Row: {
          created_at: string
          id: string
          platform: string
          position: number
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform: string
          position?: number
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          position?: number
          url?: string
        }
        Relationships: []
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
      admin_exists: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hit_rate_limit: {
        Args: { _key: string; _window_start: string }
        Returns: number
      }
      quiz_public_reveal: {
        Args: never
        Returns: {
          correct_option: string
          votes_a: number
          votes_b: number
          votes_c: number
        }[]
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
