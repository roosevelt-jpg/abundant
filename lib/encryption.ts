import crypto from 'crypto';

// Server-side encryption for sensitive API keys
// This runs only on the server, never exposes keys to client

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
const ALGORITHM = 'aes-256-gcm';

interface EncryptedData {
  encryptedData: string;
  iv: string;
  authTag: string;
}

/**
 * Encrypts sensitive data (API keys, secrets) for storage in Firestore
 * Only call this on the server side
 */
export function encryptSensitiveData(plaintext: string): EncryptedData {
  try {
    const key = crypto
      .createHash('sha256')
      .update(String(ENCRYPTION_KEY))
      .digest();
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encryptedData: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
  } catch (error) {
    console.error('[v0] Encryption error:', error);
    throw new Error('Failed to encrypt sensitive data');
  }
}

/**
 * Decrypts sensitive data retrieved from Firestore
 * Only call this on the server side
 */
export function decryptSensitiveData(encrypted: EncryptedData): string {
  try {
    const key = crypto
      .createHash('sha256')
      .update(String(ENCRYPTION_KEY))
      .digest();
    
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(encrypted.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encrypted.authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('[v0] Decryption error:', error);
    throw new Error('Failed to decrypt sensitive data');
  }
}

/**
 * Masks sensitive data for display (shows only last 4 characters)
 */
export function maskSensitiveData(data: string, showChars: number = 4): string {
  if (!data || data.length <= showChars) return '*'.repeat(Math.max(0, 4));
  return '*'.repeat(data.length - showChars) + data.slice(-showChars);
}

/**
 * Validates that encrypted data structure is valid
 */
export function isValidEncryptedData(data: any): data is EncryptedData {
  return (
    data &&
    typeof data.encryptedData === 'string' &&
    typeof data.iv === 'string' &&
    typeof data.authTag === 'string'
  );
}
