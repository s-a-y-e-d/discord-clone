import crypto from "crypto";

// Ensure this matches the Algorithm used
const ALGORITHM = "aes-256-gcm";

// Generate or retrieve the encryption secret from environment variables
// It expects a 32-byte hex string (64 characters)
const getSecretKey = () => {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error("ENCRYPTION_SECRET environment variable is missing.");
  }

  const key = Buffer.from(secret, 'hex');
  if (key.length !== 32) {
    throw new Error("ENCRYPTION_SECRET must be exactly 32 bytes (64 hex characters).");
  }
  return key;
};

/**
 * Encrypts a string of text.
 * @param text The plaintext string to encrypt.
 * @returns The encrypted string formatted as "iv:authTag:encryptedData" (hex encoded)
 */
export function encrypt(text: string): string {
  if (!text) return text;

  const key = getSecretKey();
  const iv = crypto.randomBytes(12); // Recommended 96-bit IV for GCM

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  // Format: iv:authTag:encryptedData
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an encrypted string.
 * @param hash The encrypted string formatted as "iv:authTag:encryptedData" (hex encoded)
 * @returns The decrypted plaintext string.
 */
export function decrypt(hash: string): string {
  if (!hash) return hash;

  const parts = hash.split(':');
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted format. Expected 'iv:authTag:encryptedData'.");
  }

  const [ivHex, authTagHex, encryptedDataHex] = parts;

  const key = getSecretKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedDataHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
