type AuthEvent =
  | 'invalid_redirect'
  | 'auth_failure'
  | 'cookie_error'
  | 'creator_provision_error';

interface AuthLogEntry {
  event: AuthEvent;
  timestamp: string;
  environment: string;
  details: Record<string, unknown>;
}

/**
 * Logs a structured JSON auth event to stdout.
 * Designed to be readable in Vercel function logs and
 * mappable to Sentry/DataDog event schema for future migration.
 */
export function logAuthEvent(
  event: AuthEvent,
  details: Record<string, unknown> = {}
): void {
  const entry: AuthLogEntry = {
    event,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? 'unknown',
    details,
  };
  console.log(JSON.stringify(entry));
}
