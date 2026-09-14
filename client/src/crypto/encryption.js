import { arrayBufferToBase64Url } from './keyManager';

/**
 * Encrypt text string or ArrayBuffer using AES-256-GCM
 * @param {string | ArrayBuffer} data
 * @param {CryptoKey} key
 * @returns {Promise<{ ciphertext: string, iv: string }>}
 */
export const encryptData = async (data, key) => {
  if (!data) {
    throw new Error('No data provided to encrypt.');
  }

  let dataBuffer;
  if (typeof data === 'string') {
    const encoder = new TextEncoder();
    dataBuffer = encoder.encode(data);
  } else if (data instanceof ArrayBuffer) {
    dataBuffer = data;
  } else if (data instanceof Uint8Array) {
    dataBuffer = data.buffer;
  } else {
    throw new Error('Unsupported data format for encryption.');
  }

  // Generate 96-bit (12-byte) IV for AES-GCM
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // Perform client-side encryption
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    dataBuffer
  );

  return {
    ciphertext: arrayBufferToBase64Url(encryptedBuffer),
    iv: arrayBufferToBase64Url(iv.buffer)
  };
};
