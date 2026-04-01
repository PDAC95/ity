import { z } from 'zod';

export const socialLinksSchema = z.object({
  instagram: z.string().max(100).optional().or(z.literal('')),
  x: z.string().max(100).optional().or(z.literal('')),
  youtube: z.string().max(100).optional().or(z.literal('')),
  tiktok: z.string().max(100).optional().or(z.literal('')),
  linkedin: z.string().max(100).optional().or(z.literal('')),
  facebook: z.string().max(100).optional().or(z.literal('')),
});

export const profileFormSchema = z.object({
  name: z.string().min(1, 'Requerido').max(50, 'Máximo 50 caracteres'),
  bio: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
  contactEmail: z.string().min(1, 'Requerido').email('Email inválido'),
  socialLinks: socialLinksSchema.optional(),
});

export type ProfileFormInput = z.infer<typeof profileFormSchema>;
