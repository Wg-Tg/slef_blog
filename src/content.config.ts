import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blogCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date(),
    tags: z.array(z.string()).optional().default([]),
  }),
});

const notesCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/notes' }),
  schema: z.object({
    content: z.string(),
    date: z.date(),
    tags: z.array(z.string()).optional().default([]),
    mood: z.enum(['思考', '灵感', '发现']).optional(),
  }),
});

export const collections = {
  blog: blogCollection,
  notes: notesCollection,
};
