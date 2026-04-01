import { z } from 'zod';

export const slugSchema = z
  .string()
  .min(3, 'Mínimo 3 caracteres')
  .max(40, 'Máximo 40 caracteres')
  .regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones');

export const generalFormSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(60, 'Máximo 60 caracteres'),
  description: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
});

export type GeneralFormInput = z.infer<typeof generalFormSchema>;
