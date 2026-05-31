export type DegreeLevel = "bachelor" | "master" | "language";

export type UniversityRole = "admin" | "recruiter";

export type ShortlistStatus =
  | "discovered"
  | "interested"
  | "potential"
  | "requested"
  | "not_suitable";

export interface PartnerUniversity {
  id: string;
  name: string;
  country: string;
  city?: string;
  logo_url?: string;
  website?: string;
  tier: "trial" | "partner" | "premium";
  is_active: boolean;
}

export interface UniversityAccount {
  id: string;
  university_id: string;
  role: UniversityRole;
  full_name: string;
  email: string;
  is_active: boolean;
  university?: PartnerUniversity;
}

export interface StudentDocuments {
  passport?: string;
  transcript?: string;
  certificates?: string;
}

export interface StudentProfile {
  id: string;
  submission_id?: string;
  is_visible: boolean;
  full_name?: string;
  nationality?: string;
  photo_url?: string;
  degree_level?: DegreeLevel | string;
  desired_major?: string;
  gpa?: number;
  english_level?: string;
  chinese_level?: string;
  scholarship_interest: boolean;
  intake_semester?: string;
  study_plan_summary?: string;
  profile_score: number;
  documents?: StudentDocuments;
  created_at: string;
  updated_at: string;
}

export interface UniversityShortlist {
  id: string;
  university_id: string;
  student_id: string;
  status: ShortlistStatus;
  created_at: string;
  updated_at: string;
  student?: StudentProfile;
}

export interface StudentFilters {
  search: string;
  degree: string;
  major: string;
  intake: string;
}

export interface DashboardStats {
  totalStudents: number;
  newStudents: number;
  interestedStudents: number;
}
