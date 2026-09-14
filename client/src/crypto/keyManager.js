// Base64 & Base64URL Conversion Helpers
export const arrayBufferToBase64Url = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export const base64UrlToArrayBuffer = (base64url) => {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

/**
 * Generate a cryptographically secure 256-bit AES-GCM Key
 * @returns {Promise<CryptoKey>}
 */
export const generateEncryptionKey = async () => {
  if (!window.crypto || !window.crypto.subtle) {
    throw new Error('Web Crypto API is not supported in this browser environment.');
  }

  return await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256
    },
    true, // Extractable so it can be exported into the URL fragment
    ['encrypt', 'decrypt']
  );
};

/**
 * Export CryptoKey to a URL-safe Base64URL string
 * @param {CryptoKey} key
 * @returns {Promise<string>}
 */
export const exportKeyToString = async (key) => {
  const rawKeyBuffer = await window.crypto.subtle.exportKey('raw', key);
  return arrayBufferToBase64Url(rawKeyBuffer);
};

/**
 * Import a URL-safe Base64URL string back into a CryptoKey
 * @param {string} keyString
 * @returns {Promise<CryptoKey>}
 */
export const importKeyFromString = async (keyString) => {
  if (!keyString) {
    throw new Error('Key string is empty or invalid.');
  }

  const rawKeyBuffer = base64UrlToArrayBuffer(keyString.trim());

  return await window.crypto.subtle.importKey(
    'raw',
    rawKeyBuffer,
    {
      name: 'AES-GCM',
      length: 256
    },
    false, // Non-extractable after import for added client runtime security
    ['encrypt', 'decrypt']
  );
};
