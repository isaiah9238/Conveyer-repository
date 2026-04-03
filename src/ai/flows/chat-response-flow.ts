// src/ai/flows/chat-response-flow.ts
import { defineFlow } from '@genkit-ai/flow';
import { generate } from '@genkit-ai/ai';
import { gemini25Flash } from '@genkit-ai/googleai';
import { z } from 'zod';

export const chatFlow = defineFlow(
  {
    name: 'chatFlow',
    inputSchema: z.object({
      userPrompt: z.string(),
      context: z.string(), // The existing note content
      persona: z.string(), // "Surveyor", "English Teacher", etc.
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    const response = await generate({
      model: gemini25Flash,
      system: `You are an expert ${input.persona}. Use the provided note context to help the user.`,
      prompt: `Note Context: ${input.context}\n\nUser Question: ${input.userPrompt}`,
    });
    return response.text();
  }
);