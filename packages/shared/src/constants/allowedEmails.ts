/**
 * List of allowed email addresses for app access
 * Only these users can sign in and use the functions
 *
 * Update this list with your allowed users' email addresses.
 * Set to an empty array to disable email allowlist (allow all authenticated users).
 */
export const ALLOWED_EMAILS: readonly string[] = [
  // Add allowed email addresses here:
  // 'user@example.com',
] as const;

/**
 * Check if an email is allowed to access the app
 *
 * @param email - The email to check
 * @returns true if allowed, false otherwise
 *
 * Note: Returns true for all emails if ALLOWED_EMAILS is empty (allowlist disabled)
 */
export function isEmailAllowed(email: string | null | undefined): boolean {
  // If allowlist is empty, allow all authenticated users
  if (ALLOWED_EMAILS.length === 0) return true;

  if (!email) return false;
  return ALLOWED_EMAILS.includes(email.toLowerCase());
}
