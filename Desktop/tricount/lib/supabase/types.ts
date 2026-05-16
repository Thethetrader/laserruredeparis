export type Database = {
  public: {
    Views: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
    Tables: {
      couples: {
        Row: { id: string; name: string; currency: string; created_at: string }
        Insert: { id?: string; name: string; currency?: string; created_at?: string }
        Update: { id?: string; name?: string; currency?: string; created_at?: string }
      }
      couple_members: {
        Row: {
          couple_id: string
          user_id: string
          display_name: string
          avatar_url: string | null
          color: string
          share_ratio: number
          joined_at: string
        }
        Insert: {
          couple_id: string
          user_id: string
          display_name: string
          avatar_url?: string | null
          color?: string
          share_ratio?: number
          joined_at?: string
        }
        Update: {
          display_name?: string
          avatar_url?: string | null
          color?: string
          share_ratio?: number
        }
      }
      couple_invites: {
        Row: { id: string; couple_id: string; token: string; expires_at: string; used_at: string | null }
        Insert: { id?: string; couple_id: string; token: string; expires_at: string; used_at?: string | null }
        Update: { used_at?: string | null }
      }
      categories: {
        Row: {
          id: string
          couple_id: string
          name: string
          parent_id: string | null
          icon: string
          color: string
          is_archived: boolean
          sort_order: number
        }
        Insert: {
          id?: string
          couple_id: string
          name: string
          parent_id?: string | null
          icon?: string
          color?: string
          is_archived?: boolean
          sort_order?: number
        }
        Update: {
          name?: string
          parent_id?: string | null
          icon?: string
          color?: string
          is_archived?: boolean
          sort_order?: number
        }
      }
      monthly_budgets: {
        Row: {
          id: string
          couple_id: string
          category_id: string
          month: string
          amount: number
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          couple_id: string
          category_id: string
          month: string
          amount: number
          created_by?: string | null
          created_at?: string
        }
        Update: { amount?: number }
      }
      expenses: {
        Row: {
          id: string
          couple_id: string
          paid_by: string
          category_id: string
          amount: number
          currency: string
          description: string
          spent_at: string
          receipt_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          couple_id: string
          paid_by: string
          category_id: string
          amount: number
          currency?: string
          description: string
          spent_at: string
          receipt_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          paid_by?: string
          category_id?: string
          amount?: number
          currency?: string
          description?: string
          spent_at?: string
          receipt_url?: string | null
          updated_at?: string
        }
      }
      expense_shares: {
        Row: { expense_id: string; user_id: string; share_amount: number }
        Insert: { expense_id: string; user_id: string; share_amount: number }
        Update: { share_amount?: number }
      }
      incomes: {
        Row: { id: string; couple_id: string; user_id: string; amount: number; source: string; month: string }
        Insert: { id?: string; couple_id: string; user_id: string; amount: number; source: string; month: string }
        Update: { amount?: number; source?: string }
      }
      savings_pots: {
        Row: {
          id: string
          couple_id: string
          name: string
          icon: string
          color: string
          target_amount: number | null
          target_date: string | null
          is_shared: boolean
          owner_user_id: string | null
          is_archived: boolean
        }
        Insert: {
          id?: string
          couple_id: string
          name: string
          icon?: string
          color?: string
          target_amount?: number | null
          target_date?: string | null
          is_shared?: boolean
          owner_user_id?: string | null
          is_archived?: boolean
        }
        Update: {
          name?: string
          icon?: string
          color?: string
          target_amount?: number | null
          target_date?: string | null
          is_shared?: boolean
          is_archived?: boolean
        }
      }
      savings_transactions: {
        Row: {
          id: string
          couple_id: string
          pot_id: string
          amount: number
          type: 'deposit' | 'withdrawal'
          source_month: string | null
          description: string | null
          made_by: string
          occurred_at: string
        }
        Insert: {
          id?: string
          couple_id: string
          pot_id: string
          amount: number
          type: 'deposit' | 'withdrawal'
          source_month?: string | null
          description?: string | null
          made_by: string
          occurred_at?: string
        }
        Update: { description?: string | null }
      }
      settlements: {
        Row: {
          id: string
          couple_id: string
          from_user: string
          to_user: string
          amount: number
          occurred_at: string
          note: string | null
        }
        Insert: {
          id?: string
          couple_id: string
          from_user: string
          to_user: string
          amount: number
          occurred_at?: string
          note?: string | null
        }
        Update: { note?: string | null }
      }
      profiles: {
        Row: {
          id: string
          couple_id: string | null
          display_name: string | null
          avatar_url: string | null
          color: string
          updated_at: string
        }
        Insert: {
          id: string
          couple_id?: string | null
          display_name?: string | null
          avatar_url?: string | null
          color?: string
          updated_at?: string
        }
        Update: {
          couple_id?: string | null
          display_name?: string | null
          avatar_url?: string | null
          color?: string
          updated_at?: string
        }
      }
    }
    Functions: {
      get_my_couple_id: { Args: Record<never, never>; Returns: string }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type Couple = Tables<'couples'>
export type CoupleMember = Tables<'couple_members'>
export type CoupleInvite = Tables<'couple_invites'>
export type Category = Tables<'categories'>
export type MonthlyBudget = Tables<'monthly_budgets'>
export type Expense = Tables<'expenses'>
export type ExpenseShare = Tables<'expense_shares'>
export type Income = Tables<'incomes'>
export type SavingsPot = Tables<'savings_pots'>
export type SavingsTransaction = Tables<'savings_transactions'>
export type Settlement = Tables<'settlements'>
export type Profile = Tables<'profiles'>

export type ExpenseWithShares = Expense & { expense_shares: ExpenseShare[] }
export type CategoryWithBudget = Category & {
  budget?: number
  spent?: number
  percentage?: number
}
