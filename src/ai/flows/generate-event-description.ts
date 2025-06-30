'use server';
/**
 * @fileOverview An AI flow to generate compelling event descriptions.
 *
 * - generateEventDescription - A function to generate an event description based on some details.
 * - GenerateEventDescriptionInput - The input type for the function.
 * - GenerateEventDescriptionOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const GenerateEventDescriptionInputSchema = z.object({
  title: z.string().describe('The title of the event.'),
  artist: z.string().describe('The name of the artist or performer.'),
  genre: z.string().describe('The genre of the event (e.g., Rock, Comedy).'),
  type: z.string().describe('The type of event (e.g., Music, Workshop).'),
});
export type GenerateEventDescriptionInput = z.infer<typeof GenerateEventDescriptionInputSchema>;

export const GenerateEventDescriptionOutputSchema = z.object({
  description: z.string().describe('The generated event description.'),
});
export type GenerateEventDescriptionOutput = z.infer<typeof GenerateEventDescriptionOutputSchema>;

export async function generateEventDescription(
  input: GenerateEventDescriptionInput
): Promise<GenerateEventDescriptionOutput> {
  return generateEventDescriptionFlow(input);
}

const generateDescriptionPrompt = ai.definePrompt({
  name: 'generateEventDescriptionPrompt',
  input: { schema: GenerateEventDescriptionInputSchema },
  output: { schema: GenerateEventDescriptionOutputSchema },
  prompt: `You are a professional event promoter and copywriter. Your task is to generate a short, exciting, and engaging event description.

Event Details:
- Title: {{{title}}}
- Artist/Host: {{{artist}}}
- Type: {{{type}}}
- Genre: {{{genre}}}

Based on these details, write a compelling description (around 2-3 sentences) to attract attendees. Make it sound exciting and professional.
`,
});

const generateEventDescriptionFlow = ai.defineFlow(
  {
    name: 'generateEventDescriptionFlow',
    inputSchema: GenerateEventDescriptionInputSchema,
    outputSchema: GenerateEventDescriptionOutputSchema,
  },
  async (input) => {
    const { output } = await generateDescriptionPrompt(input);
    return output!;
  }
);
