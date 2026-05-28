export type Database = {
  public: {
    Tables: {
      fan_profiles: {
        Row: {
          id: string;
          wallet_address: string;
          country_code: string;
          display_name: string | null;
          total_points: number;
          check_in_streak: number;
          longest_streak: number;
          badge_count: number;
          joined_at: string;
          updated_at: string;
        };
        Insert: {
          wallet_address: string;
          country_code: string;
          display_name?: string | null;
          total_points?: number;
          check_in_streak?: number;
          longest_streak?: number;
          badge_count?: number;
        };
        Update: {
          country_code?: string;
          display_name?: string | null;
          total_points?: number;
          check_in_streak?: number;
          longest_streak?: number;
          badge_count?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      check_ins: {
        Row: {
          id: string;
          fan_id: string;
          fixture_id: number;
          checked_in_at: string;
          points_earned: number;
        };
        Insert: {
          fan_id: string;
          fixture_id: number;
          points_earned?: number;
        };
        Update: {
          points_earned?: number;
        };
        Relationships: [];
      };
      quest_completions: {
        Row: {
          id: string;
          fan_id: string;
          quest_id: string;
          fixture_id: number;
          answer: string | null;
          points_earned: number;
          completed_at: string;
        };
        Insert: {
          fan_id: string;
          quest_id: string;
          fixture_id: number;
          answer?: string | null;
          points_earned?: number;
        };
        Update: {
          answer?: string | null;
          points_earned?: number;
        };
        Relationships: [];
      };
      badges_earned: {
        Row: {
          id: string;
          fan_id: string;
          badge_type: string;
          token_id: number | null;
          tx_hash: string | null;
          earned_at: string;
        };
        Insert: {
          fan_id: string;
          badge_type: string;
          token_id?: number | null;
          tx_hash?: string | null;
        };
        Update: {
          token_id?: number | null;
          tx_hash?: string | null;
        };
        Relationships: [];
      };
      country_stats: {
        Row: {
          country_code: string;
          total_points: number;
          fan_count: number;
          updated_at: string;
        };
        Insert: {
          country_code: string;
          total_points?: number;
          fan_count?: number;
        };
        Update: {
          total_points?: number;
          fan_count?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      increment_country_stats: {
        Args: { p_country: string; p_points: number; p_fans: number };
        Returns: undefined;
      };
    };
  };
};
