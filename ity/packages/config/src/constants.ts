export const APP_NAME = 'ITY';
export const APP_DESCRIPTION = 'I Teach You - The simplest way to create your online school';

export const SUPPORTED_LOCALES = ['en', 'es', 'fr', 'pt'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = 'en';

export const PLANS = {
  FREE: 'free',
  STARTER: 'starter',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
} as const;
export type Plan = (typeof PLANS)[keyof typeof PLANS];

export const LESSON_TYPES = {
  VIDEO: 'video',
  TEXT: 'text',
  QUIZ: 'quiz',
  DOWNLOAD: 'download',
} as const;
export type LessonType = (typeof LESSON_TYPES)[keyof typeof LESSON_TYPES];

export const LIVE_CLASS_STATUS = {
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  ENDED: 'ended',
  CANCELLED: 'cancelled',
} as const;
export type LiveClassStatus = (typeof LIVE_CLASS_STATUS)[keyof typeof LIVE_CLASS_STATUS];

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;
export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

// Default branding values
export const DEFAULT_BRANDING = {
  primaryColor: '#6366F1',
  secondaryColor: '#F59E0B',
  font: 'inter' as const,
};

// Available fonts
export const AVAILABLE_FONTS = ['inter', 'merriweather', 'space-mono'] as const;
export type AvailableFont = (typeof AVAILABLE_FONTS)[number];
