import type { ProgramDegreeType } from "@/types/ops";

/**
 * Program names as Chinese universities write them in English admission guides
 * (Ministry of Education undergraduate catalogue names). Used as suggestions when
 * adding a program in Ops, so the same major is spelled the same way everywhere.
 */
const DEGREE_MAJORS = [
  // Engineering & technology
  "Computer Science and Technology",
  "Software Engineering",
  "Artificial Intelligence",
  "Data Science and Big Data Technology",
  "Internet of Things Engineering",
  "Information Security",
  "Network Engineering",
  "Electronic Information Engineering",
  "Communication Engineering",
  "Electrical Engineering and Automation",
  "Automation",
  "Mechanical Engineering",
  "Mechanical Design, Manufacturing and Automation",
  "Mechatronic Engineering",
  "Vehicle Engineering",
  "Civil Engineering",
  "Architecture",
  "Urban and Rural Planning",
  "Transportation",
  "Traffic Engineering",
  "Aerospace Engineering",
  "Materials Science and Engineering",
  "Chemical Engineering and Technology",
  "Environmental Engineering",
  "Energy and Power Engineering",
  "Petroleum Engineering",
  "Mining Engineering",
  "Resource Exploration Engineering",
  "Biomedical Engineering",
  "Food Science and Engineering",
  // Medicine & life sciences
  "Clinical Medicine (MBBS)",
  "Stomatology",
  "Pharmacy",
  "Nursing",
  "Traditional Chinese Medicine",
  "Preventive Medicine",
  "Biotechnology",
  "Biological Science",
  // Business & economics
  "Business Administration",
  "International Economics and Trade",
  "Economics",
  "Finance",
  "Accounting",
  "Financial Management",
  "Marketing",
  "Human Resource Management",
  "Logistics Management",
  "E-commerce",
  "Tourism Management",
  "Hotel Management",
  "International Business",
  "Public Administration",
  // Law, politics, social sciences
  "Law",
  "International Politics",
  "Diplomacy",
  "Sociology",
  "Psychology",
  // Languages, media, arts, education
  "Chinese Language and Literature",
  "Chinese International Education",
  "English",
  "Translation",
  "Business English",
  "Journalism",
  "Communication",
  "Advertising",
  "Broadcasting and Hosting",
  "Internet and New Media",
  "Visual Communication Design",
  "Environmental Design",
  "Product Design",
  "Digital Media Art",
  "Fine Arts",
  "Musicology",
  "Education",
  "Preschool Education",
  "Physical Education",
  // Sciences
  "Mathematics and Applied Mathematics",
  "Statistics",
  "Physics",
  "Applied Chemistry",
  "Agriculture",
];

const MASTER_EXTRA = [
  "Master of Business Administration (MBA)",
  "Master of Public Administration (MPA)",
  "Teaching Chinese to Speakers of Other Languages (MTCSOL)",
  "International Relations",
];

const LANGUAGE_PROGRAMS = [
  "Chinese Language Program (One Semester)",
  "Chinese Language Program (One Academic Year)",
  "Chinese Language Program (One Semester, Autumn Intake)",
  "Chinese Language Program (One Academic Year, Autumn Intake)",
  "Business Chinese Program",
  "Intensive Chinese Program",
  "Standard Chinese Program",
  "Standard Chinese Program (Beginner)",
  "Chinese Language Summer Camp",
];

const FOUNDATION_PROGRAMS = [
  "Foundation Program (One Academic Year)",
  "Preparatory Program for Undergraduate Study",
  "Preparatory Program for Graduate Study",
];

export function officialMajorsFor(degree: ProgramDegreeType | string | null | undefined): string[] {
  switch (degree) {
    case "Chinese Language":
      return LANGUAGE_PROGRAMS;
    case "Foundation Program":
      return FOUNDATION_PROGRAMS;
    case "Master":
      return [...DEGREE_MAJORS, ...MASTER_EXTRA];
    default:
      return DEGREE_MAJORS;
  }
}
