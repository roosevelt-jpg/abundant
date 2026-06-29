import { getDb } from './firebase-admin-server';
import { getDefaultSettings } from './default-settings';
import type { Settings } from './types';
import { encryptSensitiveData, decryptSensitiveData, isValidEncryptedData } from './encryption';

const DEFAULT_SETTINGS_ID = 'main';

// Fields that should be encrypted before storing in Firestore
const SENSITIVE_FIELDS = [
  // Firebase Admin SDK
  'adminPrivateKey',
  'adminClientEmail',
  // Firebase Client SDK
  'clientApiKey',
  // Gmail SMTP
  'appPassword',
  // Stripe
  'secretKey',
  'webhookSecret',
  // PayPal
  'clientId',
  'secret',
  // Google Calendar
  'apiKey',
  // Microsoft Calendar
  'secret',
  // Google Places
  'apiKey',
];

export async function getSettings(): Promise<Settings> {
  try {
    console.log('[v0] Attempting to fetch settings from Firestore...');
    const db = await getDb();
    
    // If database not initialized, return defaults
    if (!db) {
      console.warn('[v0] Database not initialized, returning default settings');
      return getDefaultSettings();
    }
    
    const docSnap = await db.collection('settings').doc(DEFAULT_SETTINGS_ID).get();
    
    if (docSnap.exists) {
      console.log('[v0] Settings found in Firestore');
      const data = docSnap.data();
      // Decrypt sensitive fields before returning
      const decrypted = decryptSensitiveFields(data);
      return decrypted as Settings;
    }
    
    console.log('[v0] Settings document not found, returning defaults');
    return getDefaultSettings();
  } catch (error) {
    console.error('[v0] Error getting settings from Admin SDK:', error);
    // Always return defaults on any error - never throw
    console.warn('[v0] Returning default settings due to error:', error instanceof Error ? error.message : String(error));
    return getDefaultSettings();
  }
}

export async function updateSettings(updates: Partial<Settings>): Promise<void> {
  try {
    const db = await getDb();
    
    // If database not initialized, throw error so caller knows update failed
    if (!db) {
      throw new Error('Database not initialized - cannot update settings');
    }

    // Encrypt sensitive fields before storing
    const encryptedUpdates = encryptSensitiveFields(updates);
    
    const settingsRef = db.collection('settings').doc(DEFAULT_SETTINGS_ID);
    
    const existing = await settingsRef.get();
    
    if (existing.exists) {
      await settingsRef.update({
        ...encryptedUpdates,
        updatedAt: Date.now()
      });
    } else {
      await settingsRef.set({
        id: DEFAULT_SETTINGS_ID,
        ...encryptedUpdates,
        updatedAt: Date.now(),
        updatedBy: 'system'
      } as Settings);
    }
  } catch (error) {
    console.error('[v0] Error updating settings from Admin SDK:', error);
    throw error;
  }
}

/**
 * Encrypts sensitive fields in integrations object before storage
 */
function encryptSensitiveFields(data: any): any {
  if (!data || !data.integrations) return data;

  const encrypted = JSON.parse(JSON.stringify(data)); // Deep copy
  
  Object.keys(encrypted.integrations || {}).forEach((integrationKey) => {
    const integration = encrypted.integrations[integrationKey];
    if (!integration) return;

    Object.keys(integration).forEach((fieldKey) => {
      const value = integration[fieldKey];
      
      // Check if field name suggests it's sensitive (contains common sensitive keywords)
      const isSensitive = [
        'key', 'secret', 'password', 'token', 'email', 'privatekey', 'clientid'
      ].some(keyword => fieldKey.toLowerCase().includes(keyword));

      if (isSensitive && value && typeof value === 'string' && value.length > 0) {
        try {
          encrypted.integrations[integrationKey][fieldKey] = encryptSensitiveData(value);
        } catch (error) {
          console.error(`[v0] Failed to encrypt ${integrationKey}.${fieldKey}:`, error);
          // Keep original value if encryption fails
        }
      }
    });
  });

  return encrypted;
}

/**
 * Decrypts sensitive fields in integrations object after retrieval
 */
export function decryptSensitiveFields(data: any): any {
  if (!data || !data.integrations) return data;

  const decrypted = JSON.parse(JSON.stringify(data)); // Deep copy
  
  Object.keys(decrypted.integrations || {}).forEach((integrationKey) => {
    const integration = decrypted.integrations[integrationKey];
    if (!integration) return;

    Object.keys(integration).forEach((fieldKey) => {
      const value = integration[fieldKey];
      
      // Check if field is encrypted
      if (isValidEncryptedData(value)) {
        try {
          decrypted.integrations[integrationKey][fieldKey] = decryptSensitiveData(value);
        } catch (error) {
          console.error(`[v0] Failed to decrypt ${integrationKey}.${fieldKey}:`, error);
          decrypted.integrations[integrationKey][fieldKey] = ''; // Clear failed decryption
        }
      }
    });
  });

  return decrypted;
}
