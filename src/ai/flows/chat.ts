'use server';
/**
 * @fileOverview A multi-modal chat flow that can handle text, YouTube links, and PDFs.
 *
 * - chat - The main chat function that invokes the Genkit flow.
 * - getYoutubeTranscript - A tool to get the transcript of a YouTube video.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { YoutubeTranscript } from 'youtube-transcript';
import { ChatInputSchema, ChatOutputSchema } from '@/lib/types';

const getYoutubeTranscript = ai.defineTool(
  {
    name: 'getYoutubeTranscript',
    description:
      'Returns the transcript of a YouTube video. Use this tool whenever a user provides a YouTube link to summarize it or ask questions about it.',
    inputSchema: z.object({
      url: z.string().describe('The URL of the YouTube video.'),
    }),
    outputSchema: z.string(),
  },
  async ({ url }) => {
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(url);
      return transcript.map(t => t.text).join(' ');
    } catch (e: any) {
      return `Could not get transcript: ${e.message}`;
    }
  }
);

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    const llm = ai.getGenerator('googleai/gemini-2.5-flash');

    const result = await llm.generate({
        history: [
            {
              role: 'system',
              content: [
                {
                  text: 'You are a helpful AI assistant for Chartered Accountancy (CA) students. You can answer questions, summarize materials, and chat about various topics related to CA exams. When a user provides a YouTube link, you MUST use the `getYoutubeTranscript` tool to fetch the transcript and then answer their question. When a user uploads a document, you can answer questions based on its content. Be friendly, encouraging, and provide clear, concise explanations.',
                },
              ],
            },
            ...input.history,
        ],
        tools: [getYoutubeTranscript],
    });

    return {
      content: result.text,
    };
  }
);

// Export a wrapper function to be called by the server action
export async function chat(
  input: z.infer<typeof ChatInputSchema>
): Promise<z.infer<typeof ChatOutputSchema>> {
  return await chatFlow(input);
}
