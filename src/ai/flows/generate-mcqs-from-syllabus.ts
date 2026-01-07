'use server';
/**
 * @fileOverview A flow to generate MCQs from the syllabus based on the selected exam level, group, subject, and difficulty.
 *
 * - generateMcqsFromSyllabus - A function that handles the MCQ generation process.
 */

import {ai} from '@/ai/genkit';
import {
  GenerateMcqsFromSyllabusInputSchema,
  GenerateMcqsFromSyllabusOutputSchema,
} from '@/lib/types';
import type {
  GenerateMcqsFromSyllabusInput,
  GenerateMcqsFromSyllabusOutput,
} from '@/lib/types';

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

  I want you to act as an examiner creating a quiz.
  
  Generate {{{count}}} MCQs with {{{difficulty}}} difficulty from the syllabus for the {{{level}}} level, {{{subject}}} subject. Use the seed '{{{seed}}}' to ensure variability.
  
  The MCQs should have four options (A, B, C, D), a correct answer, and a brief explanation.

  Return the MCQs as a JSON array of objects.`,
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
