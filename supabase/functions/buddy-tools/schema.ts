import { z } from 'npm:zod@3';
export const requestSchema = z.object({
  tool: z.enum(['flashcards', 'summary', 'quiz', 'map', 'review']),
  topic: z.string().trim().min(2).max(200),
  language: z.string().min(2).max(60).default('pt-BR'),
  count: z.union([z.literal(8), z.literal(12), z.literal(20)]).default(8),
  level: z.enum(['basic', 'intermediate', 'advanced']).default('intermediate'),
});
const short = z.string().min(1).max(3000);
export const outputSchemas = {
  flashcards: z.object({cards: z.array(z.object({front:short, back:short, emoji:z.string().optional(), tag:z.string().optional(), tip:z.string().optional()})).min(1).max(20)}),
  summary: z.object({title:short, bullets:z.array(short).min(1).max(12), keyTerms:z.array(z.object({term:short,definition:short})).optional(), conclusion:short.optional()}),
  quiz: z.object({questions:z.array(z.object({question:short, options:z.array(short).length(4), correctIndex:z.number().int().min(0).max(3), explanation:short})).min(1).max(20)}),
  map: z.object({title:short, branches:z.array(z.object({title:short,points:z.array(short).min(1).max(5),example:short})).min(2).max(6)}),
  review: z.object({title:short,days:z.array(z.object({day:z.number().int().min(1).max(7),goal:short,tasks:z.array(short).min(1).max(4),check:short})).length(7)}),
};