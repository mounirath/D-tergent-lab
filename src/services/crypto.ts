/**
 * Service de sécurité et de hachage cryptographique
 * Utilise l'API native Web Crypto (SHA-256 + Sel aléatoire)
 * Conforme aux règles de sécurité: aucun mot de passe en clair.
 */

export function generateSalt(length = 16): string {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + ':' + salt);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(
  passwordAttempt: string,
  salt: string,
  expectedHash: string
): Promise<boolean> {
  const calculatedHash = await hashPassword(passwordAttempt, salt);
  return calculatedHash === expectedHash;
}
