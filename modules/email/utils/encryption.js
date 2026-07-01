const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

function getEncryptionKey() {
  const secret = process.env.EMAIL_ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!secret) throw new Error('EMAIL_ENCRYPTION_KEY or JWT_SECRET must be set');
  return crypto.createHash('sha256').update(secret).digest();
}

function encrypt(plaintext) {
  if (!plaintext) return '';
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decrypt(encryptedText) {
  if (!encryptedText) return '';
  const key = getEncryptionKey();
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
  if (!ivHex || !authTagHex || !encrypted) throw new Error('Invalid encrypted credential format');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function maskSecret(value) {
  if (!value || value.length < 8) return '****';
  return `${value.slice(0, 4)}${'*'.repeat(Math.min(value.length - 8, 12))}${value.slice(-4)}`;
}

module.exports = { encrypt, decrypt, maskSecret };
