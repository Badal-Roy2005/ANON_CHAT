import { Filter } from 'bad-words';

const MAX_LENGTH = 280;
const profanityFilter = new Filter();

function escapeHtml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function sanitizeMessage(rawText) {
  if (typeof rawText !== 'string') {
    throw new Error('sanitizeMessage: message must be a string');
  }

  let text = rawText.trim();
  if (text.length === 0) {
    throw new Error('sanitizeMessage: message cannot be empty');
  }

  text = profanityFilter.clean(text);

  if (text.length > MAX_LENGTH) {
    text = text.slice(0, MAX_LENGTH);
  }

  return escapeHtml(text);
}