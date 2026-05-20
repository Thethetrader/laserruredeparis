export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = "owner" | "manager" | "employee";
export type DelayType = "late" | "absence" | "early_leave";
export type DelayReason = "transport" | "personal" | "health" | "other";
export type ShiftType = "morning" | "evening" | "night";
export type ChallengeStatus = "draft" | "active" | "completed" | "cancelled";
export type ImprovementStatus = "open" | "in_progress" | "adopted" | "declined" | "archived";
export type FeedbackCategory = "plat" | "boisson" | "service" | "ambiance" | "autre";
export type FeedbackTone = "positive" | "negative";
export type FeedbackStatus = "active" | "archived" | "processed";
export type KudosContextType = "protocol_view" | "challenge_won" | "review_received" | "manual" | "competency_validated";

// Row types (flat, no circular refs)
type ProfileRow = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  external_combo_id: string | null;
  created_at: string;
  updated_at: string;
};

type EstablishmentRow = {
  id: string;
  owner_id: string;
  name: string;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string;
  logo_url: string | null;
  subscription_tier: string;
  subscription_status: string;
  trial_ends_at: string;
  weekly_recap_day: string;
  weekly_recap_enabled: boolean;
  created_at: string;
};

type EstablishmentMemberRow = {
  id: string;
  establishment_id: string;
  profile_id: string;
  role: UserRole;
  job_title: string | null;
  hired_at: string | null;
  joined_at: string;
  is_active: boolean;
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Omit<ProfileRow, "created_at" | "updated_at">;
        Update: Partial<Omit<ProfileRow, "created_at" | "updated_at">>;
        Relationships: [];
      };
      establishments: {
        Row: EstablishmentRow;
        Insert: { name: string; owner_id: string } & Partial<Omit<EstablishmentRow, "id" | "created_at" | "name" | "owner_id">>;
        Update: Partial<Omit<EstablishmentRow, "id" | "created_at">>;
        Relationships: [];
      };
      establishment_members: {
        Row: EstablishmentMemberRow;
        Insert: {
          establishment_id: string;
          profile_id: string;
          role: UserRole;
          job_title?: string | null;
          hired_at?: string | null;
          is_active?: boolean;
        };
        Update: Partial<Omit<EstablishmentMemberRow, "id" | "joined_at">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// Convenience types
export type Profile = ProfileRow;
export type Establishment = EstablishmentRow;
export type EstablishmentMember = EstablishmentMemberRow;

export type MemberWithProfile = EstablishmentMember & {
  profile: Profile;
};

export type EstablishmentWithRole = Establishment & {
  role: UserRole;
};
