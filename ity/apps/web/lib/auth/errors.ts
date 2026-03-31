export enum AuthErrorCode {
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  EMAIL_NOT_CONFIRMED = 'EMAIL_NOT_CONFIRMED',
  UNAUTHORIZED = 'UNAUTHORIZED',
}

export const AUTH_MESSAGES: Record<AuthErrorCode, { en: string; es: string }> =
  {
    [AuthErrorCode.SESSION_EXPIRED]: {
      en: 'Your session has expired. Please sign in again.',
      es: 'Tu sesion ha expirado. Por favor, inicia sesion de nuevo.',
    },
    [AuthErrorCode.INVALID_CREDENTIALS]: {
      en: 'Incorrect email or password.',
      es: 'Email o contrasena incorrectos.',
    },
    [AuthErrorCode.EMAIL_NOT_CONFIRMED]: {
      en: 'Please verify your email before signing in.',
      es: 'Verifica tu email antes de iniciar sesion.',
    },
    [AuthErrorCode.UNAUTHORIZED]: {
      en: 'You must be signed in to access this.',
      es: 'Debes iniciar sesion para acceder a esto.',
    },
  };

export function getAuthMessage(code: AuthErrorCode): string {
  return AUTH_MESSAGES[code].es;
}
