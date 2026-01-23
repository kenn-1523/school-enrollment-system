/**
 * Scans text for sensitive patterns (like Credit Card numbers)
 * and replaces them with safe placeholders.
 */
function scrubSensitiveData(text) {
    if (!text || typeof text !== 'string') return text;
  
    // 1. Credit Card Regex
    // Matches 13-16 digits, allowing for spaces or dashes in between
    const ccRegex = /\b(?:\d[ -]*?){13,16}\b/g;
  
    // 2. Perform Replacement
    // We replace the found number with a clear marker
    return text.replace(ccRegex, '[REDACTED CREDIT CARD]');
}
  
module.exports = { scrubSensitiveData };