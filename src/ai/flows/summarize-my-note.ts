'use server';
/**
 * @fileOverview A Genkit flow for summarizing note content.
 *
 * - summarizeNote - A function that handles the note summarization process.
 * - SummarizeNoteInput - The input type for the summarizeNote function.
 * - SummarizeNoteOutput - The return type for the summarizeNote function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeNoteInputSchema = z.object({
  noteContent: z.string().describe('The content of the note to be summarized.'),
});
export type SummarizeNoteInput = z.infer<typeof SummarizeNoteInputSchema>;

const SummarizeNoteOutputSchema = z.object({
  summary: z.string().describe('The summarized content of the note.'),
});
export type SummarizeNoteOutput = z.infer<typeof SummarizeNoteOutputSchema>;

export async function summarizeNote(input: SummarizeNoteInput): Promise<SummarizeNoteOutput> {
  return summarizeNoteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeNotePrompt',
  input: {schema: SummarizeNoteInputSchema},
  output: {schema: SummarizeNoteOutputSchema},
  prompt: `Please provide a concise summary of the following note content. Focus on the main points and key information, extracting the most important details.

Note Content:
{{noteContent}}`,
});

const summarizeNoteFlow = ai.defineFlow(
  {
    name: 'summarizeNoteFlow',
    inputSchema: SummarizeNoteInputSchema,
    outputSchema: SummarizeNoteOutputSchema,
  },
  async input => {
    try {
      const {output} = await prompt(input);
      if (!output) {
        throw new Error("Failed to generate summary from the note content.");
      }
      return output;
    } catch (error: any) {
      if (error.message?.includes('API key not valid')) {
        throw new Error('Your Gemini API key is missing or invalid. Please create a .env file in the root of the project and add your key, like this: GEMINI_API_KEY="YOUR_API_KEY_HERE"');
      }
      // Re-throw other errors
      throw error;
    }
  }
);
