'use server';
/**
 * @fileOverview A multi-modal chat flow that can handle text, YouTube links, and PDFs.
 *
 * - chat - The main chat function.
 * - getYoutubeTranscript - A tool to get the transcript of a YouTube video.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { YoutubeTranscript } from 'youtube-transcript';

const HistorySchema = z.array(
  z.object({
    role: z.enum(['user', 'model']),
    content: z.array(z.object({ text: z.string().optional(), media: z.object({
        url: z.string(),
        contentType: z.string().optional(),
    }).optional() })),
  })
);

export const ChatInputSchema = z.object({
  history: HistorySchema,
});

export const ChatOutputSchema = z.object({
  content: z.string(),
});

const getYoutubeTranscript = ai.defineTool(
  {
    name: 'getYoutubeTranscript',
    description:
      'Returns the transcript of a YouTube video, which can be used for summarization or to answer questions about the video.',
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

export async function chat(
  input: z.infer<typeof ChatInputSchema>
): Promise<z.infer<typeof ChatOutputSchema>> {
  const llm = ai.getGenerator('googleai/gemini-2.5-flash');

  const result = await llm.generate({
    prompt: [
        {
          role: 'system',
          content: [
            {
              text: 'You are a helpful AI assistant for Chartered Accountancy (CA) students. You can answer questions, summarize materials, and chat about various topics related to CA exams. Be friendly, encouraging, and provide clear, concise explanations.',
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
