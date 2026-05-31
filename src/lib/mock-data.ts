import type {
  DashboardStats,
  StudentFilters,
  StudentProfile,
  UniversityAccount,
} from "@/types";

export const MOCK_UNIVERSITY_ID = "00000000-0000-4000-8000-000000000001";
export const MOCK_USER_ID = "00000000-0000-4000-8000-000000000002";

export const MOCK_ACCOUNT: UniversityAccount = {
  id: MOCK_USER_ID,
  university_id: MOCK_UNIVERSITY_ID,
  role: "recruiter",
  full_name: "Sarah Chen",
  email: "recruiter@zufe.edu.cn",
  is_active: true,
  university: {
    id: MOCK_UNIVERSITY_ID,
    name: "Zhejiang University of Finance & Economics",
    country: "China",
    city: "Hangzhou",
    tier: "partner",
    is_active: true,
  },
};

const now = new Date().toISOString();

export const MOCK_STUDENTS: StudentProfile[] = [
  {
    id: "mock-student-1",
    is_visible: true,
    full_name: "Youssef El Amrani",
    nationality: "Morocco",
    photo_url: "https://i.pravatar.cc/300?u=youssef",
    degree_level: "bachelor",
    desired_major: "Computer Science",
    gpa: 3.72,
    english_level: "IELTS 6.5",
    chinese_level: "HSK 3",
    scholarship_interest: true,
    intake_semester: "Fall 2026",
    study_plan_summary: "Interested in software engineering and AI applications.",
    profile_score: 88,
    documents: {
      passport: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      transcript: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      certificates: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    },
    created_at: now,
    updated_at: now,
  },
  {
    id: "mock-student-2",
    is_visible: true,
    full_name: "Fatima Zahra Bennani",
    nationality: "Morocco",
    photo_url: "https://i.pravatar.cc/300?u=fatima",
    degree_level: "master",
    desired_major: "International Business",
    gpa: 3.85,
    english_level: "IELTS 7.0",
    chinese_level: "HSK 4",
    scholarship_interest: false,
    intake_semester: "Spring 2026",
    profile_score: 92,
    documents: {
      passport: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      transcript: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    },
    created_at: now,
    updated_at: now,
  },
  {
    id: "mock-student-3",
    is_visible: true,
    full_name: "Omar Idrissi",
    nationality: "Morocco",
    photo_url: "https://i.pravatar.cc/300?u=omar",
    degree_level: "bachelor",
    desired_major: "Mechanical Engineering",
    gpa: 3.45,
    english_level: "IELTS 6.0",
    chinese_level: "Beginner",
    scholarship_interest: true,
    intake_semester: "Fall 2026",
    profile_score: 76,
    documents: {
      passport: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    },
    created_at: now,
    updated_at: now,
  },
  {
    id: "mock-student-4",
    is_visible: true,
    full_name: "Lina Mansouri",
    nationality: "Morocco",
    photo_url: "https://i.pravatar.cc/300?u=lina",
    degree_level: "language",
    desired_major: "Chinese Language",
    gpa: 3.6,
    english_level: "IELTS 5.5",
    chinese_level: "HSK 2",
    scholarship_interest: true,
    intake_semester: "Spring 2026",
    profile_score: 81,
    documents: {},
    created_at: now,
    updated_at: now,
  },
  {
    id: "mock-student-5",
    is_visible: true,
    full_name: "Karim Alaoui",
    nationality: "Morocco",
    photo_url: "https://i.pravatar.cc/300?u=karim",
    degree_level: "master",
    desired_major: "Finance",
    gpa: 3.91,
    english_level: "IELTS 7.5",
    chinese_level: "HSK 5",
    scholarship_interest: false,
    intake_semester: "Fall 2026",
    profile_score: 95,
    documents: {
      passport: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      transcript: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      certificates: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    },
    created_at: now,
    updated_at: now,
  },
];

const mockInterestedIds = new Set<string>(["mock-student-2"]);

function filterMockStudents(filters: StudentFilters): StudentProfile[] {
  let rows = [...MOCK_STUDENTS];

  if (filters.degree !== "all") {
    rows = rows.filter((s) => s.degree_level === filters.degree);
  }
  if (filters.major !== "all") {
    rows = rows.filter((s) => s.desired_major === filters.major);
  }
  if (filters.intake !== "all") {
    rows = rows.filter((s) => s.intake_semester === filters.intake);
  }
  if (filters.search.trim()) {
    const q = filters.search.trim().toLowerCase();
    rows = rows.filter((s) =>
      [s.full_name, s.nationality, s.desired_major, s.intake_semester]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }

  return rows;
}

export function mockFetchStudents(filters: StudentFilters) {
  return Promise.resolve(filterMockStudents(filters));
}

export function mockFetchStudentById(id: string) {
  return Promise.resolve(MOCK_STUDENTS.find((s) => s.id === id) ?? null);
}

export function mockFetchInterestedIds() {
  return Promise.resolve(new Set(mockInterestedIds));
}

export function mockFetchInterestedStudents() {
  return Promise.resolve(
    MOCK_STUDENTS.filter((s) => mockInterestedIds.has(s.id)).map((student) => ({
      id: `shortlist-${student.id}`,
      status: "interested" as const,
      created_at: now,
      updated_at: now,
      student,
    })),
  );
}

export function mockExpressInterest(studentId: string) {
  if (mockInterestedIds.has(studentId)) {
    return Promise.resolve({ alreadyInterested: true });
  }
  mockInterestedIds.add(studentId);
  return Promise.resolve({ alreadyInterested: false });
}

export function mockDashboardStats(): DashboardStats {
  return {
    totalStudents: MOCK_STUDENTS.length,
    newStudents: 2,
    interestedStudents: mockInterestedIds.size,
  };
}

export function mockFilterOptions() {
  return Promise.resolve({
    majors: Array.from(new Set(MOCK_STUDENTS.map((s) => s.desired_major).filter(Boolean))).sort(),
    intakes: Array.from(new Set(MOCK_STUDENTS.map((s) => s.intake_semester).filter(Boolean))).sort(),
  });
}

export function mockLogProfileView() {
  return Promise.resolve();
}
