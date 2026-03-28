'use server';

/**
 * @fileOverview This file defines a Genkit flow for summarizing external content from either text or a URL.
 *
 * - summarizeExternalContent - A function that handles the content summarization process.
 * - SummarizeExternalContentInput - The input type for the summarizeExternalContent function.
 * - SummarizeExternalContentOutput - The return type for the summarizeExternalContent function, which is a string.
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

// The output schema is an object containing the summary. This is more robust for Genkit's structured output.
const SummarizeExternalContentFlowOutputSchema = z.object({
  summary: z.string().describe('A concise and accurate summary of the provided content.'),
});
// This is the type for the flow's internal return value.
type SummarizeExternalContentFlowOutput = z.infer<typeof SummarizeExternalContentFlowOutputSchema>;

// The exported function will still return a string to maintain the contract with the client.
export type SummarizeExternalContentOutput = string;

// Helper function to extract text from a web page.
async function extractTextFromUrl(url: string): Promise<string> {
  let response: Response;
  try {
    // Set a timeout for the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout
    response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
  } catch (error: any) {
    console.error(`Fetch failed for URL ${url}:`, error);
    if (error.name === 'AbortError') {
      throw new Error("The request timed out as the server is slow to respond.");
    }
    if (error.cause?.code === 'ENOTFOUND') {
      throw new Error("The website could not be found. Please check if the URL is correct.");
    }
    throw new Error("Failed to reach the URL. It might be offline or an invalid address.");
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("The page was not found at the given URL (404 Not Found).");
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error(`Access to this URL is restricted (Error ${response.status}). This content is private and cannot be summarized.`);
    }
    if (response.status >= 500) {
      throw new Error(`The server for the URL is having problems (Error ${response.status}). Please try again later.`);
    }
    throw new Error(`Could not fetch the page. The server responded with an error: ${response.status} ${response.statusText}.`);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && !contentType.includes('text/html') && !contentType.includes('text/plain')) {
    throw new Error(`Content type '${contentType}' is not supported. Only text-based web pages can be summarized, not files like PDFs or images.`);
  }

  const html = await response.text();
  // Basic HTML stripping. This is a naive implementation.
  let text = html
    .replace(/<style[^>]*>.*?<\/style>/gs, ' ')
    .replace(/<script[^>]*>.*?<\/script>/gs, ' ')
    .replace(/<!--.*?-->/gs, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!text) {
    throw new Error("Could not extract readable text from the URL. The page might be empty or use a format that is not supported for summarization.");
  }

  return text;
}


const summarizePrompt = ai.definePrompt({
  name: 'summarizeExternalContentPrompt',
  input: { schema: z.object({ textToSummarize: z.string() }) },
  output: { schema: SummarizeExternalContentFlowOutputSchema },
  prompt: `Please provide a concise and accurate summary of the following content, highlighting the key information and main points. The summary should be easy to understand and suitable for quick review. Respond with a JSON object with a 'summary' field.\n\nContent to summarize:\n{{{textToSummarize}}} `,
});

const summarizeExternalContentFlow = ai.defineFlow(
  {
    name: 'summarizeExternalContentFlow',
    inputSchema: SummarizeExternalContentInputSchema,
    outputSchema: SummarizeExternalContentFlowOutputSchema,
  },
  async (input) => {
    let textContent: string;

    if (input.url) {
      // The new extractTextFromUrl will throw specific errors which will be caught by the caller.
      textContent = await extractTextFromUrl(input.url);
    } else if (input.content) {
      textContent = input.content;
    } else {
      // This path is unlikely due to Zod schema refinement, but it's a safe fallback.
      throw new Error("No content or URL was provided for summarization.");
    }

    if (!textContent.trim()) {
      throw new Error("No meaningful content was found to summarize.");
    }

    const { output } = await summarizePrompt({ textToSummarize: textContent });
    if (!output) {
        throw new Error("Failed to generate summary from the content.");
    }
    return output;
  }
);

export async function summarizeExternalContent(
  input: SummarizeExternalContentInput
): Promise<SummarizeExternalContentOutput> {
  const result = await summarizeExternalContentFlow(input);
  return result.summary;
}
