'use server';

/**
 * @fileOverview This file defines a Genkit flow for summarizing external content from either text or a URL.
 *
 * - summarizeExternalContent - A function that handles the content summarization process.
 * - SummarizeExternalContentInput - The input type for the summarizeExternalContent function.
 * - SummarizeExternalContentOutput - The return type for the summarizeExternalContent function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SummarizeExternalContentInputSchema = z.object({
  content: z.string().optional().describe('The text content to summarize. This will be used if no URL is provided or if URL fetching fails.'),
  url: z.string().url().optional().describe('A URL from which to extract content for summarization. If provided, content from this URL will be fetched and summarized.'),
}).refine(input => input.content || input.url, {
  message: "Either 'content' or 'url' must be provided for summarization.",
  path: ["content"],
});
export type SummarizeExternalContentInput = z.infer<typeof SummarizeExternalContentInputSchema>;

const SummarizeExternalContentOutputSchema = z.string().describe('A concise and accurate summary of the provided content.');
export type SummarizeExternalContentOutput = z.infer<typeof SummarizeExternalContentOutputSchema>;

// Helper function to extract text from a web page.
// This is a basic implementation and might not work for all pages
// (e.g., heavily JavaScript-rendered pages or pages with complex structures).
// A more robust solution would involve a dedicated scraping library.
async function extractTextFromUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }
    const html = await response.text();
    // Basic HTML stripping. This won't handle all cases but helps extract plain text.
    // Replace script, style, and HTML comments first
    let text = html.replace(/<script[^>]*>.*?<\/script>/gis, '')
                   .replace(/<style[^>]*>.*?<\/style>/gis, '')
                   .replace(/<!--.*?-->/gs, '');
    // Replace all other HTML tags with a space to prevent words from merging
    text = text.replace(/<[^>]+>/g, ' ');
    // Normalize whitespace
    text = text.replace(/\s+/g, ' ').trim();
    return text;
  } catch (error) {
    console.error(`Error extracting text from URL ${url}:`, error);
    throw new Error(`Could not extract content from the provided URL: ${url}`);
  }
}

const summarizePrompt = ai.definePrompt({
  name: 'summarizeExternalContentPrompt',
  input: { schema: z.object({ textToSummarize: z.string() }) },
  output: { schema: SummarizeExternalContentOutputSchema },
  prompt: `Please provide a concise and accurate summary of the following content, highlighting the key information and main points. The summary should be easy to understand and suitable for quick review.\n\nContent to summarize:\n{{{textToSummarize}}} `,
});

const summarizeExternalContentFlow = ai.defineFlow(
  {
    name: 'summarizeExternalContentFlow',
    inputSchema: SummarizeExternalContentInputSchema,
    outputSchema: SummarizeExternalContentOutputSchema,
  },
  async (input) => {
    let textContent: string;

    if (input.url) {
      // Prioritize URL if provided
      textContent = await extractTextFromUrl(input.url);
    } else if (input.content) {
      // Fallback to direct content if no URL or URL extraction fails
      textContent = input.content;
    } else {
      // This case should ideally be caught by the refine() in the schema
      throw new Error("No content or URL provided for summarization.");
    }

    if (!textContent.trim()) {
        throw new Error("No meaningful content found to summarize after processing input.");
    }

    // Check if the content is too long for the model, if needed. For now, pass directly.
    const { output } = await summarizePrompt({ textToSummarize: textContent });
    if (!output) {
        throw new Error("Failed to generate summary.");
    }
    return output;
  }
);

export async function summarizeExternalContent(
  input: SummarizeExternalContentInput
): Promise<SummarizeExternalContentOutput> {
  return summarizeExternalContentFlow(input);
}
