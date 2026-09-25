import { describe, expect, it } from 'vitest';
import {
  AnonymizationSession,
  detectEntities,
  detectWithRegex,
  type DetectedEntity,
} from '@doccloak/core';
import { customTermEntities, filterAndMergeEntities } from '../src/lib/engine';

const entity = (text: string, value: string, type: DetectedEntity['type']): DetectedEntity => {
  const start = text.indexOf(value);
  return { type, value, start, end: start + value.length, confidence: 0.99, detector: 'test-model' };
};

describe('privacy engine integration', () => {
  it('combines model and real regex detections for review', () => {
    const text = 'Person: Alice Example\nOrganization: Acme Labs\nEmail: alice@example.com\nPhone: +1 202-555-0100\nIP: 192.0.2.10\nDate: 2026-09-24';
    const ml = [entity(text, 'Alice Example', 'PERSON'), entity(text, 'Acme Labs', 'COMPANY')];
    const found = detectEntities(text, ml, detectWithRegex(text, 'all'));
    const types = new Set(found.map((item) => item.type));
    for (const expected of ['PERSON', 'COMPANY', 'EMAIL', 'PHONE', 'IP_ADDRESS', 'DATE']) expect(types.has(expected as DetectedEntity['type'])).toBe(true);
  });

  it('detects synthetic credential-like values with the core rules', () => {
    const text = 'Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.fake-signature\n-----BEGIN PRIVATE KEY-----\nFAKEONLYNOTAKEY0123456789\n-----END PRIVATE KEY-----';
    const found = detectWithRegex(text, 'all');
    expect(found.some((item) => item.type === 'SECRET' || item.type === 'API_KEY')).toBe(true);
  });

  it('round-trips placeholders and keeps duplicate mappings stable', () => {
    const text = 'Alice Example emailed alice@example.com. Alice Example copied alice@example.com.';
    const firstName = text.indexOf('Alice Example');
    const secondName = text.lastIndexOf('Alice Example');
    const firstEmail = text.indexOf('alice@example.com');
    const secondEmail = text.lastIndexOf('alice@example.com');
    const entities: DetectedEntity[] = [
      { type: 'PERSON', value: 'Alice Example', start: firstName, end: firstName + 13, confidence: 1, detector: 'test' },
      { type: 'EMAIL', value: 'alice@example.com', start: firstEmail, end: firstEmail + 17, confidence: 1, detector: 'test' },
      { type: 'PERSON', value: 'Alice Example', start: secondName, end: secondName + 13, confidence: 1, detector: 'test' },
      { type: 'EMAIL', value: 'alice@example.com', start: secondEmail, end: secondEmail + 17, confidence: 1, detector: 'test' },
    ];
    const session = new AnonymizationSession();
    const protectedText = session.anonymizeText(text, entities);
    expect(protectedText.match(/\[PERSON_1\]/g)).toHaveLength(2);
    expect(protectedText.match(/\[EMAIL_1\]/g)).toHaveLength(2);
    const reply = 'Send the summary to [PERSON_1] at [EMAIL_1].';
    expect(session.deanonymize(reply)).toBe('Send the summary to Alice Example at alice@example.com.');
  });

  it('applies local custom terms and exact ignore values', () => {
    const text = 'Project Falcon is hosted on Internal Server Name.';
    expect(customTermEntities(text, ['Project Falcon'])).toHaveLength(1);
    const merged = filterAndMergeEntities(text, [], ['Project Falcon', 'Internal Server Name'], ['Project Falcon']);
    expect(merged.map((item) => item.value)).toEqual(['Internal Server Name']);
  });

  it('clears all reversible mappings', () => {
    const session = new AnonymizationSession();
    session.anonymize('Alice Example', 'PERSON');
    session.clear();
    expect(session.getEntries()).toEqual([]);
    expect(session.deanonymize('[PERSON_1]')).toBe('[PERSON_1]');
  });
});
