import { z } from 'zod';

export const prdSchema = z.object({
  schoolInfo: z.object({
    name: z.string().describe('School name'),
    tagline: z.string().describe('Short tagline or slogan'),
    description: z.string().describe('Brief school description'),
    valueProposition: z.string().describe('Core value proposition for students'),
  }),
  visual: z.object({
    primaryColor: z.string().describe('Hex color code e.g. #6366F1'),
    secondaryColor: z.string().describe('Hex color code e.g. #F59E0B'),
    heroImageUrl: z.string().nullable().describe('Hero image URL or null'),
    style: z.string().describe('Visual style: professional, casual, vibrant, minimal, etc.'),
  }),
  creator: z.object({
    name: z.string().describe('Creator full name'),
    bio: z.string().describe('Creator bio or about text'),
    credentials: z.string().nullable().describe('Creator credentials or certifications'),
    teachingReason: z.string().nullable().describe('Why the creator teaches this topic'),
  }),
  hero: z.object({
    headline: z.string().describe('Main hero headline'),
    subheadline: z.string().describe('Supporting subheadline'),
    ctaText: z.string().describe('Call-to-action button text'),
  }),
  optional: z.object({
    testimonials: z.array(z.object({
      name: z.string(),
      text: z.string(),
    })).nullable().describe('Student testimonials or null'),
    faqItems: z.array(z.object({
      question: z.string(),
      answer: z.string(),
    })).nullable().describe('FAQ items or null'),
    curriculumHighlights: z.array(z.string()).nullable().describe('Key curriculum points or null'),
  }),
  metadata: z.object({
    templateId: z.string().describe('Selected template ID'),
    generatedAt: z.string().describe('ISO 8601 timestamp'),
    conversationTurns: z.number().describe('Number of conversation turns'),
  }),
});

export type PrdSummary = z.infer<typeof prdSchema>;
