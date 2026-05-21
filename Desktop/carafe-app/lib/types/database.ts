export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = "owner" | "manager" | "employee";
export type DelayType = "late" | "absence" | "early_leave";
export type DelayReason = "transport" | "personal" | "health" | "other";
export type ShiftType = "morning" | "afternoon" | "evening" | "night";
export type ChallengeStatus = "active" | "completed" | "cancelled";
export type FeedbackCategory = "compliment" | "complaint" | "suggestion" | "incident";
export type FeedbackStatus = "open" | "in_progress" | "resolved";
export type KudosContextType = "protocol_view" | "challenge_won" | "review_received" | "manual";
export type ProtocolCategory = "general" | "hygiene" | "service" | "security" | "opening" | "closing";

// Row types
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

type ProtocolRow = {
  id: string;
  establishment_id: string;
  author_id: string;
  title: string;
  content: string;
  category: ProtocolCategory;
  is_mandatory: boolean;
  attachment_url: string | null;
  attachment_type: string | null;
  attachment_name: string | null;
  created_at: string;
  updated_at: string;
};

type ProtocolReadRow = {
  id: string;
  protocol_id: string;
  profile_id: string;
  read_at: string;
};

type CustomerFeedbackRow = {
  id: string;
  establishment_id: string;
  reported_by: string | null;
  category: FeedbackCategory;
  content: string;
  table_number: string | null;
  status: FeedbackStatus;
  created_at: string;
};

type DelayRow = {
  id: string;
  establishment_id: string;
  employee_id: string;
  reported_by: string | null;
  shift_date: string;
  shift_type: ShiftType | null;
  delay_minutes: number;
  reason: string | null;
  created_at: string;
};

type ChallengeRow = {
  id: string;
  establishment_id: string;
  created_by: string;
  title: string;
  description: string | null;
  target_value: number | null;
  current_value: number;
  unit: string | null;
  starts_at: string;
  ends_at: string | null;
  status: ChallengeStatus;
  created_at: string;
};

type PushSubscriptionRow = {
  id: string;
  profile_id: string;
  establishment_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
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
        Insert: { establishment_id: string; profile_id: string; role: UserRole; job_title?: string | null; hired_at?: string | null; is_active?: boolean };
        Update: Partial<Omit<EstablishmentMemberRow, "id" | "joined_at">>;
        Relationships: [];
      };
      protocols: {
        Row: ProtocolRow;
        Insert: { establishment_id: string; author_id: string; title: string; content: string } & Partial<Omit<ProtocolRow, "id" | "created_at" | "updated_at" | "establishment_id" | "author_id" | "title" | "content">>;
        Update: Partial<Omit<ProtocolRow, "id" | "created_at">>;
        Relationships: [];
      };
      protocol_reads: {
        Row: ProtocolReadRow;
        Insert: { protocol_id: string; profile_id: string };
        Update: Partial<ProtocolReadRow>;
        Relationships: [];
      };
      customer_feedback: {
        Row: CustomerFeedbackRow;
        Insert: { establishment_id: string; category: FeedbackCategory; content: string } & Partial<Omit<CustomerFeedbackRow, "id" | "created_at" | "establishment_id" | "category" | "content">>;
        Update: Partial<Omit<CustomerFeedbackRow, "id" | "created_at">>;
        Relationships: [];
      };
      delays: {
        Row: DelayRow;
        Insert: { establishment_id: string; employee_id: string; shift_date: string; delay_minutes: number } & Partial<Omit<DelayRow, "id" | "created_at" | "establishment_id" | "employee_id" | "shift_date" | "delay_minutes">>;
        Update: Partial<Omit<DelayRow, "id" | "created_at">>;
        Relationships: [];
      };
      challenges: {
        Row: ChallengeRow;
        Insert: { establishment_id: string; created_by: string; title: string } & Partial<Omit<ChallengeRow, "id" | "created_at" | "establishment_id" | "created_by" | "title">>;
        Update: Partial<Omit<ChallengeRow, "id" | "created_at">>;
        Relationships: [];
      };
      push_subscriptions: {
        Row: PushSubscriptionRow;
        Insert: { profile_id: string; establishment_id: string; endpoint: string; p256dh: string; auth: string };
        Update: Partial<PushSubscriptionRow>;
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
export type Protocol = ProtocolRow;
export type CustomerFeedback = CustomerFeedbackRow;
export type Delay = DelayRow;
export type Challenge = ChallengeRow;

export type MemberWithProfile = EstablishmentMember & { profile: Profile };
export type EstablishmentWithRole = Establishment & { role: UserRole };
