// Template registry — static data, no DB or tRPC
// SEC-01: iframe sandbox attribute constant
// SEC-02: URL allowlist and CSP origins

export type TemplateCategory = 'educacion' | 'fitness' | 'negocio';

export interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  thumbnailUrl: string;
  previewUrl: string;
  description: string;
}

// SEC-02: Allowed origins for iframe previews
const BASE_ALLOWED_PREVIEW_ORIGINS: string[] = [
  'https://templates.12ity.com',
  'https://preview.12ity.com',
];

export const ALLOWED_PREVIEW_ORIGINS: string[] =
  process.env.NODE_ENV === 'development'
    ? [...BASE_ALLOWED_PREVIEW_ORIGINS, 'http://localhost:3001']
    : BASE_ALLOWED_PREVIEW_ORIGINS;

/**
 * SEC-02: Returns true if the URL starts with any allowed preview origin.
 * Prevents open-redirect and clickjacking via untrusted iframe sources.
 */
export function isAllowedPreviewUrl(url: string): boolean {
  return ALLOWED_PREVIEW_ORIGINS.some((origin) => url.startsWith(origin));
}

// SEC-01: Sandbox attribute — prevents parent navigation and form submission
export const IFRAME_SANDBOX = 'allow-scripts allow-same-origin';

// Category display labels for filter chips
export const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  educacion: 'Educación',
  fitness: 'Fitness',
  negocio: 'Negocio',
};

export const ALL_CATEGORIES: TemplateCategory[] = ['educacion', 'fitness', 'negocio'];

// Static template data — thumbnails are placeholders until real screenshots are added
export const TEMPLATES: Template[] = [
  {
    id: 'edu-minimal',
    name: 'Educación Minimal',
    category: 'educacion',
    thumbnailUrl: '/templates/thumbnails/edu-minimal.webp',
    previewUrl: 'https://templates.12ity.com/edu-minimal',
    description: 'Diseño limpio y enfocado en contenido educativo.',
  },
  {
    id: 'edu-academy',
    name: 'Academia Premium',
    category: 'educacion',
    thumbnailUrl: '/templates/thumbnails/edu-academy.webp',
    previewUrl: 'https://templates.12ity.com/edu-academy',
    description: 'Look premium para academias y cursos de alto valor.',
  },
  {
    id: 'fit-energy',
    name: 'Fitness Energy',
    category: 'fitness',
    thumbnailUrl: '/templates/thumbnails/fit-energy.webp',
    previewUrl: 'https://templates.12ity.com/fit-energy',
    description: 'Dinámico y motivacional para entrenadores y coaches.',
  },
  {
    id: 'fit-wellness',
    name: 'Wellness Studio',
    category: 'fitness',
    thumbnailUrl: '/templates/thumbnails/fit-wellness.webp',
    previewUrl: 'https://templates.12ity.com/fit-wellness',
    description: 'Sereno y equilibrado para yoga, meditación y bienestar.',
  },
  {
    id: 'biz-professional',
    name: 'Negocio Profesional',
    category: 'negocio',
    thumbnailUrl: '/templates/thumbnails/biz-professional.webp',
    previewUrl: 'https://templates.12ity.com/biz-professional',
    description: 'Profesional y confiable para consultores y negocios.',
  },
];
