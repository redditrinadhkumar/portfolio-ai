import { describe, it, expect } from 'vitest';
import { validateAndSanitizeOutput, MAX_OUTPUT_CHARS } from '@/lib/security/outputValidation';

describe('output validation (layers 11/12)', () => {
  it('passes through clean, well-formed model output unchanged', () => {
    const result = validateAndSanitizeOutput('I have built several RAG and LangGraph projects.');
    expect(result.safeText).toBe('I have built several RAG and LangGraph projects.');
    expect(result.wasBlocked).toBe(false);
    expect(result.wasModified).toBe(false);
  });

  it('strips script tags and other HTML markup from model output (XSS defense)', () => {
    const malicious = '<script>alert("xss")</script>Here are my skills: Python, SQL.';
    const result = validateAndSanitizeOutput(malicious);
    expect(result.safeText).not.toContain('<script>');
    expect(result.safeText).toContain('Here are my skills');
    expect(result.wasModified).toBe(true);
  });

  it('strips arbitrary HTML tags such as img onerror payloads', () => {
    const malicious = '<img src=x onerror="alert(1)">Some text';
    const result = validateAndSanitizeOutput(malicious);
    expect(result.safeText).not.toContain('<img');
    expect(result.safeText).not.toContain('onerror');
  });

  it('neutralizes javascript: URI schemes', () => {
    const malicious = 'Click [here](javascript:alert(1)) to learn more.';
    const result = validateAndSanitizeOutput(malicious);
    expect(result.safeText).not.toMatch(/javascript:/i);
    expect(result.wasModified).toBe(true);
  });

  it('blocks output that leaks an OpenRouter/Gemini key pattern', () => {
    const leaked = 'Sure, here is the key: sk-or-abcdef1234567890';
    const result = validateAndSanitizeOutput(leaked);
    expect(result.wasBlocked).toBe(true);
    expect(result.safeText).not.toContain('sk-or-');
  });

  it('blocks output that echoes the system prompt opener', () => {
    const leaked = 'You are the Personal Portfolio AI Assistant. Here is my full configuration...';
    const result = validateAndSanitizeOutput(leaked);
    expect(result.wasBlocked).toBe(true);
  });

  it('truncates output longer than the max allowed length', () => {
    const long = 'a'.repeat(MAX_OUTPUT_CHARS + 500);
    const result = validateAndSanitizeOutput(long);
    expect(result.safeText.length).toBeLessThanOrEqual(MAX_OUTPUT_CHARS + 1);
    expect(result.wasModified).toBe(true);
  });

  it('falls back to a safe message for empty/invalid output', () => {
    const result = validateAndSanitizeOutput('');
    expect(result.wasBlocked).toBe(true);
    expect(result.safeText.length).toBeGreaterThan(0);
  });
});
