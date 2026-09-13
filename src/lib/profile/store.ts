import { profile } from './data';
import type { Profile, ProfileTopic } from './types';

/**
 * PROFILE RETRIEVAL ABSTRACTION
 * -----------------------------
 * Today this is a trivial static lookup over the hand-curated `Profile`
 * object. It exists as its own module — rather than importing `data.ts`
 * directly from the prompt builder — so that a future RAG implementation
 * (chunking a resume, GitHub READMEs, certification PDFs, articles, etc.
 * into a vector store) can be swapped in behind the same interface with no
 * changes to the security pipeline or the prompt builder.
 *
 * IMPORTANT for the future RAG version: whatever a retriever returns is
 * DATA, not INSTRUCTIONS. It must be interpolated into the prompt as
 * clearly delimited, inert reference text (see `lib/ai/promptBuilder.ts`),
 * exactly the same way user messages are — never concatenated into the
 * system/developer instructions, and never treated as containing commands
 * the model should obey.
 */
export interface RetrievedChunk {
  topic: ProfileTopic | 'general';
  text: string;
}

export interface ProfileStore {
  getFullProfile(): Profile;
  /**
   * Returns the relevant grounding text for a classified topic set.
   * The current implementation just serializes the matching sections of
   * the static profile; a RAG-backed implementation would instead run a
   * similarity search and return the top-k chunks.
   */
  retrieve(topics: ProfileTopic[]): RetrievedChunk[];
}

function formatEducation(p: Profile): string {
  return p.education
    .map((e) => {
      const bits = [e.program, e.detail, e.period].filter(Boolean).join(' — ');
      return `- ${e.institution}: ${bits}`;
    })
    .join('\n');
}

function formatExperience(p: Profile): string {
  return p.experience
    .map((e) => {
      const type = e.employmentType ? ` (${e.employmentType})` : '';
      const highlights = e.highlights.map((h) => `  • ${h}`).join('\n');
      return `- ${e.role} at ${e.organization}${type}, ${e.period}\n${highlights}`;
    })
    .join('\n');
}

function formatSkills(p: Profile): string {
  return p.skills.map((g) => `- ${g.category}: ${g.items.join(', ')}`).join('\n');
}

function formatProjects(p: Profile): string {
  return p.projects
    .map((proj) => {
      const highlights = proj.highlights.map((h) => `  • ${h}`).join('\n');
      return `- ${proj.name} [${proj.stack.join(', ')}]\n${highlights}`;
    })
    .join('\n');
}

function formatCertifications(p: Profile): string {
  if (p.certifications.length === 0) return '(none on record)';
  return p.certifications
    .map((c) => `- ${c.name} — ${c.issuer}${c.date ? `, ${c.date}` : ''}`)
    .join('\n');
}

function formatAchievements(p: Profile): string {
  if (p.achievements.length === 0) return '(none on record)';
  return p.achievements.map((a) => `- ${a}`).join('\n');
}

function formatInterests(p: Profile): string {
  if (p.interests.length === 0) return '(none on record)';
  return p.interests.map((i) => `- ${i}`).join('\n');
}

function formatContact(p: Profile): string {
  const c = p.contact;
  const lines: string[] = [];
  if (c.email) lines.push(`- Email: ${c.email}`);
  if (c.phone) lines.push(`- Phone: ${c.phone}`);
  if (c.linkedinUrl) lines.push(`- LinkedIn: ${c.linkedinUrl}`);
  if (c.githubUrl) lines.push(`- GitHub: ${c.githubUrl}`);
  if (c.portfolioUrl) lines.push(`- Portfolio: ${c.portfolioUrl}`);
  return lines.length > 0 ? lines.join('\n') : '(no approved contact channels on record)';
}

export function createStaticProfileStore(): ProfileStore {
  return {
    getFullProfile() {
      return profile;
    },
    retrieve(topics) {
      const chunks: RetrievedChunk[] = [];
      const want = new Set(topics);

      if (want.has('identity')) {
        chunks.push({
          topic: 'identity',
          text: `Name: ${profile.personal.fullName}\nHeadline: ${profile.personal.headline}${
            profile.personal.location ? `\nLocation: ${profile.personal.location}` : ''
          }`,
        });
      }
      if (want.has('summary')) {
        chunks.push({ topic: 'summary', text: profile.summary });
      }
      if (want.has('education')) {
        chunks.push({ topic: 'education', text: formatEducation(profile) });
      }
      if (want.has('experience')) {
        chunks.push({ topic: 'experience', text: formatExperience(profile) });
      }
      if (want.has('skills')) {
        chunks.push({ topic: 'skills', text: formatSkills(profile) });
      }
      if (want.has('projects')) {
        chunks.push({ topic: 'projects', text: formatProjects(profile) });
      }
      if (want.has('certifications')) {
        chunks.push({ topic: 'certifications', text: formatCertifications(profile) });
      }
      if (want.has('achievements')) {
        chunks.push({ topic: 'achievements', text: formatAchievements(profile) });
      }
      if (want.has('interests')) {
        chunks.push({ topic: 'interests', text: formatInterests(profile) });
      }
      if (want.has('contact')) {
        chunks.push({ topic: 'contact', text: formatContact(profile) });
      }
      return chunks;
    },
  };
}

export const profileStore = createStaticProfileStore();
