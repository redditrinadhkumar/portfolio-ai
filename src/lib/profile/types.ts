/**
 * TRUSTED DATA CONTRACT
 * ---------------------
 * Everything in this file (and in `data.ts`) is TRUSTED, approved,
 * hand-curated content. It is the single source of truth the assistant is
 * grounded on. It is never generated or modified by the LLM at request
 * time, and user input can never write into it.
 *
 * Any field left `undefined`/empty MUST be treated by the assistant as
 * "not available" — never inferred or invented (see `lib/security/scope`
 * and the system prompt builder in `lib/ai/promptBuilder.ts`).
 */

export interface ProfilePersonal {
  fullName: string;
  headline: string;
  location?: string;
  /** GitHub CDN avatar URL — approved for public display. */
  avatarUrl?: string;
}

export interface ProfileEducationEntry {
  institution: string;
  program: string;
  detail?: string; // e.g. CGPA / percentage, as literally stated on the resume
  period?: string;
}

export interface ProfileExperienceEntry {
  role: string;
  organization: string;
  employmentType?: string; // e.g. "Paid", "Unpaid" — as stated
  period: string;
  highlights: string[];
}

export interface ProfileSkillGroup {
  category: string;
  items: string[];
}

export interface ProfileProject {
  name: string;
  stack: string[];
  highlights: string[];
  /** Confirmed GitHub repository URL for this project. Only add when explicitly verified. */
  githubUrl?: string;
}

export interface ProfileCertification {
  name: string;
  issuer: string;
  date?: string;
}

export interface ProfileContact {
  /** Only fields explicitly approved for public disclosure belong here. */
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
}

export interface Profile {
  personal: ProfilePersonal;
  summary: string;
  education: ProfileEducationEntry[];
  experience: ProfileExperienceEntry[];
  skills: ProfileSkillGroup[];
  projects: ProfileProject[];
  certifications: ProfileCertification[];
  achievements: string[];
  interests: string[];
  contact: ProfileContact;
}

/** Machine-readable list of the topics the assistant is allowed to discuss. */
export const PROFILE_TOPICS = [
  'identity',
  'summary',
  'education',
  'experience',
  'skills',
  'projects',
  'certifications',
  'achievements',
  'interests',
  'contact',
] as const;

export type ProfileTopic = (typeof PROFILE_TOPICS)[number];
