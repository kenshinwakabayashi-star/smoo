export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      households: {
        Row: {
          id: string
          name: string
          invite_code: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          invite_code?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          invite_code?: string
          created_at?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          id: string
          display_name: string
          household_id: string | null
          created_at: string
        }
        Insert: {
          id: string
          display_name: string
          household_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          household_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_profiles_household_id_fkey'
            columns: ['household_id']
            isOneToOne: false
            referencedRelation: 'households'
            referencedColumns: ['id']
          },
        ]
      }
      categories: {
        Row: {
          id: string
          household_id: string
          name: string
          icon: string
          color: string
          is_default: boolean
        }
        Insert: {
          id?: string
          household_id: string
          name: string
          icon: string
          color: string
          is_default?: boolean
        }
        Update: {
          id?: string
          household_id?: string
          name?: string
          icon?: string
          color?: string
          is_default?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'categories_household_id_fkey'
            columns: ['household_id']
            isOneToOne: false
            referencedRelation: 'households'
            referencedColumns: ['id']
          },
        ]
      }
      transactions: {
        Row: {
          id: string
          household_id: string
          user_id: string | null
          amount: number
          type: 'expense' | 'income'
          category_id: string | null
          description: string | null
          date: string
          is_shared: boolean
          is_recurring: boolean
          created_at: string
        }
        Insert: {
          id?: string
          household_id: string
          user_id?: string | null
          amount: number
          type: 'expense' | 'income'
          category_id?: string | null
          description?: string | null
          date?: string
          is_shared?: boolean
          is_recurring?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          user_id?: string | null
          amount?: number
          type?: 'expense' | 'income'
          category_id?: string | null
          description?: string | null
          date?: string
          is_shared?: boolean
          is_recurring?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'transactions_household_id_fkey'
            columns: ['household_id']
            isOneToOne: false
            referencedRelation: 'households'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
        ]
      }
      budgets: {
        Row: {
          id: string
          household_id: string
          category_id: string
          amount: number
          month: string
        }
        Insert: {
          id?: string
          household_id: string
          category_id: string
          amount: number
          month: string
        }
        Update: {
          id?: string
          household_id?: string
          category_id?: string
          amount?: number
          month?: string
        }
        Relationships: [
          {
            foreignKeyName: 'budgets_household_id_fkey'
            columns: ['household_id']
            isOneToOne: false
            referencedRelation: 'households'
            referencedColumns: ['id']
          },
        ]
      }
      settlements: {
        Row: {
          id: string
          household_id: string
          from_user_id: string
          to_user_id: string
          amount: number
          month: string
          settled_at: string | null
        }
        Insert: {
          id?: string
          household_id: string
          from_user_id: string
          to_user_id: string
          amount: number
          month: string
          settled_at?: string | null
        }
        Update: {
          id?: string
          household_id?: string
          from_user_id?: string
          to_user_id?: string
          amount?: number
          month?: string
          settled_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'settlements_household_id_fkey'
            columns: ['household_id']
            isOneToOne: false
            referencedRelation: 'households'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      create_household_with_categories: {
        Args: { p_household_name: string; p_display_name: string }
        Returns: Json
      }
      join_household_by_invite_code: {
        Args: { p_invite_code: string; p_display_name: string }
        Returns: Json
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type Household = Tables<'households'>
export type UserProfile = Tables<'user_profiles'>
export type Category = Tables<'categories'>
export type Transaction = Tables<'transactions'>
export type Budget = Tables<'budgets'>
export type Settlement = Tables<'settlements'>
