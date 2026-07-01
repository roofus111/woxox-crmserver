/**
 * Normalizes phone numbers to E.164 format without leading +.
 * @param {string} phone
 * @param {string} [defaultCountryCode='91']
 * @returns {string}
 */
function normalizePhone(phone, defaultCountryCode = '91') {
  if (!phone) return '';
  let cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1);
  }
  if (defaultCountryCode && !cleaned.startsWith(defaultCountryCode) && cleaned.length <= 10) {
    cleaned = `${defaultCountryCode}${cleaned}`;
  }
  return cleaned;
}

/**
 * Formats phone for WhatsApp API (E.164 without +).
 * @param {string} phone
 * @returns {string}
 */
function toWhatsAppId(phone) {
  return normalizePhone(phone);
}

module.exports = { normalizePhone, toWhatsAppId };
