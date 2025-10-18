/**
 * @file MnemonicCodec.js
 * @description Provides functions to encode and decode the entire application state,
 * enabling the persistence and restoration of all cognitive sessions.
 */

/**
 * Encodes the entire application state (all sessions) into a single, portable JSON string.
 * This string is referred to as the 'Soul-File'.
 *
 * @param {import('../src/types').Session[]} sessions - The array of all sessions to be encoded.
 * @returns {string} The 'Soul-File' as a formatted JSON string.
 */
export function encode(sessions) {
  const soulFile = {
    meta: {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      codec: 'MnemonicCodec',
      description: 'Ψ-4ndr0666 Cognitive State Archive'
    },
    cognitive_streams: sessions,
  };
  return JSON.stringify(soulFile, null, 2);
}

/**
 * Decodes a 'Soul-File' string back into an array of sessions.
 *
 * @param {string} soulFileString - The JSON string of the 'Soul-File'.
 * @returns {import('../src/types').Session[]} The decoded array of sessions.
 * @throws {Error} if the file format is invalid, corrupted, or cannot be parsed.
 */
export function decode(soulFileString) {
  try {
    const soulFile = JSON.parse(soulFileString);

    if (
      !soulFile.meta ||
      soulFile.meta.codec !== 'MnemonicCodec' ||
      !Array.isArray(soulFile.cognitive_streams)
    ) {
      throw new Error('Invalid or corrupted Soul-File format. Metadata mismatch.');
    }

    // Basic validation of session structure can be added here if needed
    // For example, ensuring each session has an 'id', 'name', and 'messages'.

    return soulFile.cognitive_streams;
  } catch (error) {
    console.error('[MnemonicCodec] Decode failed:', error);
    throw new Error('Failed to decode Soul-File. The data may be corrupted or in an unexpected format.');
  }
}
