const SettingsService = require('../services/SettingsService');
const LeadCreationService = require('../services/LeadCreationService');
const { normalizePhone } = require('../utils/phone');

describe('Phone normalization', () => {
  test('adds default country code', () => {
    expect(normalizePhone('9876543210', '91')).toBe('919876543210');
  });

  test('preserves existing country code', () => {
    expect(normalizePhone('919876543210', '91')).toBe('919876543210');
  });
});

describe('SettingsService', () => {
  test('maskSecret masks middle characters', () => {
    const { maskSecret } = require('../utils/encryption');
    const masked = maskSecret('EAABsbCS1iHgBO7ZC');
    expect(masked).toContain('*');
    expect(masked.startsWith('EAAB')).toBe(true);
  });
});

describe('QuickReplyService', () => {
  const QuickReplyService = require('../services/QuickReplyService');

  test('applyVariables substitutes placeholders', () => {
    const result = QuickReplyService.applyVariables(
      'Hello {{studentName}}, welcome!',
      { studentName: 'John' }
    );
    expect(result).toBe('Hello John, welcome!');
  });
});
