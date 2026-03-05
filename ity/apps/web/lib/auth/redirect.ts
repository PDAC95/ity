const ALLOWED_PREFIXES = ['/dashboard', '/courses', '/settings', '/school', '/reset-password'] as const;

/**
 * Validates a redirect path against the allowlist of known app paths.
 * Returns the validated path or falls back to /dashboard.
 *
 * Defense against open redirect via:
 * - Protocol-relative URLs (//evil.com)
 * - Percent-encoded bypasses (%2F%2Fevil.com)
 * - Arbitrary external URLs
 */
export function isAllowedRedirect(next: string | null | undefined): string {
  const fallback = '/dashboard';

  if (!next) return fallback;

  // Decode percent-encoded characters before validation
  let decoded: string;
  try {
    decoded = decodeURIComponent(next);
  } catch {
    return fallback;
  }

  // Must start with exactly one slash (not double slash)
  if (!decoded.startsWith('/') || decoded.startsWith('//')) {
    return fallback;
  }

  // Must match one of the allowed prefixes
  const isAllowed = ALLOWED_PREFIXES.some((prefix) => decoded.startsWith(prefix));
  return isAllowed ? decoded : fallback;
}
