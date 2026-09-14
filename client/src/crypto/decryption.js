import { base64UrlToArrayBuffer } from './keyManager';

/**
 * Decrypt Base64URL ciphertext using AES-256-GCM and IV
 * @param {{ ciphertext: string, iv: string }} payload
 * @param {CryptoKey} key
 * @param {'string' | 'buffer'} returnType
 * @returns {Promise<string | ArrayBuffer>}
 */
export const decryptData = async ({ ciphertext, iv }, key, returnType = 'string') => {
  if (!ciphertext || !iv) {
    throw new Error('Invalid encryption payload: ciphertext and iv are required.');
  }

  const ciphertextBuffer = base64UrlToArrayBuffer(ciphertext);
  const ivBuffer = base64UrlToArrayBuffer(iv);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(ivBuffer)
    },
    key,
    ciphertextBuffer
  );

  if (returnType === 'buffer') {
    return decryptedBuffer;
  }

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
};
