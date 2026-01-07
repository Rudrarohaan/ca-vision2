'use server';
/**
 * @fileOverview A flow to generate MCQs from the syllabus based on the selected exam level, group, subject, and difficulty.
 *
 * - generateMcqsFromSyllabus - A function that handles the MCQ generation process.
 * - GenerateMcqsFromSyllabusInput - The input type for the generateMcqsFromSyllabus function.
 * - GenerateMcqsFromSyllabusOutput - The return type for the generateMcqsFromSyllabus function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MCQSchema = z.object({
  id: z.number(),
  question: z.string(),
  options: z.object({
    A: z.string(),
    B: z.string(),
    C: z.string(),
    D: z.string(),
  }),
  correctAnswer: z.enum(['A', 'B', 'C', 'D']),
  explanation: z.string(),
});

export type MCQ = z.infer<typeof MCQSchema>;

const GenerateMcqsFromSyllabusInputSchema = z.object({
  level: z.enum(['Foundation', 'Intermediate', 'Final']),
  group: z.enum(['Group I', 'Group II']).optional(),
  subject: z.string(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  count: z.number().min(5).max(50),
});

export type GenerateMcqsFromSyllabusInput = z.infer<
  typeof GenerateMcqsFromSyllabusInputSchema
>;

const GenerateMcqsFromSyllabusOutputSchema = z.array(MCQSchema);

export type GenerateMcqsFromSyllabusOutput = z.infer<
  typeof GenerateMcqsFromSyllabusOutputSchema
>;

export async function generateMcqsFromSyllabus(
  input: GenerateMcqsFromSyllabusInput
): Promise<GenerateMcqsFromSyllabusOutput> {
  return generateMcqsFromSyllabusFlow(input);
}

const generateMcqsPrompt = ai.definePrompt({
  name: 'generateMcqsFromSyllabusPrompt',
  input: {schema: GenerateMcqsFromSyllabusInputSchema},
  output: {schema: GenerateMcqsFromSyllabusOutputSchema},
  prompt: `You are an expert in creating multiple-choice questions (MCQs) for CA (Chartered Accountancy) exams.

  Generate {{{count}}} MCQs for the {{{level}}} level, {{{subject}}} subject with {{{difficulty}}} difficulty.

  The MCQs should have four options (A, B, C, D), a correct answer, and a brief explanation.

  Ensure that the questions are relevant to the syllabus and appropriate for the specified difficulty level.

  Return the MCQs in the following JSON format:
  {{GenerateMcqsFromSyllabusOutputSchema}}`,
});

const generateMcqsFromSyllabusFlow = ai.defineFlow(
  {
    name: 'generateMcqsFromSyllabusFlow',
    inputSchema: GenerateMcqsFromSyllabusInputSchema,
    outputSchema: GenerateMcqsFromSyllabusOutputSchema,
  },
  async input => {
    const {output} = await generateMcqsPrompt(input);
    return output!;
  }
);
