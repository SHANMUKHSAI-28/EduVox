import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface UserProfile {
  id: string
  full_name: string | null
  email: string | null
  role: 'student' | 'consultant' | 'admin'
  created_at: string
  updated_at: string
}

export interface UserAcademicProfile {
  user_id: string
  cgpa: number | null
  ielts_score: number | null
  toefl_score: number | null
  gre_score: number | null
  budget_min: number | null
  budget_max: number | null
  preferred_countries: string[] | null
  updated_at: string
}

export interface University {
  id: number
  name: string
  country: string
  state: string | null
  city: string | null
  type: 'public' | 'private'
  ranking: number | null
  tuition_min: number | null
  tuition_max: number | null
  cgpa_requirement: number | null
  ielts_requirement: number | null
  toefl_requirement: number | null
  gre_requirement: number | null
  application_deadline: string | null
  website: string | null
  logo_url: string | null
  created_at: string
}

export interface SavedUniversity {
  id: number
  user_id: string
  university_id: number
  created_at: string
  university?: University
}
