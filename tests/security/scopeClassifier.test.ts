import { describe, it, expect } from 'vitest';
import { classifyScope } from '@/lib/security/scopeClassifier';

describe('scope classification (layer 6)', () => {
  it('classifies a projects question as in-scope with the projects topic', () => {
    const result = classifyScope('What projects have you built?');
    expect(result.inScope).toBe(true);
    expect(result.topics).toContain('projects');
  });

  it('classifies an experience/internship question correctly', () => {
    const result = classifyScope('Tell me about your internship experience.');
    expect(result.inScope).toBe(true);
    expect(result.topics).toContain('experience');
  });

  it('classifies a contact question correctly', () => {
    const result = classifyScope('How can I contact you or reach out for a hire?');
    expect(result.inScope).toBe(true);
    expect(result.topics).toContain('contact');
  });

  it('treats greetings as in-scope', () => {
    const result = classifyScope('Hi there!');
    expect(result.inScope).toBe(true);
  });

  it('flags a weather question with no portfolio tie-in as confidently off-topic', () => {
    const result = classifyScope("What's the weather like today?");
    expect(result.confidentlyOffTopic).toBe(true);
    expect(result.inScope).toBe(false);
  });

  it('flags a general coding-help request as confidently off-topic', () => {
    const result = classifyScope('Can you debug my code and write a python script that sorts a list?');
    expect(result.confidentlyOffTopic).toBe(true);
  });

  it('flags a math question as confidently off-topic', () => {
    const result = classifyScope("What's 42 + 17?");
    expect(result.confidentlyOffTopic).toBe(true);
  });

  it('flags a medical-advice question as confidently off-topic', () => {
    const result = classifyScope('Can you give me medical advice about a headache?');
    expect(result.confidentlyOffTopic).toBe(true);
  });

  it('does not hard-block when an off-topic-looking signal still ties back to the portfolio', () => {
    const result = classifyScope('Does your resume mention the weather at your internship location?');
    // Contains "weather" (an off-topic signal) but also "resume" and
    // "internship" (portfolio tie-ins), so it should not be hard-blocked —
    // final nuance is left to the system prompt itself.
    expect(result.confidentlyOffTopic).toBe(false);
  });
});
