export const SUGGESTED_QUESTIONS = [
  'What AI/GenAI projects have you built?',
  'What internships have you completed?',
  "What's your tech stack?",
  'What certifications do you hold?',
  'How can I get in touch?',
];

export function SuggestedQuestions({ onSelect }: { onSelect: (question: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 px-1">
      {SUGGESTED_QUESTIONS.map((q) => (
        <button
          key={q}
          type="button"
          onClick={() => onSelect(q)}
          className="rounded-full px-3 py-1.5 text-xs transition-all duration-200 hover:scale-105"
          style={{
            background: 'rgba(56,189,248,0.08)',
            border: '1px solid rgba(56,189,248,0.2)',
            color: 'var(--color-neon)',
          }}
        >
          {q}
        </button>
      ))}
    </div>
  );
}
