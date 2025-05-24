export interface University {
  id: number;
  name: string;
  country: string;
  state: string | null;
  city: string | null;
  type: 'public' | 'private';
  ranking: number | null;
  tuition_min: number | null;
  tuition_max: number | null;
  cgpa_requirement: number | null;
  ielts_requirement: number | null;
  toefl_requirement: number | null;
  gre_requirement: number | null;
  application_deadline: string | null;
  website: string | null;
  logo_url: string | null;
  description: string | null;
  programs: string[] | null;
  created_at: string;
  match_score?: number;
  saved_id?: number;
}

export interface SavedUniversity {
  id: number;
  user_id: string;
  university_id: number;
  created_at: string;
  university?: University;
}

export interface UniversityFilters {
  country: string;
  state: string;
  type: string;
  minRanking: string;
  maxRanking: string;
  minTuition: string;
  maxTuition: string;
}

export interface AcademicProfile {
  cgpa: number;
  ieltsScore?: number;
  toeflScore?: number;
  greScore?: number;
  budgetMin?: number;
  budgetMax?: number;
  preferredCountries?: string[];
}

export interface UniversityMatch {
  university: University;
  matchScore: number;
  matchReasons: string[];
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}
