export const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,15}$/;

export function normalizeUsername(username) {
  return username.trim().toLowerCase();
}

export function getUsernameFormatError(username) {
  if (!username) return 'Choose a username to continue.';
  if (username.length < 3 || username.length > 15) {
    return 'Username must be 3 to 15 characters.';
  }
  if (!USERNAME_PATTERN.test(username)) {
    return 'Use letters, numbers, and underscores only.';
  }
  return '';
}
