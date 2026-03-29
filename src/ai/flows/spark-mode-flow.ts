'use server';

/**
 * @fileOverview A Genkit flow that acts as a creative partner, suggesting ideas based on note content.
 *
 * - sparkMode - A function that generates creative suggestions.
 * - SparkModeInput - The input type for the sparkMode function.
 * - SparkModeOutput - The return type for the sparkMode function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SparkModeInputSchema = z.object({
  noteContent: z.string().describe('The content of the note to brainstorm from.'),
});
export type SparkModeInput = z.infer<typeof SparkModeInputSchema>;

const SparkModeOutputSchema = z.object({
  ideas: z.array(z.string()).describe('A list of creative ideas, questions, or connections based on the note content.'),
});
// This is the type for the flow's internal return value.
type SparkModeFlowOutput = z.infer<typeof SparkModeOutputSchema>;

// The exported function will return a string array.
export type SparkModeOutput = string[];


export async function sparkMode(input: SparkModeInput): Promise<SparkModeOutput> {
  const result = await sparkModeFlow(input);
  return result.ideas;
}

const prompt = ai.definePrompt({
  name: 'sparkModePrompt',
  input: { schema: SparkModeInputSchema },
  output: { schema: SparkModeOutputSchema },
  prompt: `You are a creative muse. Your goal is to spark new ideas, suggest improvements, ask probing questions, and draw connections based on the provided text.

Analyze the following note content and provide a list of creative sparks. These could be anything from a new direction for the idea, a question to deepen the thought, or a connection to a different concept. Respond with a JSON object containing an 'ideas' array of strings.

Note Content:
{{{noteContent}}}`,
});

const sparkModeFlow = ai.defineFlow(
  {
    name: 'sparkModeFlow',
    inputSchema: SparkModeInputSchema,
    outputSchema: SparkModeOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("The creative muse is quiet right now. Could not generate ideas.");
    }
    return output;
  }
);
