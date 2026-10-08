/** The locating rule already used by capture-growth and extractor rebaselining. */
export const normalizeLocatedText = (x) => x
  .replace(/\[\s*\d+\s*\]/g, ' ')
  .replace(/\s+([,.;:!?])/g, '$1')
  .replace(/\s+/g, ' ')
  .trim();

export const locateClaim = (text, verbatim) => (text.includes(verbatim) ? 'EXACT'
  : normalizeLocatedText(text).includes(normalizeLocatedText(verbatim))
    ? 'MATCHED_AFTER_NORMALISING_EXTRACTOR_ARTEFACTS' : 'NOT_LOCATED');
